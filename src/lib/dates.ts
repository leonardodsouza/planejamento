// Datas no formato AAAA-MM-DD. O fuso vem do cookie "tz" (definido pelo
// navegador); sem ele, usamos o horário de Brasília.
export const DEFAULT_TZ = "America/Sao_Paulo";

export function todayISO(tz: string = DEFAULT_TZ): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());
  } catch {
    return new Intl.DateTimeFormat("en-CA", { timeZone: DEFAULT_TZ }).format(new Date());
  }
}

function parse(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function addDays(iso: string, days: number): string {
  const dt = parse(iso);
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

/** Segunda-feira da semana de `iso`. */
export function startOfWeek(iso: string): string {
  const dow = parse(iso).getUTCDay(); // 0 = domingo
  return addDays(iso, dow === 0 ? -6 : 1 - dow);
}

export function formatDue(iso: string | null, today: string): string {
  if (!iso) return "";
  if (iso === today) return "Hoje";
  if (iso === addDays(today, 1)) return "Amanhã";
  if (iso === addDays(today, -1)) return "Ontem";
  return parse(iso).toLocaleDateString("pt-BR", {
    timeZone: "UTC",
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

export function weekdayLabel(iso: string): string {
  return parse(iso).toLocaleDateString("pt-BR", {
    timeZone: "UTC",
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}
