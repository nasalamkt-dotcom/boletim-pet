import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente com a chave de serviço: ignora RLS.
 * Use só no servidor, em rotinas que não têm usuário logado
 * (página pública do boletim, envio automático, webhook).
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
