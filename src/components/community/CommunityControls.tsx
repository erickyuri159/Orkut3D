"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { LogIn, LogOut, Pin, Lock, Trash2 } from "lucide-react";
import { toggleMembership, createCommunityPost, commentOnPost, moderatePost } from "@/actions/content";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function JoinButton({
  communityId,
  isMember,
  isOwner,
}: {
  communityId: string;
  isMember: boolean;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [joined, setJoined] = useState(isMember);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function toggle() {
    setError(null);
    startTransition(async () => {
      const result = await toggleMembership(communityId);
      if (result && "error" in result && result.error) {
        setError(result.error);
        return;
      }
      if (result && "ok" in result && typeof result.joined === "boolean") setJoined(result.joined);
      router.refresh();
    });
  }

  if (isOwner && !joined) {
    return (
      <button type="button" disabled className="btn btn-ghost">
        <Lock size={14} /> você é o dono
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button type="button" onClick={toggle} className={`btn ${joined ? "btn-ghost" : "btn-primary"}`}>
        {joined ? <LogOut size={14} /> : <LogIn size={14} />}
        {joined ? "Sair da comunidade" : "Entrar na comunidade"}
      </button>
      {error ? <p className="text-[11px] text-magenta">{error}</p> : null}
    </div>
  );
}

export function NewPostForm({ communityId }: { communityId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit(formData: FormData) {
    setError(null);
    void createCommunityPost(communityId, formData).then((result) => {
      if (result && "error" in result && result.error) {
        setError(result.error);
      }
    });
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn btn-primary">
        Novo tópico
      </button>
    );
  }

  return (
    <form action={submit} className="w-full space-y-3 rounded-xl border border-cyan/15 bg-black/25 p-4">
      <input name="title" className="field" placeholder="Título do tópico" maxLength={140} required />
      <textarea
        name="body"
        className="field min-h-32 resize-y"
        placeholder="Escreva o conteúdo…"
        maxLength={6000}
        required
      />
      {error ? <p className="text-sm text-magenta">{error}</p> : null}
      <div className="flex gap-2">
        <SubmitButton className="btn btn-primary">Publicar</SubmitButton>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost">
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function CommentForm({ postId }: { postId: string }) {
  const [error, setError] = useState<string | null>(null);

  function submit(formData: FormData) {
    setError(null);
    void commentOnPost(postId, formData).then((result) => {
      if (result && "error" in result && result.error) setError(result.error);
    });
  }

  return (
    <form action={submit} className="mt-4 flex gap-2">
      <input name="body" className="field py-1.5 text-sm" placeholder="Comentar…" maxLength={2000} required />
      <SubmitButton className="btn btn-primary px-3 py-1.5 text-[11px]">Enviar</SubmitButton>
      {error ? <p className="self-center text-xs text-magenta">{error}</p> : null}
    </form>
  );
}

export function ModerationButtons({
  postId,
  pinned,
  locked,
  isOwner,
}: {
  postId: string;
  pinned: boolean;
  locked: boolean;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function act(action: "pin" | "lock" | "delete") {
    startTransition(async () => {
      await moderatePost(postId, action);
      router.refresh();
    });
  }

  if (!isOwner) return null;

  return (
    <div className="flex gap-1.5">
      <button
        type="button"
        onClick={() => act("pin")}
        className={`btn px-2 py-1 text-[10px] ${pinned ? "btn-primary" : "btn-ghost"}`}
        aria-label="Fixar"
      >
        <Pin size={12} />
      </button>
      <button
        type="button"
        onClick={() => act("lock")}
        className={`btn px-2 py-1 text-[10px] ${locked ? "btn-primary" : "btn-ghost"}`}
        aria-label="Trancar"
      >
        <Lock size={12} />
      </button>
      <button
        type="button"
        onClick={() => act("delete")}
        className="btn btn-ghost px-2 py-1 text-[10px] text-magenta"
        aria-label="Apagar"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}
