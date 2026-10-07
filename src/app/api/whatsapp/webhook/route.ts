import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** Verificação do webhook pela Meta (feita uma vez, ao configurar). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const modo = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const desafio = url.searchParams.get("hub.challenge");
  if (modo === "subscribe" && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(desafio ?? "", { status: 200 });
  }
  return new Response("proibido", { status: 403 });
}

function assinaturaValida(corpo: string, assinatura: string | null) {
  const segredo = process.env.WHATSAPP_APP_SECRET;
  if (!segredo) return true; // sem segredo configurado, não valida (configure em produção)
  if (!assinatura?.startsWith("sha256=")) return false;
  const esperado = createHmac("sha256", segredo).update(corpo).digest("hex");
  const a = Buffer.from(assinatura.slice(7), "hex");
  const b = Buffer.from(esperado, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

const MAPA: Record<string, string> = {
  sent: "enviado",
  delivered: "entregue",
  read: "lido",
  failed: "falhou",
};
const ORDEM = ["pendente", "simulado", "enviado", "entregue", "lido"];

type StatusMeta = { id: string; status: string; errors?: { title?: string; message?: string }[] };

/** Atualizações de entrega e leitura das mensagens. */
export async function POST(request: Request) {
  const corpo = await request.text();
  if (!assinaturaValida(corpo, request.headers.get("x-hub-signature-256"))) {
    return new Response("assinatura inválida", { status: 401 });
  }

  let json: { entry?: { changes?: { value?: { statuses?: StatusMeta[] } }[] }[] };
  try {
    json = JSON.parse(corpo);
  } catch {
    return NextResponse.json({ ok: true });
  }

  const statuses = (json.entry ?? []).flatMap((e) => (e.changes ?? []).flatMap((c) => c.value?.statuses ?? []));
  if (!statuses.length) return NextResponse.json({ ok: true });

  const admin = createAdminClient();
  for (const s of statuses) {
    const novo = MAPA[s.status];
    if (!novo) continue;
    const erro = s.errors?.[0]?.message || s.errors?.[0]?.title || null;

    for (const tabela of ["boletins", "mensagens"] as const) {
      const { data: atual } = await admin.from(tabela).select("id, status").eq("wa_message_id", s.id).maybeSingle();
      if (!atual) continue;
      const avanca = novo === "falhou" || ORDEM.indexOf(novo) > ORDEM.indexOf(atual.status);
      if (!avanca) continue;
      await admin.from(tabela).update({ status: novo, erro: novo === "falhou" ? erro : null }).eq("id", atual.id);
    }
  }
  return NextResponse.json({ ok: true });
}
