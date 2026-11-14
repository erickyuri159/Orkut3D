"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Hand, Undo2 } from "lucide-react";
import { pokeBack, sendPoke } from "@/actions/social";
import { Avatar } from "@/components/ui/Avatar";
import { relativeTime } from "@/lib/format";
import { POKE_KINDS } from "@/lib/enums";

export type IncomingPoke = {
  id: string;
  kind: string;
  createdAt: Date;
  from: { name: string; uid: string; avatarSeed: string };
};

export type SentPoke = {
  id: string;
  kind: string;
  createdAt: Date;
  seen: boolean;
  to: { name: string; uid: string; avatarSeed: string };
};

function label(kind: string) {
  return POKE_KINDS.find((item) => item.id === kind) ?? POKE_KINDS[0];
}

export function PokeInbox({ pokes }: { pokes: IncomingPoke[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [items, setItems] = useState(pokes);

  if (items.length === 0) {
    return <p className="px-5 py-8 text-center text-sm text-muted">Nenhuma cutucada nova. Paz e silêncio.</p>;
  }

  function back(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
    startTransition(async () => {
      const result = await pokeBack(id);
      if (result && "ok" in result && result.targetUid) {
        await sendPoke(result.targetUid, "poke");
      }
      router.refresh();
    });
  }

  return (
    <ul className="divide-y divide-cyan/8">
      {items.map((poke) => {
        const meta = label(poke.kind);
        return (
          <li key={poke.id} className="flex items-center gap-3 px-5 py-3">
            <Avatar name={poke.from.name} seed={poke.from.avatarSeed} size={42} />
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                <span className="font-semibold">{poke.from.name}</span>{" "}
                <span className="text-muted">{meta.verb} você</span>{" "}
                <span className="text-lg">{meta.emoji}</span>
              </p>
              <p className="font-mono text-[11px] text-muted">{relativeTime(poke.createdAt)}</p>
            </div>
            <button type="button" onClick={() => back(poke.id)} className="btn btn-primary px-3 py-1.5 text-[11px]">
              <Undo2 size={13} /> Devolver
            </button>
            <Link href={`/app/profile/${poke.from.uid}`} className="btn btn-ghost px-3 py-1.5 text-[11px]">
              <Hand size={13} />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function PokeOutbox({ pokes }: { pokes: SentPoke[] }) {
  if (pokes.length === 0) {
    return <p className="px-5 py-8 text-center text-sm text-muted">Você ainda não cutucou ninguém.</p>;
  }

  return (
    <ul className="divide-y divide-cyan/8">
      {pokes.map((poke) => {
        const meta = label(poke.kind);
        return (
          <li key={poke.id} className="flex items-center gap-3 px-5 py-3">
            <Avatar name={poke.to.name} seed={poke.to.avatarSeed} size={40} />
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                Você {meta.verb}{" "}
                <Link href={`/app/profile/${poke.to.uid}`} className="font-semibold text-cyan hover:underline">
                  {poke.to.name}
                </Link>{" "}
                <span className="text-lg">{meta.emoji}</span>
              </p>
              <p className="font-mono text-[11px] text-muted">
                {relativeTime(poke.createdAt)} · {poke.seen ? "já viu" : "aguardando resposta"}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
