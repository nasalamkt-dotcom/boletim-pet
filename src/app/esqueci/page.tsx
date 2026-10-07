"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Voltar, botaoPrimario, campoTexto } from "@/components/ui";

export default function Esqueci() {
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<"livre" | "enviando" | "enviado" | "erro">("livre");

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEstado("enviando");
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/nova-senha`,
    });
    setEstado(error ? "erro" : "enviado");
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-8 px-6 py-10">
      <Voltar href="/login" />
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-extrabold">Esqueci minha senha</h1>
        <p className="text-suave">Enviamos um link para você criar uma senha nova.</p>
      </div>

      {estado === "enviado" ? (
        <div className="rounded-2xl bg-teal-claro p-5 text-teal-escuro">
          <p className="font-bold">Confira seu e-mail.</p>
          <p className="mt-1 text-[15px]">
            Se {email} tiver acesso ao Boletim Pet, o link chega em alguns minutos. Veja também a caixa de spam.
          </p>
          <Link href="/login" className="mt-3 inline-block font-bold underline">
            Voltar ao login
          </Link>
        </div>
      ) : (
        <form onSubmit={enviar} className="flex flex-col gap-4">
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
          <button type="submit" className={botaoPrimario} disabled={estado === "enviando"}>
            {estado === "enviando" ? "Enviando..." : "Enviar link"}
          </button>
          {estado === "erro" && (
            <p className="text-[15px] text-perigo" role="alert">
              Não foi possível enviar agora. Aguarde um minuto e tente de novo.
            </p>
          )}
        </form>
      )}
    </main>
  );
}
