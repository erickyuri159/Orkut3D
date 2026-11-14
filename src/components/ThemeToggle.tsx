"use client";

import { useFormStatus } from "react-dom";
import { setTheme } from "@/actions/theme";
import type { Theme } from "@/lib/theme";

const OPTIONS: { value: Theme; label: string; title: string }[] = [
  { value: "holo", label: "2088", title: "Tema 3D (padrao)" },
  { value: "noite", label: "noite", title: "Modo escuro, sem WebGL — leve e silencioso" },
  { value: "klass", label: "2004", title: "Modo Tabelas 2004" },
];

function Choice({ value, label, title, active }: { value: Theme; label: string; title: string; active: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      name="theme"
      value={value}
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={pending}
      className={`btn px-3 py-1.5 text-[11px] ${active ? "btn-primary" : "btn-ghost"}`}
    >
      {label}
    </button>
  );
}

/** Troca de tema via Server Action: o cookie garante render correto já no SSR. */
export function ThemeToggle({ current }: { current: Theme }) {
  return (
    <form action={setTheme} className="flex items-center gap-1.5">
      {OPTIONS.map((option) => (
        <Choice key={option.value} {...option} active={current === option.value} />
      ))}
      <span className="sr-only">Tema atual: {current}</span>
    </form>
  );
}
