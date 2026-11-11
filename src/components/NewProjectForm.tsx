"use client";

import Link from "next/link";
import { useState } from "react";
import { createFromTemplate } from "@/lib/template-actions";
import { useApp } from "./AppContext";

/** Novo projeto sempre a partir de um modelo (prazos calculados pela data de entrega). */
export function NewProjectForm({ onDone, templateId }: { onDone?: () => void; templateId?: string }) {
  const { templates } = useApp();
  const [tpl, setTpl] = useState(templateId ?? templates[0]?.id ?? "");
  const template = templates.find((t) => t.id === tpl);

  if (!template) {
    return (
      <p className="text-sm text-slate-500">
        Nenhum modelo ainda.{" "}
        <Link href="/projetos" onClick={onDone} className="text-indigo-600 underline">Crie um em Projetos</Link>.
      </p>
    );
  }

  return (
    <form
      action={async (fd) => {
        onDone?.();
        await createFromTemplate(fd);
      }}
      className="space-y-2"
    >
      {!templateId && (
        <select className="input" value={tpl} onChange={(e) => setTpl(e.target.value)} aria-label="Modelo">
          {templates.map((t) => (
            <option key={t.id} value={t.id}>Modelo: {t.name}</option>
          ))}
        </select>
      )}
      <input type="hidden" name="template_id" value={tpl} />
      <input className="input" name="name" placeholder={`${template.name}: tema ou título`} autoFocus required />
      <label className="block text-xs text-slate-500">
        Data de entrega / publicação
        <input className="input mt-1" type="date" name="due_date" required />
      </label>
      <button className="btn-primary w-full">Criar {template.name.toLowerCase()}</button>
    </form>
  );
}
