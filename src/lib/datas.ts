export const FUSO_PADRAO = process.env.APP_TIMEZONE || "America/Recife";

/** Data de hoje (AAAA-MM-DD) no fuso da creche. */
export function hoje(fuso: string = FUSO_PADRAO) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: fuso,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function hora(iso: string | null | undefined, fuso: string = FUSO_PADRAO) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: fuso,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** "terça-feira, 6 de outubro" a partir de AAAA-MM-DD. */
export function diaPorExtenso(dia: string) {
  const [a, m, d] = dia.split("-").map(Number);
  // Meio-dia UTC evita virar o dia por causa do fuso.
  const data = new Date(Date.UTC(a, m - 1, d, 12));
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(data);
}
