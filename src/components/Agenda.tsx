import Link from "next/link";
import type { CalEvent } from "@/lib/server/calendar";

export function EventList({ events }: { events: CalEvent[] }) {
  if (events.length === 0) return null;
  return (
    <ul className="space-y-1.5">
      {events.map((e, i) => (
        <li
          key={i}
          className="flex items-start gap-3 rounded-lg border-l-4 border-sky-500 bg-sky-50 px-3 py-2 text-sm dark:bg-sky-500/10"
        >
          <span className="w-24 shrink-0 font-medium tabular-nums text-sky-700 dark:text-sky-300">
            {e.start ? `${e.start}${e.end ? `–${e.end}` : ""}` : "Dia todo"}
          </span>
          <span className="min-w-0">
            <span className="block">{e.title}</span>
            {e.location && <span className="block truncate text-xs text-slate-500">{e.location}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function AgendaNotice({ connected, error }: { connected: boolean; error?: string }) {
  if (error) {
    return (
      <p className="text-xs text-amber-600">
        Não consegui ler o Google Agenda agora. <Link href="/config" className="underline">Ver configurações</Link>
      </p>
    );
  }
  if (!connected) {
    return (
      <p className="text-xs text-slate-400">
        📆 <Link href="/config" className="underline">Conecte o Google Agenda</Link> para ver seus compromissos aqui.
      </p>
    );
  }
  return null;
}
