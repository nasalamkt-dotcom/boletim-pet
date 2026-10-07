import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Boletim Pet",
    short_name: "Boletim Pet",
    description: "Registro do dia na creche e boletim no WhatsApp do tutor.",
    start_url: "/app",
    display: "standalone",
    background_color: "#F3F5F4",
    theme_color: "#0E5E58",
    lang: "pt-BR",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
