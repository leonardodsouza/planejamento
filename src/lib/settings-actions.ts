"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/server/auth";
import { fetchEvents, normalizeIcalUrl } from "@/lib/server/calendar";
import { getDB } from "@/lib/server/db";
import { serverToday, serverTz } from "@/lib/today";

export type CalendarState = { error?: string; ok?: string };

export async function saveCalendar(_: CalendarState, formData: FormData): Promise<CalendarState> {
  const user = await requireUser();
  const raw = String(formData.get("ical_url") ?? "");

  if (formData.get("disconnect") === "1" || !raw.trim()) {
    await getDB().prepare("UPDATE users SET ical_url = NULL WHERE id = ?").bind(user.id).run();
    revalidatePath("/", "layout");
    return { ok: "Agenda desconectada." };
  }

  const url = normalizeIcalUrl(raw);
  if (!url) {
    return { error: "Cole o endereço secreto no formato iCal do Google Agenda (começa com https://calendar.google.com/)." };
  }

  // Testa antes de salvar.
  const today = await serverToday();
  try {
    const events = await fetchEvents(url, today, today, await serverTz());
    await getDB().prepare("UPDATE users SET ical_url = ? WHERE id = ?").bind(url, user.id).run();
    revalidatePath("/", "layout");
    return { ok: `Agenda conectada! ${events.length} compromisso(s) hoje.` };
  } catch {
    return { error: "Não consegui ler essa agenda. Confira se copiou o endereço secreto completo." };
  }
}
