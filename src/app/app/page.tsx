import Link from "next/link";
import { contexto } from "@/lib/sessao";
import { hoje, hora, diaPorExtenso } from "@/lib/datas";
import { registrosFeitos, type Presenca } from "@/lib/dominio";
import { modoWhatsApp } from "@/lib/whatsapp";
import { Avatar, Pata } from "@/components/ui";
import { BotaoCheckin, EnviarBoletins } from "./componentes";

export const dynamic = "force-dynamic";

type CaoLinha = { id: string; nome: string; raca: string | null; cor: string };
type PresencaLinha = Presenca & { boletins: { status: string } | { status: string }[] | null };

function statusBoletim(p: PresencaLinha) {
  const b = Array.isArray(p.boletins) ? p.boletins[0] : p.boletins;
  return b?.status ?? null;
}

export default async function Hoje() {
  const { supabase, creche, membro } = await contexto();
  const dia = hoje(creche.fuso);

  const [{ data: caes }, { data: presencas }, { data: marcacoes }] = await Promise.all([
    supabase.from("caes").select("id, nome, raca, cor").eq("ativo", true).order("nome"),
    supabase.from("presencas").select("*, boletins(status)").eq("dia", dia),
    supabase.from("foto_caes").select("cao_id, fotos!inner(dia)").eq("fotos.dia", dia),
  ]);

  const porCao = new Map<string, PresencaLinha>();
  (presencas as PresencaLinha[] | null)?.forEach((p) => porCao.set(p.cao_id, p));
  const fotosPorCao = new Map<string, number>();
  marcacoes?.forEach((m) => fotosPorCao.set(m.cao_id, (fotosPorCao.get(m.cao_id) ?? 0) + 1));

  const lista = (caes as CaoLinha[] | null) ?? [];
  const presentes = lista.filter((c) => porCao.get(c.id)?.chegada);
  const ausentes = lista.filter((c) => !porCao.get(c.id)?.chegada);
  const pendentes = presentes.filter((c) => {
    const s = statusBoletim(porCao.get(c.id)!);
    return !s || s === "pendente" || s === "falhou";
  }).length;

  return (
    <main className="flex flex-1 flex-col">
      <header className="flex flex-col gap-1 px-5 pt-7 pb-4">
        <span className="text-[13px] font-bold uppercase tracking-wide text-teal">{creche.nome}</span>
        <h1 className="font-display text-[30px] font-extrabold leading-tight">
          {presentes.length === 1 ? "1 cão na creche" : `${presentes.length} cães na creche`}
        </h1>
        <p className="text-[14px] text-suave">
          <span className="capitalize">{diaPorExtenso(dia)}</span> · olá, {membro.nome}
        </p>
        <nav className="mt-3 flex flex-wrap gap-2" aria-label="Menu">
          {[
            { href: "/app/caes", rotulo: "Cães" },
            { href: "/app/mensagens", rotulo: "Envios" },
            ...(membro.papel === "admin" ? [{ href: "/app/equipe", rotulo: "Equipe" }] : []),
            { href: "/app/conta", rotulo: "Conta" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex min-h-[40px] items-center rounded-full border border-borda bg-white px-4 text-[14px] font-bold text-teal"
            >
              {l.rotulo}
            </Link>
          ))}
        </nav>
      </header>

      {modoWhatsApp() === "mock" && (
        <p className="mx-5 mb-3 rounded-xl bg-[#FFF4DA] px-4 py-3 text-[14px] text-[#5C4100]">
          WhatsApp em modo simulado: nada é enviado de verdade. Veja os links em Envios.
        </p>
      )}

      {lista.length === 0 ? (
        <div className="mx-5 flex flex-col items-center gap-3 rounded-2xl border border-borda bg-white p-8 text-center">
          <Pata size={36} className="text-teal" />
          <p className="font-bold">Nenhum cão cadastrado ainda.</p>
          <Link href="/app/caes" className="font-bold text-teal">Cadastrar o primeiro</Link>
        </div>
      ) : (
        <>
          {presentes.length > 0 && (
            <div className="px-5 pb-3">
              <Link
                href="/app/turma"
                className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-sol text-base font-bold text-tinta"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
                  <circle cx="12" cy="13" r="3.5" />
                </svg>
                Foto da turma
              </Link>
            </div>
          )}

          <section className="flex flex-col gap-2.5 px-5 pb-4" aria-label="Cães presentes">
            {presentes.map((c) => {
              const p = porCao.get(c.id)!;
              const feitos = registrosFeitos(p);
              const fotos = fotosPorCao.get(c.id) ?? 0;
              const status = statusBoletim(p);
              return (
                <Link
                  key={c.id}
                  href={`/app/cao/${c.id}`}
                  className="flex min-h-[72px] items-center gap-3.5 rounded-2xl border border-borda bg-white px-3.5 py-3"
                >
                  <Avatar nome={c.nome} cor={c.cor} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-[17px] font-bold">{c.nome}</span>
                    <span className="truncate text-[13px] text-suave">
                      Chegou {hora(p.chegada, creche.fuso)} · {fotos === 1 ? "1 foto" : `${fotos} fotos`}
                    </span>
                  </span>
                  {status && status !== "pendente" && status !== "falhou" ? (
                    <span className="rounded-full bg-teal-claro px-2.5 py-1 text-[12px] font-bold text-teal-escuro">Enviado</span>
                  ) : feitos === 4 ? (
                    <span className="rounded-full bg-teal px-2.5 py-1 text-[12px] font-bold text-white">Completo</span>
                  ) : (
                    <span className="rounded-full bg-[#ECEFEE] px-2.5 py-1 text-[12px] font-bold text-suave">{feitos} de 4</span>
                  )}
                </Link>
              );
            })}
          </section>

          {ausentes.length > 0 && (
            <section className="flex flex-col gap-2 px-5 pb-6" aria-label="Ainda não chegaram">
              <h2 className="text-[13px] font-bold uppercase tracking-wide text-suave">Ainda não chegaram</h2>
              {ausentes.map((c) => (
                <div key={c.id} className="flex items-center gap-3 rounded-2xl bg-white/60 px-3.5 py-2.5">
                  <Avatar nome={c.nome} cor={c.cor} size={38} />
                  <span className="flex-1 text-[16px] font-bold">{c.nome}</span>
                  <BotaoCheckin caoId={c.id} />
                </div>
              ))}
            </section>
          )}

          {presentes.length > 0 && (
            <div className="sticky bottom-0 mt-auto border-t border-borda bg-chao px-5 pt-3 pb-6">
              <EnviarBoletins pendentes={pendentes} />
            </div>
          )}
        </>
      )}
    </main>
  );
}
