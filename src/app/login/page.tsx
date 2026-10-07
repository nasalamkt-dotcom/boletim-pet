"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Pata, botaoPrimario, campoTexto } from "@/components/ui";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("erro") === "link") {
      setErro(
        "Esse link expirou ou foi aberto em outro navegador. Peça um novo em Esqueci minha senha e abra no mesmo aparelho.",
      );
    }
  }, []);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setEntrando(true);
    setErro("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
    if (error) {
      setErro(
        /invalid login credentials/i.test(error.message)
          ? "E-mail ou senha incorretos."
          : "Não foi possível entrar agora. Tente de novo.",
      );
      setEntrando(false);
      return;
    }
    router.replace("/app");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-6 py-12">
      <div className="flex flex-col gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal text-sol">
          <Pata size={30} />
        </span>
        <h1 className="font-display text-4xl font-extrabold leading-tight">Boletim Pet</h1>
        <p className="text-suave">Acesso da equipe da creche.</p>
      </div>

      <form onSubmit={entrar} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-[15px] font-bold">E-mail</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={campoTexto}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-[15px] font-bold">Senha</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className={campoTexto}
          />
        </label>
        <button type="submit" className={botaoPrimario} disabled={entrando}>
          {entrando ? "Entrando..." : "Entrar"}
        </button>
        {erro && (
          <p className="text-[15px] text-perigo" role="alert">
            {erro}
          </p>
        )}
      </form>

      <div className="flex flex-col gap-3 text-[15px]">
        <Link href="/esqueci" className="font-bold text-teal underline">
          Esqueci minha senha
        </Link>
        <p className="text-suave">
          Sua creche ainda não usa o Boletim Pet?{" "}
          <Link href="/cadastro" className="font-bold text-teal underline">
            Cadastre aqui
          </Link>
        </p>
      </div>
    </main>
  );
}
