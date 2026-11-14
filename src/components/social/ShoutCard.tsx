"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Heart, Trash2 } from "lucide-react";
import { toggleShoutLike, deleteShout } from "@/actions/content";
import { Avatar } from "@/components/ui/Avatar";
import { relativeTime } from "@/lib/format";

export type ShoutData = {
  id: string;
  body: string;
  createdAt: Date;
  author: { name: string; username: string; uid: string; avatarSeed: string };
  _count: { likes: number };
};

export function ShoutCard({
  shout,
  isOwner,
  likedByViewer,
}: {
  shout: ShoutData;
  isOwner: boolean;
  likedByViewer: boolean;
}) {
  const [likes, setLikes] = useState(shout._count.likes);
  const [liked, setLiked] = useState(likedByViewer);
  const [pending, startTransition] = useTransition();

  function handleLike() {
    setLiked((value) => !value);
    setLikes((value) => value + (liked ? -1 : 1));
    startTransition(async () => {
      await toggleShoutLike(shout.id);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteShout(shout.id);
      if (result && "ok" in result) {
        document.getElementById(`shout-${shout.id}`)?.remove();
      }
    });
  }

  return (
    <article id={`shout-${shout.id}`} className="panel corner-frame px-5 py-4">
      <header className="flex items-center gap-3">
        <Link href={`/app/profile/${shout.author.uid}`}>
          <Avatar name={shout.author.name} seed={shout.author.avatarSeed} size={42} />
        </Link>
        <div className="min-w-0">
          <Link
            href={`/app/profile/${shout.author.uid}`}
            className="block truncate font-semibold hover:text-cyan"
          >
            {shout.author.name}
          </Link>
          <p className="font-mono text-[11px] text-muted">
            @{shout.author.username} · {relativeTime(shout.createdAt)}
          </p>
        </div>
      </header>

      <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed">{shout.body}</p>

      <footer className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={handleLike}
          disabled={pending}
          className={`btn px-3 py-1.5 text-[11px] ${liked ? "btn-danger" : "btn-ghost"}`}
        >
          <Heart size={13} fill={liked ? "currentColor" : "none"} /> {likes}
        </button>

        <Link href={`/app/profile/${shout.author.uid}`} className="btn btn-ghost px-3 py-1.5 text-[11px]">
          Responder no perfil
        </Link>

        {isOwner ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="btn btn-ghost ml-auto px-3 py-1.5 text-[11px]"
          >
            <Trash2 size={13} /> Apagar
          </button>
        ) : null}
      </footer>
    </article>
  );
}
