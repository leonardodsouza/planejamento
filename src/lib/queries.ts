import "server-only";
import { requireUser } from "@/lib/server/auth";
import { getDB } from "@/lib/server/db";
import type { ChecklistItem, Project, Task, Template, TemplateStep } from "@/lib/types";

const TASK = `SELECT t.*,
  (SELECT COUNT(*) FROM checklist_items c WHERE c.task_id = t.id) AS check_total,
  (SELECT COUNT(*) FROM checklist_items c WHERE c.task_id = t.id AND c.done = 1) AS check_done
  FROM tasks t`;

// Toda consulta filtra por user_id: cada pessoa só enxerga os próprios dados.

async function all<T>(sql: string, ...params: unknown[]): Promise<T[]> {
  const user = await requireUser();
  const { results } = await getDB()
    .prepare(sql)
    .bind(user.id, ...params)
    .all<T>();
  return results;
}

export function getProjects() {
  return all<Project>("SELECT * FROM projects WHERE user_id = ? ORDER BY created_at");
}

/** Tarefas não concluídas com prazo até `until` (inclui atrasadas). */
export function getOpenTasksUntil(until: string) {
  return all<Task>(
    `${TASK} WHERE user_id = ? AND status != 'done' AND due_date IS NOT NULL AND due_date <= ?
     ORDER BY due_date, priority DESC, created_at`,
    until,
  );
}

/** Tarefas concluídas com prazo entre `from` e `to` (para mostrar riscadas). */
export function getDoneBetween(from: string, to: string) {
  return all<Task>(
    `${TASK} WHERE user_id = ? AND status = 'done' AND due_date BETWEEN ? AND ?
     ORDER BY completed_at`,
    from,
    to,
  );
}

export function getInboxTasks() {
  return all<Task>(
    `${TASK} WHERE user_id = ? AND status != 'done' AND due_date IS NULL
     ORDER BY priority DESC, created_at`,
  );
}

export function getProjectTasks(projectId: string) {
  return all<Task>(`${TASK} WHERE user_id = ? AND project_id = ? ORDER BY position`, projectId);
}

export function getChecklist(taskId: string) {
  return all<ChecklistItem>(
    "SELECT * FROM checklist_items WHERE user_id = ? AND task_id = ? ORDER BY position",
    taskId,
  );
}

export function getTemplates() {
  return all<Template>("SELECT * FROM templates WHERE user_id = ? ORDER BY created_at");
}

export async function getTemplateSteps(templateId: string): Promise<TemplateStep[]> {
  const rows = await all<Omit<TemplateStep, "checklist"> & { checklist: string }>(
    "SELECT * FROM template_steps WHERE user_id = ? AND template_id = ? ORDER BY days_before DESC, position",
    templateId,
  );
  return rows.map((r) => ({ ...r, checklist: parseList(r.checklist) }));
}

export function parseList(json: string): string[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

export type ProjectOverview = {
  id: string;
  name: string;
  color: string;
  total: number;
  done: number;
  doing: number;
  overdue: number;
  delivery: string | null;
  next_title: string | null;
  next_due: string | null;
  next_status: string | null;
};

/** Resumo de todos os projetos: progresso, etapa atual, atrasos e data de entrega. */
export function getProjectsOverview(today: string) {
  const NEXT = `FROM tasks n WHERE n.project_id = p.id AND n.status != 'done'
    ORDER BY n.status = 'doing' DESC, n.due_date IS NULL, n.due_date, n.position LIMIT 1`;
  return all<ProjectOverview>(
    `SELECT p.id, p.name, p.color,
       COUNT(t.id) AS total,
       COALESCE(SUM(t.status = 'done'), 0) AS done,
       COALESCE(SUM(t.status = 'doing'), 0) AS doing,
       COALESCE(SUM(t.status != 'done' AND t.due_date < ?2), 0) AS overdue,
       MAX(t.due_date) AS delivery,
       (SELECT n.title ${NEXT}) AS next_title,
       (SELECT n.due_date ${NEXT}) AS next_due,
       (SELECT n.status ${NEXT}) AS next_status
     FROM projects p LEFT JOIN tasks t ON t.project_id = p.id
     WHERE p.user_id = ?1
     GROUP BY p.id
     ORDER BY delivery IS NULL, delivery, p.created_at`,
    today,
  );
}

export async function getTodayCounts(today: string) {
  const [row] = await all<{ hoje: number; atrasadas: number; semana: number }>(
    `SELECT COALESCE(SUM(due_date = ?2), 0) AS hoje,
            COALESCE(SUM(due_date < ?2), 0) AS atrasadas,
            COALESCE(SUM(due_date > ?2 AND due_date <= date(?2, '+6 days')), 0) AS semana
     FROM tasks WHERE user_id = ?1 AND status != 'done'`,
    today,
  );
  return row;
}
