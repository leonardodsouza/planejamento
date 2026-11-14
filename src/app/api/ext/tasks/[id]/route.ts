import { revalidatePath } from "next/cache";
import { apiError, apiUser, json, preflight, readJson } from "@/lib/server/api";
import { getDB } from "@/lib/server/db";
import { cleanTask } from "@/lib/server/tasks";
import type { Status } from "@/lib/types";

export const OPTIONS = preflight;

/** Marca/desmarca a tarefa como concluída. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser(req);
  if (user instanceof Response) return user;
  const { id } = await params;
  const body = await readJson(req);
  if (body.status !== "done" && body.status !== "todo") return apiError("Status inválido.", 400);
  const data = cleanTask({ status: body.status as Status });
  const res = await getDB()
    .prepare("UPDATE tasks SET status = ?, completed_at = ? WHERE id = ? AND user_id = ?")
    .bind(data.status, data.completed_at, id, user.id)
    .run();
  if (!res.meta.changes) return apiError("Tarefa não encontrada.", 404);
  revalidatePath("/", "layout");
  return json({ ok: true });
}
