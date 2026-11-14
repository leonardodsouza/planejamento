import { revalidatePath } from "next/cache";
import { apiError, apiUser, json, preflight, readJson } from "@/lib/server/api";
import { getDB } from "@/lib/server/db";
import { insertTask, isISODate } from "@/lib/server/tasks";
import type { Priority } from "@/lib/types";

export const OPTIONS = preflight;

/**
 * Tarefas de hoje: abertas com prazo até hoje (inclui atrasadas) e as
 * concluídas hoje. O dia vem da extensão (?today=AAAA-MM-DD), no fuso do usuário.
 */
export async function GET(req: Request) {
  const user = await apiUser(req);
  if (user instanceof Response) return user;
  const today = new URL(req.url).searchParams.get("today");
  if (!isISODate(today)) return apiError("Parâmetro today inválido.", 400);
  const { results } = await getDB()
    .prepare(
      `SELECT t.id, t.title, t.due_date, t.priority, t.status, p.name AS project_name, p.color AS project_color
       FROM tasks t LEFT JOIN projects p ON p.id = t.project_id
       WHERE t.user_id = ? AND t.due_date IS NOT NULL AND (
         (t.status != 'done' AND t.due_date <= ?) OR (t.status = 'done' AND t.due_date = ?))
       ORDER BY t.status = 'done', t.due_date, t.priority DESC, t.created_at
       LIMIT 100`,
    )
    .bind(user.id, today, today)
    .all();
  return json({ tasks: results });
}

/** Cria uma tarefa (ex.: a partir da página aberta no Safari). */
export async function POST(req: Request) {
  const user = await apiUser(req);
  if (user instanceof Response) return user;
  const body = await readJson(req);
  try {
    const id = await insertTask(user.id, {
      title: String(body.title ?? ""),
      description: body.description == null ? null : String(body.description),
      due_date: body.due_date == null ? null : String(body.due_date),
      priority: (Number(body.priority) || 2) as Priority,
      project_id: body.project_id ? String(body.project_id) : null,
    });
    if (!id) return apiError("Informe um título.", 400);
    revalidatePath("/", "layout");
    return json({ id }, 201);
  } catch {
    return apiError("Projeto não encontrado.", 400);
  }
}
