"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/server/auth";
import { getDB, newId } from "@/lib/server/db";
import { PROJECT_COLORS, type Priority, type Status } from "@/lib/types";

function refresh() {
  revalidatePath("/", "layout");
}

const STATUSES: Status[] = ["todo", "doing", "done"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function validColor(c: string) {
  return PROJECT_COLORS.includes(c) ? c : PROJECT_COLORS[0];
}

// ---------- Projetos ----------

export async function updateProject(id: string, fields: { name: string; color: string }) {
  const user = await requireUser();
  const name = fields.name.trim().slice(0, 100);
  if (!name) return;
  await getDB()
    .prepare("UPDATE projects SET name = ?, color = ? WHERE id = ? AND user_id = ?")
    .bind(name, validColor(fields.color), id, user.id)
    .run();
  refresh();
}

export async function deleteProject(id: string) {
  const user = await requireUser();
  const db = getDB();
  await db.batch([
    db.prepare("DELETE FROM tasks WHERE project_id = ? AND user_id = ?").bind(id, user.id),
    db.prepare("DELETE FROM projects WHERE id = ? AND user_id = ?").bind(id, user.id),
  ]);
  refresh();
  redirect("/");
}

// ---------- Tarefas ----------

export type TaskInput = {
  title: string;
  description?: string | null;
  due_date?: string | null;
  priority?: Priority;
  status?: Status;
  project_id?: string | null;
};

/** Valida e normaliza os campos recebidos do navegador. */
function clean(input: Partial<TaskInput>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (input.title !== undefined) out.title = String(input.title).trim().slice(0, 200);
  if (input.description !== undefined)
    out.description = String(input.description ?? "").trim().slice(0, 5000) || null;
  if (input.due_date !== undefined)
    out.due_date = input.due_date && DATE_RE.test(input.due_date) ? input.due_date : null;
  if (input.priority !== undefined) out.priority = [1, 2, 3].includes(Number(input.priority)) ? Number(input.priority) : 2;
  if (input.project_id !== undefined) out.project_id = input.project_id || null;
  if (input.status !== undefined) {
    out.status = STATUSES.includes(input.status) ? input.status : "todo";
    out.completed_at = out.status === "done" ? new Date().toISOString() : null;
  }
  return out;
}

/** Garante que o projeto informado pertence ao usuário. */
async function checkProject(userId: string, projectId: unknown) {
  if (!projectId) return;
  const row = await getDB()
    .prepare("SELECT 1 FROM projects WHERE id = ? AND user_id = ?")
    .bind(projectId, userId)
    .first();
  if (!row) throw new Error("Projeto não encontrado");
}

export async function createTask(input: TaskInput) {
  const user = await requireUser();
  const data = clean({ status: "todo", priority: 2, ...input });
  if (!data.title) return;
  await checkProject(user.id, data.project_id);
  const fields = { id: newId(), user_id: user.id, position: Date.now(), ...data };
  const cols = Object.keys(fields);
  await getDB()
    .prepare(`INSERT INTO tasks (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`)
    .bind(...Object.values(fields))
    .run();
  refresh();
}

async function update(id: string, data: Record<string, unknown>) {
  const user = await requireUser();
  if ("title" in data && !data.title) return;
  if ("project_id" in data) await checkProject(user.id, data.project_id);
  const cols = Object.keys(data);
  if (cols.length === 0) return;
  await getDB()
    .prepare(`UPDATE tasks SET ${cols.map((c) => `${c} = ?`).join(", ")} WHERE id = ? AND user_id = ?`)
    .bind(...Object.values(data), id, user.id)
    .run();
  refresh();
}

export async function updateTask(id: string, input: Partial<TaskInput>) {
  await update(id, clean(input));
}

export async function moveTask(id: string, status: Status, position: number) {
  await update(id, { ...clean({ status }), position: Number(position) || Date.now() });
}

export async function deleteTask(id: string) {
  const user = await requireUser();
  await getDB().prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?").bind(id, user.id).run();
  refresh();
}
