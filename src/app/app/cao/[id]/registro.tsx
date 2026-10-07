"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CAMPOS, type CampoChave, type Presenca } from "@/lib/dominio";
import { enviarFoto } from "@/lib/upload";
import {
  fazerCheckout,
  reenviarBoletim,
  registrarFoto,
  removerFoto,
  salvarCampo,
  salvarRecado,
  sugerirRecado,
} from "../../acoes";
import { botaoContorno, botaoPrimario, rotulo } from "@/components/ui";

type Props = {
  crecheId: string;
  dia: string;
  caoId: string;
  nomeCao: string;
  presenca: Presenca;
  fotos: { id: string; url: string }[];
  iaLigada: boolean;
  boletim: { status: string; link: string } | null;
};

export function RegistroCao(props: Props) {
  const router = useRouter();
  const { presenca } = props;
  const [valores, setValores] = useState<Record<CampoChave, string | null>>({
    alimentacao: presenca.alimentacao,
    necessidades: presenca.necessidades,
    atividade: presenca.atividade,
    humor: presenca.humor,
  });
  const [recado, setRecado] = useState(presenca.recado ?? "");
  const [recadoSalvo, setRecadoSalvo] = useState(presenca.recado ?? "");
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [pendente, iniciar] = useTransition();
  const inputFoto = useRef<HTMLInputElement>(null);

  function escolher(campo: CampoChave, opcao: string) {
    const novo = valores[campo] === opcao ? null : opcao;
    setValores((v) => ({ ...v, [campo]: novo }));
    salvarCampo(presenca.id, campo, novo).catch(() => {
      setValores((v) => ({ ...v, [campo]: valores[campo] }));
      setAviso("Não foi possível salvar. Verifique a conexão.");
    });
  }

  async function aoEscolherFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!arquivos.length) return;
    setEnviandoFoto(true);
    setAviso(null);
    try {
      for (const arq of arquivos) {
        const caminho = await enviarFoto(arq, props.crecheId, props.dia);
        await registrarFoto(caminho, [props.caoId]);
      }
      router.refresh();
    } catch {
      setAviso("A foto não subiu. Tente de novo.");
    } finally {
      setEnviandoFoto(false);
    }
  }

  const jaSaiu = props.boletim && !["pendente", "falhou"].includes(props.boletim.status);

  return (
    <div className="flex flex-1 flex-col gap-5 px-5 pt-2 pb-8">
      {aviso && (
        <p className="rounded-xl bg-[#FDECEA] px-4 py-3 text-[14px] text-perigo" role="alert">
          {aviso}
        </p>
      )}

      {CAMPOS.map((campo) => (
        <fieldset key={campo.chave} className="flex flex-col gap-2">
          <legend className={`${rotulo} mb-2`}>{campo.rotulo}</legend>
          <div className="flex flex-wrap gap-2">
            {campo.opcoes.map((opcao) => {
              const ativo = valores[campo.chave] === opcao;
              return (
                <button
                  key={opcao}
                  type="button"
                  aria-pressed={ativo}
                  onClick={() => escolher(campo.chave, opcao)}
                  className={
                    ativo
                      ? "min-h-[44px] rounded-full border border-teal bg-teal px-4 text-[15px] font-bold text-white"
                      : "min-h-[44px] rounded-full border border-linha bg-white px-4 text-[15px] font-medium text-tinta"
                  }
                >
                  {opcao}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      <section className="flex flex-col gap-2">
        <h2 className={rotulo}>Fotos de hoje</h2>
        <div className="grid grid-cols-4 gap-2">
          {props.fotos.map((f) => (
            <div key={f.id} className="group relative aspect-square overflow-hidden rounded-xl bg-[#BFDCD6]">
              {f.url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.url} alt={`Foto de ${props.nomeCao}`} className="h-full w-full object-cover" />
              )}
              <button
                type="button"
                aria-label="Remover foto"
                onClick={() =>
                  iniciar(async () => {
                    if (!confirm("Remover esta foto? Ela sai do boletim de todos os cães marcados nela.")) return;
                    await removerFoto(f.id);
                    router.refresh();
                  })
                }
                className="absolute top-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          ))}
          <button
            type="button"
            aria-label="Adicionar foto"
            disabled={enviandoFoto}
            onClick={() => inputFoto.current?.click()}
            className="flex aspect-square items-center justify-center rounded-xl border-[1.5px] border-dashed border-[#9AA6A3] text-suave disabled:opacity-60"
          >
            {enviandoFoto ? (
              <span className="text-[12px] font-bold">Enviando</span>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
            )}
          </button>
        </div>
        <input
          ref={inputFoto}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={aoEscolherFoto}
        />
      </section>

      <section className="flex flex-col gap-2">
        <label htmlFor="recado" className={rotulo}>
          Recado para o tutor
        </label>
        <textarea
          id="recado"
          rows={4}
          value={recado}
          onChange={(e) => setRecado(e.target.value)}
          placeholder="Anote do jeito rápido: brincou com a Mel, comeu tudo, dormiu depois do almoço..."
          className="w-full rounded-xl border border-linha bg-white p-3 text-base leading-relaxed outline-none focus:border-teal"
        />
        <div className="flex gap-2">
          {props.iaLigada && (
            <button
              type="button"
              disabled={pendente || !recado.trim()}
              className={`${botaoContorno} flex-1`}
              onClick={() =>
                iniciar(async () => {
                  const r = await sugerirRecado(presenca.id, recado);
                  if (r.ok) setRecado(r.texto);
                  else setAviso(r.erro);
                })
              }
            >
              Melhorar com IA
            </button>
          )}
          <button
            type="button"
            disabled={pendente || recado === recadoSalvo}
            className={`${botaoContorno} flex-1`}
            onClick={() =>
              iniciar(async () => {
                await salvarRecado(presenca.id, recado);
                setRecadoSalvo(recado);
              })
            }
          >
            {recado === recadoSalvo && recado ? "Recado salvo" : "Salvar recado"}
          </button>
        </div>
      </section>

      <section className="mt-2 flex flex-col gap-2 border-t border-borda pt-5">
        {jaSaiu ? (
          <>
            <p className="text-[15px]">
              Boletim {props.boletim!.status === "simulado" ? "gerado (modo simulado)" : "enviado"}.{" "}
              <a href={props.boletim!.link} target="_blank" rel="noreferrer" className="font-bold text-teal underline">
                Ver como o tutor vê
              </a>
            </p>
            <button
              type="button"
              disabled={pendente}
              className={botaoContorno}
              onClick={() =>
                iniciar(async () => {
                  await reenviarBoletim(presenca.id);
                  setAviso(null);
                })
              }
            >
              Reenviar aviso ao tutor
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={pendente}
            className={botaoPrimario}
            onClick={() =>
              iniciar(async () => {
                if (recado !== recadoSalvo) {
                  await salvarRecado(presenca.id, recado);
                  setRecadoSalvo(recado);
                }
                const r = await fazerCheckout(presenca.id);
                if (r.status === "falhou") setAviso("O boletim não saiu. Confira o WhatsApp do tutor em Cães.");
                router.refresh();
              })
            }
          >
            {pendente ? "Enviando..." : `Saída de ${props.nomeCao} e enviar boletim`}
          </button>
        )}
      </section>
    </div>
  );
}
