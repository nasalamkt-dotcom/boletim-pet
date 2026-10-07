import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { diaPorExtenso, hora } from "@/lib/datas";
import { Avatar, Pata } from "@/components/ui";
import { Compartilhar } from "./compartilhar";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

type Dados = {
  presenca: {
    id: string;
    dia: string;
    chegada: string | null;
    saida: string | null;
    alimentacao: string | null;
    necessidades: string | null;
    atividade: string | null;
    humor: string | null;
    recado: string | null;
    recado_autor: string | null;
    cao_id: string;
    caes: { nome: string; cor: string } | null;
    creches: { nome: string; fuso: string } | null;
  };
};

async function carregar(token: string) {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;
  const admin = createAdminClient();
  const { data: boletim } = await admin
    .from("boletins")
    .select(
      "presenca:presencas(id, dia, chegada, saida, alimentacao, necessidades, atividade, humor, recado, recado_autor, cao_id, caes(nome, cor), creches(nome, fuso))",
    )
    .eq("token", token)
    .maybeSingle();
  if (!boletim?.presenca) return null;
  const { presenca } = boletim as unknown as Dados;

  // Fotos do dia em que o cão foi marcado
  const { data: marcacoes } = await admin
    .from("foto_caes")
    .select("fotos!inner(id, caminho, dia, criado_em, foto_caes(cao_id, caes(id, nome, cor)))")
    .eq("cao_id", presenca.cao_id)
    .eq("fotos.dia", presenca.dia);

  type Foto = {
    id: string;
    caminho: string;
    criado_em: string;
    foto_caes: { cao_id: string; caes: { id: string; nome: string; cor: string } | null }[];
  };
  const fotos = ((marcacoes ?? []).map((m) => m.fotos) as unknown as Foto[]).sort((a, b) =>
    a.criado_em.localeCompare(b.criado_em),
  );

  const { data: assinadas } = fotos.length
    ? await admin.storage.from("fotos").createSignedUrls(fotos.map((f) => f.caminho), 60 * 60 * 6)
    : { data: [] };

  const amigos = new Map<string, { nome: string; cor: string }>();
  fotos.forEach((f) =>
    f.foto_caes.forEach((fc) => {
      if (fc.caes && fc.cao_id !== presenca.cao_id) amigos.set(fc.caes.id, { nome: fc.caes.nome, cor: fc.caes.cor });
    }),
  );

  return {
    presenca,
    fotos: fotos.map((f, i) => ({ id: f.id, url: assinadas?.[i]?.signedUrl ?? "", em: f.criado_em })),
    amigos: Array.from(amigos.values()),
  };
}

const ICONES: Record<string, React.ReactNode> = {
  Alimentação: <path d="M4 13h16a8 8 0 0 1-16 0zM9 9c0-2 2-2 2-4M14 9c0-2 2-2 2-4" />,
  Necessidades: <path d="M12 3c3 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-7 6-11z" />,
  Atividade: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M4.5 9.5c4 1 11 1 15 0M4.5 14.5c4-1 11-1 15 0" />
    </>
  ),
  Humor: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M8.5 14c1.8 2 5.2 2 7 0M9.5 10h.01M14.5 10h.01" />
    </>
  ),
};

export default async function Boletim({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const dados = await carregar(token);
  if (!dados) notFound();
  const { presenca: p, fotos, amigos } = dados;
  const nome = p.caes?.nome ?? "Seu pet";
  const fuso = p.creches?.fuso;
  const capa = fotos[fotos.length > 1 ? 1 : 0];

  const rotina = [
    { rotulo: "Alimentação", valor: p.alimentacao },
    { rotulo: "Necessidades", valor: p.necessidades },
    { rotulo: "Atividade", valor: p.atividade },
    { rotulo: "Humor", valor: p.humor },
  ].filter((r) => r.valor);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col pb-10">
      <header className="flex flex-col gap-1.5 bg-teal px-6 pt-7 pb-[70px] text-white">
        <span className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-[#CFE9E4]">
          <Pata size={18} />
          {p.creches?.nome}
        </span>
        <h1 className="font-display text-[36px] font-extrabold leading-none">O dia do {nome}</h1>
        <p className="text-[15px] text-[#DDEFEC]">
          <span className="capitalize">{diaPorExtenso(p.dia)}</span>
          {p.chegada && ` · das ${hora(p.chegada, fuso)}`}
          {p.saida && ` às ${hora(p.saida, fuso)}`}
        </p>
      </header>

      <div className="-mt-[52px] mx-4 flex h-[260px] items-center justify-center overflow-hidden rounded-[20px] bg-[#F7D58A] text-tinta">
        {capa?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={capa.url} alt={`${nome} hoje na creche`} className="h-full w-full object-cover" />
        ) : (
          <Pata size={56} />
        )}
      </div>

      {rotina.length > 0 && (
        <section className="flex flex-col gap-3 px-4 pt-7">
          <h2 className="font-display text-[22px] font-extrabold">Rotina</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {rotina.map((r) => (
              <div key={r.rotulo} className="flex flex-col gap-1.5 rounded-2xl border border-borda bg-white p-3.5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0E5E58" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {ICONES[r.rotulo]}
                </svg>
                <span className="text-[12px] font-bold uppercase tracking-wide text-suave">{r.rotulo}</span>
                <span className="text-[16px] font-bold">{r.valor}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {p.recado && (
        <section className="flex flex-col gap-3 px-4 pt-7">
          <h2 className="font-display text-[22px] font-extrabold">Recado da equipe</h2>
          <div className="flex flex-col gap-3 rounded-[18px] border border-borda bg-white p-[18px]">
            <p className="whitespace-pre-line text-[16px] leading-relaxed">{p.recado}</p>
            {p.recado_autor && (
              <div className="flex items-center gap-2.5">
                <Avatar nome={p.recado_autor} cor="#DDEFEC" size={34} />
                <span className="text-[14px] text-suave">{p.recado_autor}</span>
              </div>
            )}
          </div>
        </section>
      )}

      {amigos.length > 0 && (
        <section className="flex flex-col gap-3 px-4 pt-7">
          <h2 className="font-display text-[22px] font-extrabold">Turma de hoje</h2>
          <div className="flex flex-wrap gap-4">
            {amigos.map((a) => (
              <div key={a.nome} className="flex flex-col items-center gap-1.5">
                <Avatar nome={a.nome} cor={a.cor} size={54} />
                <span className="text-[14px] font-medium">{a.nome}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {fotos.length > 0 && (
        <section className="flex flex-col gap-3 px-4 pt-7">
          <h2 className="font-display text-[22px] font-extrabold">Fotos do dia</h2>
          <div className="grid grid-cols-2 gap-2">
            {fotos.map((f) => (
              <a key={f.id} href={f.url} target="_blank" rel="noreferrer" className="relative block h-[150px] overflow-hidden rounded-[14px] bg-[#BFDCD6]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.url} alt={`Foto de ${nome} às ${hora(f.em, fuso)}`} loading="lazy" className="h-full w-full object-cover" />
                <span className="absolute bottom-2 left-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[12px] font-bold text-white">
                  {hora(f.em, fuso)}
                </span>
              </a>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-col gap-2.5 px-4 pt-8">
        <Compartilhar nome={nome} />
      </div>

      <footer className="mt-auto px-4 pt-8 text-center text-[12px] text-suave">
        Boletim enviado por {p.creches?.nome} · feito com Boletim Pet
      </footer>
    </main>
  );
}
