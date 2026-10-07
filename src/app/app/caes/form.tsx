"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { alternarAtivo, cadastrarCao, sair, type EstadoCadastro } from "../acoes";
import { botaoPrimario, campoTexto } from "@/components/ui";

export function FormCao({ tutores }: { tutores: { id: string; nome: string }[] }) {
  const [estado, acao, pendente] = useActionState<EstadoCadastro, FormData>(cadastrarCao, null);
  const [tutorId, setTutorId] = useState("");
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado?.ok) {
      form.current?.reset();
      setTutorId("");
    }
  }, [estado]);

  return (
    <form ref={form} action={acao} className="flex flex-col gap-3 rounded-2xl border border-borda bg-white p-4">
      <h2 className="font-display text-lg font-extrabold">Novo cão</h2>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[14px] font-bold">Nome do cão</span>
          <input name="cao" required className={campoTexto} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[14px] font-bold">Raça</span>
          <input name="raca" className={campoTexto} placeholder="Opcional" />
        </label>
      </div>

      {tutores.length > 0 && (
        <label className="flex flex-col gap-1.5">
          <span className="text-[14px] font-bold">Tutor</span>
          <select name="tutor_id" value={tutorId} onChange={(e) => setTutorId(e.target.value)} className={campoTexto}>
            <option value="">Novo tutor</option>
            {tutores.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
          </select>
        </label>
      )}

      {!tutorId && (
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[14px] font-bold">Nome do tutor</span>
            <input name="tutor" required className={campoTexto} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[14px] font-bold">WhatsApp</span>
            <input name="telefone" required inputMode="tel" className={campoTexto} placeholder="(81) 99999-0000" />
          </label>
        </div>
      )}

      <button type="submit" disabled={pendente} className={botaoPrimario}>
        {pendente ? "Salvando..." : "Cadastrar"}
      </button>
      {estado?.erro && (
        <p className="text-[14px] text-perigo" role="alert">
          {estado.erro}
        </p>
      )}
      {estado?.ok && (
        <p className="text-[14px] font-bold text-teal" role="status">
          {estado.ok}
        </p>
      )}
    </form>
  );
}

export function BotaoAtivo({ caoId, ativo }: { caoId: string; ativo: boolean }) {
  const [pendente, iniciar] = useTransition();
  return (
    <button
      type="button"
      disabled={pendente}
      onClick={() => iniciar(() => alternarAtivo(caoId, !ativo))}
      className="min-h-[44px] rounded-xl border border-linha px-3 text-[13px] font-bold text-suave"
    >
      {ativo ? "Desativar" : "Reativar"}
    </button>
  );
}

export function BotaoSair() {
  return (
    <form action={sair}>
      <button type="submit" className="min-h-[44px] text-[14px] font-bold text-suave underline">
        Sair da conta
      </button>
    </form>
  );
}
