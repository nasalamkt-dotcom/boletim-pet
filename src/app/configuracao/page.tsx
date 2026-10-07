import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { variaveisFaltando } from "@/lib/config";
import { Pata } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

type Item = { rotulo: string; ok: boolean; dica?: string };

async function diagnostico(): Promise<Item[]> {
  const faltando = variaveisFaltando(true);
  const itens: Item[] = [
    {
      rotulo: "Variáveis do Supabase cadastradas na Vercel",
      ok: faltando.length === 0,
      dica: faltando.length
        ? `Faltando ou inválida: ${faltando.join(", ")}. Cadastre em Settings › Environment Variables e faça um Redeploy.`
        : undefined,
    },
  ];
  if (faltando.length) return itens;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim();

  // 1. O endereço responde e a chave pública é aceita?
  let conectou = false;
  try {
    const r = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: anon }, cache: "no-store" });
    conectou = r.ok;
    itens.push({
      rotulo: "Conexão com o Supabase (URL e chave anon)",
      ok: r.ok,
      dica: r.ok
        ? undefined
        : r.status === 401
          ? "O Supabase recusou a chave anon. Confira se colou a chave anon/publishable do mesmo projeto, sem espaços."
          : `O Supabase respondeu com erro ${r.status}. Confira a Project URL.`,
    });
  } catch {
    itens.push({
      rotulo: "Conexão com o Supabase (URL e chave anon)",
      ok: false,
      dica: "Não foi possível acessar a Project URL. Ela deve ser algo como https://abcdefgh.supabase.co, sem barra no final.",
    });
  }
  if (!conectou) return itens;

  // 2. A chave de serviço funciona e o banco foi criado?
  try {
    const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!.trim(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await admin.from("creches").select("id", { head: true, count: "exact" });
    if (!error) {
      itens.push({ rotulo: "Chave service_role e tabelas do banco", ok: true });
    } else if (/does not exist|relation|schema cache/i.test(error.message)) {
      itens.push({
        rotulo: "Tabelas do banco",
        ok: false,
        dica: "As tabelas ainda não existem. Rode o arquivo supabase/migrations/0001_inicial.sql no SQL Editor do Supabase.",
      });
    } else {
      itens.push({
        rotulo: "Chave service_role",
        ok: false,
        dica: "O Supabase recusou a chave service_role. Confira se colou a chave secreta do mesmo projeto.",
      });
    }
  } catch {
    itens.push({ rotulo: "Chave service_role e tabelas do banco", ok: false, dica: "Falha ao consultar o banco." });
  }

  // 3. Endereço público do app
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  itens.push({
    rotulo: "Endereço do app (NEXT_PUBLIC_APP_URL)",
    ok: Boolean(appUrl && appUrl.startsWith("https://")),
    dica: appUrl?.startsWith("https://")
      ? undefined
      : "Cadastre NEXT_PUBLIC_APP_URL com o endereço do app na Vercel (ex.: https://boletim-pet.vercel.app). Sem ele, os links dos boletins saem errados.",
  });

  return itens;
}

export default async function Configuracao() {
  const itens = await diagnostico();
  const tudoOk = itens.every((i) => i.ok);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-6 py-12">
      <div className="flex flex-col gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal text-sol">
          <Pata size={30} />
        </span>
        <h1 className="font-display text-3xl font-extrabold">
          {tudoOk ? "Tudo configurado" : "Falta configurar"}
        </h1>
        <p className="text-suave">
          {tudoOk
            ? "O app está conectado ao Supabase e pronto para uso."
            : "O app ainda não consegue falar com o Supabase. Veja abaixo o que corrigir."}
        </p>
      </div>

      <ul className="flex flex-col gap-2.5">
        {itens.map((i) => (
          <li key={i.rotulo} className="flex flex-col gap-1 rounded-2xl border border-borda bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <span className="font-bold">{i.rotulo}</span>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-[12px] font-bold ${
                  i.ok ? "bg-teal-claro text-teal-escuro" : "bg-[#FDECEA] text-perigo"
                }`}
              >
                {i.ok ? "OK" : "Corrigir"}
              </span>
            </div>
            {i.dica && <p className="text-[14px] text-suave">{i.dica}</p>}
          </li>
        ))}
      </ul>

      {tudoOk ? (
        <Link href="/login" className="font-bold text-teal underline">
          Ir para o login
        </Link>
      ) : (
        <p className="text-[13px] text-suave">
          Depois de corrigir na Vercel, faça um Redeploy e recarregue esta página. Variáveis que começam com
          NEXT_PUBLIC só passam a valer depois de um novo deploy.
        </p>
      )}
    </main>
  );
}
