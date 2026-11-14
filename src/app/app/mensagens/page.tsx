import Link from "next/link";
import { MessagesSquare, PenLine } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Panel, EmptyState } from "@/components/ui/Panel";
import { Avatar } from "@/components/ui/Avatar";
import { MessageThread } from "@/components/social/MessageThread";
import { relativeTime } from "@/lib/format";

export const metadata = { title: "Mensagens" };

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ to?: string }>;
}) {
  const viewer = await currentUser();
  if (!viewer) return null;

  const { to } = await searchParams;

  const conversations = await prisma.message.findMany({
    where: { OR: [{ fromId: viewer.id }, { toId: viewer.id }] },
    orderBy: { createdAt: "desc" },
    include: {
      from: { select: { id: true, name: true, uid: true, avatarSeed: true } },
      to: { select: { id: true, name: true, uid: true, avatarSeed: true } },
    },
    take: 60,
  });

  const peers = new Map<string, { id: string; name: string; uid: string; avatarSeed: string; lastMessage: Date; unread: number }>();

  for (const message of conversations) {
    const peer = message.fromId === viewer.id ? message.to : message.from;
    const existing = peers.get(peer.id);
    const unread = message.toId === viewer.id && !message.readAt ? 1 : 0;
    if (!existing) {
      peers.set(peer.id, { ...peer, lastMessage: message.createdAt, unread });
    } else {
      existing.unread += unread;
      if (message.createdAt > existing.lastMessage) existing.lastMessage = message.createdAt;
    }
  }

  const list = [...peers.values()].sort((a, b) => b.lastMessage.getTime() - a.lastMessage.getTime());

  let thread: {
    peer: { id: string; name: string; uid: string; avatarSeed: string };
    messages: {
      id: string;
      body: string;
      createdAt: Date;
      readAt: Date | null;
      fromId: string;
      mine: boolean;
    }[];
  } | null = null;

  if (to) {
    const peer = await prisma.user.findUnique({
      where: { uid: to },
      select: { id: true, name: true, uid: true, avatarSeed: true },
    });

    if (peer && peer.id !== viewer.id) {
      await prisma.message.updateMany({
        where: { fromId: peer.id, toId: viewer.id, readAt: null },
        data: { readAt: new Date() },
      });

      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { fromId: viewer.id, toId: peer.id },
            { fromId: peer.id, toId: viewer.id },
          ],
        },
        orderBy: { createdAt: "asc" },
        take: 200,
      });

      thread = {
        peer,
        messages: messages.map((message) => ({
          id: message.id,
          body: message.body,
          createdAt: message.createdAt,
          readAt: message.readAt,
          fromId: message.fromId,
          mine: message.fromId === viewer.id,
        })),
      };
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <Panel title="Conversas" action={<MessagesSquare size={14} className="text-muted" />}>
        {list.length === 0 ? (
          <EmptyState
            title="Nenhuma conversa"
            hint="Abra um perfil e use o botão Mensagem para começar."
          />
        ) : (
          <ul className="divide-y divide-cyan/8">
            {list.map((peer) => (
              <li key={peer.id}>
                <Link
                  href={`/app/mensagens?to=${peer.uid}`}
                  className={`flex items-center gap-3 px-5 py-3 transition-colors hover:bg-cyan/8 ${
                    to === peer.uid ? "bg-cyan/10" : ""
                  }`}
                >
                  <Avatar name={peer.name} seed={peer.avatarSeed} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{peer.name}</p>
                    <p className="truncate font-mono text-[11px] text-muted">
                      {relativeTime(peer.lastMessage)}
                    </p>
                  </div>
                  {peer.unread > 0 ? (
                    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-magenta px-1 font-mono text-[10px] font-bold text-white">
                      {peer.unread}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {thread ? (
        <Panel className="overflow-hidden">
          <MessageThread
            key={thread.peer.id}
            peerUid={thread.peer.uid}
            peerName={thread.peer.name}
            peerSeed={thread.peer.avatarSeed}
            viewerId={viewer.id}
            initial={thread.messages}
          />
        </Panel>
      ) : (
        <Panel>
          <EmptyState
            icon={<PenLine size={26} />}
            title="Selecione uma conversa"
            hint="Escolha alguém na lista ao lado para ver o histórico."
          />
        </Panel>
      )}
    </div>
  );
}
