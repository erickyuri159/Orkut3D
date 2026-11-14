import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Eye,
  Ghost,
  History,
  MapPin,
  Quote,
  Sparkles,
  Users,
} from "lucide-react";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileVistaForTheme } from "@/components/ProfileVista";
import { recordProfileVisit } from "@/lib/visits";
import { resolveFriendState, scrapVisibilityWhere } from "@/lib/rules";
import { getTheme } from "@/lib/theme";
import { Panel, Stat, Chip } from "@/components/ui/Panel";
import { Avatar } from "@/components/ui/Avatar";
import { ProfileActions } from "@/components/social/ProfileActions";
import { ScrapForm, ScrapItem } from "@/components/social/Scrap";
import { AvatarOrbView } from "@/components/three/AvatarOrbView";
import { ProfileMedia } from "@/components/social/ProfileMedia";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = await params;
  const viewer = await currentUser();
  if (!viewer) return null;

  const theme = await getTheme();

  const profile = await prisma.user.findUnique({
    where: { uid },
    include: {
      photos: { orderBy: { createdAt: "desc" } },
      videos: { orderBy: { createdAt: "desc" } },
      tracks: { orderBy: { createdAt: "desc" } },
      books: { orderBy: { createdAt: "desc" } },
      achievements: { orderBy: { unlockedAt: "desc" } },
      memberships: { include: { community: { select: { slug: true, name: true, theme: true } } } },
      scraps: {
        where: scrapVisibilityWhere(uid, viewer.id),
        orderBy: { createdAt: "desc" },
        take: 30,
        include: {
          author: { select: { name: true, uid: true, avatarSeed: true } },
          comments: {
            orderBy: { createdAt: "asc" },
            include: { author: { select: { name: true, uid: true, avatarSeed: true } } },
          },
        },
      },
    },
  });

  if (!profile) notFound();

  const isSelf = profile.id === viewer.id;

  const [friendships, friends, visits, scrapCount, pokeCount] = await Promise.all([
    prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: viewer.id, addresseeId: profile.id },
          { requesterId: profile.id, addresseeId: viewer.id },
        ],
      },
      select: { id: true, status: true, requesterId: true, addresseeId: true },
    }),
    prisma.friendship.findMany({
      where: { status: "ACCEPTED", OR: [{ requesterId: profile.id }, { addresseeId: profile.id }] },
      include: {
        requester: { select: { id: true, name: true, uid: true, username: true, avatarSeed: true, headline: true } },
        addressee: { select: { id: true, name: true, uid: true, username: true, avatarSeed: true, headline: true } },
      },
      take: 60,
    }),
    prisma.profileVisit.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 12,
      include: { visitor: { select: { name: true, uid: true, avatarSeed: true } } },
    }),
    prisma.scrap.count({ where: { profileId: profile.id } }),
    prisma.poke.count({ where: { toId: profile.id } }),
  ]);

  if (!isSelf) {
    await recordProfileVisit(profile.id, viewer.id);
  }

  const { state: friendState, friendshipId } = resolveFriendState(
    friendships.map((f) => ({ ...f, id: f.id })),
    viewer.id,
    profile.id,
  );

  const friendList = friends.map((link) =>
    link.requester.id === profile.id ? link.addressee : link.requester,
  );

  return (
    <div className="space-y-6">
      <Panel className="overflow-hidden">
        <div className="relative h-44 sm:h-56">
          <ProfileVistaForTheme theme={theme} seed={Number(profile.avatarSeed) || 0} className="h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-void via-transparent to-transparent" />
          <span className="panel-title absolute top-3 left-4 rounded-md border border-cyan/25 bg-void/70 px-2 py-1 backdrop-blur">
            VISTA · seed {profile.avatarSeed}
          </span>
        </div>

        <div className="-mt-16 flex flex-col gap-6 px-6 pb-6 sm:-mt-20 sm:flex-row sm:items-end">
          <div className="relative shrink-0">
            {profile.avatarUrl ? (
              <div
                className="h-40 w-40 overflow-hidden rounded-full border-2 border-cyan/40 shadow-[0_0_40px_-10px_rgba(0,229,255,0.8)] sm:h-48 sm:w-48"
                style={{ borderRadius: "9999px" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  width={192}
                  height={192}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="h-40 w-40 sm:h-48 sm:w-48">
                <AvatarOrbView seed={Number(profile.avatarSeed) || 0} className="h-full w-full" />
              </div>
            )}
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full border border-cyan/40 bg-void/80 px-3 py-0.5 font-mono text-[10px] tracking-[0.2em] text-cyan">
              UID {profile.uid}
            </span>
          </div>

          <div className="min-w-0 flex-1 sm:pb-2">
            <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{profile.name}</h1>
            <p className="font-mono text-sm text-cyan">@{profile.username}</p>
            <p className="mt-2 max-w-xl text-sm text-muted">{profile.headline || "Sem frase de efeito ainda."}</p>

            <div className="mt-3 flex flex-wrap gap-2">
              {profile.city || profile.state ? (
                <Chip>
                  <MapPin size={12} /> {[profile.city, profile.state].filter(Boolean).join(" — ")}
                </Chip>
              ) : null}
              {profile.relationship ? <Chip tone="violet">{profile.relationship}</Chip> : null}
              {profile.gender ? <Chip tone="magenta">{profile.gender}</Chip> : null}
              <Chip tone="lime">
                <Eye size={12} /> {profile.profileViews + 1} visitas
              </Chip>
              {profile.avatarUrl ? (
                <Chip tone="violet">foto enviada</Chip>
              ) : (
                <Chip>nucleo 3D</Chip>
              )}
            </div>
          </div>

          <div className="sm:pb-2">
            <ProfileActions
              profileUid={profile.uid}
              isSelf={isSelf}
              friendState={friendState}
              friendshipId={friendshipId}
            />
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat label="Amigos" value={friends.length} />
        <Stat label="Scraps" value={scrapCount} />
        <Stat label="Cutucadas" value={pokeCount} />
        <Stat label="Fotos" value={profile.photos.length} />
        <Stat label="Créditos" value={profile.credits} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {profile.quote ? (
            <Panel>
              <div className="flex gap-3 px-5 py-5">
                <Quote size={18} className="shrink-0 text-cyan" />
                <p className="font-display text-lg leading-snug text-cyan-soft">{profile.quote}</p>
              </div>
            </Panel>
          ) : null}

          <Panel title="Sobre mim">
            <div className="grid gap-x-6 gap-y-4 px-5 py-5 sm:grid-cols-2">
              <Field label="Bio" value={profile.bio} />
              <Field label="Sobre" value={profile.aboutMe} wide />
              <Field label="Passatempos" value={profile.hobbies} />
              <Field label="Procuro" value={profile.lookingFor} />
              <Field label="Trabalho" value={profile.job} />
              <Field label="Escola" value={profile.school} />
              <Field label="Música favorita" value={profile.favoriteMus} />
              <Field label="País" value={profile.country} />
            </div>
          </Panel>

          <ProfileMedia profile={profile} isSelf={isSelf} />

          <Panel title="Scrapbook" action={<Ghost size={14} className="text-muted" />}>
            <ScrapForm profileUid={profile.uid} />
            <ul className="divide-y divide-cyan/8 border-t border-cyan/10">
              {profile.scraps.length === 0 ? (
                <li className="px-5 py-8 text-center text-sm text-muted">
                  Nenhum scrap ainda. Seja a primeira pessoa a deixar um.
                </li>
              ) : (
                profile.scraps.map((scrap) => (
                  <ScrapItem
                    key={scrap.id}
                    canDelete={isSelf || scrap.author.uid === viewer.uid}
                    scrap={{
                      id: scrap.id,
                      message: scrap.message,
                      thumb: scrap.thumb,
                      private: scrap.private,
                      createdAt: scrap.createdAt,
                      author: scrap.author,
                      comments: scrap.comments.map((comment) => ({
                        id: comment.id,
                        body: comment.body,
                        createdAt: comment.createdAt,
                        author: comment.author,
                      })),
                    }}
                  />
                ))
              )}
            </ul>
          </Panel>
        </div>

        <aside className="space-y-6">
          <Panel title={`Amigos (${friendList.length})`} action={<Users size={14} className="text-muted" />}>
            {friendList.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-muted">Ainda sem amigos por aqui.</p>
            ) : (
              <ul className="divide-y divide-cyan/8">
                {friendList.map((friend) => (
                  <li key={friend.id} className="flex items-center gap-3 px-5 py-2.5">
                    <Avatar name={friend.name} seed={friend.avatarSeed} size={34} />
                    <div className="min-w-0 flex-1">
                      <Link href={`/app/profile/${friend.uid}`} className="block truncate text-sm hover:text-cyan">
                        {friend.name}
                      </Link>
                      <p className="truncate font-mono text-[11px] text-muted">@{friend.username}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {profile.memberships.length > 0 ? (
            <Panel title="Comunidades">
              <ul className="divide-y divide-cyan/8">
                {profile.memberships.map((membership) => (
                  <li key={membership.id} className="px-5 py-2.5">
                    <Link
                      href={`/app/comunidades/${membership.community.slug}`}
                      className="flex items-center gap-2 text-sm hover:text-cyan"
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: membership.community.theme }}
                      />
                      {membership.community.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          {profile.achievements.length > 0 ? (
            <Panel title="Conquistas" action={<Sparkles size={14} className="text-muted" />}>
              <ul className="grid grid-cols-2 gap-2 px-5 py-4">
                {profile.achievements.map((achievement) => (
                  <li
                    key={achievement.id}
                    className="rounded-xl border border-amber/30 bg-amber/8 px-3 py-2"
                    title={achievement.description}
                  >
                    <p className="font-display text-[11px] tracking-wider text-amber uppercase">
                      {achievement.name}
                    </p>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          <Panel title="Quem visitou" action={<History size={14} className="text-muted" />}>
            {visits.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-muted">Sem visitas registradas.</p>
            ) : (
              <ul className="flex flex-wrap gap-2 px-5 py-4">
                {visits.map((visit) => (
                  <li key={visit.id}>
                    <Link
                      href={`/app/profile/${visit.visitor.uid}`}
                      title={visit.visitor.name}
                      className="block"
                    >
                      <Avatar name={visit.visitor.name} seed={visit.visitor.avatarSeed} size={32} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <p className="label">{label}</p>
      <p className="whitespace-pre-wrap text-sm">{value || <span className="text-muted">—</span>}</p>
    </div>
  );
}
