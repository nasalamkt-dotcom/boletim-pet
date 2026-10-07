import { contexto } from "@/lib/sessao";
import { hoje } from "@/lib/datas";
import { Voltar } from "@/components/ui";
import { FotoTurma } from "./foto-turma";

export const dynamic = "force-dynamic";

export default async function Turma() {
  const { supabase, creche } = await contexto();
  const dia = hoje(creche.fuso);
  const { data } = await supabase
    .from("presencas")
    .select("caes(id, nome, cor)")
    .eq("dia", dia)
    .not("chegada", "is", null);

  const caes = ((data ?? []).map((p) => p.caes) as unknown as { id: string; nome: string; cor: string }[])
    .filter(Boolean)
    .sort((a, b) => a.nome.localeCompare(b.nome));

  return (
    <main className="flex flex-1 flex-col">
      <header className="flex items-center gap-3 px-5 pt-5 pb-3">
        <Voltar href="/app" />
        <h1 className="font-display text-[22px] font-extrabold">Foto da turma</h1>
      </header>
      <FotoTurma crecheId={creche.id} dia={dia} caes={caes} />
    </main>
  );
}
