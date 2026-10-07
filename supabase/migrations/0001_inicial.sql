-- Boletim Pet: estrutura inicial
-- Rode no Supabase em SQL Editor > New query (ou com `supabase db push`).


-- Creches (cada cliente do produto)
create table public.creches (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  fuso text not null default 'America/Recife',
  criado_em timestamptz not null default now()
);

-- Equipe: liga um usuário do Supabase Auth a uma creche
create table public.membros (
  user_id uuid primary key references auth.users (id) on delete cascade,
  creche_id uuid not null references public.creches (id) on delete cascade,
  nome text not null,
  papel text not null default 'monitor' check (papel in ('admin', 'monitor')),
  criado_em timestamptz not null default now()
);

create table public.tutores (
  id uuid primary key default gen_random_uuid(),
  creche_id uuid not null references public.creches (id) on delete cascade,
  nome text not null,
  telefone text not null, -- só dígitos, com 55 na frente
  criado_em timestamptz not null default now()
);

create table public.caes (
  id uuid primary key default gen_random_uuid(),
  creche_id uuid not null references public.creches (id) on delete cascade,
  tutor_id uuid not null references public.tutores (id) on delete restrict,
  nome text not null,
  raca text,
  cor text not null default '#F4B83A',
  observacoes text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

-- Um registro por cão por dia: presença + rotina + recado
create table public.presencas (
  id uuid primary key default gen_random_uuid(),
  creche_id uuid not null references public.creches (id) on delete cascade,
  cao_id uuid not null references public.caes (id) on delete cascade,
  dia date not null,
  chegada timestamptz,
  saida timestamptz,
  alimentacao text,
  necessidades text,
  atividade text,
  humor text,
  recado text,
  recado_autor text,
  atualizado_em timestamptz not null default now(),
  unique (cao_id, dia)
);

create table public.fotos (
  id uuid primary key default gen_random_uuid(),
  creche_id uuid not null references public.creches (id) on delete cascade,
  dia date not null,
  caminho text not null, -- caminho no bucket "fotos"
  legenda text,
  autor uuid references auth.users (id) on delete set null,
  criado_em timestamptz not null default now()
);

-- Uma foto pode marcar vários cães (a "foto da turma")
create table public.foto_caes (
  foto_id uuid not null references public.fotos (id) on delete cascade,
  cao_id uuid not null references public.caes (id) on delete cascade,
  primary key (foto_id, cao_id)
);

create table public.boletins (
  id uuid primary key default gen_random_uuid(),
  creche_id uuid not null references public.creches (id) on delete cascade,
  presenca_id uuid not null unique references public.presencas (id) on delete cascade,
  token text not null unique,
  status text not null default 'pendente', -- pendente | simulado | enviado | entregue | lido | falhou
  erro text,
  wa_message_id text,
  enviado_em timestamptz,
  criado_em timestamptz not null default now()
);

-- Histórico de tudo que foi enviado ao WhatsApp
create table public.mensagens (
  id uuid primary key default gen_random_uuid(),
  creche_id uuid not null references public.creches (id) on delete cascade,
  tutor_id uuid references public.tutores (id) on delete set null,
  tipo text not null, -- boletim | chegada
  para text not null,
  conteudo jsonb not null default '{}'::jsonb,
  status text not null,
  wa_message_id text,
  erro text,
  criado_em timestamptz not null default now()
);

create index on public.caes (creche_id) where ativo;
create index on public.presencas (creche_id, dia);
create index on public.fotos (creche_id, dia);
create index on public.foto_caes (cao_id);
create index on public.mensagens (creche_id, criado_em desc);
create index on public.mensagens (wa_message_id);
create index on public.boletins (wa_message_id);

-- Creche do usuário logado (usada nas regras de acesso)
create or replace function public.minha_creche()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select creche_id from public.membros where user_id = auth.uid()
$$;

-- ===== Regras de acesso (RLS): cada equipe só vê a própria creche =====
alter table public.creches enable row level security;
alter table public.membros enable row level security;
alter table public.tutores enable row level security;
alter table public.caes enable row level security;
alter table public.presencas enable row level security;
alter table public.fotos enable row level security;
alter table public.foto_caes enable row level security;
alter table public.boletins enable row level security;
alter table public.mensagens enable row level security;

create policy "ver a própria creche" on public.creches
  for select using (id = public.minha_creche());

create policy "ver a própria equipe" on public.membros
  for select using (creche_id = public.minha_creche());

create policy "equipe gerencia tutores" on public.tutores
  for all using (creche_id = public.minha_creche())
  with check (creche_id = public.minha_creche());

create policy "equipe gerencia cães" on public.caes
  for all using (creche_id = public.minha_creche())
  with check (creche_id = public.minha_creche());

create policy "equipe gerencia presenças" on public.presencas
  for all using (creche_id = public.minha_creche())
  with check (creche_id = public.minha_creche());

create policy "equipe gerencia fotos" on public.fotos
  for all using (creche_id = public.minha_creche())
  with check (creche_id = public.minha_creche());

create policy "equipe gerencia marcações" on public.foto_caes
  for all using (
    exists (select 1 from public.fotos f where f.id = foto_id and f.creche_id = public.minha_creche())
  )
  with check (
    exists (select 1 from public.fotos f where f.id = foto_id and f.creche_id = public.minha_creche())
    and exists (select 1 from public.caes c where c.id = cao_id and c.creche_id = public.minha_creche())
  );

create policy "equipe vê boletins" on public.boletins
  for select using (creche_id = public.minha_creche());

create policy "equipe vê mensagens" on public.mensagens
  for select using (creche_id = public.minha_creche());

-- Boletins e mensagens são gravados pelo servidor (chave de serviço), não pelo navegador.

-- ===== Fotos: bucket privado, pasta = id da creche =====
insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', false)
on conflict (id) do nothing;

create policy "equipe envia fotos da creche" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'fotos'
    and (storage.foldername(name))[1] = public.minha_creche()::text
  );

create policy "equipe vê fotos da creche" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'fotos'
    and (storage.foldername(name))[1] = public.minha_creche()::text
  );

create policy "equipe apaga fotos da creche" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'fotos'
    and (storage.foldername(name))[1] = public.minha_creche()::text
  );
