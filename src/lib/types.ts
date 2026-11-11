export type Status = "todo" | "doing" | "done";
export type Priority = 1 | 2 | 3;

export type Project = {
  id: string;
  name: string;
  color: string;
  created_at: string;
};

export type Task = {
  id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: Priority;
  status: Status;
  position: number;
  created_at: string;
  completed_at: string | null;
  check_total: number;
  check_done: number;
};

export type ChecklistItem = {
  id: string;
  task_id: string;
  text: string;
  done: number;
  position: number;
};

export type Template = {
  id: string;
  name: string;
  color: string;
  created_at: string;
};

export type TemplateStep = {
  id: string;
  template_id: string;
  title: string;
  description: string | null;
  days_before: number;
  priority: Priority;
  checklist: string[];
  position: number;
};

export const STATUS_LABEL: Record<Status, string> = {
  todo: "A fazer",
  doing: "Fazendo",
  done: "Feito",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  1: "Baixa",
  2: "Média",
  3: "Alta",
};

export const PROJECT_COLORS = [
  "#6366f1",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#8b5cf6",
  "#64748b",
];
