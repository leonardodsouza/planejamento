import { addDays } from "./dates";

// Feriados nacionais do Brasil (inclui Carnaval e Corpus Christi, que costumam ser dias sem expediente).

function easter(year: number): string {
  // Algoritmo de Meeus/Jones/Butcher
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const cache = new Map<number, Set<string>>();

export function holidays(year: number): Set<string> {
  let set = cache.get(year);
  if (set) return set;
  const fixed = ["01-01", "04-21", "05-01", "09-07", "10-12", "11-02", "11-15", "11-20", "12-25"];
  const e = easter(year);
  set = new Set([
    ...fixed.map((md) => `${year}-${md}`),
    addDays(e, -48), // Carnaval (segunda)
    addDays(e, -47), // Carnaval (terça)
    addDays(e, -2), // Sexta-feira Santa
    addDays(e, 60), // Corpus Christi
  ]);
  cache.set(year, set);
  return set;
}

export function isWorkday(iso: string): boolean {
  const dow = new Date(`${iso}T00:00:00Z`).getUTCDay();
  if (dow === 0 || dow === 6) return false;
  return !holidays(Number(iso.slice(0, 4))).has(iso);
}

export function prevWorkday(iso: string): string {
  let d = iso;
  while (!isWorkday(d)) d = addDays(d, -1);
  return d;
}

export function nextWorkday(iso: string): string {
  let d = iso;
  while (!isWorkday(d)) d = addDays(d, 1);
  return d;
}

/**
 * Prazo de uma etapa de modelo. `daysBefore` > 0 = antes da entrega, < 0 = depois, 0 = no dia.
 * Com `skip`, etapas que cairiam em fim de semana/feriado vão para o dia útil anterior
 * (antes da entrega) ou seguinte (depois). O dia da entrega em si não muda.
 */
export function stepDueDate(target: string, daysBefore: number, today: string, skip: boolean): string {
  let due = addDays(target, -daysBefore);
  const move = skip && daysBefore !== 0;
  if (move) due = daysBefore > 0 ? prevWorkday(due) : nextWorkday(due);
  if (due < today) {
    due = today; // nada de prazo no passado
    if (move) due = nextWorkday(due);
  }
  return due;
}
