import { QuickAdd } from "@/components/QuickAdd";
import { TaskList } from "@/components/TaskItem";
import { getInboxTasks } from "@/lib/queries";

export default async function EntradaPage() {
  const tasks = await getInboxTasks();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Sem data</h1>
        <p className="text-sm text-slate-500">Tarefas abertas que ainda não têm prazo.</p>
      </div>
      <QuickAdd />
      <TaskList tasks={tasks} empty="Tudo com prazo definido." />
    </div>
  );
}
