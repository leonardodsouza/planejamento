"use client";

import { useState, useTransition } from "react";
import { deleteProject, updateProject } from "@/lib/actions";
import { PROJECT_COLORS, type Project } from "@/lib/types";

export function ProjectHeader({ project, total, done }: { project: Project; total: number; done: number }) {
  const [editing, setEditing] = useState(false);
  const [, start] = useTransition();
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="h-3.5 w-3.5 rounded-full" style={{ background: project.color }} />
        {editing ? (
          <form
            className="flex flex-1 flex-wrap items-center gap-2"
            action={(fd) => {
              const name = String(fd.get("name") ?? "").trim();
              const color = String(fd.get("color") ?? project.color);
              setEditing(false);
              if (name) start(() => updateProject(project.id, { name, color }));
            }}
          >
            <input className="input max-w-xs" name="name" defaultValue={project.name} autoFocus required />
            <div className="flex gap-1.5">
              {PROJECT_COLORS.map((c) => (
                <label key={c} className="cursor-pointer">
                  <input type="radio" name="color" value={c} defaultChecked={c === project.color} className="peer sr-only" />
                  <span className="block h-5 w-5 rounded-full ring-offset-2 peer-checked:ring-2 peer-checked:ring-slate-400" style={{ background: c }} />
                </label>
              ))}
            </div>
            <button className="btn-primary">Salvar</button>
          </form>
        ) : (
          <>
            <h1 className="text-2xl font-semibold">{project.name}</h1>
            <button className="btn-ghost text-xs" onClick={() => setEditing(true)}>Editar</button>
            <button
              className="btn-ghost text-xs text-red-600"
              onClick={() => {
                if (confirm(`Excluir o projeto "${project.name}" e todas as suas tarefas?`)) {
                  start(() => deleteProject(project.id));
                }
              }}
            >
              Excluir
            </button>
          </>
        )}
      </div>
      <div className="mt-3 flex items-center gap-3 text-sm text-slate-500">
        <div className="h-2 w-48 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
        </div>
        {done} de {total} concluídas
      </div>
    </div>
  );
}
