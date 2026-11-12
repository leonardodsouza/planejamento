"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { createFromTemplate } from "@/lib/template-actions";
import { useApp } from "./AppContext";

/** Novo projeto sempre a partir de um modelo (prazos calculados pela data de entrega). */
export function NewProjectForm({ onDone, templateId, dueDate }: { onDone?: () => void; templateId?: string; dueDate?: string }) {
  const { templates } = useApp();
  const [tpl, setTpl] = useState(templateId ?? templates[0]?.id ?? "");
  const template = templates.find((t) => t.id === tpl);
  const sending = useRef(false);

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
        // Evita criar o projeto duas vezes com clique duplo ou Enter + clique.
        if (sending.current) return;
        sending.current = true;
        try {
          await createFromTemplate(fd);
        } finally {
          sending.current = false;
          onDone?.();
        }
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
        <input className="input mt-1" type="date" name="due_date" defaultValue={dueDate} required />
      </label>
      <SubmitButton label={`Criar ${template.name.toLowerCase()}`} />
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn-primary w-full" disabled={pending}>
      {pending ? "Criando…" : label}
    </button>
  );
}
