"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Flag, Plus, X } from "lucide-react";
import { addDays, weekdayLabel } from "@/lib/dates";
import type { CalEvent } from "@/lib/server/calendar";
import type { Project, Task } from "@/lib/types";
import { EventList } from "./Agenda";
import { useApp } from "./AppContext";
import { NewProjectForm } from "./NewProjectForm";
import { TaskDialog } from "./TaskDialog";
import { TaskList } from "./TaskItem";

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const MAX_ITEMS = 3; // itens visíveis por dia no computador

type Props = {
  month: string; // AAAA-MM
  prev: string;
  next: string;
  gridStart: string;
  today: string;
  tasks: Task[];
  deliveries: Project[];
  events: CalEvent[];
};

function monthTitle(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("pt-BR", { timeZone: "UTC", month: "long", year: "numeric" });
}

export function MonthCalendar({ month, prev, next, gridStart, today, tasks, deliveries, events }: Props) {
  const { projects } = useApp();
  const colorOf = (id: string | null) => projects.find((p) => p.id === id)?.color ?? "#94a3b8";
  const [selected, setSelected] = useState<string | null>(today.startsWith(month) ? today : null);
  const [creating, setCreating] = useState<string | null>(null);
  const [openTask, setOpenTask] = useState<Task | null>(null);

  // Ao trocar de mês, limpa a seleção (ou volta para hoje se for o mês atual).
  useEffect(() => setSelected(today.startsWith(month) ? today : null), [month, today]);

  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const tasksOn = (d: string) => tasks.filter((t) => t.due_date === d);
  const deliveriesOn = (d: string) => deliveries.filter((p) => p.due_date === d);
  const eventsOn = (d: string) => events.filter((e) => e.date === d);

  function clickDay(d: string) {
    // Dia sem tarefas nem entregas: já abre o "novo projeto" com essa data de entrega.
    if (tasksOn(d).length === 0 && deliveriesOn(d).length === 0) setCreating(d);
    setSelected(d);
  }

  const sel = selected;

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold first-letter:uppercase">{monthTitle(month)}</h1>
        <div className="flex items-center gap-1">
          {!today.startsWith(month) && (
            <Link href="/calendario" className="btn-ghost">Hoje</Link>
          )}
          <Link href={`/calendario?m=${prev}`} className="btn-ghost px-2" aria-label="Mês anterior">
            <ChevronLeft size={20} strokeWidth={1.75} />
          </Link>
          <Link href={`/calendario?m=${next}`} className="btn-ghost px-2" aria-label="Próximo mês">
            <ChevronRight size={20} strokeWidth={1.75} />
          </Link>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="grid grid-cols-7 border-b border-slate-200 text-center text-xs font-medium text-slate-500 dark:border-slate-800">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-2">{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d, i) => {
            const inMonth = d.startsWith(month);
            const dayTasks = tasksOn(d);
            const dayDeliveries = deliveriesOn(d);
            const dayEvents = eventsOn(d);
            const items = dayDeliveries.length + dayEvents.length + dayTasks.length;
            const hidden = Math.max(0, items - MAX_ITEMS);
            let shown = 0;
            const take = () => shown++ < MAX_ITEMS;
            const weekend = i % 7 >= 5;
            return (
              <div
                key={d}
                role="button"
                tabIndex={0}
                onClick={() => clickDay(d)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), clickDay(d))}
                aria-label={weekdayLabel(d)}
                className={`group relative flex min-h-14 cursor-pointer flex-col gap-1 border-b border-r border-slate-100 p-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 md:min-h-28 md:p-1.5 dark:border-slate-800 ${
                  i % 7 === 6 ? "border-r-0" : ""
                } ${inMonth ? (weekend ? "bg-slate-50/60 dark:bg-slate-800/20" : "") : "bg-slate-50 text-slate-400 dark:bg-slate-900/60"} ${
                  sel === d ? "ring-2 ring-inset ring-indigo-500" : "hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs tabular-nums md:text-sm ${
                      d === today ? "bg-indigo-600 font-semibold text-white" : ""
                    }`}
                  >
                    {Number(d.slice(8))}
                  </span>
                  <Plus
                    size={14}
                    strokeWidth={2}
                    className="hidden text-slate-400 opacity-0 transition group-hover:opacity-100 md:block"
                    aria-hidden
                  />
                </div>

                {/* Celular: só marcadores */}
                <div className="flex flex-wrap items-center gap-0.5 md:hidden">
                  {dayDeliveries.map((p) => (
                    <Flag key={p.id} size={12} strokeWidth={2.25} style={{ color: p.color }} fill={p.color} />
                  ))}
                  {dayEvents.length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />}
                  {dayTasks.slice(0, 4).map((t) => (
                    <span
                      key={t.id}
                      className={`h-1.5 w-1.5 rounded-full ${t.status === "done" ? "opacity-30" : ""}`}
                      style={{ background: colorOf(t.project_id) }}
                    />
                  ))}
                </div>

                {/* Computador: itens com nome */}
                <div className="hidden min-w-0 flex-col gap-0.5 md:flex">
                  {dayDeliveries.filter(take).map((p) => (
                    <Link
                      key={p.id}
                      href={`/projetos/${p.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 truncate rounded px-1.5 py-0.5 text-xs font-semibold text-white shadow-sm"
                      style={{ background: p.color }}
                      title={`Entrega: ${p.name}`}
                    >
                      <Flag size={12} strokeWidth={2.25} className="shrink-0" />
                      <span className="truncate">{p.name}</span>
                    </Link>
                  ))}
                  {dayEvents.filter(take).map((e, j) => (
                    <span key={j} className="truncate rounded bg-sky-50 px-1.5 py-0.5 text-xs text-sky-700 dark:bg-sky-500/10 dark:text-sky-300" title={e.title}>
                      {e.start && <span className="tabular-nums">{e.start} </span>}
                      {e.title}
                    </span>
                  ))}
                  {dayTasks.filter(take).map((t) => (
                    <button
                      key={t.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenTask(t);
                      }}
                      className={`flex items-center gap-1 truncate rounded px-1 py-0.5 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800 ${
                        t.status === "done" ? "text-slate-400 line-through" : ""
                      }`}
                      title={t.title}
                    >
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: colorOf(t.project_id) }} />
                      <span className="truncate">{t.title}</span>
                    </button>
                  ))}
                  {hidden > 0 && <span className="px-1 text-xs text-slate-500">+{hidden} mais</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {sel && (
        <DayPanel
          day={sel}
          tasks={tasksOn(sel)}
          deliveries={deliveriesOn(sel)}
          events={eventsOn(sel)}
          onCreate={() => setCreating(sel)}
        />
      )}

      <CreateDialog day={creating} onClose={() => setCreating(null)} />
      {openTask && <TaskDialog open onClose={() => setOpenTask(null)} task={openTask} />}
    </>
  );
}

function DayPanel({
  day,
  tasks,
  deliveries,
  events,
  onCreate,
}: {
  day: string;
  tasks: Task[];
  deliveries: Project[];
  events: CalEvent[];
  onCreate: () => void;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-500 first-letter:uppercase">{weekdayLabel(day)}</h2>
        <button className="btn-ghost text-sm" onClick={onCreate}>
          <Plus size={16} strokeWidth={1.75} /> Novo projeto
        </button>
      </div>
      {deliveries.map((p) => (
        <Link
          key={p.id}
          href={`/projetos/${p.id}`}
          className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-white shadow-sm"
          style={{ background: p.color }}
        >
          <Flag size={16} strokeWidth={2} className="shrink-0" />
          <span className="truncate">Entrega: {p.name}</span>
        </Link>
      ))}
      <EventList events={events} />
      <TaskList tasks={tasks} empty={deliveries.length || events.length ? "Nenhuma tarefa." : "Livre."} />
    </section>
  );
}

function CreateDialog({ day, onClose }: { day: string | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (day && !d.open) d.showModal();
    if (!day && d.open) d.close();
  }, [day]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-xl bg-white p-0 text-slate-900 shadow-xl backdrop:bg-black/40 dark:bg-slate-900 dark:text-slate-100"
    >
      {day && (
        <div className="space-y-3 p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">Novo projeto</h2>
              <p className="text-sm text-slate-500 first-letter:uppercase">Entrega em {weekdayLabel(day)}</p>
            </div>
            <button className="btn-ghost -m-2 p-2" onClick={onClose} aria-label="Fechar">
              <X size={18} strokeWidth={1.75} />
            </button>
          </div>
          <NewProjectForm key={day} dueDate={day} onDone={onClose} />
        </div>
      )}
    </dialog>
  );
}
