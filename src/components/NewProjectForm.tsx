"use client";

import { useState } from "react";
import { createProject } from "@/lib/actions";
import { createFromTemplate } from "@/lib/template-actions";
import { PROJECT_COLORS } from "@/lib/types";
import { useApp } from "./AppContext";

/** Novo projeto em branco ou a partir de um modelo (com prazos calculados). */
export function NewProjectForm({ onDone, templateId }: { onDone?: () => void; templateId?: string }) {
  const { templates } = useApp();
  const [tpl, setTpl] = useState(templateId ?? "");
  const template = templates.find((t) => t.id === tpl);

  return (
    <form
      action={async (fd) => {
        onDone?.();
        if (tpl) await createFromTemplate(fd);
        else await createProject(fd);
      }}
      className="space-y-2"
    >
      {!templateId && (
        <select className="input" value={tpl} onChange={(e) => setTpl(e.target.value)} aria-label="Modelo">
          <option value="">Projeto em branco</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>Modelo: {t.name}</option>
          ))}
        </select>
      )}
      <input type="hidden" name="template_id" value={tpl} />
      <input
        className="input"
        name="name"
        placeholder={template ? `${template.name}: tema ou título` : "Nome do projeto"}
        autoFocus
        required
      />
      {template ? (
        <label className="block text-xs text-slate-500">
          Data de entrega / publicação
          <input className="input mt-1" type="date" name="due_date" required />
        </label>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {PROJECT_COLORS.map((c, i) => (
            <label key={c} className="cursor-pointer">
              <input type="radio" name="color" value={c} defaultChecked={i === 0} className="peer sr-only" />
              <span className="block h-5 w-5 rounded-full ring-offset-2 peer-checked:ring-2 peer-checked:ring-slate-400" style={{ background: c }} />
            </label>
          ))}
        </div>
      )}
      <button className="btn-primary w-full">{template ? `Criar ${template.name.toLowerCase()}` : "Criar projeto"}</button>
    </form>
  );
}
