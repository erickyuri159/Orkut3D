"use client";

import dynamic from "next/dynamic";

const BackdropScene = dynamic(
  () => import("@/components/three/BackdropScene").then((m) => m.BackdropScene),
  { ssr: false },
);

/** Camada WebGL fixa por trás de toda a aplicação (só no tema 3D). */
export function Vista() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      <BackdropScene />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,229,255,0.08),transparent_55%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(4,6,15,0.86))]" />
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-soft-light"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
