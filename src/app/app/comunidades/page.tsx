import Link from "next/link";
import { Globe, Users } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashCode } from "@/lib/format";
import { Panel, EmptyState, Stat } from "@/components/ui/Panel";
import { CreateCommunityForm } from "@/components/community/CreateCommunityForm";

export const metadata = { title: "Comunidades" };

export default async function CommunitiesPage() {
  const viewer = await currentUser();
  if (!viewer) return null;

  const [communities, myMemberships, totalMembers] = await Promise.all([
    prisma.community.findMany({
      include: { _count: { select: { members: true, posts: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.communityMember.findMany({ where: { userId: viewer.id } }),
    prisma.communityMember.count(),
  ]);

  const myCommunityIds = new Set(myMemberships.map((membership) => membership.communityId));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Comunidades" value={communities.length} />
        <Stat label="Minhas" value={myMemberships.length} />
        <Stat label="Membros no total" value={totalMembers} />
      </div>

      <Panel title="Criar comunidade">
        <div className="px-5 py-4">
          <CreateCommunityForm />
        </div>
      </Panel>

      {communities.length === 0 ? (
        <Panel>
          <EmptyState icon={<Globe size={26} />} title="Nenhuma comunidade" hint="Crie a primeira." />
        </Panel>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {communities.map((community) => {
            const hue = hashCode(community.slug) % 360;
            return (
              <Link
                key={community.id}
                href={`/app/comunidades/${community.slug}`}
                className="panel corner-frame group overflow-hidden transition-transform duration-300 hover:-translate-y-1"
              >
                <div
                  className="relative h-24"
                  style={{
                    background: `linear-gradient(120deg, ${community.theme}44, transparent 70%), radial-gradient(90% 140% at 80% 0%, ${community.theme}55, transparent 60%), #060a18`,
                  }}
                >
                  <div className="grid-floor absolute inset-0" />
                  {myCommunityIds.has(community.id) ? (
                    <span className="absolute top-2 right-2 rounded-full border border-lime/50 bg-lime/15 px-2 py-0.5 text-[10px] text-lime">
                      você participa
                    </span>
                  ) : null}
                </div>
                <div className="px-5 py-4">
                  <h2 className="font-display text-base tracking-wide">{community.name}</h2>
                  <p className="mt-1 line-clamp-2 text-xs text-muted">{community.tagline || community.description}</p>
                  <div className="mt-3 flex gap-3 font-mono text-[11px] text-muted">
                    <span className="flex items-center gap-1">
                      <Users size={12} /> {community._count.members}
                    </span>
                    <span>{community._count.posts} tópicos</span>
                    <span className="ml-auto" style={{ color: community.theme }}>
                      #{hue.toString(16).padStart(3, "0")}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
