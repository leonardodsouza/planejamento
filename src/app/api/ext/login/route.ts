import { createApiToken, findUserByEmail, hashPassword, verifyPassword } from "@/lib/server/auth";
import { apiError, json, preflight, readJson } from "@/lib/server/api";

export const OPTIONS = preflight;

/** Entra com e-mail e senha e devolve um token para a extensão. */
export async function POST(req: Request) {
  const body = await readJson(req);
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const user = email ? await findUserByEmail(email) : null;
  if (!user) {
    await hashPassword(password); // mesmo custo, para não revelar se o e-mail existe
    return apiError("E-mail ou senha incorretos.", 401);
  }
  if (!(await verifyPassword(password, user.password_hash))) {
    return apiError("E-mail ou senha incorretos.", 401);
  }
  return json({ token: await createApiToken(user.id), email });
}
