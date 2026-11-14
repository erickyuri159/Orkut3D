"use client";

import { useEffect, useRef, useState, useTransition } from "react";import { Send } from "lucide-react";
import { sendMessage } from "@/actions/content";
import { Avatar } from "@/components/ui/Avatar";
import { relativeTime } from "@/lib/format";

export type ThreadMessage = {
  id: string;
  body: string;
  createdAt: Date;
  readAt: Date | null;
  fromId: string;
  mine: boolean;
};

export function MessageThread({
  peerUid,
  peerName,
  peerSeed,
  viewerId,
  initial,
}: {
  peerUid: string;
  peerName: string;
  peerSeed: string;
  viewerId: string;
  initial: ThreadMessage[];
}) {
  const [items, setItems] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const countRef = useRef(items.length);

  useEffect(() => {
    if (items.length === countRef.current) return;
    countRef.current = items.length;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [items]);

  function send(formData: FormData) {
    const body = String(formData.get("body") ?? "").trim();
    if (!body) return;

    const optimistic: ThreadMessage = {
      id: `tmp-${Date.now()}`,
      body,
      createdAt: new Date(),
      readAt: null,
      fromId: viewerId,
      mine: true,
    };
    setItems((current) => [...current, optimistic]);
    setError(null);

    startTransition(async () => {
      const result = await sendMessage(formData);
      if (result && "error" in result && result.error) {
        setItems((current) => current.filter((item) => item.id !== optimistic.id));
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex h-full min-h-[420px] flex-col">
      <header className="flex items-center gap-3 border-b border-cyan/10 px-5 py-3">
        <Avatar name={peerName} seed={peerSeed} size={38} />
        <div>
          <p className="text-sm font-semibold">{peerName}</p>
          <p className="font-mono text-[11px] text-muted">conversa privada</p>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
        {items.length === 0 ? (
          <p className="pt-10 text-center text-sm text-muted">
            Nenhuma mensagem ainda. Diga oi para {peerName}.
          </p>
        ) : null}

        {items.map((message) => (
          <div key={message.id} className={`flex ${message.mine ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                message.mine
                  ? "border border-cyan/35 bg-cyan/12 text-paper"
                  : "border border-violet/25 bg-violet/10 text-paper"
              }`}
            >
              <p className="whitespace-pre-wrap">{message.body}</p>
              <p className="mt-1 font-mono text-[10px] text-muted">
                {relativeTime(message.createdAt)}
                {message.mine ? (message.readAt ? " · lida" : " · enviada") : ""}
              </p>
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      <form action={send} className="flex gap-2 border-t border-cyan/10 px-5 py-4">
        <input
          name="body"
          className="field"
          placeholder={`Mensagem para ${peerName}…`}
          maxLength={2000}
          required
          autoComplete="off"
        />
        <input type="hidden" name="toUid" value={peerUid} />
        <button type="submit" className="btn btn-primary px-4" aria-label="Enviar">
          <Send size={16} />
        </button>
      </form>

      {error ? <p className="px-5 pb-3 text-sm text-magenta">{error}</p> : null}
    </div>
  );
}
