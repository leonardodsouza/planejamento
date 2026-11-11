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

Precisa de uma conta Cloudflare (o plano gratuito basta).

```bash
npm install
npx wrangler login
npx wrangler d1 create planejamento
```

1. Copie o `database_id` que o último comando mostrar para `wrangler.jsonc`.
2. Crie as tabelas no banco de produção:
   ```bash
   npx wrangler d1 migrations apply planejamento --remote
   ```
3. Publique:
   ```bash
   npm run deploy
   ```
   O endereço fica algo como `https://planejamento.<sua-conta>.workers.dev`
   (dá para ligar um domínio próprio em *Settings → Domains & Routes*).

### Deploy automático a cada push (opcional)
Com o `database_id` já no `wrangler.jsonc`, no painel da Cloudflare vá em
**Workers & Pages → Create → Import a repository**, escolha este repositório e use
Build command `npx opennextjs-cloudflare build` e Deploy command `npx opennextjs-cloudflare deploy`.

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
