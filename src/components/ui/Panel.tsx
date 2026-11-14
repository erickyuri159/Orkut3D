import type { ReactNode } from "react";

export function Panel({
  title,
  action,
  children,
  className = "",
  solid = false,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  solid?: boolean;
}) {
  return (
    <section className={`panel ${solid ? "panel-solid" : ""} corner-frame ${className}`}>
      {title ? (
        <header className="flex items-center justify-between gap-3 border-b border-cyan/10 px-5 py-3">
          <h2 className="panel-title">{title}</h2>
          {action}
        </header>
      ) : null}
      <div className="relative">{children}</div>
    </section>
  );
}

export function EmptyState({
  icon,
  title,
  hint,
}: {
  icon?: ReactNode;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      {icon ? <div className="mb-1 opacity-70">{icon}</div> : null}
      <p className="font-display text-sm tracking-[0.18em] uppercase text-cyan-soft/80">{title}</p>
      {hint ? <p className="max-w-sm text-sm text-muted">{hint}</p> : null}
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="panel px-4 py-3 text-center">
      <p className="font-display text-2xl leading-none text-cyan">{value}</p>
      <p className="mt-1 text-[10px] tracking-[0.2em] uppercase text-muted">{label}</p>
    </div>
  );
}

export function Chip({ children, tone = "cyan" }: { children: ReactNode; tone?: "cyan" | "violet" | "magenta" | "lime" | "amber" }) {
  const tones: Record<string, string> = {
    cyan: "border-cyan/35 bg-cyan/10 text-cyan-soft",
    violet: "border-violet/40 bg-violet/12 text-violet",
    magenta: "border-magenta/40 bg-magenta/12 text-magenta",
    lime: "border-lime/40 bg-lime/10 text-lime",
    amber: "border-amber/40 bg-amber/10 text-amber",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] tracking-wide ${tones[tone]}`}>
      {children}
    </span>
  );
}
