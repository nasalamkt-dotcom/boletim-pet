"use server";

import { revalidatePath } from "next/cache";
import { contexto } from "@/lib/sessao";
import { createAdminClient } from "@/lib/supabase/admin";
import { criarAcesso, emailValido, SENHA_MINIMA } from "@/lib/contas";

export type EstadoEquipe = { erro?: string; ok?: string } | null;

async function exigirAdmin() {
  const ctx = await contexto();
  if (ctx.membro.papel !== "admin") throw new Error("Só o administrador pode gerenciar a equipe.");
  return ctx;
}

export async function adicionarMembro(_a: EstadoEquipe, form: FormData): Promise<EstadoEquipe> {
  let ctx;
  try {
    ctx = await exigirAdmin();
  } catch (e) {
    return { erro: (e as Error).message };
  }
  const nome = String(form.get("nome") || "").trim();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const senha = String(form.get("senha") || "");
  const papel = form.get("papel") === "admin" ? "admin" : "monitor";

  if (!nome) return { erro: "Informe o nome da pessoa." };
  if (!emailValido(email)) return { erro: "Informe um e-mail válido." };
  if (senha.length < SENHA_MINIMA) return { erro: `A senha provisória precisa ter pelo menos ${SENHA_MINIMA} caracteres.` };

  const acesso = await criarAcesso(email, senha, nome);
  if (!acesso.ok) return { erro: acesso.erro };

  const { error } = await createAdminClient()
    .from("membros")
    .insert({ user_id: acesso.userId, creche_id: ctx.creche.id, nome, papel });
  if (error) return { erro: "Não foi possível adicionar à equipe." };

  revalidatePath("/app/equipe");
  return { ok: `${nome} já pode entrar com ${email} e a senha provisória.` };
}

export async function removerMembro(userId: string) {
  const ctx = await exigirAdmin();
  if (userId === ctx.userId) throw new Error("Você não pode remover o próprio acesso.");
  const admin = createAdminClient();
  const { data: alvo } = await admin
    .from("membros")
    .select("user_id")
    .eq("user_id", userId)
    .eq("creche_id", ctx.creche.id)
    .maybeSingle();
  if (!alvo) return;
  await admin.from("membros").delete().eq("user_id", userId);
  await admin.auth.admin.deleteUser(userId);
  revalidatePath("/app/equipe");
}

export async function redefinirSenhaMembro(userId: string, senha: string) {
  const ctx = await exigirAdmin();
  if (senha.length < SENHA_MINIMA) return { erro: `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.` };
  const admin = createAdminClient();
  const { data: alvo } = await admin
    .from("membros")
    .select("user_id")
    .eq("user_id", userId)
    .eq("creche_id", ctx.creche.id)
    .maybeSingle();
  if (!alvo) return { erro: "Pessoa não encontrada na equipe." };
  const { error } = await admin.auth.admin.updateUserById(userId, { password: senha });
  if (error) return { erro: "Não foi possível trocar a senha." };
  return { ok: "Senha provisória atualizada." };
}
