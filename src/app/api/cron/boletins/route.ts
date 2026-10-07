import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enviarBoletinsDoDia } from "@/lib/envios";
import { hoje } from "@/lib/datas";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Envio automático de fim de dia (agendado em vercel.json). */
export async function GET(request: Request) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo || request.headers.get("authorization") !== `Bearer ${segredo}`) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: creches, error } = await admin.from("creches").select("id, fuso");
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  const resumo: Record<string, { enviados: number; falhas: number }> = {};
  for (const c of creches ?? []) {
    try {
      resumo[c.id] = await enviarBoletinsDoDia(c.id, hoje(c.fuso));
    } catch {
      resumo[c.id] = { enviados: 0, falhas: -1 };
    }
  }
  return NextResponse.json({ ok: true, resumo });
}
