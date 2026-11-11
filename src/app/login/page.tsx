"use client";

import { useActionState, useState } from "react";
import { signIn, signUp, type AuthState } from "./actions";

export default function LoginPage() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [inState, inAction, inPending] = useActionState<AuthState, FormData>(signIn, {});
  const [upState, upAction, upPending] = useActionState<AuthState, FormData>(signUp, {});
  const state = mode === "in" ? inState : upState;
  const pending = inPending || upPending;

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div className="card w-full max-w-sm p-6">
        <h1 className="text-2xl font-semibold">Planejamento</h1>
        <p className="mt-1 text-sm text-slate-500">
          {mode === "in" ? "Entre na sua conta" : "Crie sua conta"}
        </p>

        <form action={mode === "in" ? inAction : upAction} className="mt-6 space-y-3">
          <label className="block text-sm">
            E-mail
            <input className="input mt-1" type="email" name="email" required autoComplete="email" />
          </label>
          <label className="block text-sm">
            Senha
            <input
              className="input mt-1"
              type="password"
              name="password"
              required
              minLength={mode === "up" ? 8 : undefined}
              autoComplete={mode === "in" ? "current-password" : "new-password"}
            />
          </label>

          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
          <button className="btn-primary w-full" disabled={pending}>
            {pending ? "Aguarde…" : mode === "in" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <button
          type="button"
          className="mt-4 w-full text-center text-sm text-indigo-600 hover:underline"
          onClick={() => setMode(mode === "in" ? "up" : "in")}
        >
          {mode === "in" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
        </button>
      </div>
    </main>
  );
}
