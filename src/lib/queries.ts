import { createClient } from "@/lib/supabase/server";
import type { Project, Task } from "@/lib/types";

export async function getProjects(): Promise<Project[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("projects").select("*").order("created_at");
  return data ?? [];
}

const ORDER = { ascending: true, nullsFirst: false } as const;

/** Tarefas não concluídas com prazo até `until` (inclui atrasadas). */
export async function getOpenTasksUntil(until: string): Promise<Task[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tasks")
    .select("*")
    .neq("status", "done")
    .lte("due_date", until)
    .order("due_date", ORDER)
    .order("priority", { ascending: false });
  return data ?? [];
}

/** Tarefas concluídas com prazo entre `from` e `to` (para mostrar riscadas). */
export async function getDoneBetween(from: string, to: string): Promise<Task[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tasks")
    .select("*")
    .eq("status", "done")
    .gte("due_date", from)
    .lte("due_date", to)
    .order("completed_at");
  return data ?? [];
}

export async function getInboxTasks(): Promise<Task[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tasks")
    .select("*")
    .neq("status", "done")
    .is("due_date", null)
    .order("priority", { ascending: false })
    .order("created_at");
  return data ?? [];
}

export async function getProjectTasks(projectId: string): Promise<Task[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("position");
  return data ?? [];
}
