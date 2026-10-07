import { redirect } from "next/navigation";
import { contexto } from "@/lib/sessao";
import { emailsDosUsuarios } from "@/lib/contas";
import { Avatar, Voltar } from "@/components/ui";
import { FormMembro, AcoesMembro } from "./form";

export const dynamic = "force-dynamic";

export default async function Equipe() {
  const { supabase, membro, userId, creche } = await contexto();
  if (membro.papel !== "admin") redirect("/app/conta");

  const { data } = await supabase.from("membros").select("user_id, nome, papel").order("nome");
  const lista = data ?? [];
  const emails = await emailsDosUsuarios(lista.map((m) => m.user_id));

  return (
    <main className="flex flex-1 flex-col gap-6 pb-10">
      <header className="flex items-center gap-3 px-5 pt-5">
        <Voltar href="/app" />
        <div className="flex flex-col">
          <h1 className="font-display text-[22px] font-extrabold">Equipe</h1>
          <span className="text-[13px] text-suave">Quem pode entrar no app da {creche.nome}</span>
        </div>
      </header>

      <section className="flex flex-col gap-2 px-5" aria-label="Pessoas com acesso">
        {lista.map((m) => (
          <div key={m.user_id} className="flex flex-col gap-2 rounded-2xl border border-borda bg-white px-3.5 py-3">
            <div className="flex items-center gap-3">
              <Avatar nome={m.nome} cor="#DDEFEC" size={40} />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="font-bold">
                  {m.nome}
                  {m.user_id === userId && <span className="font-normal text-suave"> (você)</span>}
                </span>
                <span className="truncate text-[13px] text-suave">{emails.get(m.user_id)}</span>
              </div>
              <span className="rounded-full bg-[#ECEFEE] px-2.5 py-1 text-[12px] font-bold text-suave">
                {m.papel === "admin" ? "Administrador" : "Monitor"}
              </span>
            </div>
            {m.user_id !== userId && <AcoesMembro userId={m.user_id} nome={m.nome} />}
          </div>
        ))}
      </section>

      <section className="px-5">
        <FormMembro />
      </section>
    </main>
  );
}
