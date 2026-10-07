"use client";

import { useState, useTransition } from "react";
import { enviarBoletinsHoje, fazerCheckin } from "./acoes";
import { botaoPrimario } from "@/components/ui";

export function BotaoCheckin({ caoId }: { caoId: string }) {
  const [pendente, iniciar] = useTransition();
  return (
    <button
      type="button"
      disabled={pendente}
      onClick={() => iniciar(async () => void (await fazerCheckin(caoId)))}
      className="min-h-[44px] rounded-xl bg-teal px-4 text-[15px] font-bold text-white disabled:opacity-60"
    >
      {pendente ? "..." : "Chegou"}
    </button>
  );
}

export function EnviarBoletins({ pendentes }: { pendentes: number }) {
  const [pendente, iniciar] = useTransition();
  const [resultado, setResultado] = useState<string | null>(null);

  if (pendentes === 0 && !resultado) {
    return (
      <div className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-teal-claro text-[15px] font-bold text-teal-escuro">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
        Todos os boletins de hoje já saíram
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={pendente || pendentes === 0}
        className={botaoPrimario}
        onClick={() =>
          iniciar(async () => {
            const r = await enviarBoletinsHoje();
            setResultado(
              r.falhas
                ? `${r.enviados} enviados, ${r.falhas} com falha. Veja em Envios.`
                : `${r.enviados} ${r.enviados === 1 ? "boletim enviado" : "boletins enviados"}.`,
            );
          })
        }
      >
        {pendente ? "Enviando..." : `Enviar ${pendentes} ${pendentes === 1 ? "boletim" : "boletins"} no WhatsApp`}
      </button>
      <p className="text-center text-[12px] text-suave" role="status">
        {resultado ?? "Também saem sozinhos no fim do dia ou no checkout de cada cão."}
      </p>
    </div>
  );
}
