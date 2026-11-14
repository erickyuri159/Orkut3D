"use client";

import { useActionState, useState, useTransition } from "react";
import { Lock, Send } from "lucide-react";
import { leaveScrap, commentScrap, deleteScrap } from "@/actions/social";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Avatar } from "@/components/ui/Avatar";
import { relativeTime } from "@/lib/format";

type State = { error?: string; ok?: boolean } | null;

const THUMBS = ["\u{1F44B}", "\u{1F4AA}", "\u{1F602}", "\u{1F60D}", "\u{1F495}", "\u{1F44F}", "\u{2764}\u{FE0F}", "\u{1F389}"];

export function ScrapForm({ profileUid }: { profileUid: string }) {
  const [state, action] = useActionState<State, FormData>(async (_prev, formData) => {
    const result = await leaveScrap(profileUid, formData);
    if (result && "ok" in result) return { ok: true };
    return { error: result && "error" in result ? result.error : "Não foi possível enviar" };
  }, null);

  const [thumb, setThumb] = useState(THUMBS[0]);
  const [open, setOpen] = useState(false);

  if (state?.ok) {
    return (
      <p className="px-5 py-4 text-sm text-lime">
        Scrap entregue no mural de {profileUid}. Volte em instantes para ver.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-3 px-5 py-4">
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="btn btn-ghost w-full">
          <Send size={15} /> Deixar um scrap
        </button>
      ) : (
        <>
          <textarea
            name="message"
            className="field min-h-24 resize-y"
            placeholder="Escreva algo no mural desta pessoa…"
            maxLength={900}
            required
          />
          <input type="hidden" name="thumb" value={thumb} />

          <div className="flex flex-wrap gap-1.5">
            {THUMBS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setThumb(option)}
                className={`grid h-9 w-9 place-items-center rounded-lg border text-lg transition-all ${
                  thumb === option
                    ? "border-cyan bg-cyan/15 scale-110"
                    : "border-cyan/15 bg-white/4 hover:border-cyan/45"
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs text-muted">
              <input type="checkbox" name="private" className="accent-cyan" />
              <Lock size={12} /> Só eu e o dono do perfil vemos
            </label>
            <SubmitButton className="btn btn-primary">Enviar scrap</SubmitButton>
          </div>

          {state?.error ? <p className="text-sm text-magenta">{state.error}</p> : null}
        </>
      )}
    </form>
  );
}

export type ScrapData = {
  id: string;
  message: string;
  thumb: string;
  private: boolean;
  createdAt: Date;
  author: { name: string; uid: string; avatarSeed: string };
  comments: {
    id: string;
    body: string;
    createdAt: Date;
    author: { name: string; uid: string; avatarSeed: string };
  }[];
};

export function ScrapItem({
  scrap,
  canDelete,
}: {
  scrap: ScrapData;
  canDelete: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  return (
    <li className="px-5 py-4">
      <div className="flex gap-3">
        <a href={`/app/profile/${scrap.author.uid}`}>
          <Avatar name={scrap.author.name} seed={scrap.author.avatarSeed} size={36} />
        </a>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <a href={`/app/profile/${scrap.author.uid}`} className="text-sm font-semibold hover:text-cyan">
              {scrap.author.name}
            </a>
            <span className="text-lg">{scrap.thumb}</span>
            {scrap.private ? (
              <span className="chip border-amber/40 bg-amber/10 text-amber">
                <Lock size={10} /> privado
              </span>
            ) : null}
            <span className="font-mono text-[11px] text-muted">{relativeTime(scrap.createdAt)}</span>
          </div>

          <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed">{scrap.message}</p>

          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              className="text-[11px] tracking-[0.15em] uppercase text-muted hover:text-cyan"
            >
              {open ? "fechar" : "responder"}
            </button>

            {canDelete ? (
              <button
                type="button"
                onClick={() => startTransition(async () => { await deleteScrap(scrap.id); })}
                className="text-[11px] tracking-[0.15em] uppercase text-muted hover:text-magenta"
              >
                apagar
              </button>
            ) : null}
          </div>

          {scrap.comments.length > 0 ? (
            <ul className="mt-3 space-y-2 border-l border-cyan/15 pl-3">
              {scrap.comments.map((comment) => (
                <li key={comment.id} className="text-sm">
                  <a
                    href={`/app/profile/${comment.author.uid}`}
                    className="font-semibold text-cyan-soft hover:text-cyan"
                  >
                    {comment.author.name}
                  </a>
                  <span className="text-muted"> {comment.body}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {open ? <ScrapCommentForm scrapId={scrap.id} /> : null}
        </div>
      </div>
    </li>
  );
}

export function ScrapCommentForm({ scrapId }: { scrapId: string }) {
  const [state, action] = useActionState<State, FormData>(async (_prev, formData) => {
    formData.set("body", String(formData.get("body") ?? ""));
    const result = await commentScrap(scrapId, formData);
    if (result && "ok" in result) return { ok: true };
    return { error: result && "error" in result ? result.error : "Falhou" };
  }, null);

  return (
    <form action={action} className="mt-3 flex gap-2">
      <input name="body" className="field py-1.5 text-sm" placeholder="Responder…" maxLength={400} required />
      <SubmitButton className="btn btn-primary px-3 py-1.5 text-[11px]">Enviar</SubmitButton>
      {state?.error ? <p className="text-xs text-magenta">{state.error}</p> : null}
    </form>
  );
}
