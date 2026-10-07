import "server-only";

/**
 * Envio de mensagens de modelo (template) pelo WhatsApp.
 *
 * WHATSAPP_MODE=mock  → nada sai do servidor; a mensagem fica no histórico
 *                       como "simulado" (útil até a Meta aprovar a conta).
 * WHATSAPP_MODE=cloud → usa a API oficial (Cloud API) da Meta.
 */

export type EnvioTemplate = {
  para: string; // só dígitos, com 55
  template: string;
  parametrosCorpo: string[];
  /** Sufixo do botão de link dinâmico (ex.: o token do boletim). */
  parametroBotaoUrl?: string;
};

export type ResultadoEnvio =
  | { ok: true; status: "simulado" | "enviado"; waMessageId: string | null }
  | { ok: false; status: "falhou"; erro: string };

export function modoWhatsApp(): "mock" | "cloud" {
  return process.env.WHATSAPP_MODE === "cloud" ? "cloud" : "mock";
}

export async function enviarTemplate(envio: EnvioTemplate): Promise<ResultadoEnvio> {
  if (modoWhatsApp() === "mock") {
    console.log("[whatsapp:simulado]", JSON.stringify(envio));
    return { ok: true, status: "simulado", waMessageId: null };
  }

  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const versao = process.env.WHATSAPP_GRAPH_VERSION || "v23.0";
  if (!phoneId || !token) {
    return { ok: false, status: "falhou", erro: "WhatsApp não configurado (phone id ou token ausente)" };
  }

  const components: unknown[] = [];
  if (envio.parametrosCorpo.length) {
    components.push({
      type: "body",
      parameters: envio.parametrosCorpo.map((text) => ({ type: "text", text })),
    });
  }
  if (envio.parametroBotaoUrl) {
    components.push({
      type: "button",
      sub_type: "url",
      index: "0",
      parameters: [{ type: "text", text: envio.parametroBotaoUrl }],
    });
  }

  try {
    const resp = await fetch(`https://graph.facebook.com/${versao}/${phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: envio.para,
        type: "template",
        template: {
          name: envio.template,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANG || "pt_BR" },
          components,
        },
      }),
    });
    const corpo = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      const erro = corpo?.error?.message || `HTTP ${resp.status}`;
      return { ok: false, status: "falhou", erro };
    }
    return { ok: true, status: "enviado", waMessageId: corpo?.messages?.[0]?.id ?? null };
  } catch (e) {
    return { ok: false, status: "falhou", erro: e instanceof Error ? e.message : String(e) };
  }
}
