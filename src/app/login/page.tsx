"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Pata, botaoPrimario, campoTexto } from "@/components/ui";

export default function Login() {
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<"livre" | "enviando" | "enviado" | "erro">("livre");
  const [erro, setErro] = useState("");

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setEstado("enviando");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setErro(error.message);
      setEstado("erro");
    } else {
      setEstado("enviado");
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-6 py-12">
      <div className="flex flex-col gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal text-sol">
          <Pata size={30} />
        </span>
        <h1 className="font-display text-4xl font-extrabold leading-tight">Boletim Pet</h1>
        <p className="text-suave">O dia de cada cão, registrado em poucos toques e entregue no WhatsApp do tutor.</p>
      </div>

      {estado === "enviado" ? (
        <div className="rounded-2xl bg-teal-claro p-5 text-teal-escuro">
          <p className="font-bold">Confira seu e-mail.</p>
          <p className="mt-1 text-[15px]">Enviamos um link de acesso para {email}. Abra no celular que a equipe usa na creche.</p>
        </div>
      ) : (
        <form onSubmit={entrar} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-[15px] font-bold">Seu e-mail</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={campoTexto}
              placeholder="voce@creche.com.br"
            />
          </label>
          <button type="submit" className={botaoPrimario} disabled={estado === "enviando"}>
            {estado === "enviando" ? "Enviando..." : "Receber link de acesso"}
          </button>
          {estado === "erro" && <p className="text-[15px] text-perigo">{erro}</p>}
        </form>
      )}
    </main>
  );
}
