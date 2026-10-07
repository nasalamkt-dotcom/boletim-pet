"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { adicionarMembro, redefinirSenhaMembro, removerMembro, type EstadoEquipe } from "./acoes";
import { botaoPrimario, campoTexto } from "@/components/ui";

export function FormMembro() {
  const [estado, acao, pendente] = useActionState<EstadoEquipe, FormData>(adicionarMembro, null);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado?.ok) form.current?.reset();
  }, [estado]);

  return (
    <form ref={form} action={acao} className="flex flex-col gap-3 rounded-2xl border border-borda bg-white p-4">
      <h2 className="font-display text-lg font-extrabold">Adicionar pessoa</h2>
      <label className="flex flex-col gap-1.5">
        <span className="text-[14px] font-bold">Nome</span>
        <input name="nome" required className={campoTexto} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[14px] font-bold">E-mail</span>
        <input name="email" type="email" required autoComplete="off" className={campoTexto} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[14px] font-bold">Senha provisória</span>
        <input name="senha" type="text" required minLength={8} autoComplete="off" className={campoTexto} />
        <span className="text-[13px] text-suave">Passe para a pessoa. Ela pode trocar depois em Conta.</span>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[14px] font-bold">Permissão</span>
        <select name="papel" defaultValue="monitor" className={campoTexto}>
          <option value="monitor">Monitor: registra o dia dos cães</option>
          <option value="admin">Administrador: também gerencia a equipe</option>
        </select>
      </label>
      <button type="submit" disabled={pendente} className={botaoPrimario}>
        {pendente ? "Adicionando..." : "Adicionar à equipe"}
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

export function AcoesMembro({ userId, nome }: { userId: string; nome: string }) {
  const [pendente, iniciar] = useTransition();
  const [aviso, setAviso] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pendente}
          className="min-h-[40px] flex-1 rounded-xl border border-linha text-[13px] font-bold text-suave"
          onClick={() => {
            const senha = prompt(`Nova senha provisória para ${nome} (mínimo 8 caracteres):`);
            if (!senha) return;
            iniciar(async () => {
              const r = await redefinirSenhaMembro(userId, senha);
              setAviso(r.erro ?? r.ok ?? null);
            });
          }}
        >
          Trocar senha
        </button>
        <button
          type="button"
          disabled={pendente}
          className="min-h-[40px] flex-1 rounded-xl border border-linha text-[13px] font-bold text-perigo"
          onClick={() => {
            if (!confirm(`Remover o acesso de ${nome}? A pessoa não conseguirá mais entrar.`)) return;
            iniciar(() => removerMembro(userId));
          }}
        >
          Remover acesso
        </button>
      </div>
      {aviso && (
        <p className="text-[13px] text-suave" role="status">
          {aviso}
        </p>
      )}
    </div>
  );
}
