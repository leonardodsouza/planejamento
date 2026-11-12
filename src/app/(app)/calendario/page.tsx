import { AgendaNotice } from "@/components/Agenda";
import { MonthCalendar } from "@/components/MonthCalendar";
import { addDays, startOfWeek } from "@/lib/dates";
import { getProjects, getTasksBetween } from "@/lib/queries";
import { requireUser } from "@/lib/server/auth";
import { getAgenda } from "@/lib/server/calendar";
import { serverToday, serverTz } from "@/lib/today";

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

export default async function CalendarioPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const [user, today, tz, { m }] = await Promise.all([requireUser(), serverToday(), serverTz(), searchParams]);
  const month = m && MONTH_RE.test(m) ? m : today.slice(0, 7);
  // Grade de 6 semanas, de segunda a domingo.
  const gridStart = startOfWeek(`${month}-01`);
  const gridEnd = addDays(gridStart, 41);
  const [tasks, projects, agenda] = await Promise.all([
    getTasksBetween(gridStart, gridEnd),
    getProjects(),
    getAgenda(user.id, gridStart, gridEnd, tz),
  ]);
  const deliveries = projects.filter((p) => p.due_date && p.due_date >= gridStart && p.due_date <= gridEnd);

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <MonthCalendar
        month={month}
        prev={shiftMonth(month, -1)}
        next={shiftMonth(month, 1)}
        gridStart={gridStart}
        today={today}
        tasks={tasks}
        deliveries={deliveries}
        events={agenda.events}
      />
      <AgendaNotice connected={agenda.connected} error={agenda.error} />
    </div>
  );
}
