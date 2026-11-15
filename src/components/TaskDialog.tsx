"use client";

import { useEffect, useRef, useTransition } from "react";
import { createTask, deleteTask, updateTask, type TaskInput } from "@/lib/actions";
import { PRIORITY_LABEL, STATUS_LABEL, type Priority, type Status, type Task } from "@/lib/types";
import { useApp } from "./AppContext";
import { Checklist } from "./Checklist";
import { Trash2 } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  task?: Task;
  defaults?: Partial<TaskInput>;
};

export function TaskDialog({ open, onClose, task, defaults }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const { projects } = useApp();
  const [pending, start] = useTransition();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const v = { ...defaults, ...task };

  function submit(fd: FormData) {
    const input: TaskInput = {
      title: String(fd.get("title") ?? ""),
      description: String(fd.get("description") ?? ""),
      due_date: String(fd.get("due_date") ?? "") || null,
      priority: Number(fd.get("priority")) as Priority,
      status: String(fd.get("status")) as Status,
      project_id: String(fd.get("project_id") ?? "") || null,
    };
    start(async () => {
      if (task) await updateTask(task.id, input);
      else await createTask(input);
      onClose();
    });
  }

  function remove() {
    if (!task || !confirm("Excluir esta tarefa?")) return;
    start(async () => {
      await deleteTask(task.id);
      onClose();
    });
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-0 h-dvh max-h-none w-full max-w-none overflow-x-hidden overflow-y-auto overscroll-contain bg-white p-0 text-slate-900 backdrop:bg-black/40 md:m-auto md:h-fit md:max-h-[90dvh] md:w-[calc(100%-2rem)] md:max-w-lg md:rounded-xl md:shadow-xl dark:bg-slate-900 dark:text-slate-100"
    >
      {open && (
        <form action={submit} className="flex min-h-full flex-col">
          <h2 className="px-4 pt-[calc(1rem+env(safe-area-inset-top))] text-lg font-semibold md:px-5 md:pt-5">{task ? "Editar tarefa" : "Nova tarefa"}</h2>

          <div className="flex-1 space-y-4 p-4 md:space-y-3 md:p-5">
            <input className="input" name="title" placeholder="Título" defaultValue={v.title ?? ""} required autoFocus={!task} />
            <textarea
              className="input min-h-20 field-sizing-content max-h-[40vh]"
              name="description"
              placeholder="Descrição (opcional)"
              defaultValue={v.description ?? ""}
            />
            <div className="space-y-4 md:space-y-3">
              <label className="block text-sm">
                Prazo
                <input className="input mt-1" type="date" name="due_date" defaultValue={v.due_date ?? ""} />
              </label>
              <label className="block text-sm">
                Prioridade
                <select className="input mt-1" name="priority" defaultValue={v.priority ?? 2}>
                  {([3, 2, 1] as Priority[]).map((p) => (
                    <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                Status
                <select className="input mt-1" name="status" defaultValue={v.status ?? "todo"}>
                  {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
                    <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                Projeto
                <select className="input mt-1" name="project_id" defaultValue={v.project_id ?? ""}>
                  <option value="">Nenhum</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </label>
            </div>
            {task && <Checklist taskId={task.id} />}
          </div>

          {/* Rodapé fixo: as ações ficam sempre visíveis ao rolar */}
          <div className="sticky bottom-0 z-10 flex items-center gap-2 border-t border-slate-200 bg-slate-50 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:px-5 md:pb-3 dark:border-slate-800 dark:bg-slate-950">
            {task && (
              <button
                type="button"
                className="btn px-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                onClick={remove}
                disabled={pending}
                title="Excluir tarefa"
                aria-label="Excluir tarefa"
              >
                <Trash2 size={20} />
              </button>
            )}
            <div className="flex-1" />
            <button type="button" className="btn-outline" onClick={onClose}>Cancelar</button>
            <button className="btn-primary px-5" disabled={pending}>{pending ? "Salvando…" : "Salvar"}</button>
          </div>
        </form>
      )}
    </dialog>
  );
}
