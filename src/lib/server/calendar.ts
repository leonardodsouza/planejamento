import "server-only";
import ICAL from "ical.js";
import { addDays } from "@/lib/dates";
import { getDB } from "./db";

export type CalEvent = {
  date: string; // AAAA-MM-DD no fuso do usuário
  start: string | null; // "09:30" (null = dia todo)
  end: string | null;
  title: string;
  location: string | null;
};

// Só buscamos agendas destes serviços (evita usar o servidor para acessar endereços arbitrários).
const ALLOWED_HOSTS = [/^calendar\.google\.com$/, /^outlook\.(office365|live)\.com$/, /^p\d+-caldav\.icloud\.com$/];

export function normalizeIcalUrl(raw: string): string | null {
  const value = raw.trim().replace(/^webcal:\/\//i, "https://");
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || !ALLOWED_HOSTS.some((re) => re.test(url.hostname))) return null;
  return url.toString();
}

export async function getIcalUrl(userId: string): Promise<string | null> {
  const row = await getDB().prepare("SELECT ical_url FROM users WHERE id = ?").bind(userId).first<{ ical_url: string | null }>();
  return row?.ical_url ?? null;
}

const dateFmt = (tz: string) => new Intl.DateTimeFormat("en-CA", { timeZone: tz });
const timeFmt = (tz: string) =>
  new Intl.DateTimeFormat("pt-BR", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false });

/** Eventos entre `from` e `to` (inclusive), no fuso `tz`. Lança erro se a agenda não puder ser lida. */
export async function fetchEvents(icalUrl: string, from: string, to: string, tz: string): Promise<CalEvent[]> {
  const res = await fetch(icalUrl, { cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  if (!text.includes("BEGIN:VCALENDAR")) throw new Error("não é uma agenda iCal");

  const root = new ICAL.Component(ICAL.parse(text));
  for (const vtz of root.getAllSubcomponents("vtimezone")) {
    const zone = new ICAL.Timezone(vtz);
    if (!ICAL.TimezoneService.has(zone.tzid)) ICAL.TimezoneService.register(zone);
  }

  // Separa eventos "mestre" das exceções de eventos recorrentes (RECURRENCE-ID).
  const masters = new Map<string, ICAL.Event>();
  const exceptions: ICAL.Event[] = [];
  for (const v of root.getAllSubcomponents("vevent")) {
    if (String(v.getFirstPropertyValue("status") ?? "").toUpperCase() === "CANCELLED" && !v.hasProperty("recurrence-id")) continue;
    const ev = new ICAL.Event(v);
    if (ev.isRecurrenceException()) exceptions.push(ev);
    else masters.set(ev.uid, ev);
  }
  for (const ex of exceptions) masters.get(ex.uid)?.relateException(ex);

  const dFmt = dateFmt(tz);
  const tFmt = timeFmt(tz);
  // Limite de iteração: um pouco além do fim do período (em UTC, com folga de fuso).
  const stopAt = new Date(`${addDays(to, 2)}T00:00:00Z`).getTime();
  const out: CalEvent[] = [];

  function push(start: ICAL.Time, end: ICAL.Time | null, item: ICAL.Event) {
    if (String(item.component.getFirstPropertyValue("status") ?? "").toUpperCase() === "CANCELLED") return;
    const title = item.summary || "(sem título)";
    const location = item.location || null;
    if (start.isDate) {
      // Dia todo: ocupa de DTSTART até o dia anterior a DTEND.
      const first = start.toString().slice(0, 10);
      const last = end ? addDays(end.toString().slice(0, 10), -1) : first;
      for (let d = first < from ? from : first; d <= last && d <= to; d = addDays(d, 1)) {
        out.push({ date: d, start: null, end: null, title, location });
      }
      return;
    }
    const s = start.toJSDate();
    const date = dFmt.format(s);
    if (date < from || date > to) return;
    const e = end ? end.toJSDate() : null;
    out.push({ date, start: tFmt.format(s), end: e ? tFmt.format(e) : null, title, location });
  }

  for (const ev of masters.values()) {
    if (!ev.isRecurring()) {
      push(ev.startDate, ev.endDate, ev);
      continue;
    }
    const it = ev.iterator();
    for (let i = 0, next = it.next(); next && i < 5000; next = it.next(), i++) {
      if (next.toJSDate().getTime() > stopAt) break;
      const occ = ev.getOccurrenceDetails(next);
      push(occ.startDate, occ.endDate, occ.item);
    }
  }

  out.sort((a, b) => a.date.localeCompare(b.date) || (a.start ?? "").localeCompare(b.start ?? ""));
  return out;
}

export type AgendaResult = { connected: boolean; events: CalEvent[]; error?: string };

/** Agenda do usuário para o período; nunca lança (erros viram aviso na tela). */
export async function getAgenda(userId: string, from: string, to: string, tz: string): Promise<AgendaResult> {
  const url = await getIcalUrl(userId);
  if (!url) return { connected: false, events: [] };
  try {
    return { connected: true, events: await fetchEvents(url, from, to, tz) };
  } catch (e) {
    return { connected: true, events: [], error: e instanceof Error ? e.message : String(e) };
  }
}
