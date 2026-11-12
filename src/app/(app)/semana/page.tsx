import { AgendaNotice, EventList } from "@/components/Agenda";
import { QuickAdd } from "@/components/QuickAdd";
import { TaskList } from "@/components/TaskItem";
import { addDays, startOfWeek, weekdayLabel } from "@/lib/dates";
import { getDoneBetween, getOpenTasksUntil } from "@/lib/queries";
import { requireUser } from "@/lib/server/auth";
import { getAgenda } from "@/lib/server/calendar";
import { serverToday, serverTz } from "@/lib/today";

export default async function SemanaPage() {
  const [user, today, tz] = await Promise.all([requireUser(), serverToday(), serverTz()]);
  const monday = startOfWeek(today);
  const sunday = addDays(monday, 6);
  const [open, done, agenda] = await Promise.all([
    getOpenTasksUntil(sunday),
    getDoneBetween(monday, sunday),
    getAgenda(user.id, today, sunday, tz),
  ]);
  const overdue = open.filter((t) => t.due_date! < today);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i)).filter((d) => d >= today);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Esta semana</h1>
      <QuickAdd defaults={{ due_date: today }} />
      <AgendaNotice connected={agenda.connected} error={agenda.error} />

      {overdue.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-red-600">Atrasadas ({overdue.length})</h2>
          <TaskList tasks={overdue} />
        </section>
      )}

      {days.map((d) => {
        const tasks = [
          ...open.filter((t) => t.due_date === d),
          ...done.filter((t) => t.due_date === d),
        ];
        const events = agenda.events.filter((e) => e.date === d);
        return (
          <section key={d} className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-500 first-letter:uppercase">
              {d === today ? "Hoje · " : ""}
              {weekdayLabel(d)}
            </h2>
            <EventList events={events} />
            <TaskList tasks={tasks} empty={events.length ? "Nenhuma tarefa." : "Livre."} />
          </section>
        );
      })}
    </div>
  );
}
