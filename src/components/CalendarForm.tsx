"use client";

import { useActionState } from "react";
import { saveCalendar, type CalendarState } from "@/lib/settings-actions";

export function CalendarForm({ connected }: { connected: boolean }) {
  const [state, action, pending] = useActionState<CalendarState, FormData>(saveCalendar, {});
  return (
    <form action={action} className="space-y-2">
      {connected && !state.error && (
        <p className="text-sm font-medium text-emerald-600">✓ Agenda conectada</p>
      )}
      <input
        className="input"
        name="ical_url"
        type="url"
        inputMode="url"
        autoComplete="off"
        placeholder={connected ? "Cole um novo endereço para trocar" : "https://calendar.google.com/calendar/ical/…/basic.ics"}
      />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.ok && <p className="text-sm text-emerald-600">{state.ok}</p>}
      <div className="flex gap-2">
        <button className="btn-primary" disabled={pending}>{pending ? "Testando…" : "Salvar"}</button>
        {connected && (
          <button className="btn-ghost text-red-600" name="disconnect" value="1" disabled={pending}>
            Desconectar
          </button>
        )}
      </div>
    </form>
  );
}
