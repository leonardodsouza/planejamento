"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarDays, CalendarRange, Folder, House, Inbox, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Plus, Settings, Sun, type LucideIcon } from "lucide-react";
import { NewProjectForm } from "./NewProjectForm";
import type { Project } from "@/lib/types";
import { signOut } from "@/app/login/actions";
import { SIDEBAR_COOKIE } from "@/lib/sidebar";

function NavLink({
  href,
  children,
  onClick,
  icon: Icon,
  collapsed,
  title,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
  icon?: LucideIcon;
  collapsed?: boolean;
  /** Nome mostrado ao passar o mouse quando o menu está recolhido. */
  title?: string;
}) {
  const active = usePathname() === href;
  return (
    <Link
      href={href}
      onClick={onClick}
      title={collapsed ? title : undefined}
      aria-label={collapsed ? title : undefined}
      className={`flex items-center gap-2 rounded-lg py-2.5 text-base md:py-2 md:text-sm ${collapsed ? "justify-center px-0" : "px-3"} ${
        active
          ? "bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
          : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      }`}
    >
      {Icon && <Icon size={18} strokeWidth={1.75} className="shrink-0" />}
      {collapsed && Icon ? null : children}
    </Link>
  );
}

/** Lista de projetos em andamento + criar novo + conta. Usada na barra lateral e no "Mais" do celular. */
function ProjectsAndAccount({
  projects,
  email,
  onNavigate,
  startAdding = false,
}: {
  projects: Project[];
  email: string;
  onNavigate?: () => void;
  startAdding?: boolean;
}) {
  const [adding, setAdding] = useState(startAdding);
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

const DESKTOP_LINKS = [
  { href: "/", icon: House, label: "Início" },
  { href: "/hoje", icon: Sun, label: "Hoje" },
  { href: "/semana", icon: CalendarDays, label: "Esta semana" },
  { href: "/calendario", icon: CalendarRange, label: "Calendário" },
  { href: "/entrada", icon: Inbox, label: "Sem data" },
  { href: "/projetos", icon: Folder, label: "Projetos" },
];

/** Guarda a escolha num cookie, para a página já abrir com o menu do jeito certo. */
function saveCollapsed(value: boolean) {
  document.cookie = `${SIDEBAR_COOKIE}=${value ? "collapsed" : "open"}; path=/; max-age=31536000; samesite=lax`;
}

/** Versão recolhida: projetos como bolinhas coloridas e conta como ícones. */
function CollapsedProjectsAndAccount({ projects, onAdd }: { projects: Project[]; onAdd: () => void }) {
  return (
    <>
      <div className="mx-2 mt-6 border-t border-slate-200 pt-3 dark:border-slate-800">
        <button
          className="flex w-full justify-center rounded-lg py-2 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"
          onClick={onAdd}
          aria-label="Novo projeto"
          title="Novo projeto"
        >
          <Plus size={16} strokeWidth={2} />
        </button>
      </div>
      <nav className="mt-1 flex-1 space-y-1 overflow-y-auto">
        {projects.map((p) => (
          <NavLink key={p.id} href={`/projetos/${p.id}`} collapsed title={p.name}>
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: p.color }} />
          </NavLink>
        ))}
      </nav>
      <div className="mt-4 space-y-1 border-t border-slate-200 pt-3 dark:border-slate-800">
        <NavLink href="/config" icon={Settings} collapsed title="Configurações">Configurações</NavLink>
        <form action={signOut}>
          <button className="btn-ghost w-full px-0" aria-label="Sair" title="Sair">
            <LogOut size={16} strokeWidth={1.75} />
          </button>
        </form>
      </div>
    </>
  );
}

export function Sidebar({ projects, email, initialCollapsed = false }: { projects: Project[]; email: string; initialCollapsed?: boolean }) {
  const pathname = usePathname();
  const [more, setMore] = useState(false);
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [addOnOpen, setAddOnOpen] = useState(false);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    setAddOnOpen(false);
    saveCollapsed(next);
  }

  // Fecha o "Mais" ao trocar de página.
  useEffect(() => setMore(false), [pathname]);

  return (
    <>
      {/* Computador: barra lateral (pode ser recolhida para mostrar só os ícones) */}
      <aside
        className={`sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-slate-200 bg-white transition-[width] duration-200 md:flex dark:border-slate-800 dark:bg-slate-900 ${
          collapsed ? "w-16 px-2 py-4" : "w-64 p-4"
        }`}
      >
        <div className={`mb-6 flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
          {!collapsed && <span className="truncate text-lg font-semibold">Planejamento</span>}
          <button
            onClick={toggleCollapsed}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            aria-expanded={!collapsed}
            title={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            {collapsed ? <PanelLeftOpen size={18} strokeWidth={1.75} /> : <PanelLeftClose size={18} strokeWidth={1.75} />}
          </button>
        </div>
        <nav className="space-y-1">
          {DESKTOP_LINKS.map((l) => (
            <NavLink key={l.href} href={l.href} icon={l.icon} collapsed={collapsed} title={l.label}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        {collapsed ? (
          <CollapsedProjectsAndAccount projects={projects} onAdd={() => { setCollapsed(false); saveCollapsed(false); setAddOnOpen(true); }} />
        ) : (
          <ProjectsAndAccount projects={projects} email={email} startAdding={addOnOpen} />
        )}
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
