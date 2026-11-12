"use client";

import { LayoutGrid, Rows3 } from "lucide-react";
import { useRouter } from "next/navigation";

export type HomeView = "cards" | "bars";

/** Alterna a forma de exibir os projetos no Início; a escolha fica salva num cookie. */
export function ViewToggle({ view }: { view: HomeView }) {
  const router = useRouter();
  function choose(v: HomeView) {
    document.cookie = `home_view=${v}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }
  const btn = (v: HomeView, label: string, Icon: typeof Rows3) => (
    <button
      type="button"
      onClick={() => choose(v)}
      aria-pressed={view === v}
      title={label}
      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition ${
        view === v
          ? "bg-white font-medium text-indigo-700 shadow-sm dark:bg-slate-700 dark:text-indigo-300"
          : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
      }`}
    >
      <Icon size={16} strokeWidth={1.75} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
  return (
    <div className="flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800" role="group" aria-label="Forma de exibição">
      {btn("cards", "Cartões", LayoutGrid)}
      {btn("bars", "Barras", Rows3)}
    </div>
  );
}
