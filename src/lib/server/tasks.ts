import "server-only";
import { getDB, newId } from "./db";
import type { Priority, Status } from "@/lib/types";

export type TaskInput = {
  title: string;
  description?: string | null;
  due_date?: string | null;
  priority?: Priority;
  status?: Status;
  project_id?: string | null;
};

const STATUSES: Status[] = ["todo", "doing", "done"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const isISODate = (s: unknown): s is string => typeof s === "string" && DATE_RE.test(s);

/** Valida e normaliza os campos recebidos do navegador (ou da extensão). */
export function cleanTask(input: Partial<TaskInput>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (input.title !== undefined) out.title = String(input.title).trim().slice(0, 200);
  if (input.description !== undefined)
    out.description = String(input.description ?? "").trim().slice(0, 5000) || null;
  if (input.due_date !== undefined) out.due_date = isISODate(input.due_date) ? input.due_date : null;
  if (input.priority !== undefined) out.priority = [1, 2, 3].includes(Number(input.priority)) ? Number(input.priority) : 2;
  if (input.project_id !== undefined) out.project_id = input.project_id || null;
  if (input.status !== undefined) {
    out.status = STATUSES.includes(input.status) ? input.status : "todo";
    out.completed_at = out.status === "done" ? new Date().toISOString() : null;
  }
  return out;
}

/** Garante que o projeto informado pertence ao usuário. */
export async function checkProject(userId: string, projectId: unknown) {
  if (!projectId) return;
  const row = await getDB()
    .prepare("SELECT 1 FROM projects WHERE id = ? AND user_id = ?")
    .bind(projectId, userId)
    .first();
  if (!row) throw new Error("Projeto não encontrado");
}

/** Cria a tarefa e devolve o id (ou null se o título veio vazio). */
export async function insertTask(userId: string, input: TaskInput): Promise<string | null> {
  const data = cleanTask({ status: "todo", priority: 2, ...input });
  if (!data.title) return null;
  await checkProject(userId, data.project_id);
  const fields = { id: newId(), user_id: userId, position: Date.now(), ...data };
  const cols = Object.keys(fields);
  await getDB()
    .prepare(`INSERT INTO tasks (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`)
    .bind(...Object.values(fields))
    .run();
  return fields.id;
}
