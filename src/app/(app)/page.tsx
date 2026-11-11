import Link from "next/link";
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

export default async function InicioPage() {
  const today = await serverToday();
  const [projects, counts] = await Promise.all([getProjectsOverview(today), getTodayCounts(today)]);
  const active = projects.filter((p) => p.total === 0 || p.done < p.total);
  const finished = projects.filter((p) => p.total > 0 && p.done === p.total);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <h1 className="text-2xl font-semibold">Início</h1>

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
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {active.map((p) => <ProjectCard key={p.id} p={p} today={today} />)}
          </div>
        )}
      </section>

      {finished.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-500">Concluídos</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {finished.map((p) => <ProjectCard key={p.id} p={p} today={today} />)}
          </div>
        </section>
      )}
    </div>
  );
}
