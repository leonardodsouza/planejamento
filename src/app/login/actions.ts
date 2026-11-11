"use server";

import { redirect } from "next/navigation";
import {
  createSession,
  destroySession,
  findUserByEmail,
  hashPassword,
  registerUser,
  verifyPassword,
} from "@/lib/server/auth";

export type AuthState = { error?: string };

function credentials(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signIn(_: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password } = credentials(formData);
  const user = await findUserByEmail(email);
  if (!user) {
    await hashPassword(password); // mesmo custo, para não revelar se o e-mail existe
    return { error: "E-mail ou senha incorretos." };
  }
  if (!(await verifyPassword(password, user.password_hash))) {
    return { error: "E-mail ou senha incorretos." };
  }
  await createSession(user.id);
  redirect("/hoje");
}

export async function signUp(_: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password } = credentials(formData);
  if (!EMAIL_RE.test(email)) return { error: "Informe um e-mail válido." };
  if (password.length < 8) return { error: "A senha precisa ter pelo menos 8 caracteres." };
  const id = await registerUser(email, password);
  if (!id) return { error: "Já existe uma conta com este e-mail." };
  await createSession(id);
  redirect("/hoje");
}

export async function signOut() {
  await destroySession();
  redirect("/login");
}
