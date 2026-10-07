import { contexto } from "@/lib/sessao";
import { FormSenha } from "@/components/form-senha";
import { Voltar } from "@/components/ui";
import { BotaoSair } from "../caes/form";

export const dynamic = "force-dynamic";

export default async function Conta() {
  const { supabase, membro, creche } = await contexto();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex flex-1 flex-col gap-6 px-5 pb-10">
      <header className="flex items-center gap-3 pt-5">
        <Voltar href="/app" />
        <h1 className="font-display text-[22px] font-extrabold">Minha conta</h1>
      </header>

      <div className="flex flex-col gap-1 rounded-2xl border border-borda bg-white p-4">
        <span className="font-bold">{membro.nome}</span>
        <span className="text-[14px] text-suave">{user?.email}</span>
        <span className="text-[14px] text-suave">
          {creche.nome} · {membro.papel === "admin" ? "Administrador" : "Monitor"}
        </span>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-extrabold">Trocar senha</h2>
        <FormSenha />
      </section>

      <BotaoSair />
    </main>
  );
}
