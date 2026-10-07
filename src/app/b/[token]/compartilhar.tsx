"use client";

import { useState } from "react";
import { botaoSol } from "@/components/ui";

export function Compartilhar({ nome }: { nome: string }) {
  const [copiado, setCopiado] = useState(false);

  async function compartilhar() {
    const url = window.location.href;
    const texto = `Olha como foi o dia do ${nome} na creche!`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `O dia do ${nome}`, text: texto, url });
        return;
      } catch {
        // cancelado pelo usuário
      }
    }
    await navigator.clipboard.writeText(url);
    setCopiado(true);
  }

  return (
    <button type="button" onClick={compartilhar} className={botaoSol}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="6" cy="12" r="2.5" />
        <circle cx="18" cy="6" r="2.5" />
        <circle cx="18" cy="18" r="2.5" />
        <path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6" />
      </svg>
      {copiado ? "Link copiado" : "Compartilhar com a família"}
    </button>
  );
}
