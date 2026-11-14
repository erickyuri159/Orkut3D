import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, LogOut, Search } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { getTheme } from "@/lib/theme";
import { prisma } from "@/lib/prisma";
import { logoutAction } from "@/actions/auth";
import { AppNav } from "@/components/AppNav";
import { Avatar } from "@/components/ui/Avatar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/login");

  const theme = await getTheme();

  const [unreadMessages, unreadPokes, unreadNotifications] = await Promise.all([
    prisma.message.count({ where: { toId: user.id, readAt: null } }),
    prisma.poke.count({ where: { toId: user.id, seenAt: null } }),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);

  const navItems = [
    { href: "/app/feed", label: "Recados", icon: "home" },
    { href: "/app/amigos", label: "Amigos", icon: "users" },
    { href: "/app/cutucadas", label: "Cutucadas", icon: "hand", badge: unreadPokes || undefined },
    {
      href: "/app/mensagens",
      label: "Mensagens",
      icon: "messages",
      badge: unreadMessages || undefined,
    },
    { href: "/app/comunidades", label: "Comunidades", icon: "users" },
    { href: "/app/classificados", label: "Classificados", icon: "shopping" },
    { href: "/app/ranking", label: "Ranking", icon: "trophy" },
    { href: "/app/busca", label: "Busca", icon: "search" },
    { href: "/app/config", label: "Configurações", icon: "settings" },
  ];

  return (
    <div className="min-h-dvh">
      <AppNav items={navItems} username={user.username} theme={theme} />

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-cyan/10 bg-[rgba(4,7,18,0.72)] px-5 py-3 backdrop-blur-2xl lg:px-8">
          <span className="hidden font-mono text-[11px] tracking-[0.2em] text-muted uppercase sm:block">
            {new Date().toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "2-digit",
              month: "long",
            })}
          </span>

          <div className="ml-auto flex items-center gap-2">
            <form action="/app/busca" className="relative hidden sm:block">
              <input
                name="q"
                placeholder="Buscar pessoas…"
                className="field w-52 py-1.5 pl-9 text-sm"
                defaultValue={""}
              />
              <Search size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
            </form>

            <Link
              href="/app/notificacoes"
              aria-label="Notificações"
              className="btn btn-ghost relative px-3"
            >
              <Bell size={16} />
              {unreadNotifications > 0 ? (
                <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-magenta px-1 font-mono text-[10px] font-bold text-white">
                  {unreadNotifications}
                </span>
              ) : null}
            </Link>

            <Link href={`/app/profile/${user.uid}`} className="flex items-center gap-2">
              <Avatar name={user.name} seed={user.avatarSeed} size={32} />
              <span className="hidden text-sm sm:block">{user.name}</span>
            </Link>

            <form action={logoutAction}>
              <button type="submit" className="btn btn-ghost px-3" aria-label="Sair">
                <LogOut size={16} />
              </button>
            </form>
          </div>
        </header>

        <main className="px-5 py-7 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
