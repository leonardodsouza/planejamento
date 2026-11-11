import "server-only";
import { requireUser } from "@/lib/server/auth";
import { getDB } from "@/lib/server/db";
import type { Project, Task } from "@/lib/types";

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
    `SELECT * FROM tasks WHERE user_id = ? AND status != 'done' AND due_date IS NOT NULL AND due_date <= ?
     ORDER BY due_date, priority DESC, created_at`,
    until,
  );
}

/** Tarefas concluídas com prazo entre `from` e `to` (para mostrar riscadas). */
export function getDoneBetween(from: string, to: string) {
  return all<Task>(
    `SELECT * FROM tasks WHERE user_id = ? AND status = 'done' AND due_date BETWEEN ? AND ?
     ORDER BY completed_at`,
    from,
    to,
  );
}

export function getInboxTasks() {
  return all<Task>(
    `SELECT * FROM tasks WHERE user_id = ? AND status != 'done' AND due_date IS NULL
     ORDER BY priority DESC, created_at`,
  );
}

export function getProjectTasks(projectId: string) {
  return all<Task>("SELECT * FROM tasks WHERE user_id = ? AND project_id = ? ORDER BY position", projectId);
}
