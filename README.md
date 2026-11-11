# Planejamento

Sistema web para planejar tarefas e projetos, com login e dados salvos na nuvem
(funciona em qualquer dispositivo). Roda 100% no Cloudflare.

- **Projetos** com cor, barra de progresso e quadro **Kanban** (A fazer / Fazendo / Feito), com arrastar e soltar
- **Tarefas** com prazo, prioridade (baixa/média/alta), status, descrição e projeto
- Visões **Hoje** (inclui atrasadas), **Esta semana** (dia a dia) e **Sem data**
- Login por e-mail e senha; cada pessoa só vê os próprios dados

Stack: Next.js 15 (App Router, Server Actions) · Tailwind CSS 4 ·
Cloudflare Workers (via [OpenNext](https://opennext.js.org/cloudflare)) · Cloudflare D1 (banco SQLite).

Login próprio: senhas com PBKDF2-SHA256 (100 mil iterações, salt aleatório) e
sessões de 30 dias guardadas no D1 (o cookie é `httpOnly` e o banco só guarda o hash do token).

## Colocar no ar

O banco D1 `planejamento` já existe na conta Cloudflare (o id está em `wrangler.jsonc`).

**Deploy automático a cada push:** no painel da Cloudflare, **Workers & Pages → Create →
Import a repository**, escolha este repositório e use:
- Build command: deixe em branco
- Deploy command: `npm run deploy`

O `npm run deploy` compila, aplica as migrações novas do banco (`migrations/`) e publica o app.
O endereço fica algo como `https://planejamento.<sua-conta>.workers.dev`
(dá para ligar um domínio próprio em *Settings → Domains & Routes*).

**Pelo terminal (alternativa):** `npx wrangler login` e depois `npm run deploy`.

## Rodar localmente

```bash
npm install
npx wrangler d1 migrations apply planejamento --local   # cria o banco local
npm run dev        # http://localhost:3000 (Next.js com o D1 local)
npm run preview    # mesmo app no runtime do Cloudflare, em http://localhost:8787
```

Mudou o banco? Crie um arquivo novo em `migrations/` e rode o `migrations apply`
(com `--local` e depois `--remote`).

## Próximos passos
Calendário, subtarefas, tags, lembretes e recuperação de senha por e-mail.
