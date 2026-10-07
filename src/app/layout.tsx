import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Boletim Pet",
  description: "O boletim diário da creche, direto no WhatsApp do tutor.",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#0E5E58",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=DM+Sans:wght@400;500;700&display=swap"
        />
      </head>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
