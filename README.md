# Boletim Pet

O dia de cada cão na creche, registrado em poucos toques pelo monitor e entregue no WhatsApp do tutor como um boletim com fotos, rotina e recado.

**Stack:** Next.js 15 (App Router) · Supabase (banco, login e fotos) · WhatsApp Cloud API (Meta) · Claude (recado com IA, opcional) · Vercel (hospedagem e envio automático diário).

## O que já funciona

- **Login com e-mail e senha**, cadastro da creche (o primeiro acesso vira administrador) e "Esqueci minha senha".
- **Equipe**: o administrador cadastra os colaboradores com e-mail e senha provisória; cada um troca a própria senha em **Conta**.
- **Cadastro de cães e tutores** (irmãos podem compartilhar o mesmo tutor).
- **Lista do dia**: check-in com um toque, progresso de registros e fotos de cada cão.
- **Registro rápido**: alimentação, necessidades, atividade e humor em botões; fotos tiradas pelo celular (reduzidas antes do envio); recado para o tutor, com botão "Melhorar com IA".
- **Foto da turma**: uma foto, vários cães marcados, e ela entra no boletim de cada um.
- **Boletim público** em `/b/<token>`: página bonita no celular, com capa, rotina, recado, turma do dia, galeria e botão de compartilhar. Fotos ficam em bucket privado e são servidas por links temporários.
- **Envio pelo WhatsApp**: no checkout de cada cão, pelo botão "Enviar boletins" ou automaticamente às 17h (horário de Recife).
- **Modo simulado** (`WHATSAPP_MODE=mock`): nada sai de verdade, mas tudo fica registrado em **Envios**, com o link do boletim, para testar o fluxo completo antes da Meta aprovar a conta.
- **Webhook** que atualiza o status (enviado, entregue, lido, falhou).
- Cada creche só enxerga os próprios dados (regras de acesso no banco).

## Rodar no seu computador

```bash
npm install
cp .env.example .env.local   # preencha com os dados do Supabase
npm run dev                  # http://localhost:3000
```

## Colocar no ar

### 1. Supabase

1. No projeto do Supabase, abra **SQL Editor › New query**, cole o conteúdo de `supabase/migrations/0001_inicial.sql` e rode. Isso cria as tabelas, as regras de acesso e o bucket privado `fotos`.
2. Em **Authentication › URL Configuration**:
   - **Site URL**: o endereço do app na Vercel (ex.: `https://boletim-pet.vercel.app`).
   - **Redirect URLs**: adicione `https://SEU-DOMINIO/auth/callback` e `http://localhost:3000/auth/callback`.
3. Em **Project Settings › API**, copie a URL, a chave `anon` e a chave `service_role`.
4. Recomendado antes de ter clientes: configure um SMTP próprio em **Authentication › Emails**, porque o envio de e-mails padrão do Supabase tem limite baixo por hora.

### 2. Vercel

1. **Add New › Project** e importe o repositório do GitHub.
2. Em **Environment Variables**, cadastre as variáveis do `.env.example`:
   - `NEXT_PUBLIC_APP_URL` com o endereço final do app;
   - as três do Supabase;
   - `CRON_SECRET` com um texto longo e aleatório;
   - `WHATSAPP_MODE=mock` por enquanto.
3. Faça o deploy. O envio automático já fica agendado pelo `vercel.json` para 20h UTC (17h em Recife).

### 3. Primeiro acesso

Abra o app, toque em **Cadastre aqui**, crie a creche com seu e-mail e senha, cadastre dois ou três cães com o **seu próprio WhatsApp** como tutor e faça um dia de teste: check-in, registros, fotos e envio. Em modo simulado, os boletins aparecem em **Envios**.

## Ligar o WhatsApp de verdade (Meta)

1. Em [business.facebook.com](https://business.facebook.com), crie (ou use) o portfólio empresarial e inicie a **verificação da empresa**.
2. Em [developers.facebook.com](https://developers.facebook.com), crie um app do tipo **Business** e adicione o produto **WhatsApp**.
3. Cadastre um **número dedicado** ao produto. Um número que já está no app do WhatsApp Business pode exigir migração; confira as opções disponíveis para o seu caso antes de usar o número principal da creche.
4. Crie um **token permanente** (usuário do sistema com permissão `whatsapp_business_messaging`).
5. Envie para aprovação os modelos abaixo, na categoria **Utilidade**, idioma **Português (BR)**.

**`boletim_pronto`**
- Corpo: `Oi, {{1}}! O boletim de hoje do {{2}} está pronto, com fotos, rotina e um recado da equipe.`
- Botão de link dinâmico "Ver boletim": `https://SEU-DOMINIO/b/{{1}}`
- Exemplos para a Meta: `{{1}}` = Ana, `{{2}}` = Thor; sufixo do link = `exemplo123`.

**`chegada`** (opcional)
- Corpo: `{{1}} chegou à creche às {{2}} e já está com a turma.`

6. Configure o **webhook**: URL `https://SEU-DOMINIO/api/whatsapp/webhook`, token de verificação igual ao `WHATSAPP_VERIFY_TOKEN`, e assine o campo `messages`.
7. Na Vercel, preencha `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET` e `WHATSAPP_TEMPLATE_CHEGADA=chegada` (se aprovado). Troque `WHATSAPP_MODE` para `cloud` e faça um novo deploy.

## Recado com IA (opcional)

Preencha `ANTHROPIC_API_KEY`. O botão "Melhorar com IA" aparece no registro do cão e transforma as anotações rápidas do monitor num recado curto e carinhoso, sem inventar fatos.

## Estrutura

```
src/app/app/            app do monitor (lista do dia, cão, foto da turma, cães, envios)
src/app/app/acoes.ts    ações do servidor (check-in, registros, fotos, envios)
src/app/b/[token]/      boletim público do tutor
src/app/api/cron/       envio automático de fim de dia
src/app/api/whatsapp/   webhook de status da Meta
src/lib/envios.ts       geração e envio dos boletins
src/lib/whatsapp.ts     integração com a Cloud API (e o modo simulado)
supabase/migrations/    banco de dados e regras de acesso
```

## Próximos passos sugeridos

- Convidar monitores para a equipe da creche (hoje cada conta cria a própria creche).
- Recado por áudio: gravar, transcrever e passar pela IA.
- Foto de capa no cabeçalho da mensagem do WhatsApp.
- Álbum do pet com o histórico de todos os dias.
- Painel de assinatura e cobrança por creche.
