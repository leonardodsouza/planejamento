"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { addChecklistItem, deleteChecklistItem, loadChecklist, toggleChecklistItem } from "@/lib/template-actions";
import type { ChecklistItem } from "@/lib/types";

export function Checklist({ taskId }: { taskId: string }) {
  const [items, setItems] = useState<ChecklistItem[] | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    loadChecklist(taskId).then((r) => alive && setItems(r));
    return () => {
      alive = false;
    };
  }, [taskId]);

  if (!items) return <p className="text-xs text-slate-400">Carregando checklist…</p>;

  const done = items.filter((i) => i.done).length;

  async function add() {
    const value = input.current?.value.trim();
    if (!value) return;
    input.current!.value = "";
    const item = await addChecklistItem(taskId, value);
    if (item) setItems((cur) => [...(cur ?? []), item]);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span>Checklist</span>
        {items.length > 0 && (
          <span className="text-xs text-slate-500">
            {done}/{items.length}
          </span>
        )}
      </div>
      {items.length > 0 && (
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(done / items.length) * 100}%` }} />
        </div>
      )}
      <ul className="space-y-1">
        {items.map((it) => (
          <li key={it.id} className="group flex items-center gap-3 py-1.5 text-base md:gap-2 md:py-0 md:text-sm">
            <input
              type="checkbox"
              className="h-5 w-5 shrink-0 accent-emerald-500 md:h-4 md:w-4"
              checked={!!it.done}
              onChange={(e) => {
                const v = e.target.checked;
                setItems((cur) => cur!.map((x) => (x.id === it.id ? { ...x, done: v ? 1 : 0 } : x)));
                toggleChecklistItem(it.id, v);
              }}
            />
            <span className={`flex-1 ${it.done ? "text-slate-400 line-through" : ""}`}>{it.text}</span>
            <button
              type="button"
              aria-label="Remover item"
              className="-m-2 p-2 text-lg text-slate-400 opacity-0 hover:text-red-600 group-hover:opacity-100 max-md:opacity-100"
              onClick={() => {
                setItems((cur) => cur!.filter((x) => x.id !== it.id));
                deleteChecklistItem(it.id);
              }}
            >
              <X size={16} strokeWidth={1.75} />
            </button>
          </li>
        ))}
      </ul>
      <input
        ref={input}
        className="input"
        placeholder="Adicionar item e apertar Enter"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add();
          }
        }}
      />
    </div>
  );
}
