import "server-only";
import { userFromToken, type User } from "./auth";

// Ajudantes da API usada pela extensão do Safari (/api/ext/*).
// A autenticação é por token no cabeçalho Authorization (sem cookie), então
// liberar qualquer origem no CORS não expõe a sessão do site.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Max-Age": "86400",
};

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { ...CORS, "Cache-Control": "no-store" } });
}

export const apiError = (message: string, status: number) => json({ error: message }, status);

/** Resposta ao "preflight" do navegador. */
export const preflight = () => new Response(null, { status: 204, headers: CORS });

export function bearer(req: Request): string | null {
  const m = req.headers.get("authorization")?.match(/^Bearer\s+([0-9a-f]{64})$/i);
  return m ? m[1].toLowerCase() : null;
}

/** Usuário do token, ou uma resposta 401 pronta para devolver. */
export async function apiUser(req: Request): Promise<User | Response> {
  const token = bearer(req);
  const user = token ? await userFromToken(token) : null;
  return user ?? apiError("Faça login de novo.", 401);
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
