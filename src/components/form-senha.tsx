"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { botaoPrimario, campoTexto } from "@/components/ui";

export const SENHA_MINIMA = 8;

/** Define uma senha nova para o usuário logado. */
export function FormSenha({ depois }: { depois?: string }) {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [repetir, setRepetir] = useState("");
  const [estado, setEstado] = useState<"livre" | "salvando" | "ok">("livre");
  const [erro, setErro] = useState("");

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (senha.length < SENHA_MINIMA) return setErro(`A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`);
    if (senha !== repetir) return setErro("As duas senhas não são iguais.");
    setEstado("salvando");
    const { error } = await createClient().auth.updateUser({ password: senha });
    if (error) {
      setEstado("livre");
      setErro(
        /different from the old/i.test(error.message)
          ? "A senha nova precisa ser diferente da atual."
          : "Não foi possível salvar a senha. Tente de novo.",
      );
      return;
    }
    setEstado("ok");
    setSenha("");
    setRepetir("");
    if (depois) {
      router.replace(depois);
      router.refresh();
    }
  }

  return (
    <form onSubmit={salvar} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="text-[15px] font-bold">Nova senha</span>
        <input
          type="password"
          required
          autoComplete="new-password"
          minLength={SENHA_MINIMA}
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className={campoTexto}
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-[15px] font-bold">Repita a nova senha</span>
        <input
          type="password"
          required
          autoComplete="new-password"
          value={repetir}
          onChange={(e) => setRepetir(e.target.value)}
          className={campoTexto}
        />
      </label>
      <button type="submit" className={botaoPrimario} disabled={estado === "salvando"}>
        {estado === "salvando" ? "Salvando..." : "Salvar senha"}
      </button>
      {erro && (
        <p className="text-[15px] text-perigo" role="alert">
          {erro}
        </p>
      )}
      {estado === "ok" && !depois && (
        <p className="text-[15px] font-bold text-teal" role="status">
          Senha atualizada.
        </p>
      )}
    </form>
  );
}
