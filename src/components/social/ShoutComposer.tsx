"use client";

import { useActionState } from "react";
import { createShout } from "@/actions/content";
import { SubmitButton } from "@/components/ui/SubmitButton";

type State = { error?: string; ok?: boolean } | null;

export function ShoutComposer({ compact = false }: { compact?: boolean }) {
  const [state, action] = useActionState<State, FormData>(async (_prev, formData) => {
    const result = await createShout(formData);
    if (result && "ok" in result) return { ok: true };
    return { error: result && "error" in result ? result.error : "Não foi possível postar" };
  }, null);

  return (
    <form action={action} className={compact ? "flex gap-2" : "space-y-3"}>
      <textarea
        name="body"
        className="field min-h-24 resize-y"
        placeholder="O que você está living agora?"
        maxLength={500}
        required
      />
      <div className="flex items-center justify-between gap-3">
        {state?.error ? (
          <p className="text-sm text-magenta">{state.error}</p>
        ) : (
          <p className="font-mono text-[11px] text-muted">até 500 caracteres · seus amigos serão notificados</p>
        )}
        <SubmitButton className="btn btn-primary">Postar recado</SubmitButton>
      </div>
    </form>
  );
}
