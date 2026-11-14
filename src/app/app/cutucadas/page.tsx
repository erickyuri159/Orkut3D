import { Hand, Send, Inbox } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Panel, Stat } from "@/components/ui/Panel";
import { PokeInbox, PokeOutbox } from "@/components/social/PokePanels";

export const metadata = { title: "Cutucadas" };

export default async function PokesPage() {
  const viewer = await currentUser();
  if (!viewer) return null;

  const [incoming, sent, totalReceived] = await Promise.all([
    prisma.poke.findMany({
      where: { toId: viewer.id, seenAt: null },
      orderBy: { createdAt: "desc" },
      include: { from: { select: { name: true, uid: true, avatarSeed: true } } },
    }),
    prisma.poke.findMany({
      where: { fromId: viewer.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { to: { select: { name: true, uid: true, avatarSeed: true } } },
    }),
    prisma.poke.count({ where: { toId: viewer.id } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Não devolvidas" value={incoming.length} />
        <Stat label="Enviadas" value={sent.length} />
        <Stat label="Total recebido" value={totalReceived} />
      </div>

      <Panel title="Quem te cutucou" action={<Inbox size={14} className="text-muted" />}>
        <PokeInbox
          pokes={incoming.map((poke) => ({
            id: poke.id,
            kind: poke.kind,
            createdAt: poke.createdAt,
            from: poke.from,
          }))}
        />
      </Panel>

      <Panel title="Suas cutucadas" action={<Send size={14} className="text-muted" />}>
        <PokeOutbox
          pokes={sent.map((poke) => ({
            id: poke.id,
            kind: poke.kind,
            createdAt: poke.createdAt,
            seen: Boolean(poke.seenAt),
            to: poke.to,
          }))}
        />
      </Panel>

      <Panel>
        <p className="px-5 py-4 text-sm text-muted">
          <Hand size={14} className="mr-2 inline text-cyan" />
          Cada cutucada custa 2 créditos. Devolver o poke é de graça — mas o outro lado vai
          saber que você devolveu.
        </p>
      </Panel>
    </div>
  );
}
