"use client";

import Link from "next/link";
import { useState } from "react";
import type { Template, TemplateStep } from "@/lib/types";
import { NewProjectForm } from "./NewProjectForm";

export function daysLabel(n: number) {
  if (n === 0) return "no dia da entrega";
  return n === 1 ? "1 dia antes" : `${n} dias antes`;
}

export function TemplateCard({ template, steps }: { template: Template; steps: TemplateStep[] }) {
  const [using, setUsing] = useState(false);
  return (
    <li className="card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="h-3 w-3 rounded-full" style={{ background: template.color }} />
        <h2 className="flex-1 font-semibold">{template.name}</h2>
        <Link href={`/modelos/${template.id}`} className="btn-ghost text-xs">Editar etapas</Link>
        <button className="btn-primary text-xs" onClick={() => setUsing(!using)}>
          Usar modelo
        </button>
      </div>
      <ol className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-300">
        {steps.map((s) => (
          <li key={s.id} className="flex justify-between gap-2">
            <span>{s.title}</span>
            <span className="shrink-0 text-xs text-slate-400">{daysLabel(s.days_before)}</span>
          </li>
        ))}
        {steps.length === 0 && <li className="text-slate-400">Sem etapas ainda.</li>}
      </ol>
      {using && (
        <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
          <NewProjectForm templateId={template.id} />
        </div>
      )}
    </li>
  );
}
