import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Pata, botaoPrimario, campoTexto } from "@/components/ui";
import { FUSO_PADRAO } from "@/lib/datas";

async function criarCreche(form: FormData) {
  "use server";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const nomeCreche = String(form.get("creche") || "").trim();
  const nomePessoa = String(form.get("nome") || "").trim();
  if (!nomeCreche || !nomePessoa) return;

  const admin = createAdminClient();
  const { data: existente } = await admin.from("membros").select("user_id").eq("user_id", user.id).maybeSingle();
  if (existente) redirect("/app");

  const { data: creche, error } = await admin
    .from("creches")
    .insert({ nome: nomeCreche, fuso: FUSO_PADRAO })
    .select("id")
    .single();
  if (error || !creche) throw error ?? new Error("Não foi possível criar a creche");

  await admin.from("membros").insert({ user_id: user.id, creche_id: creche.id, nome: nomePessoa, papel: "admin" });
  redirect("/app/caes");
}

export default async function Comecar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: membro } = await supabase.from("membros").select("user_id").eq("user_id", user.id).maybeSingle();
  if (membro) redirect("/app");

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-6 py-12">
      <div className="flex flex-col gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal text-sol">
          <Pata size={30} />
        </span>
        <h1 className="font-display text-3xl font-extrabold">Vamos configurar sua creche</h1>
        <p className="text-suave">Leva um minuto. Depois é só cadastrar os cães e os tutores.</p>
      </div>
      <form action={criarCreche} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-[15px] font-bold">Nome da creche</span>
          <input name="creche" required className={campoTexto} placeholder="Ex.: Creche Patinhas" />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-[15px] font-bold">Seu nome</span>
          <input name="nome" required className={campoTexto} placeholder="Como a equipe te chama" />
        </label>
        <button type="submit" className={botaoPrimario}>
          Criar e continuar
        </button>
      </form>
    </main>
  );
}
