import Link from "next/link";
import { Bell } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Panel, EmptyState } from "@/components/ui/Panel";
import { Avatar } from "@/components/ui/Avatar";
import { MarkAllRead } from "@/components/social/MarkAllRead";
import { relativeTime } from "@/lib/format";

export const metadata = { title: "Notificações" };

const TONES: Record<string, string> = {
  poke: "text-cyan",
  friend_request: "text-violet",
  friend_accepted: "text-lime",
  scrap: "text-magenta",
  message: "text-amber",
  shout: "text-cyan",
};

export default async function NotificationsPage() {
  const viewer = await currentUser();
  if (!viewer) return null;

  const notifications = await prisma.notification.findMany({
    where: { userId: viewer.id },
    orderBy: { createdAt: "desc" },
    take: 80,
    include: { actor: { select: { name: true, uid: true, avatarSeed: true } } },
  });

  const unread = notifications.filter((item) => !item.readAt).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Panel title={`Notificações${unread ? ` (${unread} novas)` : ""}`} action={<MarkAllRead />}>
        {notifications.length === 0 ? (
          <EmptyState icon={<Bell size={26} />} title="Nada por aqui" hint="Suas notificações aparecem aqui." />
        ) : (
          <ul className="divide-y divide-cyan/8">
            {notifications.map((notification) => (
              <li key={notification.id} className={notification.readAt ? "opacity-55" : ""}>
                <Link href={notification.href} className="flex items-center gap-3 px-5 py-3 hover:bg-cyan/6">
                  {notification.actor ? (
                    <Avatar
                      name={notification.actor.name}
                      seed={notification.actor.avatarSeed}
                      size={36}
                    />
                  ) : (
                    <span className="grid h-9 w-9 place-items-center rounded-full border border-cyan/25 bg-cyan/10">
                      <Bell size={14} className="text-cyan" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${TONES[notification.type] ?? "text-paper"}`}>{notification.body}</p>
                    <p className="font-mono text-[11px] text-muted">{relativeTime(notification.createdAt)}</p>
                  </div>
                  {!notification.readAt ? (
                    <span className="h-2 w-2 rounded-full bg-cyan" />
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
