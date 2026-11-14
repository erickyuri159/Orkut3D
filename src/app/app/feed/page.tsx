import { Ghost, Radio } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Panel, EmptyState, Stat } from "@/components/ui/Panel";
import { ShoutComposer } from "@/components/social/ShoutComposer";
import { ShoutCard } from "@/components/social/ShoutCard";

export const metadata = { title: "Recados" };

export default async function FeedPage() {
  const user = await currentUser();
  if (!user) return null;

  const [shouts, friendCount, communityCount, unreadPokes] = await Promise.all([
    prisma.shout.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        author: { select: { name: true, username: true, uid: true, avatarSeed: true } },
        likes: { where: { userId: user.id }, select: { id: true } },
        _count: { select: { likes: true } },
      },
    }),
    prisma.friendship.count({
      where: { status: "ACCEPTED", OR: [{ requesterId: user.id }, { addresseeId: user.id }] },
    }),
    prisma.communityMember.count({ where: { userId: user.id } }),
    prisma.poke.count({ where: { toId: user.id, seenAt: null } }),
  ]);

  const sidebar = await prisma.user.findMany({
    where: { id: { not: user.id } },
    orderBy: { profileViews: "desc" },
    take: 5,
    select: { id: true, name: true, username: true, uid: true, avatarSeed: true, headline: true },
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <Panel title="Novo recado">
          <div className="px-5 py-4">
            <ShoutComposer />
          </div>
        </Panel>

        {shouts.length === 0 ? (
          <Panel>
            <EmptyState
              icon={<Radio size={28} />}
              title="Silêncio no rádio"
              hint="Nenhum recado ainda. Seja a primeira pessoa a transmitir."
            />
          </Panel>
        ) : (
          <div className="space-y-4">
            {shouts.map((shout) => (
              <ShoutCard
                key={shout.id}
                shout={{
                  id: shout.id,
                  body: shout.body,
                  createdAt: shout.createdAt,
                  author: shout.author,
                  _count: shout._count,
                }}
                isOwner={shout.author.uid === user.uid}
                likedByViewer={shout.likes.length > 0}
              />
            ))}
          </div>
        )}
      </div>

      <aside className="space-y-5">
        <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
          <Stat label="Amigos" value={friendCount} />
          <Stat label="Comunidades" value={communityCount} />
          <Stat label="Cutucadas novas" value={unreadPokes} />
        </div>

        <Panel title="Perfil em alta" action={<Ghost size={14} className="text-muted" />}>
          <ul className="divide-y divide-cyan/8">
            {sidebar.map((person) => (
              <li key={person.id} className="flex items-center gap-3 px-5 py-3">
                <span className="grid h-7 w-7 place-items-center rounded-lg border border-cyan/20 font-mono text-[11px] text-cyan">
                  {person.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <a
                    href={`/app/profile/${person.uid}`}
                    className="block truncate text-sm hover:text-cyan"
                  >
                    {person.name}
                  </a>
                  <p className="truncate font-mono text-[11px] text-muted">
                    @{person.username}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </aside>
    </div>
  );
}
