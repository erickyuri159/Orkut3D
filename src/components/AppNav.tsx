"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Hand,
  Home,
  Menu,
  MessagesSquare,
  Search,
  Settings,
  ShoppingBag,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { Theme } from "@/lib/theme";

export type NavItem = {
  href: string;
  label: string;
  icon: string;
  badge?: number;
};

const ICONS: Record<string, typeof Home> = {
  home: Home,
  users: Users,
  hand: Hand,
  messages: MessagesSquare,
  search: Search,
  shopping: ShoppingBag,
  trophy: Trophy,
  settings: Settings,
};

export function AppNav({
  items,
  username,
  theme,
}: {
  items: NavItem[];
  username: string;
  theme: Theme;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Abrir menu"
        className="btn btn-ghost fixed top-4 left-4 z-50 lg:hidden"
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 border-r border-cyan/12 bg-[rgba(4,7,18,0.82)] px-4 py-6 backdrop-blur-2xl transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Link href="/app/feed" className="mb-8 flex items-center gap-3 px-2">
          <span className="grid h-9 w-9 place-items-center rounded-full border border-cyan/40 bg-cyan/10 font-display text-[10px] font-bold text-cyan">
            ORB
          </span>
          <span className="font-display text-xs tracking-[0.28em] uppercase">
            ORB<span className="text-cyan">{"//2088"}</span>
          </span>
        </Link>

        <nav className="space-y-1">
          {items.map((item) => {
            const Icon = ICONS[item.icon] ?? Home;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                  active
                    ? "border border-cyan/35 bg-cyan/12 text-cyan shadow-[0_0_22px_-10px_rgba(0,229,255,0.9)]"
                    : "border border-transparent text-muted hover:border-cyan/18 hover:bg-white/5 hover:text-paper"
                }`}
              >
                <Icon size={17} className={active ? "text-cyan" : "text-muted group-hover:text-cyan"} />
                <span className="flex-1">{item.label}</span>
                {item.badge ? (
                  <span className="rounded-full bg-magenta px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="panel mt-8 px-4 py-3">
          <p className="text-[10px] tracking-[0.2em] uppercase text-muted">Conectado como</p>
          <p className="mt-1 font-display text-sm text-cyan-soft">@{username}</p>
        </div>

        <div className="mt-4 px-2">
          <ThemeToggle current={theme} />
        </div>

        <p className="mt-6 px-2 font-mono text-[10px] leading-relaxed text-muted/60">
          ORB{"//"}2088
          <br />
          projeto independente, sem afiliação.
        </p>
      </aside>

      {open ? (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
        />
      ) : null}
    </>
  );
}
