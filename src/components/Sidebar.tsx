"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarDays, CalendarRange, Folder, House, Inbox, Menu, Plus, Settings, Sun, type LucideIcon } from "lucide-react";
import { NewProjectForm } from "./NewProjectForm";
import type { Project } from "@/lib/types";
import { signOut } from "@/app/login/actions";

function NavLink({ href, children, onClick, icon: Icon }: { href: string; children: React.ReactNode; onClick?: () => void; icon?: LucideIcon }) {
  const active = usePathname() === href;
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-base md:py-2 md:text-sm ${
        active
          ? "bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
          : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      }`}
    >
      {Icon && <Icon size={18} strokeWidth={1.75} className="shrink-0" />}
      {children}
    </Link>
  );
}

/** Lista de projetos em andamento + criar novo + conta. Usada na barra lateral e no "Mais" do celular. */
function ProjectsAndAccount({ projects, email, onNavigate }: { projects: Project[]; email: string; onNavigate?: () => void }) {
  const [adding, setAdding] = useState(false);
  return (
    <>
      <div className="mt-6 flex items-center justify-between px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Em andamento
        <button
          className="-m-2 p-2 hover:text-indigo-600"
          onClick={() => setAdding(!adding)}
          aria-label="Novo projeto"
        >
          <Plus size={16} strokeWidth={2} />
        </button>
      </div>

      {adding && (
        <div className="mt-2 px-1">
          <NewProjectForm onDone={() => { setAdding(false); onNavigate?.(); }} />
        </div>
      )}

      <nav className="mt-2 flex-1 space-y-1 overflow-y-auto">
        {projects.map((p) => (
          <NavLink key={p.id} href={`/projetos/${p.id}`} onClick={onNavigate}>
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: p.color }} />
            <span className="truncate">{p.name}</span>
          </NavLink>
        ))}
        {projects.length === 0 && !adding && (
          <p className="px-3 text-sm text-slate-400">Nenhum projeto ainda. Toque no + para criar.</p>
        )}
      </nav>

      <div className="mt-4 border-t border-slate-200 pt-3 text-xs text-slate-500 dark:border-slate-800">
        <div className="truncate px-3">{email}</div>
        <Link href="/config" onClick={onNavigate} className="btn-ghost mt-1 w-full justify-start"><Settings size={16} strokeWidth={1.75} /> Configurações</Link>
        <form action={signOut}>
          <button className="btn-ghost mt-1 w-full justify-start">Sair</button>
        </form>
      </div>
    </>
  );
}

const TABS = [
  { href: "/", icon: House, label: "Início" },
  { href: "/hoje", icon: Sun, label: "Hoje" },
  { href: "/semana", icon: CalendarDays, label: "Semana" },
  { href: "/projetos", icon: Folder, label: "Projetos" },
];

export function Sidebar({ projects, email }: { projects: Project[]; email: string }) {
  const pathname = usePathname();
  const [more, setMore] = useState(false);

  // Fecha o "Mais" ao trocar de página.
  useEffect(() => setMore(false), [pathname]);

  return (
    <>
      {/* Computador: barra lateral */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-4 md:flex dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 text-lg font-semibold">Planejamento</div>
        <nav className="space-y-1">
          <NavLink href="/" icon={House}>Início</NavLink>
          <NavLink href="/hoje" icon={Sun}>Hoje</NavLink>
          <NavLink href="/semana" icon={CalendarDays}>Esta semana</NavLink>
          <NavLink href="/calendario" icon={CalendarRange}>Calendário</NavLink>
          <NavLink href="/entrada" icon={Inbox}>Sem data</NavLink>
          <NavLink href="/projetos" icon={Folder}>Projetos</NavLink>
        </nav>
        <ProjectsAndAccount projects={projects} email={email} />
      </aside>

      {/* Celular: barra fixa embaixo */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden dark:border-slate-800 dark:bg-slate-900/95"
        aria-label="Navegação"
      >
        {TABS.map((t) => {
          const active = t.href === "/" ? pathname === "/" : pathname === t.href || (t.href === "/projetos" && pathname.startsWith("/projetos"));
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${active ? "font-semibold text-indigo-600 dark:text-indigo-400" : "text-slate-500"}`}
            >
              <t.icon size={22} strokeWidth={active ? 2 : 1.75} />
              {t.label}
            </Link>
          );
        })}
        <button
          onClick={() => setMore(true)}
          className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${more ? "font-semibold text-indigo-600" : "text-slate-500"}`}
        >
          <Menu size={22} strokeWidth={1.75} />
          Mais
        </button>
      </nav>

      {/* Celular: painel "Mais" que sobe de baixo */}
      {more && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMore(false)} />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-2xl bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl dark:bg-slate-900">
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-300" />
            <nav className="space-y-1">
              <NavLink href="/calendario" icon={CalendarRange} onClick={() => setMore(false)}>Calendário</NavLink>
              <NavLink href="/entrada" icon={Inbox}>Sem data</NavLink>
            </nav>
            <ProjectsAndAccount projects={projects} email={email} onNavigate={() => setMore(false)} />
          </div>
        </div>
      )}
    </>
  );
}
