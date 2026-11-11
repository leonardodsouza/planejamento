# Planejamento

Sistema web para planejar tarefas e projetos, com login e dados salvos na nuvem
(funciona em qualquer dispositivo).

- **Projetos** com cor, barra de progresso e quadro **Kanban** (A fazer / Fazendo / Feito), com arrastar e soltar
- **Tarefas** com prazo, prioridade (baixa/média/alta), status, descrição e projeto
- Visões **Hoje** (inclui atrasadas), **Esta semana** (dia a dia) e **Sem data**
- Login por e-mail e senha; cada pessoa só vê os próprios dados (Row Level Security)

Stack: Next.js 15 (App Router, Server Actions) · Tailwind CSS 4 · Supabase (Auth + Postgres) · Cloudflare Workers (hospedagem).

## Colocar no ar (gratuito)

### 1. Supabase (login + banco)
1. Crie uma conta em https://supabase.com e um projeto novo.
2. Abra **SQL Editor**, cole o conteúdo de `supabase/migrations/20261111000000_init.sql` e rode.
3. Em **Project Settings → API**, copie a *Project URL* e a chave *anon public*.

### 2. Cloudflare Workers (hospedagem)
O app roda no Cloudflare Workers via [OpenNext](https://opennext.js.org/cloudflare).

**Pelo painel (deploy automático a cada push):**
1. No painel da Cloudflare, **Workers & Pages → Create → Import a repository** e escolha este repositório.
2. Build command: `npx opennextjs-cloudflare build` · Deploy command: `npx opennextjs-cloudflare deploy`.
3. Em *Settings → Build → Variables and secrets* (variáveis **de build**, pois o Next.js as embute no código), adicione:
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = chave anon
4. Salve e rode o deploy. O endereço fica algo como `https://planejamento.<sua-conta>.workers.dev`
   (dá para ligar um domínio próprio em *Settings → Domains & Routes*).

**Pelo terminal:** com `.env.local` preenchido, `npx wrangler login` e depois `npm run deploy`.

### 3. Ajuste final no Supabase
Em **Authentication → URL Configuration**, coloque o endereço do app
em *Site URL* e adicione `<endereço>/auth/confirm` em *Redirect URLs*.
Assim o link de confirmação de e-mail volta para o app.

## Rodar localmente

```bash
npm install
cp .env.example .env.local   # preencha com os dados do Supabase
npm run dev                  # http://localhost:3000
npm run preview              # mesmo app no runtime do Cloudflare, em http://localhost:8787
```

Ou, com Docker, use um Supabase local: `npx supabase start` (aplica a migração
automaticamente) e use a URL/chave anon que ele imprime.

## Próximos passos
Calendário, subtarefas, tags e lembretes.
