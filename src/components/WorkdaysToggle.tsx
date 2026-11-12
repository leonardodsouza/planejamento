"use client";

import { useOptimistic, useTransition } from "react";
import { setSkipNonWorkdays } from "@/lib/settings-actions";

export function WorkdaysToggle({ enabled }: { enabled: boolean }) {
  const [on, setOn] = useOptimistic(enabled);
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label="Não agendar em fins de semana e feriados"
      disabled={pending}
      onClick={() =>
        start(async () => {
          setOn(!on);
          await setSkipNonWorkdays(!on);
        })
      }
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${
        on ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"
      }`}
    >
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${on ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}
