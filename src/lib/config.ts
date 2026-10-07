/**
 * Confere as variáveis de ambiente obrigatórias.
 * Os nomes NEXT_PUBLIC_* são escritos por extenso para o Next.js
 * conseguir embuti-los no código durante o build.
 */
export function variaveisFaltando(incluirServidor = true) {
  const faltando: string[] = [];
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) faltando.push("NEXT_PUBLIC_SUPABASE_URL");
  else if (!/^https:\/\/.+/.test(url.trim())) faltando.push("NEXT_PUBLIC_SUPABASE_URL (precisa começar com https://)");
  if (!anon) faltando.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (incluirServidor && !process.env.SUPABASE_SERVICE_ROLE_KEY) faltando.push("SUPABASE_SERVICE_ROLE_KEY");
  return faltando;
}
