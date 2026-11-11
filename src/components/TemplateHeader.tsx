"use client";

import { useState, useTransition } from "react";
import { deleteTemplate, updateTemplate } from "@/lib/template-actions";
import { PROJECT_COLORS, type Template } from "@/lib/types";

export function TemplateHeader({ template }: { template: Template }) {
  const [editing, setEditing] = useState(false);
  const [, start] = useTransition();

  if (editing) {
    return (
      <form
        className="flex flex-wrap items-center gap-2"
        action={(fd) => {
          setEditing(false);
          start(() =>
            updateTemplate(template.id, { name: String(fd.get("name") ?? ""), color: String(fd.get("color") ?? "") }),
          );
        }}
      >
        <input className="input max-w-xs" name="name" defaultValue={template.name} autoFocus required />
        <div className="flex gap-1.5">
          {PROJECT_COLORS.map((c) => (
            <label key={c} className="cursor-pointer">
              <input type="radio" name="color" value={c} defaultChecked={c === template.color} className="peer sr-only" />
              <span className="block h-5 w-5 rounded-full ring-offset-2 peer-checked:ring-2 peer-checked:ring-slate-400" style={{ background: c }} />
            </label>
          ))}
        </div>
        <button className="btn-primary">Salvar</button>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="h-3.5 w-3.5 rounded-full" style={{ background: template.color }} />
      <h1 className="text-2xl font-semibold">Modelo: {template.name}</h1>
      <button className="btn-ghost text-xs" onClick={() => setEditing(true)}>Renomear</button>
      <button
        className="btn-ghost text-xs text-red-600"
        onClick={() => {
          if (confirm(`Excluir o modelo "${template.name}"? Projetos já criados com ele continuam existindo.`)) {
            start(() => deleteTemplate(template.id));
          }
        }}
      >
        Excluir
      </button>
    </div>
  );
}
