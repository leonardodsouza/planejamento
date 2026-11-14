# Extensão do Planejamento para o Safari

Botão na barra do Safari para:

- **Adicionar tarefa a partir da página aberta**: o título e o link da página já vêm
  preenchidos; escolha quando (Hoje, Amanhã, Sem data ou uma data), o projeto e a prioridade.
- **Ver as tarefas de hoje** (inclui atrasadas) e marcar como feitas.
- **Botão direito → "Adicionar ao Planejamento"** em qualquer página, texto selecionado
  ou link: a tarefa vai para "Sem data" e o ícone mostra ✓ (ou ! se deu erro).

Funciona no Safari do Mac e também no iPhone/iPad (mesmo código).

Na primeira vez a extensão pede o **endereço do app** (ex.:
`https://planejamento.suaconta.workers.dev`), o e-mail e a senha do Planejamento.
Ela guarda só um token de acesso (válido por 1 ano), não a senha. "Sair" apaga o token.

> A extensão usa a API `/api/ext/*` do app, então o app precisa estar publicado
> com essa versão antes de entrar.

## Testar rápido no Mac (sem Xcode)

Safari 18 ou mais novo carrega a pasta direto, como extensão temporária:

1. Safari → **Ajustes → Avançado** → marque **"Mostrar recursos para desenvolvedores web"**.
2. Safari → **Ajustes → Desenvolvedor** → **"Adicionar extensão temporária…"** e escolha
   a pasta `extensao-safari`.
3. O ícone do Planejamento aparece na barra. Clique nele e entre.

A extensão temporária some quando o Safari fecha (ou depois de 24 h).

## Instalar de vez no Mac (com Xcode)

Precisa do Xcode (grátis na App Store). No Terminal, dentro da pasta do repositório:

```bash
xcrun safari-web-extension-converter extensao-safari \
  --app-name "Planejamento" \
  --bundle-identifier com.leonardodsouza.planejamento \
  --swift --macos-only --copy-resources \
  --project-location ~/Desktop/PlanejamentoSafari
```

1. O Xcode abre o projeto. Em cada *target* (o app e a extensão), aba
   **Signing & Capabilities**, escolha seu **Team** (seu Apple ID serve).
2. **Product → Run** (⌘R). Abre um app "Planejamento"; pode fechar.
3. Safari → **Ajustes → Extensões** → ative **Planejamento** e permita.

Sem Team (app sem assinatura), ative antes **Desenvolvedor → Permitir extensões não
assinadas** no Safari (precisa repetir sempre que o Safari reabre).

Para iPhone/iPad, rode o mesmo comando **sem** `--macos-only`, escolha o iPhone como
destino no Xcode e depois ative em **Ajustes → Apps → Safari → Extensões**.
Com Apple ID gratuito a instalação vale 7 dias; para ficar de vez (ou distribuir) é
preciso o Apple Developer Program (US$ 99/ano) e TestFlight ou App Store.

Mudou algo na pasta `extensao-safari`? Sem `--copy-resources` o Xcode usa os arquivos
originais; com ele, rode o comando de novo (com `--force`) ou copie os arquivos.

## Arquivos

| Arquivo | O que faz |
| --- | --- |
| `manifest.json` | Configuração (Manifest V3): popup, menu do botão direito, permissões `activeTab`, `storage`, `contextMenus` |
| `popup.html/.css/.js` | Tela do botão: login, nova tarefa, lista de hoje |
| `background.js` | Menu "Adicionar ao Planejamento" |
| `api.js` | Chamadas à API do app (usado pelos dois acima) |

## API usada (`/api/ext`)

Autenticação por `Authorization: Bearer <token>` (o token é guardado com hash na tabela
`sessions`, como os logins do site; não precisou de migração no banco).

| Método | Caminho | |
| --- | --- | --- |
| POST | `/login` | `{email, password}` → `{token, email}` |
| POST | `/logout` | apaga o token |
| GET | `/me` | `{email, projects: [{id, name, color}]}` |
| GET | `/tasks?today=AAAA-MM-DD` | abertas até hoje + concluídas hoje |
| POST | `/tasks` | `{title, description?, due_date?, project_id?, priority?}` |
| PATCH | `/tasks/:id` | `{status: "done" \| "todo"}` |
