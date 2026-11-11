"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Priority, Status } from "@/lib/types";

async function db() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return supabase;
}

function refresh() {
  revalidatePath("/", "layout");
}

// ---------- Projetos ----------

export async function createProject(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? "#6366f1");
  if (!name) return;
  const supabase = await db();
  const { data, error } = await supabase
    .from("projects")
    .insert({ name, color })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  refresh();
  redirect(`/projetos/${data.id}`);
}

export async function updateProject(id: string, fields: { name?: string; color?: string }) {
  const supabase = await db();
  const { error } = await supabase.from("projects").update(fields).eq("id", id);
  if (error) throw new Error(error.message);
  refresh();
}

export async function deleteProject(id: string) {
  const supabase = await db();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw new Error(error.message);
  refresh();
  redirect("/hoje");
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

function clean(input: Partial<TaskInput>) {
  const out: Record<string, unknown> = {};
  if (input.title !== undefined) out.title = input.title.trim();
  if (input.description !== undefined) out.description = input.description?.trim() || null;
  if (input.due_date !== undefined) out.due_date = input.due_date || null;
  if (input.priority !== undefined) out.priority = input.priority;
  if (input.project_id !== undefined) out.project_id = input.project_id || null;
  if (input.status !== undefined) {
    out.status = input.status;
    out.completed_at = input.status === "done" ? new Date().toISOString() : null;
  }
  return out;
}

export async function createTask(input: TaskInput) {
  if (!input.title.trim()) return;
  const supabase = await db();
  const { error } = await supabase.from("tasks").insert({ ...clean(input), position: Date.now() });
  if (error) throw new Error(error.message);
  refresh();
}

export async function updateTask(id: string, input: Partial<TaskInput>) {
  const supabase = await db();
  const { error } = await supabase.from("tasks").update(clean(input)).eq("id", id);
  if (error) throw new Error(error.message);
  refresh();
}

export async function moveTask(id: string, status: Status, position: number) {
  const supabase = await db();
  const { error } = await supabase
    .from("tasks")
    .update({ ...clean({ status }), position })
    .eq("id", id);
  if (error) throw new Error(error.message);
  refresh();
}

export async function deleteTask(id: string) {
  const supabase = await db();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw new Error(error.message);
  refresh();
}
