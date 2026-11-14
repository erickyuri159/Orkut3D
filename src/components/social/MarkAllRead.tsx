"use client";

import { useTransition } from "react";
import { CheckCheck } from "lucide-react";
import { markNotificationsRead } from "@/actions/social";

export function MarkAllRead() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => {
        await markNotificationsRead();
      })}
      className="btn btn-ghost px-3 py-1.5 text-[11px]"
    >
      <CheckCheck size={13} /> Marcar todas como lidas
    </button>
  );
}
