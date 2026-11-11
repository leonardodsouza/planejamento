"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NewProjectForm } from "./NewProjectForm";
import type { Project } from "@/lib/types";
import { signOut } from "@/app/login/actions";

function NavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick: () => void }) {
  const active = usePathname() === href;
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
        active
          ? "bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
          : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      }`}
    >
      {children}
    </Link>
  );
}

export function Sidebar({ projects, email }: { projects: Project[]; email: string }) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:hidden dark:border-slate-800 dark:bg-slate-900/90">
        <span className="font-semibold">Planejamento</span>
        <button className="btn-ghost" onClick={() => setOpen(!open)} aria-label="Menu">
          ☰
        </button>
      </header>

      {open && <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={close} />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white p-4 transition-transform md:sticky md:top-0 md:h-dvh md:translate-x-0 dark:border-slate-800 dark:bg-slate-900 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-6 hidden text-lg font-semibold md:block">Planejamento</div>

        <nav className="space-y-1">
          <NavLink href="/hoje" onClick={close}>☀️ Hoje</NavLink>
          <NavLink href="/semana" onClick={close}>📅 Esta semana</NavLink>
          <NavLink href="/entrada" onClick={close}>📥 Sem data</NavLink>
          <NavLink href="/modelos" onClick={close}>🧩 Modelos</NavLink>
        </nav>

        <div className="mt-6 flex items-center justify-between px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Projetos
          <button className="text-lg leading-none hover:text-indigo-600" onClick={() => setAdding(!adding)} aria-label="Novo projeto">
            +
          </button>
        </div>

        {adding && (
          <div className="mt-2 px-1">
            <NewProjectForm onDone={() => { setAdding(false); close(); }} />
          </div>
        )}

        <nav className="mt-2 flex-1 space-y-1 overflow-y-auto">
          {projects.map((p) => (
            <NavLink key={p.id} href={`/projetos/${p.id}`} onClick={close}>
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: p.color }} />
              <span className="truncate">{p.name}</span>
            </NavLink>
          ))}
          {projects.length === 0 && !adding && (
            <p className="px-3 text-sm text-slate-400">Nenhum projeto ainda.</p>
          )}
        </nav>

        <div className="mt-4 border-t border-slate-200 pt-3 text-xs text-slate-500 dark:border-slate-800">
          <div className="truncate px-3">{email}</div>
          <form action={signOut}>
            <button className="btn-ghost mt-1 w-full justify-start">Sair</button>
          </form>
        </div>
      </aside>
    </>
  );
}
