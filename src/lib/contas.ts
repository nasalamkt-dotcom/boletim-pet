import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export const SENHA_MINIMA = 8;

export function emailValido(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Cria um acesso com e-mail e senha, já confirmado (sem e-mail de confirmação).
 * Se o e-mail já existe mas não pertence a nenhuma creche, reaproveita o usuário.
 */
export async function criarAcesso(email: string, senha: string, nome: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome },
  });
  if (!error && data.user) return { ok: true as const, userId: data.user.id };

  if (error && /already|registered|exists/i.test(error.message)) {
    const existente = await buscarUsuarioPorEmail(email);
    if (!existente) return { ok: false as const, erro: "Este e-mail já está em uso." };
    const { data: membro } = await admin.from("membros").select("user_id").eq("user_id", existente).maybeSingle();
    if (membro) return { ok: false as const, erro: "Este e-mail já tem acesso a uma creche." };
    await admin.auth.admin.updateUserById(existente, { password: senha, email_confirm: true });
    return { ok: true as const, userId: existente };
  }
  if (error && /password/i.test(error.message)) {
    return { ok: false as const, erro: `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.` };
  }
  return { ok: false as const, erro: "Não foi possível criar o acesso. Tente de novo." };
}

async function buscarUsuarioPorEmail(email: string) {
  const admin = createAdminClient();
  const alvo = email.toLowerCase();
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error || !data.users.length) return null;
    const u = data.users.find((x) => x.email?.toLowerCase() === alvo);
    if (u) return u.id;
    if (data.users.length < 200) return null;
  }
  return null;
}

export async function emailsDosUsuarios(ids: string[]) {
  const admin = createAdminClient();
  const pares = await Promise.all(
    ids.map(async (id) => {
      const { data } = await admin.auth.admin.getUserById(id);
      return [id, data.user?.email ?? ""] as const;
    }),
  );
  return new Map(pares);
}
