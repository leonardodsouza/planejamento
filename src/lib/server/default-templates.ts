import "server-only";
import { getDB, newId } from "./db";

type Step = { title: string; days_before: number; priority: 1 | 2 | 3; description?: string; checklist: string[] };

const DEFAULTS: { name: string; color: string; steps: Step[] }[] = [
  {
    name: "Vídeo",
    color: "#ef4444",
    steps: [
      {
        title: "Definir o tema",
        days_before: 7,
        priority: 3,
        checklist: ["Pesquisar referências", "Definir público e objetivo do vídeo", "Escolher título provisório"],
      },
      {
        title: "Escrever o roteiro",
        days_before: 6,
        priority: 3,
        description: "Escreva o roteiro aqui.",
        checklist: [
          "Gancho dos primeiros segundos",
          "Desenvolvimento em tópicos",
          "Chamada para ação no final",
          "Revisar lendo em voz alta",
        ],
      },
      {
        title: "Preparar a gravação",
        days_before: 5,
        priority: 2,
        checklist: ["Carregar baterias e liberar cartão de memória", "Testar áudio", "Arrumar luz e cenário"],
      },
      {
        title: "Gravar",
        days_before: 4,
        priority: 3,
        checklist: ["Gravar todas as partes do roteiro", "Gravar imagens de apoio (B-roll)", "Copiar os arquivos para o computador"],
      },
      {
        title: "Editar",
        days_before: 2,
        priority: 3,
        checklist: ["Cortes e montagem", "Trilha e efeitos sonoros", "Legendas", "Criar a thumbnail", "Exportar"],
      },
      {
        title: "Publicar",
        days_before: 0,
        priority: 3,
        checklist: ["Título final", "Descrição e tags", "Publicar ou agendar", "Divulgar nas redes"],
      },
    ],
  },
];

/** Cria os modelos padrão uma única vez por usuário (mesmo que ele apague depois). */
export async function ensureDefaultTemplates(userId: string) {
  const db = getDB();
  const claimed = await db
    .prepare("UPDATE users SET templates_seeded = 1 WHERE id = ? AND templates_seeded = 0")
    .bind(userId)
    .run();
  if (!claimed.meta.changes) return;

  const stmts = [];
  for (const t of DEFAULTS) {
    const templateId = newId();
    stmts.push(
      db.prepare("INSERT INTO templates (id, user_id, name, color) VALUES (?, ?, ?, ?)").bind(templateId, userId, t.name, t.color),
    );
    t.steps.forEach((s, i) =>
      stmts.push(
        db
          .prepare(
            `INSERT INTO template_steps (id, template_id, user_id, title, description, days_before, priority, checklist, position)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(newId(), templateId, userId, s.title, s.description ?? null, s.days_before, s.priority, JSON.stringify(s.checklist), i),
      ),
    );
  }
  await db.batch(stmts);
}
