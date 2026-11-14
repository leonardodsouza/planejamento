"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/server/auth";
import { getDB } from "@/lib/server/db";
import { checkProject, cleanTask, insertTask, type TaskInput } from "@/lib/server/tasks";
import { PROJECT_COLORS, type Status } from "@/lib/types";

export type { TaskInput };

function refresh() {
  revalidatePath("/", "layout");
}

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

export async function createTask(input: TaskInput) {
  const user = await requireUser();
  if (await insertTask(user.id, input)) refresh();
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
  await update(id, cleanTask(input));
}

export async function moveTask(id: string, status: Status, position: number) {
  await update(id, { ...cleanTask({ status }), position: Number(position) || Date.now() });
}

export async function deleteTask(id: string) {
  const user = await requireUser();
  await getDB().prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?").bind(id, user.id).run();
  refresh();
}
