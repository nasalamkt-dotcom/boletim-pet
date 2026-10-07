import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { variaveisFaltando } from "@/lib/config";

function paraConfiguracao(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/configuracao";
  url.search = "";
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Sem as variáveis do Supabase, mostra o que falta em vez de quebrar.
  if (variaveisFaltando(false).length) return paraConfiguracao(request);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  let user = null;
  try {
    ({
      data: { user },
    } = await supabase.auth.getUser());
  } catch {
    // URL ou chave inválida: o Supabase não respondeu.
    return paraConfiguracao(request);
  }

  const caminho = request.nextUrl.pathname;
  const protegida = ["/app", "/comecar", "/nova-senha"].some((p) => caminho.startsWith(p));
  if (!user && protegida) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  // Quem já está logado não precisa ver login nem cadastro
  if (user && (caminho === "/login" || caminho === "/cadastro")) {
    const url = request.nextUrl.clone();
    url.pathname = "/app";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Só as áreas com login; a página pública do boletim (/b) e as APIs ficam de fora.
  // (/configuracao fica de fora de propósito, para não entrar em laço.)
  matcher: ["/app/:path*", "/comecar", "/nova-senha", "/login", "/cadastro", "/esqueci", "/auth/:path*"],
};
