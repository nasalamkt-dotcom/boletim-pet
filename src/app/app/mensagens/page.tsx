import { contexto } from "@/lib/sessao";
import { Voltar } from "@/components/ui";

export const dynamic = "force-dynamic";

const ROTULOS: Record<string, string> = {
  simulado: "Simulado",
  enviado: "Enviado",
  entregue: "Entregue",
  lido: "Lido",
  falhou: "Falhou",
};

export default async function Mensagens() {
  const { supabase, creche } = await contexto();
  const { data } = await supabase
    .from("mensagens")
    .select("id, tipo, status, erro, conteudo, criado_em, tutores(nome)")
    .order("criado_em", { ascending: false })
    .limit(60);

  type Linha = {
    id: string;
    tipo: string;
    status: string;
    erro: string | null;
    conteudo: { link?: string; corpo?: string[] };
    criado_em: string;
    tutores: { nome: string } | null;
  };
  const lista = (data as unknown as Linha[]) ?? [];
  const fmt = new Intl.DateTimeFormat("pt-BR", {
    timeZone: creche.fuso,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <main className="flex flex-1 flex-col gap-4 pb-10">
      <header className="flex items-center gap-3 px-5 pt-5">
        <Voltar href="/app" />
        <h1 className="font-display text-[22px] font-extrabold">Envios no WhatsApp</h1>
      </header>
      {lista.length === 0 && <p className="px-5 text-suave">Nenhuma mensagem enviada ainda.</p>}
      <ul className="flex flex-col gap-2 px-5">
        {lista.map((m) => (
          <li key={m.id} className="flex flex-col gap-1 rounded-2xl border border-borda bg-white px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold">
                {m.tipo === "boletim" ? "Boletim" : "Chegada"}
                {m.conteudo.corpo?.[1] && m.tipo === "boletim" ? ` de ${m.conteudo.corpo[1]}` : ""}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[12px] font-bold ${
                  m.status === "falhou" ? "bg-[#FDECEA] text-perigo" : "bg-teal-claro text-teal-escuro"
                }`}
              >
                {ROTULOS[m.status] ?? m.status}
              </span>
            </div>
            <span className="text-[13px] text-suave">
              Para {m.tutores?.nome ?? "tutor"} · {fmt.format(new Date(m.criado_em))}
            </span>
            {m.erro && <span className="text-[13px] text-perigo">{m.erro}</span>}
            {m.conteudo.link && (
              <a href={m.conteudo.link} target="_blank" rel="noreferrer" className="text-[14px] font-bold text-teal underline">
                Abrir boletim
              </a>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
