import { apiUser, json, preflight } from "@/lib/server/api";
import { getDB } from "@/lib/server/db";

export const OPTIONS = preflight;

/** Conta logada e projetos (para o seletor de projeto da extensão). */
export async function GET(req: Request) {
  const user = await apiUser(req);
  if (user instanceof Response) return user;
  const { results: projects } = await getDB()
    .prepare("SELECT id, name, color FROM projects WHERE user_id = ? ORDER BY created_at")
    .bind(user.id)
    .all<{ id: string; name: string; color: string }>();
  return json({ email: user.email, projects });
}
