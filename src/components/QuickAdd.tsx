"use client";

import { useRef, useState, useTransition } from "react";
import { createTask, type TaskInput } from "@/lib/actions";
import { TaskDialog } from "./TaskDialog";

/** Campo para adicionar tarefa rápido (Enter) ou abrir o formulário completo. */
export function QuickAdd({ defaults, placeholder }: { defaults?: Partial<TaskInput>; placeholder?: string }) {
  const [pending, start] = useTransition();
  const [full, setFull] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  return (
    <div className="flex gap-2">
      <form
        className="flex-1"
        action={(fd) => {
          const title = String(fd.get("title") ?? "").trim();
          if (!title) return;
          start(async () => {
            await createTask({ ...defaults, title });
            if (input.current) input.current.value = "";
          });
        }}
      >
        <input
          ref={input}
          className="input"
          name="title"
          placeholder={placeholder ?? "Adicionar tarefa e apertar Enter"}
          disabled={pending}
        />
      </form>
      <button className="btn-primary" onClick={() => setFull(true)}>
        + Detalhes
      </button>
      <TaskDialog open={full} onClose={() => setFull(false)} defaults={defaults} />
    </div>
  );
}
