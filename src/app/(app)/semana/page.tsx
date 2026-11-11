import { QuickAdd } from "@/components/QuickAdd";
import { TaskList } from "@/components/TaskItem";
import { addDays, startOfWeek, weekdayLabel } from "@/lib/dates";
import { getDoneBetween, getOpenTasksUntil } from "@/lib/queries";
import { serverToday } from "@/lib/today";

export default async function SemanaPage() {
  const today = await serverToday();
  const monday = startOfWeek(today);
  const sunday = addDays(monday, 6);
  const [open, done] = await Promise.all([getOpenTasksUntil(sunday), getDoneBetween(monday, sunday)]);
  const overdue = open.filter((t) => t.due_date! < today);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i)).filter((d) => d >= today);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Esta semana</h1>
      <QuickAdd defaults={{ due_date: today }} />

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
        return (
          <section key={d}>
            <h2 className="mb-2 text-sm font-semibold text-slate-500 first-letter:uppercase">
              {d === today ? "Hoje · " : ""}
              {weekdayLabel(d)}
            </h2>
            <TaskList tasks={tasks} empty="Livre." />
          </section>
        );
      })}
    </div>
  );
}
