import { AgendaNotice, EventList } from "@/components/Agenda";
import { QuickAdd } from "@/components/QuickAdd";
import { TaskList } from "@/components/TaskItem";
import { weekdayLabel } from "@/lib/dates";
import { getDoneBetween, getOpenTasksUntil } from "@/lib/queries";
import { requireUser } from "@/lib/server/auth";
import { getAgenda } from "@/lib/server/calendar";
import { serverToday, serverTz } from "@/lib/today";

export default async function HojePage() {
  const [user, today, tz] = await Promise.all([requireUser(), serverToday(), serverTz()]);
  const [open, done, agenda] = await Promise.all([
    getOpenTasksUntil(today),
    getDoneBetween(today, today),
    getAgenda(user.id, today, today, tz),
  ]);
  const overdue = open.filter((t) => t.due_date! < today);
  const dueToday = open.filter((t) => t.due_date === today);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Hoje</h1>
        <p className="text-sm text-slate-500 first-letter:uppercase">{weekdayLabel(today)}</p>
      </div>
      <QuickAdd defaults={{ due_date: today }} />

      {agenda.events.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-sky-700 dark:text-sky-300">Agenda ({agenda.events.length})</h2>
          <EventList events={agenda.events} />
        </section>
      )}
      <AgendaNotice connected={agenda.connected} error={agenda.error} />

      {overdue.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-red-600">Atrasadas ({overdue.length})</h2>
          <TaskList tasks={overdue} />
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-500">Para hoje ({dueToday.length})</h2>
        <TaskList tasks={dueToday} empty="Nenhuma tarefa para hoje. 🎉" />
      </section>

      {done.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-500">Concluídas ({done.length})</h2>
          <TaskList tasks={done} />
        </section>
      )}
    </div>
  );
}
