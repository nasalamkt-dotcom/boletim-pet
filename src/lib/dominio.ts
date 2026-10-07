/** Campos da rotina e as opções que o monitor toca no app. */
export const CAMPOS = [
  {
    chave: "alimentacao",
    rotulo: "Alimentação",
    opcoes: ["Comeu tudo", "Comeu pouco", "Não comeu"],
  },
  {
    chave: "necessidades",
    rotulo: "Necessidades",
    opcoes: ["Xixi e cocô", "Só xixi", "Nada ainda"],
  },
  {
    chave: "atividade",
    rotulo: "Atividade",
    opcoes: ["Brincou muito", "Brincou pouco", "Descansou"],
  },
  {
    chave: "humor",
    rotulo: "Humor",
    opcoes: ["Animado", "Tranquilo", "Ansioso"],
  },
] as const;

export type CampoChave = (typeof CAMPOS)[number]["chave"];
export const CHAVES_CAMPOS = CAMPOS.map((c) => c.chave) as CampoChave[];

export const CORES_AVATAR = [
  "#F4B83A",
  "#9CC9C1",
  "#C9B6E4",
  "#F2A285",
  "#E8D27A",
  "#A9C4E8",
  "#B7D99A",
  "#F1B6C9",
];

export type Presenca = {
  id: string;
  cao_id: string;
  dia: string;
  chegada: string | null;
  saida: string | null;
  alimentacao: string | null;
  necessidades: string | null;
  atividade: string | null;
  humor: string | null;
  recado: string | null;
  recado_autor: string | null;
};

export type Cao = {
  id: string;
  nome: string;
  raca: string | null;
  cor: string;
  tutor_id: string;
  ativo: boolean;
};

export function registrosFeitos(p: Partial<Presenca> | null | undefined) {
  if (!p) return 0;
  return CHAVES_CAMPOS.filter((k) => p[k]).length;
}

export function inicial(nome: string) {
  return nome.trim().charAt(0).toUpperCase();
}

/** Mantém só os dígitos e garante o código do Brasil (55). */
export function normalizarTelefone(bruto: string) {
  const digitos = bruto.replace(/\D/g, "");
  if (digitos.length === 10 || digitos.length === 11) return "55" + digitos;
  return digitos;
}

export function primeiroNome(nome: string) {
  return nome.trim().split(/\s+/)[0] ?? nome;
}
