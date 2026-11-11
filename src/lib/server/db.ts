import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export function getDB(): D1Database {
  return getCloudflareContext().env.DB;
}

export function newId(): string {
  return crypto.randomUUID();
}
