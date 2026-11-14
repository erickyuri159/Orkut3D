"use client";

import { useEffect } from "react";
import { createLogger } from "@/lib/logger";

const logger = createLogger("boundary");

/**
 * Envia o erro para /api/log e mostra a tela de erro.
 * Sem isso, erro de renderizacao so existe enquanto a aba estiver aberta.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const report = {
      message: error.message,
      name: error.name,
      stack: error.stack?.split("\n").slice(0, 25).join("\n"),
      digest: error.digest,
      pathname: typeof window !== "undefined" ? window.location.pathname : undefined,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    };

    logger.error("render falhou", report);

    void fetch("/api/log", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(report),
      keepalive: true,
    }).catch(() => {
      /* silencioso: reportar o erro do reporter nao ajuda */
    });
  }, [error]);

  return (
    <main className="grid min-h-dvh place-items-center px-5">
      <div className="panel corner-frame max-w-lg px-8 py-12 text-center">
        <p className="font-display text-5xl font-bold text-magenta">ERRO</p>
        <h1 className="mt-4 font-display text-xl tracking-[0.2em] uppercase">
          O renderizador falhou
        </h1>
        <p className="mt-3 text-sm text-muted">{error.message}</p>
        {error.digest ? (
          <p className="mt-2 font-mono text-[11px] text-muted">digest: {error.digest}</p>
        ) : null}
        <button type="button" onClick={reset} className="btn btn-primary mt-7">
          Tentar de novo
        </button>
        <p className="mt-6 font-mono text-[11px] text-muted/70">
          Este erro foi reportado no log do servidor.
        </p>
      </div>
    </main>
  );
}