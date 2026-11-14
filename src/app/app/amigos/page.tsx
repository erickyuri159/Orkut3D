import { Orbit, Users, UserPlus } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashCode } from "@/lib/format";
import { Panel, Stat } from "@/components/ui/Panel";
import { FriendList, FriendRequestList } from "@/components/social/FriendPanels";
import { GraphView } from "@/components/three/GraphView";
import type { GraphEdge, GraphNode } from "@/components/three/ConnectionGraph";

export const metadata = { title: "Amigos" };

export default async function FriendsPage() {
  const viewer = await currentUser();
  if (!viewer) return null;

  const [links, incoming] = await Promise.all([
    prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterId: viewer.id }, { addresseeId: viewer.id }],
      },
      include: {
        requester: { select: { id: true, name: true, uid: true, username: true, avatarSeed: true, headline: true } },
        addressee: { select: { id: true, name: true, uid: true, username: true, avatarSeed: true, headline: true } },
      },
    }),
    prisma.friendship.findMany({
      where: { addresseeId: viewer.id, status: "PENDING" },
      include: { requester: { select: { id: true, name: true, uid: true, username: true, avatarSeed: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const friends = links.map((link) => {
    const friend = link.requesterId === viewer.id ? link.addressee : link.requester;
    return { ...friend, friendshipId: link.id };
  });

  const friendIds = friends.map((friend) => friend.id);
  const secondDegree = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      requesterId: { in: friendIds },
      addresseeId: { notIn: [...friendIds, viewer.id] },
    },
    include: {
      requester: { select: { id: true, name: true } },
      addressee: { select: { id: true, name: true } },
    },
    take: 40,
  });

  const nodes: GraphNode[] = [
    { id: viewer.id, label: viewer.name, href: `/app/profile/${viewer.uid}`, hue: hashCode(viewer.uid) % 360, size: 1, isCenter: true },
    ...friends.map((friend) => ({
      id: friend.id,
      label: friend.name,
      href: `/app/profile/${friend.uid}`,
      hue: hashCode(friend.uid) % 360,
      size: 1,
    })),
  ];

  const edges: GraphEdge[] = [
    ...friends.map((friend) => ({ from: viewer.id, to: friend.id })),
  ];

  const known = new Set(nodes.map((node) => node.id));

  for (const link of secondDegree) {
    const anchor = link.requesterId;
    const peripheral = link.addresseeId;
    if (!known.has(anchor)) continue;
    if (!known.has(peripheral)) {
      const name = link.addressee.name;
      nodes.push({ id: peripheral, label: name, hue: hashCode(name) % 360, size: 0.6 });
      known.add(peripheral);
    }
    edges.push({ from: anchor, to: peripheral });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Amigos" value={friends.length} />
        <Stat label="Pedidos recebidos" value={incoming.length} />
        <Stat label="Nós na rede" value={nodes.length} />
        <Stat label="Arestas" value={edges.length} />
      </div>

      <Panel title="Constelação de conexões" action={<Orbit size={14} className="text-muted" />}>
        <div className="px-2 py-3">
          <GraphView nodes={nodes} edges={edges} />
          <p className="px-4 pb-2 text-center font-mono text-[11px] text-muted">
            profundidade 2 — você no centro, amigos no primeiro anel, amigos dos amigos no segundo
          </p>
        </div>
      </Panel>

      <Panel title="Pedidos de amizade" action={<UserPlus size={14} className="text-muted" />}>
        <FriendRequestList
          requests={incoming.map((request) => ({
            id: request.id,
            createdAt: request.createdAt,
            requester: request.requester,
          }))}
        />
      </Panel>

      <Panel title={`Meus amigos (${friends.length})`} action={<Users size={14} className="text-muted" />}>
        <FriendList friends={friends} />
      </Panel>
    </div>
  );
}
