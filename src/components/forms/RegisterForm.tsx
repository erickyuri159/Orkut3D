"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction, type AuthState } from "@/actions/auth";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function RegisterForm() {
  const [state, action] = useActionState<AuthState, FormData>(registerAction, null);

  return (
    <form action={action} className="space-y-4">
      {state?.error ? (
        <p className="rounded-xl border border-magenta/45 bg-magenta/12 px-4 py-2.5 text-sm text-magenta">
          {state.error}
        </p>
      ) : null}

      <div>
        <label className="label" htmlFor="name">
          Nome
        </label>
        <input id="name" name="name" className="field" placeholder="Como você quer ser chamado" required />
      </div>

      <div>
        <label className="label" htmlFor="username">
          Username
        </label>
        <input
          id="username"
          name="username"
          className="field"
          placeholder="sem_espacos"
          autoComplete="username"
          pattern="[a-z0-9_.]+"
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="email">
          E-mail
        </label>
        <input id="email" name="email" type="email" className="field" autoComplete="email" required />
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
          autoComplete="new-password"
          minLength={6}
          required
        />
      </div>

      <SubmitButton className="btn btn-primary w-full py-3">Criar meu perfil</SubmitButton>

      <p className="text-center text-xs text-muted">
        Já tem conta?{" "}
        <Link href="/login" className="text-cyan hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
