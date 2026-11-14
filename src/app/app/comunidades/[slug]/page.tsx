import Link from "next/link";
import { notFound } from "next/navigation";
import { Crown, Pin, MessageSquare, Users } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashCode, relativeTime } from "@/lib/format";
import { Panel, EmptyState, Stat } from "@/components/ui/Panel";
import { Avatar } from "@/components/ui/Avatar";
import {
  CommentForm,
  JoinButton,
  ModerationButtons,
  NewPostForm,
} from "@/components/community/CommunityControls";

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const viewer = await currentUser();
  if (!viewer) return null;

  const community = await prisma.community.findUnique({
    where: { slug },
    include: {
      owner: { select: { name: true, uid: true, avatarSeed: true } },
      members: {
        include: { user: { select: { id: true, name: true, uid: true, avatarSeed: true } } },
        take: 24,
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { members: true, posts: true } },
    },
  });

  if (!community) notFound();

  const membership = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId: community.id, userId: viewer.id } },
  });

  const isModerator = community.ownerId === viewer.id || membership?.role === "MODERATOR";

  const posts = await prisma.communityPost.findMany({
    where: { communityId: community.id },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: 40,
    include: {
      author: { select: { name: true, uid: true, avatarSeed: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true, uid: true, avatarSeed: true } } },
      },
    },
  });

  const hue = hashCode(community.slug) % 360;

  return (
    <div className="space-y-6">
      <Panel className="overflow-hidden">
        <div
          className="relative h-40"
          style={{
            background: `linear-gradient(115deg, ${community.theme}55, transparent 65%), radial-gradient(100% 150% at 90% 0%, ${community.theme}66, transparent 55%), #05070f`,
          }}
        >
          <div className="grid-floor absolute inset-0" />
          <div className="absolute inset-0 bg-gradient-to-t from-void to-transparent" />
        </div>

        <div className="-mt-10 flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">{community.name}</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted">
              {community.tagline || community.description || "Uma comunidade sem descrição."}
            </p>
            <p className="mt-2 flex flex-wrap items-center gap-3 font-mono text-[11px] text-muted">
              <span className="flex items-center gap-1">
                <Crown size={12} /> @{community.owner.name.split(" ")[0].toLowerCase()}
              </span>
              <span className="flex items-center gap-1">
                <Users size={12} /> {community._count.members} membros
              </span>
              <span>{community._count.posts} tópicos</span>
              <span style={{ color: community.theme }}>tema {community.theme}</span>
              <span className="opacity-50">hue {hue}</span>
            </p>
          </div>

          <div className="flex flex-col items-end gap-3">
            <JoinButton
              communityId={community.id}
              isMember={Boolean(membership)}
              isOwner={community.ownerId === viewer.id}
            />
            {isModerator ? <NewPostForm communityId={community.id} /> : null}
          </div>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          {posts.length === 0 ? (
            <Panel>
              <EmptyState
                title="Nenhum tópico ainda"
                hint={isModerator ? "Crie o primeiro tópico acima." : "Entre na comunidade para criar tópicos."}
              />
            </Panel>
          ) : (
            posts.map((post) => (
              <Panel key={post.id} className={post.pinned ? "border-amber/40" : ""}>
                <div className="px-5 py-4">
                  <header className="flex flex-wrap items-center gap-2">
                    {post.pinned ? (
                      <span className="chip border-amber/45 bg-amber/10 text-amber">
                        <Pin size={11} /> fixado
                      </span>
                    ) : null}
                    {post.locked ? (
                      <span className="chip border-magenta/45 bg-magenta/10 text-magenta">
                        trancado
                      </span>
                    ) : null}
                    <span className="ml-auto">
                      <ModerationButtons
                        postId={post.id}
                        pinned={post.pinned}
                        locked={post.locked}
                        isOwner={isModerator || post.author.uid === viewer.uid}
                      />
                    </span>
                  </header>

                  <h2 className="mt-2 font-display text-lg">{post.title}</h2>

                  <div className="mt-2 flex items-center gap-2">
                    <Avatar name={post.author.name} seed={post.author.avatarSeed} size={26} />
                    <Link
                      href={`/app/profile/${post.author.uid}`}
                      className="text-xs text-cyan hover:underline"
                    >
                      {post.author.name}
                    </Link>
                    <span className="font-mono text-[11px] text-muted">
                      {relativeTime(post.createdAt)}
                    </span>
                  </div>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{post.body}</p>

                  {post.comments.length > 0 ? (
                    <ul className="mt-4 space-y-2 border-l border-cyan/15 pl-4">
                      {post.comments.map((comment) => (
                        <li key={comment.id} className="flex gap-2 text-sm">
                          <Avatar name={comment.author.name} seed={comment.author.avatarSeed} size={22} />
                          <div>
                            <Link
                              href={`/app/profile/${comment.author.uid}`}
                              className="font-semibold text-cyan-soft hover:text-cyan"
                            >
                              {comment.author.name}
                            </Link>
                            <span className="text-muted"> {comment.body}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {membership && !post.locked ? (
                    <CommentForm postId={post.id} />
                  ) : (
                    <p className="mt-4 flex items-center gap-2 text-xs text-muted">
                      <MessageSquare size={13} />
                      {post.locked ? "Tópico trancado pela moderação." : "Entre na comunidade para comentar."}
                    </p>
                  )}
                </div>
              </Panel>
            ))
          )}
        </div>

        <aside className="space-y-5">
          <Panel title="Sobre">
            <p className="px-5 py-4 text-sm whitespace-pre-wrap text-muted">
              {community.description || "Sem descrição."}
            </p>
          </Panel>

          <Panel title={`Membros (${community._count.members})`}>
            <ul className="flex flex-wrap gap-2 px-5 py-4">
              {community.members.map((member) => (
                <li key={member.id}>
                  <Link
                    href={`/app/profile/${member.user.uid}`}
                    title={`${member.user.name} · ${member.role}`}
                  >
                    <Avatar name={member.user.name} seed={member.user.avatarSeed} size={36} />
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>

          <div className="grid grid-cols-2 gap-3">
            <Stat label="Tópicos" value={community._count.posts} />
            <Stat label="Membros" value={community._count.members} />
          </div>
        </aside>
      </div>
    </div>
  );
}
