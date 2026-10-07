import "server-only";
import Anthropic from "@anthropic-ai/sdk";

export function iaDisponivel() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * Transforma as anotações rápidas do monitor num recado curto e carinhoso.
 * Não inventa fatos: só reescreve o que foi anotado.
 */
export async function melhorarRecado(params: {
  nomeCao: string;
  anotacoes: string;
  rotina: Record<string, string | null>;
}) {
  if (!iaDisponivel()) throw new Error("IA não configurada (ANTHROPIC_API_KEY ausente)");
  const cliente = new Anthropic();

  const rotina = Object.entries(params.rotina)
    .filter(([, v]) => v)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n");

  const resposta = await cliente.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
    max_tokens: 400,
    system:
      "Você escreve o recado diário de uma creche para cães, enviado ao tutor. " +
      "Português do Brasil, tom carinhoso e leve, 2 a 4 frases, sem emojis, sem hashtags. " +
      "Use somente os fatos das anotações e da rotina; nunca invente acontecimentos, " +
      "saúde ou comportamento que não foram informados. Se algo preocupante foi anotado, " +
      "mencione com tranquilidade e sugira conversar com a equipe. Responda só com o recado.",
    messages: [
      {
        role: "user",
        content:
          `Cão: ${params.nomeCao}\n` +
          (rotina ? `Rotina registrada:\n${rotina}\n` : "") +
          `Anotações do monitor:\n${params.anotacoes}`,
      },
    ],
  });

  const texto = resposta.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("")
    .trim();
  return texto;
}
