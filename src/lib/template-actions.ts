"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addDays } from "@/lib/dates";
import { getChecklist as queryChecklist, getTemplateSteps } from "@/lib/queries";
import { requireUser } from "@/lib/server/auth";
import { getDB, newId } from "@/lib/server/db";
import { serverToday } from "@/lib/today";
import { PROJECT_COLORS, type ChecklistItem } from "@/lib/types";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const color = (c: unknown) => (PROJECT_COLORS.includes(String(c)) ? String(c) : PROJECT_COLORS[0]);
const text = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

function refresh() {
  revalidatePath("/", "layout");
}

async function ownTemplate(userId: string, templateId: string) {
  const row = await getDB()
    .prepare("SELECT id, name, color FROM templates WHERE id = ? AND user_id = ?")
    .bind(templateId, userId)
    .first<{ id: string; name: string; color: string }>();
  if (!row) throw new Error("Modelo não encontrado");
  return row;
}

// ---------- Criar projeto a partir de modelo ----------

export async function createFromTemplate(formData: FormData) {
  const user = await requireUser();
  const template = await ownTemplate(user.id, String(formData.get("template_id")));
  const name = text(formData.get("name"), 100) || template.name;
  const today = await serverToday();
  const dueRaw = String(formData.get("due_date") ?? "");
  const target = DATE_RE.test(dueRaw) ? dueRaw : today;

  const steps = await getTemplateSteps(template.id);
  const db = getDB();
  const projectId = newId();
  const stmts = [
    db.prepare("INSERT INTO projects (id, user_id, name, color) VALUES (?, ?, ?, ?)").bind(projectId, user.id, name, template.color),
  ];
  const base = Date.now();
  steps.forEach((s, i) => {
    let due = addDays(target, -s.days_before);
    if (due < today) due = today; // nada de prazo no passado
    const taskId = newId();
    stmts.push(
      db
        .prepare(
          `INSERT INTO tasks (id, user_id, project_id, title, description, due_date, priority, status, position)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'todo', ?)`,
        )
        .bind(taskId, user.id, projectId, s.title, s.description, due, s.priority, base + i * 1000),
    );
    s.checklist.forEach((item, j) =>
      stmts.push(
        db
          .prepare("INSERT INTO checklist_items (id, task_id, user_id, text, done, position) VALUES (?, ?, ?, ?, 0, ?)")
          .bind(newId(), taskId, user.id, item, j),
      ),
    );
  });
  await db.batch(stmts);
  refresh();
  redirect(`/projetos/${projectId}`);
}

// ---------- Editar modelos ----------

export async function createTemplate(formData: FormData) {
  const user = await requireUser();
  const name = text(formData.get("name"), 100);
  if (!name) return;
  const id = newId();
  await getDB()
    .prepare("INSERT INTO templates (id, user_id, name, color) VALUES (?, ?, ?, ?)")
    .bind(id, user.id, name, color(formData.get("color")))
    .run();
  refresh();
  redirect(`/projetos/modelos/${id}`);
}

export async function updateTemplate(id: string, fields: { name: string; color: string }) {
  const user = await requireUser();
  const name = text(fields.name, 100);
  if (!name) return;
  await getDB()
    .prepare("UPDATE templates SET name = ?, color = ? WHERE id = ? AND user_id = ?")
    .bind(name, color(fields.color), id, user.id)
    .run();
  refresh();
}

export async function deleteTemplate(id: string) {
  const user = await requireUser();
  const db = getDB();
  await db.batch([
    db.prepare("DELETE FROM template_steps WHERE template_id = ? AND user_id = ?").bind(id, user.id),
    db.prepare("DELETE FROM templates WHERE id = ? AND user_id = ?").bind(id, user.id),
  ]);
  refresh();
  redirect("/projetos");
}

export type StepInput = {
  title: string;
  description: string;
  days_before: number;
  priority: number;
  checklist: string; // um item por linha
};

function cleanStep(s: StepInput) {
  const days = Math.round(Number(s.days_before));
  const pr = Number(s.priority);
  return {
    title: text(s.title, 200),
    description: text(s.description, 5000) || null,
    days_before: Number.isFinite(days) ? Math.min(Math.max(days, 0), 365) : 0,
    priority: [1, 2, 3].includes(pr) ? pr : 2,
    checklist: JSON.stringify(
      String(s.checklist ?? "")
        .split("\n")
        .map((l) => l.trim().slice(0, 200))
        .filter(Boolean)
        .slice(0, 50),
    ),
  };
}

export async function saveStep(templateId: string, stepId: string | null, input: StepInput) {
  const user = await requireUser();
  await ownTemplate(user.id, templateId);
  const s = cleanStep(input);
  if (!s.title) return;
  const db = getDB();
  if (stepId) {
    await db
      .prepare(
        `UPDATE template_steps SET title = ?, description = ?, days_before = ?, priority = ?, checklist = ?
         WHERE id = ? AND template_id = ? AND user_id = ?`,
      )
      .bind(s.title, s.description, s.days_before, s.priority, s.checklist, stepId, templateId, user.id)
      .run();
  } else {
    await db
      .prepare(
        `INSERT INTO template_steps (id, template_id, user_id, title, description, days_before, priority, checklist, position)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(newId(), templateId, user.id, s.title, s.description, s.days_before, s.priority, s.checklist, Date.now())
      .run();
  }
  refresh();
}

export async function deleteStep(stepId: string) {
  const user = await requireUser();
  await getDB().prepare("DELETE FROM template_steps WHERE id = ? AND user_id = ?").bind(stepId, user.id).run();
  refresh();
}

// ---------- Checklist das tarefas ----------

export async function loadChecklist(taskId: string): Promise<ChecklistItem[]> {
  return queryChecklist(String(taskId));
}

async function ownTask(userId: string, taskId: string) {
  const row = await getDB().prepare("SELECT 1 FROM tasks WHERE id = ? AND user_id = ?").bind(taskId, userId).first();
  if (!row) throw new Error("Tarefa não encontrada");
}

export async function addChecklistItem(taskId: string, value: string): Promise<ChecklistItem | null> {
  const user = await requireUser();
  await ownTask(user.id, taskId);
  const t = text(value, 200);
  if (!t) return null;
  const item: ChecklistItem = { id: newId(), task_id: taskId, text: t, done: 0, position: Date.now() };
  await getDB()
    .prepare("INSERT INTO checklist_items (id, task_id, user_id, text, done, position) VALUES (?, ?, ?, ?, 0, ?)")
    .bind(item.id, taskId, user.id, t, item.position)
    .run();
  refresh();
  return item;
}

export async function toggleChecklistItem(id: string, done: boolean) {
  const user = await requireUser();
  await getDB()
    .prepare("UPDATE checklist_items SET done = ? WHERE id = ? AND user_id = ?")
    .bind(done ? 1 : 0, id, user.id)
    .run();
  refresh();
}

export async function deleteChecklistItem(id: string) {
  const user = await requireUser();
  await getDB().prepare("DELETE FROM checklist_items WHERE id = ? AND user_id = ?").bind(id, user.id).run();
  refresh();
}
