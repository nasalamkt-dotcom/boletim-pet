import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Contexto = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  membro: { nome: string; papel: "admin" | "monitor"; creche_id: string };
  creche: { id: string; nome: string; fuso: string };
};

/** Usuário logado + creche dele. Sem creche, vai para a configuração inicial. */
export async function contexto(): Promise<Contexto> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membro } = await supabase
    .from("membros")
    .select("nome, papel, creche_id, creches(id, nome, fuso)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membro) redirect("/comecar");

  const creche = membro.creches as unknown as Contexto["creche"];
  return {
    supabase,
    userId: user.id,
    membro: { nome: membro.nome, papel: membro.papel, creche_id: membro.creche_id },
    creche,
  };
}
