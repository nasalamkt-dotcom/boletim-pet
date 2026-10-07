import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FormSenha } from "@/components/form-senha";
import { Pata } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function NovaSenha() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-6 py-12">
      <div className="flex flex-col gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal text-sol">
          <Pata size={30} />
        </span>
        <h1 className="font-display text-3xl font-extrabold">Crie sua nova senha</h1>
        <p className="text-suave">Para a conta {user.email}.</p>
      </div>
      <FormSenha depois="/app" />
    </main>
  );
}
