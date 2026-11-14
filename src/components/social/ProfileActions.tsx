"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Hand, MessageSquare, Send, UserPlus, UserCheck, Clock, Trash2 } from "lucide-react";
import { sendPoke, sendFriendRequest, unfriend } from "@/actions/social";
import { POKE_KINDS } from "@/lib/enums";
import type { FriendState } from "@/lib/rules";
import dynamic from "next/dynamic";

const PokeBurst = dynamic(
  () => import("@/components/three/PokeBurst").then((m) => m.PokeBurst),
  { ssr: false },
);

export type { FriendState };

export function ProfileActions({
  profileUid,
  isSelf,
  friendState,
  friendshipId,
}: {
  profileUid: string;
  isSelf: boolean;
  friendState: FriendState;
  friendshipId?: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [trigger, setTrigger] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState(friendState);

  if (isSelf) {
    return (
      <Link href="/app/config" className="btn btn-primary">
        Editar meu perfil
      </Link>
    );
  }

  function poke(kind: string) {
    setError(null);
    startTransition(async () => {
      const result = await sendPoke(profileUid, kind);
      if (result && "error" in result && result.error) {
        setError(result.error);
        return;
      }
      setTrigger((value) => value + 1);
    });
  }

  function addFriend() {
    setError(null);
    startTransition(async () => {
      const result = await sendFriendRequest(profileUid);
      if (result && "error" in result && result.error) {
        setError(result.error);
        return;
      }
      setState("sent");
    });
  }

  function removeFriend() {
    setError(null);
    startTransition(async () => {
      if (!friendshipId) return;
      await unfriend(friendshipId);
      setState("none");
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => poke("poke")}
          disabled={pending}
          className="btn btn-primary"
        >
          <Hand size={15} /> Cutucar
        </button>

        {state === "friends" ? (
          <button type="button" onClick={removeFriend} disabled={pending} className="btn btn-ghost">
            <Trash2 size={15} /> Desfazer amizade
          </button>
        ) : state === "sent" ? (
          <button type="button" disabled className="btn btn-ghost">
            <Clock size={15} /> Pedido enviado
          </button>
        ) : (
          <button type="button" onClick={addFriend} disabled={pending} className="btn btn-ghost">
            <UserPlus size={15} /> Adicionar amigo
          </button>
        )}

        <Link href={`/app/mensagens?to=${profileUid}`} className="btn btn-ghost">
          <MessageSquare size={15} /> Mensagem
        </Link>
      </div>

      <details className="group">
        <summary className="cursor-pointer list-none text-[11px] tracking-[0.2em] uppercase text-muted hover:text-cyan">
          + outros gestos
        </summary>
        <div className="mt-2 flex flex-wrap gap-2">
          {POKE_KINDS.filter((p) => p.id !== "poke").map((kind) => (
            <button
              key={kind.id}
              type="button"
              onClick={() => poke(kind.id)}
              disabled={pending}
              className="btn btn-ghost px-3 py-1.5 text-[11px]"
            >
              {kind.emoji} {kind.label}
            </button>
          ))}
        </div>
      </details>

      {error ? <p className="text-xs text-magenta">{error}</p> : null}

      {trigger > 0 ? <PokeBurst trigger={trigger} /> : null}

      {state === "friends" ? (
        <p className="flex items-center gap-1.5 text-xs text-lime">
          <UserCheck size={13} /> Vocês são amigos
        </p>
      ) : null}

      <p className="flex items-center gap-1.5 font-mono text-[11px] text-muted/70">
        <Send size={12} />_actions_: poke / friend / message
      </p>
    </div>
  );
}
