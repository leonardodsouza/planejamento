"use client";

import { useOptimistic, useState, useTransition } from "react";
import { updateTask } from "@/lib/actions";
import { formatDue } from "@/lib/dates";
import { PRIORITY_LABEL, type Task } from "@/lib/types";
import { useApp } from "./AppContext";
import { TaskDialog } from "./TaskDialog";

const PRIORITY_STYLE = {
  3: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  2: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  1: "bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300",
} as const;

export function TaskMeta({ task, showProject = true }: { task: Task; showProject?: boolean }) {
  const { projects, today } = useApp();
  const project = projects.find((p) => p.id === task.project_id);
  const overdue = task.due_date && task.due_date < today && task.status !== "done";
  return (
    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
      <span className={`rounded px-1.5 py-0.5 font-medium ${PRIORITY_STYLE[task.priority]}`}>
        {PRIORITY_LABEL[task.priority]}
      </span>
      {task.due_date && (
        <span className={overdue ? "font-medium text-red-600" : ""}>
          {overdue ? "Atrasada · " : ""}
          {formatDue(task.due_date, today)}
        </span>
      )}
      {task.check_total > 0 && (
        <span className={task.check_done === task.check_total ? "text-emerald-600" : ""}>
          ☑ {task.check_done}/{task.check_total}
        </span>
      )}
      {showProject && project && (
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full" style={{ background: project.color }} />
          {project.name}
        </span>
      )}
      {showProject && task.status === "doing" && <span className="text-indigo-600">Fazendo</span>}
    </div>
  );
}

export function TaskItem({ task }: { task: Task }) {
  const [editing, setEditing] = useState(false);
  const [, start] = useTransition();
  const [done, setDone] = useOptimistic(task.status === "done");

  function toggle() {
    start(async () => {
      setDone(!done);
      await updateTask(task.id, { status: done ? "todo" : "done" });
    });
  }

  return (
    <li className="card flex items-start gap-3 p-3">
      <button
        onClick={toggle}
        aria-label={done ? "Marcar como não feita" : "Concluir"}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px] text-white transition ${
          done ? "border-emerald-500 bg-emerald-500" : "border-slate-300 hover:border-emerald-500"
        }`}
      >
        {done && "✓"}
      </button>
      <button className="min-w-0 flex-1 text-left" onClick={() => setEditing(true)}>
        <div className={`text-sm ${done ? "text-slate-400 line-through" : ""}`}>{task.title}</div>
        <TaskMeta task={task} />
      </button>
      <TaskDialog open={editing} onClose={() => setEditing(false)} task={task} />
    </li>
  );
}

export function TaskList({ tasks, empty }: { tasks: Task[]; empty?: string }) {
  if (tasks.length === 0) return <p className="py-4 text-sm text-slate-400">{empty ?? "Nada por aqui."}</p>;
  return (
    <ul className="space-y-2">
      {tasks.map((t) => (
        <TaskItem key={t.id} task={t} />
      ))}
    </ul>
  );
}
