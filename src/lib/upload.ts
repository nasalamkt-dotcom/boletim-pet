"use client";

import { createClient } from "@/lib/supabase/client";

/** Reduz a foto para no máximo `lado` px e JPEG 82%, economizando dados e armazenamento. */
async function reduzir(arquivo: File, lado = 1600): Promise<Blob> {
  const bitmap = await createImageBitmap(arquivo).catch(() => null);
  if (!bitmap) return arquivo;
  const escala = Math.min(1, lado / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b ?? arquivo), "image/jpeg", 0.82),
  );
}

/** Envia a foto ao bucket privado e devolve o caminho salvo. */
export async function enviarFoto(arquivo: File, crecheId: string, dia: string) {
  const blob = await reduzir(arquivo);
  const caminho = `${crecheId}/${dia}/${crypto.randomUUID()}.jpg`;
  const supabase = createClient();
  const { error } = await supabase.storage
    .from("fotos")
    .upload(caminho, blob, { contentType: "image/jpeg", upsert: false });
  if (error) throw error;
  return caminho;
}
