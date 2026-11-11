import { QuickAdd } from "@/components/QuickAdd";
import { TaskList } from "@/components/TaskItem";
import { weekdayLabel } from "@/lib/dates";
import { getDoneBetween, getOpenTasksUntil } from "@/lib/queries";
import { serverToday } from "@/lib/today";

export default async function HojePage() {
  const today = await serverToday();
  const [open, done] = await Promise.all([getOpenTasksUntil(today), getDoneBetween(today, today)]);
  const overdue = open.filter((t) => t.due_date! < today);
  const dueToday = open.filter((t) => t.due_date === today);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Hoje</h1>
        <p className="text-sm text-slate-500 first-letter:uppercase">{weekdayLabel(today)}</p>
      </div>
      <QuickAdd defaults={{ due_date: today }} />

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
