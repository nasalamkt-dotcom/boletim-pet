import "server-only";
import { randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { enviarTemplate } from "@/lib/whatsapp";
import { hora } from "@/lib/datas";
import { primeiroNome } from "@/lib/dominio";

type Admin = ReturnType<typeof createAdminClient>;

function novoToken() {
  return randomBytes(18).toString("base64url");
}

export function linkBoletim(token: string) {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}/b/${token}`;
}

type PresencaComCao = {
  id: string;
  creche_id: string;
  chegada: string | null;
  caes: { nome: string; tutores: { id: string; nome: string; telefone: string } | null } | null;
};

async function carregarPresenca(admin: Admin, presencaId: string) {
  const { data, error } = await admin
    .from("presencas")
    .select("id, creche_id, chegada, caes(nome, tutores(id, nome, telefone))")
    .eq("id", presencaId)
    .single();
  if (error || !data) throw new Error("Presença não encontrada");
  return data as unknown as PresencaComCao;
}

/**
 * Cria (se preciso) o boletim da presença e envia o aviso ao tutor.
 * Não reenvia um boletim que já saiu, a menos que `forcar` seja true.
 */
export async function enviarBoletim(presencaId: string, opcoes: { forcar?: boolean } = {}) {
  const admin = createAdminClient();
  const p = await carregarPresenca(admin, presencaId);
  const tutor = p.caes?.tutores;
  if (!p.caes || !tutor) throw new Error("Cão sem tutor cadastrado");

  let { data: boletim } = await admin
    .from("boletins")
    .select("id, token, status")
    .eq("presenca_id", presencaId)
    .maybeSingle();

  if (!boletim) {
    const { data, error } = await admin
      .from("boletins")
      .insert({ creche_id: p.creche_id, presenca_id: presencaId, token: novoToken() })
      .select("id, token, status")
      .single();
    if (error) throw error;
    boletim = data;
  }

  const jaSaiu = ["simulado", "enviado", "entregue", "lido"].includes(boletim.status);
  if (jaSaiu && !opcoes.forcar) return { status: boletim.status, link: linkBoletim(boletim.token) };

  const template = process.env.WHATSAPP_TEMPLATE_BOLETIM || "boletim_pronto";
  const corpo = [primeiroNome(tutor.nome), p.caes.nome];
  const resultado = await enviarTemplate({
    para: tutor.telefone,
    template,
    parametrosCorpo: corpo,
    parametroBotaoUrl: boletim.token,
  });

  const link = linkBoletim(boletim.token);
  await admin
    .from("boletins")
    .update({
      status: resultado.status,
      erro: resultado.ok ? null : resultado.erro,
      wa_message_id: resultado.ok ? resultado.waMessageId : null,
      enviado_em: resultado.ok ? new Date().toISOString() : null,
    })
    .eq("id", boletim.id);

  await admin.from("mensagens").insert({
    creche_id: p.creche_id,
    tutor_id: tutor.id,
    tipo: "boletim",
    para: tutor.telefone,
    conteudo: { template, corpo, link },
    status: resultado.status,
    wa_message_id: resultado.ok ? resultado.waMessageId : null,
    erro: resultado.ok ? null : resultado.erro,
  });

  return { status: resultado.status, link };
}

/** Aviso de chegada ("O Thor chegou às 7:42"). Só envia se o modelo estiver configurado. */
export async function enviarChegada(presencaId: string, fuso?: string) {
  const template = process.env.WHATSAPP_TEMPLATE_CHEGADA;
  if (!template) return null;
  const admin = createAdminClient();
  const p = await carregarPresenca(admin, presencaId);
  const tutor = p.caes?.tutores;
  if (!p.caes || !tutor) return null;

  const corpo = [p.caes.nome, hora(p.chegada, fuso)];
  const resultado = await enviarTemplate({ para: tutor.telefone, template, parametrosCorpo: corpo });
  await admin.from("mensagens").insert({
    creche_id: p.creche_id,
    tutor_id: tutor.id,
    tipo: "chegada",
    para: tutor.telefone,
    conteudo: { template, corpo },
    status: resultado.status,
    wa_message_id: resultado.ok ? resultado.waMessageId : null,
    erro: resultado.ok ? null : resultado.erro,
  });
  return resultado.status;
}

/** Envia os boletins pendentes de um dia (usado pelo botão e pelo envio automático). */
export async function enviarBoletinsDoDia(crecheId: string, dia: string) {
  const admin = createAdminClient();
  const { data: presencas, error } = await admin
    .from("presencas")
    .select("id, boletins(status)")
    .eq("creche_id", crecheId)
    .eq("dia", dia)
    .not("chegada", "is", null);
  if (error) throw error;

  let enviados = 0;
  let falhas = 0;
  for (const p of presencas ?? []) {
    const b = (p as { boletins: { status: string } | { status: string }[] | null }).boletins;
    const status = Array.isArray(b) ? b[0]?.status : b?.status;
    if (status && status !== "pendente" && status !== "falhou") continue;
    try {
      const r = await enviarBoletim(p.id);
      if (r.status === "falhou") falhas++;
      else enviados++;
    } catch {
      falhas++;
    }
  }
  return { enviados, falhas };
}
