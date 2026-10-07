"use client";

import { useActionState } from "react";
import Link from "next/link";
import { cadastrarCreche, type EstadoCadastroCreche } from "./acoes";
import { Pata, botaoPrimario, campoTexto } from "@/components/ui";

export default function Cadastro() {
  const [estado, acao, pendente] = useActionState<EstadoCadastroCreche, FormData>(cadastrarCreche, null);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-6 py-12">
      <div className="flex flex-col gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal text-sol">
          <Pata size={30} />
        </span>
        <h1 className="font-display text-3xl font-extrabold">Cadastre sua creche</h1>
        <p className="text-suave">Você será o administrador e poderá cadastrar o acesso da sua equipe depois.</p>
      </div>

      <form action={acao} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-[15px] font-bold">Nome da creche</span>
          <input name="creche" required className={campoTexto} placeholder="Ex.: Creche Patinhas" />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-[15px] font-bold">Seu nome</span>
          <input name="nome" required autoComplete="name" className={campoTexto} />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-[15px] font-bold">E-mail</span>
          <input name="email" type="email" required autoComplete="email" className={campoTexto} />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-[15px] font-bold">Senha</span>
          <input name="senha" type="password" required minLength={8} autoComplete="new-password" className={campoTexto} />
          <span className="text-[13px] text-suave">Pelo menos 8 caracteres.</span>
        </label>
        <button type="submit" className={botaoPrimario} disabled={pendente}>
          {pendente ? "Criando..." : "Criar conta da creche"}
        </button>
        {estado?.erro && (
          <p className="text-[15px] text-perigo" role="alert">
            {estado.erro}
          </p>
        )}
      </form>

      <p className="text-[15px] text-suave">
        Já tem acesso?{" "}
        <Link href="/login" className="font-bold text-teal underline">
          Entrar
        </Link>
      </p>
    </main>
  );
}
