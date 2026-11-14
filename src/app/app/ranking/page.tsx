import Link from "next/link";
import { Crown, Flame, Medal, Trophy } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/auth";
import { hashCode, relativeTime } from "@/lib/format";
import { Panel, EmptyState } from "@/components/ui/Panel";
import { Avatar } from "@/components/ui/Avatar";

export const metadata = { title: "Ranking" };

const PODIUM = ["#ffd75e", "#c9d6e8", "#d08b52"];

export default async function RankingPage() {
  const viewer = await currentUser();

  const [topProfiles, topCommunities, topScrappers] = await Promise.all([
    prisma.user.findMany({
      orderBy: { profileViews: "desc" },
      take: 20,
      select: {
        id: true, name: true, uid: true, username: true, avatarSeed: true,
        profileViews: true, headline: true, createdAt: true,
      },
    }),
    prisma.community.findMany({
      include: { _count: { select: { members: true, posts: true } } },
      orderBy: { members: { _count: "desc" } },
      take: 10,
    }),
    prisma.scrap.groupBy({
      by: ["authorId"],
      _count: { authorId: true },
      orderBy: { _count: { authorId: "desc" } },
      take: 10,
    }),
  ]);

  const scrapperIds = topScrappers.map((entry) => entry.authorId);
  const scrappers = await prisma.user.findMany({
    where: { id: { in: scrapperIds } },
    select: { id: true, name: true, uid: true, avatarSeed: true },
  });
  const scrapCount = new Map(topScrappers.map((entry) => [entry.authorId, entry._count.authorId]));

  const [totalUsers, totalScraps, totalPokes, totalMessages] = await Promise.all([
    prisma.user.count(),
    prisma.scrap.count(),
    prisma.poke.count(),
    prisma.message.count(),
  ]);

  return (
    <div className="space-y-6">
      <div className="panel corner-frame relative overflow-hidden px-6 py-8 text-center">
        <Trophy className="mx-auto text-amber" size={30} />
        <h1 className="mt-3 font-display text-2xl tracking-[0.2em] uppercase">Ranking da rede</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted">
          {totalUsers.toLocaleString("pt-BR")} perfis · {totalScraps.toLocaleString("pt-BR")} scraps ·{" "}
          {totalPokes.toLocaleString("pt-BR")} cutucadas · {totalMessages.toLocaleString("pt-BR")} mensagens
        </p>
      </div>

      <Panel title="Perfis mais visitados" action={<Flame size={14} className="text-muted" />}>
        <ol className="divide-y divide-cyan/8">
          {topProfiles.map((profile, index) => (
            <li key={profile.id} className="flex items-center gap-3 px-5 py-3">
              <span
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg font-display text-xs font-bold"
                style={{
                  background: index < 3 ? `${PODIUM[index]}22` : "rgba(255,255,255,0.04)",
                  color: index < 3 ? PODIUM[index] : "rgba(139,163,199,0.8)",
                  border: index < 3 ? `1px solid ${PODIUM[index]}55` : "1px solid rgba(0,229,255,0.12)",
                }}
              >
                {index + 1}
              </span>
              <Avatar name={profile.name} seed={profile.avatarSeed} size={38} />
              <div className="min-w-0 flex-1">
                <Link href={`/app/profile/${profile.uid}`} className="block truncate text-sm font-semibold hover:text-cyan">
                  {profile.name}
                  {viewer?.uid === profile.uid ? <span className="ml-2 text-[10px] text-cyan">(você)</span> : null}
                </Link>
                <p className="truncate font-mono text-[11px] text-muted">
                  @{profile.username} · {profile.headline || "sem frase"}
                </p>
              </div>
              <span className="font-mono text-xs text-cyan">{profile.profileViews}</span>
            </li>
          ))}
        </ol>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Quem mais deixa scraps" action={<Medal size={14} className="text-muted" />}>
          {scrappers.length === 0 ? (
            <EmptyState title="Ninguém scrapou ainda" />
          ) : (
            <ol className="divide-y divide-cyan/8">
              {scrappers.map((person, index) => (
                <li key={person.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="font-display text-sm text-muted">{index + 1}.</span>
                  <Avatar name={person.name} seed={person.avatarSeed} size={34} />
                  <Link href={`/app/profile/${person.uid}`} className="min-w-0 flex-1 truncate text-sm hover:text-cyan">
                    {person.name}
                  </Link>
                  <span className="font-mono text-xs text-cyan">{scrapCount.get(person.id)}</span>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel title="Comunidades mais ativas" action={<Crown size={14} className="text-muted" />}>
          {topCommunities.length === 0 ? (
            <EmptyState title="Nenhuma comunidade" />
          ) : (
            <ol className="divide-y divide-cyan/8">
              {topCommunities.map((community, index) => (
                <li key={community.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="font-display text-sm text-muted">{index + 1}.</span>
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: community.theme }} />
                  <Link
                    href={`/app/comunidades/${community.slug}`}
                    className="min-w-0 flex-1 truncate text-sm hover:text-cyan"
                  >
                    {community.name}
                  </Link>
                  <span className="font-mono text-[11px] text-muted">
                    {community._count.members}m · {community._count.posts}t ·{" "}
                    {relativeTime(community.createdAt)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      <Panel title="Mais antigos da rede">
        <ol className="grid gap-3 px-5 py-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...topProfiles]
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
            .slice(0, 8)
            .map((profile) => (
              <li key={profile.id} className="flex items-center gap-2">
                <Avatar name={profile.name} seed={profile.avatarSeed} size={30} />
                <div className="min-w-0">
                  <Link href={`/app/profile/${profile.uid}`} className="block truncate text-xs hover:text-cyan">
                    {profile.name}
                  </Link>
                  <p className="font-mono text-[10px] text-muted">
                    {relativeTime(profile.createdAt)} · #{hashCode(profile.uid) % 9999}
                  </p>
                </div>
              </li>
            ))}
        </ol>
      </Panel>
    </div>
  );
}
