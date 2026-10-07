"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { enviarFoto } from "@/lib/upload";
import { registrarFoto } from "../acoes";
import { Avatar, botaoPrimario, botaoSol } from "@/components/ui";

type Cao = { id: string; nome: string; cor: string };

export function FotoTurma({ crecheId, dia, caes }: { crecheId: string; dia: string; caes: Cao[] }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [marcados, setMarcados] = useState<Set<string>>(new Set());
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    if (!arquivo) return setPreview(null);
    const url = URL.createObjectURL(arquivo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [arquivo]);

  function alternar(id: string) {
    setMarcados((m) => {
      const n = new Set(m);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function salvar() {
    if (!arquivo || marcados.size === 0) return;
    setSalvando(true);
    setAviso(null);
    try {
      const caminho = await enviarFoto(arquivo, crecheId, dia);
      await registrarFoto(caminho, Array.from(marcados));
      const n = marcados.size;
      setArquivo(null);
      setMarcados(new Set());
      setAviso(`Foto salva para ${n} ${n === 1 ? "cão" : "cães"}. Tire a próxima ou volte à lista.`);
      router.refresh();
    } catch {
      setAviso("A foto não subiu. Tente de novo.");
    } finally {
      setSalvando(false);
    }
  }

  if (caes.length === 0) {
    return <p className="px-5 pt-6 text-suave">Faça o check-in dos cães primeiro.</p>;
  }

  return (
    <div className="flex flex-1 flex-col gap-4 px-5 pb-8">
      {aviso && (
        <p className="rounded-xl bg-teal-claro px-4 py-3 text-[14px] text-teal-escuro" role="status">
          {aviso}
        </p>
      )}

      <button
        type="button"
        onClick={() => input.current?.click()}
        className="flex h-[300px] items-center justify-center overflow-hidden rounded-2xl bg-[#CFE3DF] text-teal-escuro"
        aria-label={preview ? "Trocar foto" : "Tirar foto"}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Foto da turma" className="h-full w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-2 font-bold">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
            Tirar foto
          </span>
        )}
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          setArquivo(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />

      <h2 className="text-[15px] font-bold">Quem aparece nesta foto?</h2>
      <div className="grid grid-cols-3 gap-2.5">
        {caes.map((c) => {
          const ativo = marcados.has(c.id);
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={ativo}
              onClick={() => alternar(c.id)}
              className={`flex min-h-[92px] flex-col items-center justify-center gap-1.5 rounded-2xl border-2 ${
                ativo ? "border-teal bg-teal-claro" : "border-borda bg-white"
              }`}
            >
              <Avatar nome={c.nome} cor={c.cor} size={40} />
              <span className={`text-[14px] ${ativo ? "font-bold" : "font-medium"}`}>{c.nome}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-auto pt-2">
        {arquivo ? (
          <button type="button" disabled={salvando || marcados.size === 0} onClick={salvar} className={botaoPrimario}>
            {salvando
              ? "Salvando..."
              : marcados.size
                ? `Salvar foto para ${marcados.size} ${marcados.size === 1 ? "cão" : "cães"}`
                : "Marque quem aparece na foto"}
          </button>
        ) : (
          <button type="button" onClick={() => input.current?.click()} className={botaoSol}>
            Tirar foto
          </button>
        )}
      </div>
    </div>
  );
}
