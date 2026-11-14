"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { respondFriendRequest, unfriend } from "@/actions/social";
import { Avatar } from "@/components/ui/Avatar";
import { relativeTime } from "@/lib/format";

export function FriendRequestList({
  requests,
}: {
  requests: {
    id: string;
    createdAt: Date;
    requester: { name: string; uid: string; username: string; avatarSeed: string };
  }[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [items, setItems] = useState(requests);

  function act(requestId: string, accept: boolean) {
    setItems((current) => current.filter((item) => item.id !== requestId));
    startTransition(async () => {
      await respondFriendRequest(requestId, accept);
      router.refresh();
    });
  }

  if (items.length === 0) {
    return <p className="px-5 py-6 text-center text-sm text-muted">Nenhum pedido pendente.</p>;
  }

  return (
    <ul className="divide-y divide-cyan/8">
      {items.map((request) => (
        <li key={request.id} className="flex items-center gap-3 px-5 py-3">
          <Avatar name={request.requester.name} seed={request.requester.avatarSeed} size={40} />
          <div className="min-w-0 flex-1">
            <a href={`/app/profile/${request.requester.uid}`} className="block truncate text-sm font-semibold hover:text-cyan">
              {request.requester.name}
            </a>
            <p className="font-mono text-[11px] text-muted">
              @{request.requester.username} · {relativeTime(request.createdAt)}
            </p>
          </div>
          <button type="button" onClick={() => act(request.id, true)} className="btn btn-primary px-3 py-1.5 text-[11px]">
            <Check size={13} /> Aceitar
          </button>
          <button type="button" onClick={() => act(request.id, false)} className="btn btn-ghost px-3 py-1.5 text-[11px]">
            <X size={13} />
          </button>
        </li>
      ))}
    </ul>
  );
}

export function FriendList({
  friends,
}: {
  friends: {
    id: string;
    name: string;
    uid: string;
    username: string;
    avatarSeed: string;
    headline: string;
    friendshipId: string;
  }[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [items, setItems] = useState(friends);

  function remove(friendshipId: string) {
    setItems((current) => current.filter((item) => item.friendshipId !== friendshipId));
    startTransition(async () => {
      await unfriend(friendshipId);
      router.refresh();
    });
  }

  if (items.length === 0) {
    return <p className="px-5 py-6 text-center text-sm text-muted">Você ainda não tem amigos. Comece pela busca.</p>;
  }

  return (
    <ul className="grid gap-3 px-5 py-4 sm:grid-cols-2">
      {items.map((friend) => (
        <li key={friend.id} className="flex items-center gap-3 rounded-xl border border-cyan/12 bg-white/3 px-3 py-2.5">
          <Avatar name={friend.name} seed={friend.avatarSeed} size={40} />
          <div className="min-w-0 flex-1">
            <a href={`/app/profile/${friend.uid}`} className="block truncate text-sm font-semibold hover:text-cyan">
              {friend.name}
            </a>
            <p className="truncate font-mono text-[11px] text-muted">
              @{friend.username}
            </p>
          </div>
          <button
            type="button"
            onClick={() => remove(friend.friendshipId)}
            className="btn btn-ghost px-2 py-1 text-[10px] text-magenta"
          >
            remover
          </button>
        </li>
      ))}
    </ul>
  );
}
