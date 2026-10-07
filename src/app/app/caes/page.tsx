import { contexto } from "@/lib/sessao";
import { Avatar, Voltar } from "@/components/ui";
import { FormCao, BotaoAtivo, BotaoSair } from "./form";

export const dynamic = "force-dynamic";

function formatarTelefone(t: string) {
  const d = t.replace(/^55/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return t;
}

export default async function Caes() {
  const { supabase, creche } = await contexto();
  const [{ data: caes }, { data: tutores }] = await Promise.all([
    supabase.from("caes").select("id, nome, raca, cor, ativo, tutores(nome, telefone)").order("nome"),
    supabase.from("tutores").select("id, nome").order("nome"),
  ]);

  type Linha = {
    id: string;
    nome: string;
    raca: string | null;
    cor: string;
    ativo: boolean;
    tutores: { nome: string; telefone: string } | null;
  };
  const lista = (caes as unknown as Linha[]) ?? [];

  return (
    <main className="flex flex-1 flex-col gap-6 pb-10">
      <header className="flex items-center gap-3 px-5 pt-5">
        <Voltar href="/app" />
        <div className="flex flex-col">
          <h1 className="font-display text-[22px] font-extrabold">Cães e tutores</h1>
          <span className="text-[13px] text-suave">{creche.nome}</span>
        </div>
      </header>

      <section className="px-5">
        <FormCao tutores={tutores ?? []} />
      </section>

      <section className="flex flex-col gap-2 px-5" aria-label="Cães cadastrados">
        <h2 className="text-[13px] font-bold uppercase tracking-wide text-suave">
          {lista.length} {lista.length === 1 ? "cão cadastrado" : "cães cadastrados"}
        </h2>
        {lista.map((c) => (
          <div
            key={c.id}
            className={`flex items-center gap-3 rounded-2xl border border-borda bg-white px-3.5 py-3 ${c.ativo ? "" : "opacity-60"}`}
          >
            <Avatar nome={c.nome} cor={c.cor} size={40} />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="font-bold">
                {c.nome}
                {c.raca && <span className="font-normal text-suave"> · {c.raca}</span>}
              </span>
              <span className="truncate text-[13px] text-suave">
                {c.tutores?.nome} · {c.tutores ? formatarTelefone(c.tutores.telefone) : ""}
              </span>
            </div>
            <BotaoAtivo caoId={c.id} ativo={c.ativo} />
          </div>
        ))}
      </section>

      <div className="px-5">
        <BotaoSair />
      </div>
    </main>
  );
}
