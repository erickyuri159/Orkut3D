import { ImagePlus, Palette, Settings, Shield } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Panel, Stat } from "@/components/ui/Panel";
import { ProfileEditor } from "@/components/config/ProfileEditor";
import { MediaManager } from "@/components/media/MediaManager";
import { AvatarOrbView } from "@/components/three/AvatarOrbView";

export const metadata = { title: "Configurações" };

export default async function SettingsPage() {
  const viewer = await currentUser();
  if (!viewer) return null;

  const profile = await prisma.user.findUniqueOrThrow({ where: { id: viewer.id } });

  const [media, friends, communities, listings, scraps, pokesSent] = await Promise.all([
    prisma.media.findMany({
      where: { userId: viewer.id },
      orderBy: { createdAt: "desc" },
      take: 24,
      select: {
        id: true,
        key: true,
        kind: true,
        width: true,
        height: true,
        size: true,
      },
    }),
    prisma.friendship.count({
      where: { status: "ACCEPTED", OR: [{ requesterId: viewer.id }, { addresseeId: viewer.id }] },
    }),
    prisma.communityMember.count({ where: { userId: viewer.id } }),
    prisma.listing.count({ where: { sellerId: viewer.id } }),
    prisma.scrap.count({ where: { authorId: viewer.id } }),
    prisma.poke.count({ where: { fromId: viewer.id } }),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <Panel title="Seu núcleo" className="h-fit">
          <div className="px-5 py-6">
            <div className="mx-auto h-48 w-48">
              <AvatarOrbView seed={Number(profile.avatarSeed) || 0} className="h-full w-full" />
            </div>
            <p className="mt-4 text-center font-display text-sm">{profile.name}</p>
            <p className="text-center font-mono text-[11px] text-muted">
              @{profile.username} · UID {profile.uid}
            </p>
            <p className="mt-3 text-center font-display text-lg text-amber">
              {profile.credits} créditos
            </p>
            <p className="text-center font-mono text-[11px] text-muted">
              cada cutucada custa 2 créditos · aceitar Scraps soma créditos no futuro
            </p>
          </div>
        </Panel>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Stat label="Amigos" value={friends} />
            <Stat label="Comunidades" value={communities} />
            <Stat label="Anúncios" value={listings} />
            <Stat label="Scraps" value={scraps} />
            <Stat label="Pokes" value={pokesSent} />
          </div>

          <Panel title="Galeria e foto do perfil" action={<ImagePlus size={14} className="text-muted" />}>
            <div className="px-5 py-5">
              <MediaManager
                isSelf
                avatarUrl={profile.avatarUrl}
                media={media.map((item) => ({
                  id: item.id,
                  url: `/api/media/${item.key}`,
                  kind: item.kind,
                  width: item.width,
                  height: item.height,
                  size: item.size,
                }))}
              />
            </div>
          </Panel>

          <Panel title="Editar perfil" action={<Settings size={14} className="text-muted" />}>
            <div className="px-5 py-5">
              <ProfileEditor profile={profile} />
            </div>
          </Panel>

          <Panel title="Sua conta" action={<Shield size={14} className="text-muted" />}>
            <ul className="divide-y divide-cyan/8 text-sm">
              <li className="flex items-center justify-between px-5 py-3">
                <span className="text-muted">E-mail</span>
                <span className="font-mono text-xs">{profile.email}</span>
              </li>
              <li className="flex items-center justify-between px-5 py-3">
                <span className="text-muted">Membro desde</span>
                <span>{profile.createdAt.toLocaleDateString("pt-BR")}</span>
              </li>
              <li className="flex items-center justify-between px-5 py-3">
                <span className="text-muted">Visitas ao perfil</span>
                <span className="font-mono">{profile.profileViews}</span>
              </li>
              <li className="flex items-center justify-between px-5 py-3">
                <span className="text-muted">Perfil público</span>
                <span className={profile.isPublic ? "text-lime" : "text-magenta"}>
                  {profile.isPublic ? "sim" : "não"}
                </span>
              </li>
            </ul>
          </Panel>

          <Panel title="Sobre esta reconstrução" action={<Palette size={14} className="text-muted" />}>
            <p className="px-5 py-4 text-sm text-muted">
              O ORB // 2088 é uma homenagem funcional: cada módulo clássico das redes sociais
              dos anos 2000 — scrapbook, cutucadas, comunidades, recados, mensagens privadas,
              classificados e ranking — foi reimplementado do zero com Server Components,
              Server Actions e renderização tridimensional em WebGL. Nenhuma imagem de upload:
              todos os avatares e todas as Vistas são gerados por geometria procedural.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
