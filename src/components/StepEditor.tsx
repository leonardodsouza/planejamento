"use client";

import { useState, useTransition } from "react";
import { deleteStep, saveStep } from "@/lib/template-actions";
import { PRIORITY_LABEL, type Priority, type TemplateStep } from "@/lib/types";
import { daysLabel } from "./TemplateCard";

/** Edita uma etapa existente, ou (sem `step`) adiciona uma nova. */
export function StepEditor({ templateId, step }: { templateId: string; step?: TemplateStep }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  if (!open) {
    if (!step) {
      return (
        <button className="btn-ghost w-full border border-dashed border-slate-300 dark:border-slate-700" onClick={() => setOpen(true)}>
          + Adicionar etapa
        </button>
      );
    }
    return (
      <li className="card cursor-pointer p-3 hover:border-indigo-300" onClick={() => setOpen(true)}>
        <div className="flex justify-between gap-2">
          <span className="font-medium">{step.title}</span>
          <span className="shrink-0 text-xs text-slate-400">{daysLabel(step.days_before)}</span>
        </div>
        {step.checklist.length > 0 && (
          <ul className="mt-1 list-inside list-disc text-xs text-slate-500">
            {step.checklist.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        )}
      </li>
    );
  }

  const Wrapper = step ? "li" : "div";
  return (
    <Wrapper className="card p-4">
      <form
        className="space-y-3"
        action={(fd) =>
          start(async () => {
            await saveStep(templateId, step?.id ?? null, {
              title: String(fd.get("title") ?? ""),
              description: String(fd.get("description") ?? ""),
              days_before: Number(fd.get("days_before")),
              priority: Number(fd.get("priority")),
              checklist: String(fd.get("checklist") ?? ""),
            });
            setOpen(false);
          })
        }
      >
        <input className="input" name="title" placeholder="Nome da etapa" defaultValue={step?.title} autoFocus required />
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            Dias antes da entrega
            <input className="input mt-1" type="number" min={0} max={365} name="days_before" defaultValue={step?.days_before ?? 0} />
          </label>
          <label className="text-sm">
            Prioridade
            <select className="input mt-1" name="priority" defaultValue={step?.priority ?? 2}>
              {([3, 2, 1] as Priority[]).map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
            </select>
          </label>
        </div>
        <label className="block text-sm">
          Checklist (um item por linha)
          <textarea className="input mt-1 min-h-24" name="checklist" defaultValue={step?.checklist.join("\n")} />
        </label>
        <label className="block text-sm">
          Descrição (opcional)
          <textarea className="input mt-1" name="description" defaultValue={step?.description ?? ""} />
        </label>
        <div className="flex items-center justify-between">
          {step ? (
            <button
              type="button"
              className="btn text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
              disabled={pending}
              onClick={() => confirm("Excluir esta etapa?") && start(() => deleteStep(step.id))}
            >
              Excluir
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="btn-primary" disabled={pending}>{pending ? "Salvando…" : "Salvar"}</button>
          </div>
        </div>
      </form>
    </Wrapper>
  );
}
