"use client";

import dynamic from "next/dynamic";
import type { Theme } from "@/lib/theme";

const VistaRenderer = dynamic(
  () => import("@/components/three/VistaView").then((m) => m.VistaRenderer),
  { ssr: false },
);

function VistaFallback({ seed }: { seed: number }) {
  const hue = seed % 360;
  return (
    <div
      className="h-full w-full"
      style={{
        background: `linear-gradient(180deg, hsl(${hue} 80% 30%), hsl(${(hue + 50) % 360} 85% 55%) 55%, #120a22)`,
      }}
    />
  );
}

/**
 * A VISTA do perfil: wallpaper procedural único por pessoa.
 * Sem upload de imagem — só a seed do perfil.
 */
export function ProfileVista({
  seed,
  classic = false,
  className = "",
}: {
  seed: number;
  classic?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <VistaFallback seed={seed} />
      <div className="absolute inset-0">
        <VistaRenderer seed={seed} classic={classic} className="h-full w-full" />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-void via-void/60 to-transparent" />
    </div>
  );
}

/** Versao CSS da vista para o modo 2004 (sem WebGL). */
export function ProfileVistaLegacy({ seed }: { seed: number }) {
  const hue = seed % 360;
  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        backgroundImage: [
          "repeating-linear-gradient(0deg, rgba(0,0,0,0.16) 0 1px, transparent 1px 3px)",
          `radial-gradient(60% 90% at 50% 120%, hsl(${(hue + 40) % 360} 90% 45%), transparent 70%)`,
          "linear-gradient(180deg, #101a6b 0%, #7a1f8a 45%, #d26a2b 78%, #f0b429 100%)",
        ].join(","),
        imageRendering: "pixelated",
      }}
    >
      <div
        className="absolute inset-x-0 bottom-0 h-1/2"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)",
          backgroundSize: "12px 12px",
          transform: "perspective(120px) rotateX(55deg)",
          transformOrigin: "bottom",
        }}
      />
    </div>
  );
}

/**
 * Versao CSS da vista para o modo noite: sem WebGL, sem brilho,
 * apenas um degradê suave derivado da seed.
 */
export function ProfileVistaNight({ seed }: { seed: number }) {
  const hue = seed % 360;
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0d1117]">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(120% 150% at 22% 0%, hsl(${hue} 55% 30% / 0.9), transparent 62%), radial-gradient(100% 130% at 88% 26%, hsl(${(hue + 55) % 360} 45% 26% / 0.75), transparent 60%)`,
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.14) 1px, transparent 1px)",
          backgroundSize: "46px 46px",
        }}
      />
    </div>
  );
}

/** Escolhe a variante da VISTA conforme o tema ativo. */
export function ProfileVistaForTheme({
  theme,
  seed,
  className = "",
}: {
  theme: Theme;
  seed: number;
  className?: string;
}) {
  if (theme === "klass") return <ProfileVistaLegacy seed={seed} />;
  if (theme === "noite") return <ProfileVistaNight seed={seed} />;
  return (
    <div className={`relative ${className}`}>
      <ProfileVista seed={seed} className="h-full w-full" />
    </div>
  );
}
