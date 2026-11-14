"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type AuthState } from "@/actions/auth";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function LoginForm() {
  const [state, action] = useActionState<AuthState, FormData>(loginAction, null);

  return (
    <form action={action} className="space-y-4">
      {state?.error ? (
        <p className="rounded-xl border border-magenta/45 bg-magenta/12 px-4 py-2.5 text-sm text-magenta">
          {state.error}
        </p>
      ) : null}

      <div>
        <label className="label" htmlFor="identifier">
          Usuário ou e-mail
        </label>
        <input id="identifier" name="identifier" className="field" autoComplete="username" required />
      </div>

      <div>
        <label className="label" htmlFor="password">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="field"
          autoComplete="current-password"
          required
        />
      </div>

      <SubmitButton className="btn btn-primary w-full py-3">Entrar</SubmitButton>

      <p className="text-center text-xs text-muted">
        Não tem perfil?{" "}
        <Link href="/registrar" className="text-cyan hover:underline">
          Criar agora
        </Link>
      </p>
    </form>
  );
}
