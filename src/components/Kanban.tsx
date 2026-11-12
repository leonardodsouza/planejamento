"use client";

import { useOptimistic, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { moveTask } from "@/lib/actions";
import { STATUS_LABEL, type Status, type Task } from "@/lib/types";
import { TaskDialog } from "./TaskDialog";
import { TaskMeta } from "./TaskItem";

const COLUMNS: Status[] = ["todo", "doing", "done"];

type Move = { id: string; status: Status; position: number };

export function Kanban({ tasks, projectId }: { tasks: Task[]; projectId: string }) {
  const [, start] = useTransition();
  const [items, applyMove] = useOptimistic(tasks, (state, m: Move) =>
    state.map((t) => (t.id === m.id ? { ...t, status: m.status, position: m.position } : t)),
  );
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<{ status: Status; index: number } | null>(null);
  const [editing, setEditing] = useState<Task | null>(null);
  const [creating, setCreating] = useState<Status | null>(null);

  const byStatus = (s: Status) =>
    items.filter((t) => t.status === s).sort((a, b) => a.position - b.position);

  function drop(status: Status, index: number) {
    const id = dragId;
    setDragId(null);
    setOver(null);
    if (!id) return;
    const col = byStatus(status).filter((t) => t.id !== id);
    const before = col[index - 1]?.position;
    const after = col[index]?.position;
    const position =
      before === undefined && after === undefined
        ? Date.now()
        : before === undefined
          ? after! - 1000
          : after === undefined
            ? before + 1000
            : (before + after) / 2;
    start(async () => {
      applyMove({ id, status, position });
      await moveTask(id, status, position);
    });
  }

  // Alternativa ao arrastar (útil no celular): mover para a coluna ao lado.
  function shift(task: Task, dir: -1 | 1) {
    const status = COLUMNS[COLUMNS.indexOf(task.status) + dir];
    if (!status) return;
    const position = Date.now();
    start(async () => {
      applyMove({ id: task.id, status, position });
      await moveTask(task.id, status, position);
    });
  }

  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0">
      {COLUMNS.map((status) => {
        const col = byStatus(status);
        return (
          <section
            key={status}
            className={`flex min-h-40 w-[85vw] max-w-sm shrink-0 snap-center flex-col rounded-xl bg-slate-100 p-3 transition md:w-auto md:max-w-none dark:bg-slate-800/50 ${
              over?.status === status ? "ring-2 ring-indigo-400" : ""
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              if (over?.status !== status) setOver({ status, index: col.length });
            }}
            onDrop={(e) => {
              e.preventDefault();
              drop(status, over?.status === status ? over.index : col.length);
            }}
          >
            <header className="mb-3 flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold">
                {STATUS_LABEL[status]} <span className="font-normal text-slate-400">{col.length}</span>
              </h3>
              <button className="-m-2 p-2 text-slate-400 hover:text-indigo-600" onClick={() => setCreating(status)} aria-label="Nova tarefa">
                <Plus size={18} strokeWidth={1.75} />
              </button>
            </header>
            <ul className="flex-1 space-y-2">
              {col.map((t, i) => (
                <li
                  key={t.id}
                  draggable
                  onDragStart={(e) => {
                    setDragId(t.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragEnd={() => {
                    setDragId(null);
                    setOver(null);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    const index = e.clientY < rect.top + rect.height / 2 ? i : i + 1;
                    if (over?.status !== status || over.index !== index) setOver({ status, index });
                  }}
                  className={`card group cursor-grab p-3 active:cursor-grabbing ${dragId === t.id ? "opacity-40" : ""} ${
                    over?.status === status && over.index === i && dragId ? "border-t-2 border-t-indigo-500" : ""
                  }`}
                >
                  <button className="w-full text-left" onClick={() => setEditing(t)}>
                    <div className={`text-sm ${t.status === "done" ? "text-slate-400 line-through" : ""}`}>{t.title}</div>
                    <TaskMeta task={t} showProject={false} />
                  </button>
                  <div className="-mx-1 mt-2 flex justify-between text-sm text-slate-500 md:hidden">
                    <button disabled={status === "todo"} onClick={() => shift(t, -1)} className="flex items-center gap-0.5 rounded-md px-2 py-1 active:bg-slate-100 disabled:invisible"><ChevronLeft size={16} strokeWidth={1.75} /> voltar</button>
                    <button disabled={status === "done"} onClick={() => shift(t, 1)} className="flex items-center gap-0.5 rounded-md px-2 py-1 active:bg-slate-100 disabled:invisible">avançar <ChevronRight size={16} strokeWidth={1.75} /></button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      {editing && <TaskDialog open onClose={() => setEditing(null)} task={editing} />}
      {creating && (
        <TaskDialog open onClose={() => setCreating(null)} defaults={{ project_id: projectId, status: creating }} />
      )}
    </div>
  );
}
