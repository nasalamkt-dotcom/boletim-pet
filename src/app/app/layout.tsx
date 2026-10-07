import { contexto } from "@/lib/sessao";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  await contexto();
  return <div className="mx-auto flex min-h-dvh max-w-md flex-col">{children}</div>;
}
