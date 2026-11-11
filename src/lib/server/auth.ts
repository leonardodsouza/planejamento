import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getDB, newId } from "./db";

export const SESSION_COOKIE = "session";
const SESSION_DAYS = 30;
const PBKDF2_ITERATIONS = 100_000; // máximo suportado pelo Workers

const enc = new TextEncoder();
const toHex = (buf: ArrayBuffer | Uint8Array) =>
  Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
const fromHex = (hex: string): Uint8Array<ArrayBuffer> => new Uint8Array(hex.match(/../g)!.map((h) => parseInt(h, 16)));

async function pbkdf2(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  return new Uint8Array(
    await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256),
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toHex(salt)}$${toHex(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, iter, saltHex, hashHex] = stored.split("$");
  if (algo !== "pbkdf2") return false;
  const hash = await pbkdf2(password, fromHex(saltHex), Number(iter));
  const expected = fromHex(hashHex);
  if (hash.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < hash.length; i++) diff |= hash[i] ^ expected[i];
  return diff === 0;
}

async function sha256(text: string) {
  return toHex(await crypto.subtle.digest("SHA-256", enc.encode(text)));
}

export async function createSession(userId: string) {
  const token = toHex(crypto.getRandomValues(new Uint8Array(32)));
  const expires = Date.now() + SESSION_DAYS * 86_400_000;
  const db = getDB();
  await db.batch([
    db.prepare("DELETE FROM sessions WHERE user_id = ? AND expires_at < ?").bind(userId, Date.now()),
    db
      .prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)")
      .bind(await sha256(token), userId, expires),
  ]);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expires),
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await getDB().prepare("DELETE FROM sessions WHERE id = ?").bind(await sha256(token)).run();
  store.delete(SESSION_COOKIE);
}

export type User = { id: string; email: string };

/** Usuário da sessão atual, ou null. Memorizado por requisição. */
export const getUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = await getDB()
    .prepare(
      "SELECT u.id, u.email, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ?",
    )
    .bind(await sha256(token))
    .first<{ id: string; email: string; expires_at: number }>();
  if (!row || row.expires_at < Date.now()) return null;
  return { id: row.id, email: row.email };
});

export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

/** Cria o usuário; devolve null se o e-mail já existe. */
export async function registerUser(email: string, password: string): Promise<string | null> {
  const id = newId();
  const res = await getDB()
    .prepare("INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?) ON CONFLICT(email) DO NOTHING")
    .bind(id, email, await hashPassword(password))
    .run();
  return res.meta.changes ? id : null;
}

export async function findUserByEmail(email: string) {
  return getDB()
    .prepare("SELECT id, password_hash FROM users WHERE email = ?")
    .bind(email)
    .first<{ id: string; password_hash: string }>();
}
