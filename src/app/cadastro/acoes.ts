"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { criarAcesso, emailValido, SENHA_MINIMA } from "@/lib/contas";
import { FUSO_PADRAO } from "@/lib/datas";

export type EstadoCadastroCreche = { erro?: string } | null;

export async function cadastrarCreche(_a: EstadoCadastroCreche, form: FormData): Promise<EstadoCadastroCreche> {
  if (process.env.CADASTRO_ABERTO === "false") return { erro: "Novos cadastros estão fechados no momento." };

  const creche = String(form.get("creche") || "").trim();
  const nome = String(form.get("nome") || "").trim();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const senha = String(form.get("senha") || "");

  if (!creche || !nome) return { erro: "Preencha o nome da creche e o seu nome." };
  if (!emailValido(email)) return { erro: "Informe um e-mail válido." };
  if (senha.length < SENHA_MINIMA) return { erro: `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.` };

  const acesso = await criarAcesso(email, senha, nome);
  if (!acesso.ok) return { erro: acesso.erro };

  const admin = createAdminClient();
  const { data: nova, error } = await admin
    .from("creches")
    .insert({ nome: creche, fuso: FUSO_PADRAO })
    .select("id")
    .single();
  if (error || !nova) return { erro: "Não foi possível criar a creche. Tente de novo." };

  const { error: e2 } = await admin
    .from("membros")
    .insert({ user_id: acesso.userId, creche_id: nova.id, nome, papel: "admin" });
  if (e2) {
    await admin.from("creches").delete().eq("id", nova.id);
    return { erro: "Não foi possível concluir o cadastro. Tente de novo." };
  }

  // Já entra logado
  const supabase = await createClient();
  await supabase.auth.signInWithPassword({ email, password: senha });
  redirect("/app/caes");
}
