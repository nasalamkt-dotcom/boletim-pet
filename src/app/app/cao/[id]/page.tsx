import { notFound } from "next/navigation";
import { contexto } from "@/lib/sessao";
import { hoje, hora } from "@/lib/datas";
import { registrosFeitos, type Presenca } from "@/lib/dominio";
import { iaDisponivel } from "@/lib/ia";
import { linkBoletim } from "@/lib/envios";
import { Avatar, Voltar } from "@/components/ui";
import { BotaoCheckin } from "../../componentes";
import { RegistroCao } from "./registro";

export const dynamic = "force-dynamic";

export default async function PaginaCao({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, creche } = await contexto();
  const dia = hoje(creche.fuso);

  const { data: cao } = await supabase
    .from("caes")
    .select("id, nome, raca, cor, tutores(nome)")
    .eq("id", id)
    .maybeSingle();
  if (!cao) notFound();

  const { data: presenca } = await supabase
    .from("presencas")
    .select("*, boletins(status, token)")
    .eq("cao_id", id)
    .eq("dia", dia)
    .maybeSingle();

  const { data: marcacoes } = await supabase
    .from("foto_caes")
    .select("fotos!inner(id, caminho, dia, criado_em)")
    .eq("cao_id", id)
    .eq("fotos.dia", dia);

  type Foto = { id: string; caminho: string; criado_em: string };
  const fotos = ((marcacoes ?? []).map((m) => m.fotos) as unknown as Foto[]).sort((a, b) =>
    a.criado_em.localeCompare(b.criado_em),
  );
  const { data: assinadas } = fotos.length
    ? await supabase.storage.from("fotos").createSignedUrls(fotos.map((f) => f.caminho), 3600)
    : { data: [] };
  const fotosComUrl = fotos.map((f, i) => ({ id: f.id, url: assinadas?.[i]?.signedUrl ?? "" }));

  const tutor = (cao.tutores as unknown as { nome: string } | null)?.nome;
  const b = presenca?.boletins as { status: string; token: string } | { status: string; token: string }[] | null;
  const boletim = Array.isArray(b) ? b[0] : b;

  return (
    <main className="flex flex-1 flex-col">
      <header className="flex items-center gap-3 px-5 pt-5 pb-3">
        <Voltar href="/app" />
        <Avatar nome={cao.nome} cor={cao.cor} size={44} />
        <div className="flex min-w-0 flex-col">
          <h1 className="font-display text-[22px] font-extrabold leading-tight">{cao.nome}</h1>
          <span className="truncate text-[13px] text-suave">
            {presenca?.chegada
              ? `Chegou às ${hora(presenca.chegada, creche.fuso)} · ${registrosFeitos(presenca)} de 4 registros`
              : `${cao.raca ?? "Sem raça informada"}${tutor ? ` · tutor: ${tutor}` : ""}`}
          </span>
        </div>
      </header>

      {!presenca?.chegada ? (
        <div className="mx-5 mt-4 flex items-center justify-between gap-4 rounded-2xl border border-borda bg-white p-5">
          <p className="font-bold">{cao.nome} ainda não chegou hoje.</p>
          <BotaoCheckin caoId={cao.id} />
        </div>
      ) : (
        <RegistroCao
          crecheId={creche.id}
          dia={dia}
          caoId={cao.id}
          nomeCao={cao.nome}
          presenca={presenca as Presenca}
          fotos={fotosComUrl}
          iaLigada={iaDisponivel()}
          boletim={boletim ? { status: boletim.status, link: linkBoletim(boletim.token) } : null}
        />
      )}
    </main>
  );
}
