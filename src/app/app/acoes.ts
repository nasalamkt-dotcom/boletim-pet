"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { contexto } from "@/lib/sessao";
import { hoje } from "@/lib/datas";
import { CAMPOS, CORES_AVATAR, normalizarTelefone, type CampoChave } from "@/lib/dominio";
import { enviarBoletim, enviarBoletinsDoDia, enviarChegada } from "@/lib/envios";
import { iaDisponivel, melhorarRecado } from "@/lib/ia";

/** Garante que a presença é da creche do usuário (consulta com RLS). */
async function minhaPresenca(presencaId: string) {
  const ctx = await contexto();
  const { data } = await ctx.supabase
    .from("presencas")
    .select("id, cao_id, dia, alimentacao, necessidades, atividade, humor, caes(nome)")
    .eq("id", presencaId)
    .maybeSingle();
  if (!data) throw new Error("Registro não encontrado");
  return { ctx, presenca: data };
}

export async function fazerCheckin(caoId: string) {
  const ctx = await contexto();
  const dia = hoje(ctx.creche.fuso);
  const { data, error } = await ctx.supabase
    .from("presencas")
    .upsert(
      { creche_id: ctx.creche.id, cao_id: caoId, dia, chegada: new Date().toISOString() },
      { onConflict: "cao_id,dia" },
    )
    .select("id")
    .single();
  if (error) throw error;
  await enviarChegada(data.id, ctx.creche.fuso).catch(() => null);
  revalidatePath("/app");
  return data.id;
}

export async function salvarCampo(presencaId: string, campo: CampoChave, valor: string | null) {
  const def = CAMPOS.find((c) => c.chave === campo);
  if (!def) throw new Error("Campo inválido");
  if (valor !== null && !(def.opcoes as readonly string[]).includes(valor)) throw new Error("Opção inválida");
  const { ctx } = await minhaPresenca(presencaId);
  const { error } = await ctx.supabase
    .from("presencas")
    .update({ [campo]: valor, atualizado_em: new Date().toISOString() })
    .eq("id", presencaId);
  if (error) throw error;
  revalidatePath("/app");
}

export async function salvarRecado(presencaId: string, texto: string) {
  const { ctx } = await minhaPresenca(presencaId);
  const limpo = texto.trim().slice(0, 1200);
  const { error } = await ctx.supabase
    .from("presencas")
    .update({ recado: limpo || null, recado_autor: limpo ? ctx.membro.nome : null, atualizado_em: new Date().toISOString() })
    .eq("id", presencaId);
  if (error) throw error;
  revalidatePath("/app");
}

export async function sugerirRecado(presencaId: string, anotacoes: string) {
  if (!iaDisponivel()) return { ok: false as const, erro: "A IA ainda não foi configurada." };
  const { presenca } = await minhaPresenca(presencaId);
  const nome = (presenca.caes as unknown as { nome: string } | null)?.nome ?? "o cão";
  try {
    const texto = await melhorarRecado({
      nomeCao: nome,
      anotacoes: anotacoes.slice(0, 1500),
      rotina: {
        alimentação: presenca.alimentacao,
        necessidades: presenca.necessidades,
        atividade: presenca.atividade,
        humor: presenca.humor,
      },
    });
    return { ok: true as const, texto };
  } catch (e) {
    return { ok: false as const, erro: e instanceof Error ? e.message : "Falha na IA" };
  }
}

/** Registra uma foto já enviada ao Storage e marca os cães que aparecem nela. */
export async function registrarFoto(caminho: string, caoIds: string[], legenda?: string) {
  const ctx = await contexto();
  if (!caminho.startsWith(`${ctx.creche.id}/`)) throw new Error("Caminho de foto inválido");
  if (!caoIds.length) throw new Error("Marque pelo menos um cão");
  const dia = hoje(ctx.creche.fuso);
  const { data: foto, error } = await ctx.supabase
    .from("fotos")
    .insert({ creche_id: ctx.creche.id, dia, caminho, legenda: legenda?.slice(0, 120) || null, autor: ctx.userId })
    .select("id")
    .single();
  if (error) throw error;
  const { error: e2 } = await ctx.supabase
    .from("foto_caes")
    .insert(caoIds.map((cao_id) => ({ foto_id: foto.id, cao_id })));
  if (e2) throw e2;
  revalidatePath("/app");
  return foto.id;
}

export async function removerFoto(fotoId: string) {
  const ctx = await contexto();
  const { data: foto } = await ctx.supabase.from("fotos").select("id, caminho").eq("id", fotoId).maybeSingle();
  if (!foto) return;
  await ctx.supabase.storage.from("fotos").remove([foto.caminho]);
  await ctx.supabase.from("fotos").delete().eq("id", fotoId);
  revalidatePath("/app");
}

/** Envia o boletim do cão agora, sem registrar saída (ele pode continuar na creche). */
export async function enviarBoletimAgora(presencaId: string) {
  await minhaPresenca(presencaId);
  const r = await enviarBoletim(presencaId);
  revalidatePath("/app");
  return r;
}

export async function reenviarBoletim(presencaId: string) {
  await minhaPresenca(presencaId);
  const r = await enviarBoletim(presencaId, { forcar: true });
  revalidatePath("/app");
  return r;
}

export async function enviarBoletinsHoje() {
  const ctx = await contexto();
  const r = await enviarBoletinsDoDia(ctx.creche.id, hoje(ctx.creche.fuso));
  revalidatePath("/app");
  return r;
}

export type EstadoCadastro = { erro?: string; ok?: string } | null;

export async function cadastrarCao(_anterior: EstadoCadastro, form: FormData): Promise<EstadoCadastro> {
  const ctx = await contexto();
  const nomeCao = String(form.get("cao") || "").trim();
  const raca = String(form.get("raca") || "").trim();
  const tutorExistente = String(form.get("tutor_id") || "");
  const nomeTutor = String(form.get("tutor") || "").trim();
  const telefone = normalizarTelefone(String(form.get("telefone") || ""));
  if (!nomeCao) return { erro: "Informe o nome do cão." };

  let tutorId = tutorExistente;
  if (!tutorId) {
    if (!nomeTutor) return { erro: "Informe o nome do tutor." };
    if (telefone.length < 12 || telefone.length > 13) return { erro: "Informe o WhatsApp do tutor com DDD." };
    const { data, error } = await ctx.supabase
      .from("tutores")
      .insert({ creche_id: ctx.creche.id, nome: nomeTutor, telefone })
      .select("id")
      .single();
    if (error) return { erro: "Não foi possível salvar o tutor." };
    tutorId = data.id;
  }

  const { count } = await ctx.supabase.from("caes").select("id", { count: "exact", head: true });
  const cor = CORES_AVATAR[(count ?? 0) % CORES_AVATAR.length];
  const { error } = await ctx.supabase
    .from("caes")
    .insert({ creche_id: ctx.creche.id, tutor_id: tutorId, nome: nomeCao, raca: raca || null, cor });
  if (error) return { erro: "Não foi possível salvar o cão." };
  revalidatePath("/app/caes");
  revalidatePath("/app");
  return { ok: `${nomeCao} cadastrado.` };
}

export async function alternarAtivo(caoId: string, ativo: boolean) {
  const ctx = await contexto();
  await ctx.supabase.from("caes").update({ ativo }).eq("id", caoId);
  revalidatePath("/app/caes");
  revalidatePath("/app");
}

export async function sair() {
  const ctx = await contexto();
  await ctx.supabase.auth.signOut();
  redirect("/login");
}
