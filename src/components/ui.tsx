import { inicial } from "@/lib/dominio";

export function Pata({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      className={className}
      aria-hidden="true"
    >
      <ellipse cx="12" cy="16" rx="4.5" ry="3.6" />
      <circle cx="6" cy="10" r="1.8" />
      <circle cx="9.5" cy="6.5" r="1.8" />
      <circle cx="14.5" cy="6.5" r="1.8" />
      <circle cx="18" cy="10" r="1.8" />
    </svg>
  );
}

export function Avatar({ nome, cor, size = 46 }: { nome: string; cor: string; size?: number }) {
  return (
    <span
      className="font-display flex shrink-0 items-center justify-center rounded-full font-extrabold text-tinta"
      style={{ width: size, height: size, background: cor, fontSize: size * 0.42 }}
      aria-hidden="true"
    >
      {inicial(nome)}
    </span>
  );
}

export const botaoPrimario =
  "inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-teal px-5 text-base font-bold text-white transition hover:bg-teal-escuro disabled:opacity-60";
export const botaoSol =
  "inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-sol px-5 text-base font-bold text-tinta transition hover:brightness-95 disabled:opacity-60";
export const botaoContorno =
  "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-linha bg-white px-4 text-[15px] font-bold text-tinta transition hover:border-teal disabled:opacity-60";
export const campoTexto =
  "w-full min-h-[48px] rounded-xl border border-linha bg-white px-3 text-base outline-none focus:border-teal";
export const rotulo = "text-[13px] font-bold uppercase tracking-wide text-suave";

export function Voltar({ href, rotulo = "Voltar" }: { href: string; rotulo?: string }) {
  return (
    <a
      href={href}
      aria-label={rotulo}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-borda bg-white text-tinta"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M15 5l-7 7 7 7" />
      </svg>
    </a>
  );
}
