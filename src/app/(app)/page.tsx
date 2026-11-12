import { cookies } from "next/headers";
import Link from "next/link";
import { ViewToggle, type HomeView } from "@/components/ViewToggle";
import { formatDue } from "@/lib/dates";
import { getProjectsOverview, getTodayCounts, type ProjectOverview } from "@/lib/queries";
import { serverToday } from "@/lib/today";

function Stat({ label, value, href, tone }: { label: string; value: number; href: string; tone?: string }) {
  return (
    <Link href={href} className="card block p-4 transition hover:border-indigo-300">
      <div className={`text-3xl font-semibold ${tone ?? ""}`}>{value}</div>
      <div className="mt-1 text-sm text-slate-500">{label}</div>
    </Link>
  );
}

function ProjectCard({ p, today }: { p: ProjectOverview; today: string }) {
  const pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
  const finished = p.total > 0 && p.done === p.total;
  const late = p.overdue > 0;
  return (
    <Link href={`/projetos/${p.id}`} className="card block p-4 transition hover:border-indigo-300">
      <div className="flex items-start gap-2">
        <span className="mt-1.5 h-3 w-3 shrink-0 rounded-full" style={{ background: p.color }} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold">{p.name}</h3>
          <p className="text-xs text-slate-500">
            {p.delivery ? `Entrega: ${formatDue(p.delivery, today)}` : "Sem data de entrega"}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            finished
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
              : late
                ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300"
                : "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
          }`}
        >
          {finished ? "Concluído" : late ? `${p.overdue} atrasada${p.overdue > 1 ? "s" : ""}` : "Em dia"}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className={`h-full rounded-full ${finished ? "bg-emerald-500" : late ? "bg-red-500" : "bg-indigo-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="w-10 text-right text-sm font-medium">{pct}%</span>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        {p.done} de {p.total} etapas concluídas
      </p>

      {p.next_title && (
        <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/50">
          <span className="text-xs text-slate-500">{p.next_status === "doing" ? "Fazendo agora" : "Próxima etapa"}</span>
          <div className="flex justify-between gap-2">
            <span className="truncate font-medium">{p.next_title}</span>
            {p.next_due && (
              <span className={`shrink-0 text-xs ${p.next_due < today ? "font-medium text-red-600" : "text-slate-500"}`}>
                {formatDue(p.next_due, today)}
              </span>
            )}
          </div>
        </div>
      )}
    </Link>
  );
}

function ProjectBars({ projects, today }: { projects: ProjectOverview[]; today: string }) {
  return (
    <div className="card divide-y divide-slate-200 dark:divide-slate-800">
      {projects.map((p) => {
        const pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
        const finished = p.total > 0 && p.done === p.total;
        const late = p.overdue > 0;
        return (
          <Link
            key={p.id}
            href={`/projetos/${p.id}`}
            className="block px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
          >
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: p.color }} />
                <span className="truncate font-medium">{p.name}</span>
              </span>
              <span className="flex shrink-0 items-baseline gap-2 text-xs text-slate-500">
                {late && <span className="font-medium text-red-600">{p.overdue} atrasada{p.overdue > 1 ? "s" : ""}</span>}
                {p.delivery && !finished && <span className="hidden sm:inline">{formatDue(p.delivery, today)}</span>}
                <span className="w-9 text-right text-sm font-semibold text-slate-700 dark:text-slate-200">{pct}%</span>
              </span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className={`h-full rounded-full ${finished ? "bg-emerald-500" : late ? "bg-red-500" : "bg-indigo-500"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function ProjectGroup({ projects, today, view }: { projects: ProjectOverview[]; today: string; view: HomeView }) {
  if (view === "bars") return <ProjectBars projects={projects} today={today} />;
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {projects.map((p) => <ProjectCard key={p.id} p={p} today={today} />)}
    </div>
  );
}

export default async function InicioPage() {
  const view: HomeView = (await cookies()).get("home_view")?.value === "bars" ? "bars" : "cards";
  const today = await serverToday();
  const [projects, counts] = await Promise.all([getProjectsOverview(today), getTodayCounts(today)]);
  const active = projects.filter((p) => p.total === 0 || p.done < p.total);
  const finished = projects.filter((p) => p.total > 0 && p.done === p.total);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Início</h1>
        <ViewToggle view={view} />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Projetos em andamento" value={active.length} href="/projetos" />
        <Stat label="Para hoje" value={counts.hoje} href="/hoje" />
        <Stat label="Atrasadas" value={counts.atrasadas} href="/hoje" tone={counts.atrasadas ? "text-red-600" : ""} />
        <Stat label="Nos próximos 6 dias" value={counts.semana} href="/semana" />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-500">Em andamento</h2>
        {active.length === 0 ? (
          <p className="text-sm text-slate-400">
            Nenhum projeto em andamento. <Link href="/projetos" className="text-indigo-600 underline">Criar um projeto</Link>
          </p>
        ) : (
          <ProjectGroup projects={active} today={today} view={view} />
        )}
      </section>

      {finished.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-500">Concluídos</h2>
          <ProjectGroup projects={finished} today={today} view={view} />
        </section>
      )}
    </div>
  );
}
