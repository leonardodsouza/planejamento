import { revokeToken } from "@/lib/server/auth";
import { bearer, json, preflight } from "@/lib/server/api";

export const OPTIONS = preflight;

export async function POST(req: Request) {
  const token = bearer(req);
  if (token) await revokeToken(token);
  return json({ ok: true });
}
