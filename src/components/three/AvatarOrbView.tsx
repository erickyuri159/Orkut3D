"use client";

import dynamic from "next/dynamic";

const AvatarOrb = dynamic(
  () => import("@/components/three/AvatarOrb").then((m) => m.AvatarOrb),
  { ssr: false },
);

export function AvatarOrbView({ seed, className = "" }: { seed: number; className?: string }) {
  return (
    <div className={`relative rounded-full border border-cyan/25 bg-[radial-gradient(circle_at_50%_35%,rgba(0,229,255,0.14),rgba(4,7,18,0.9))] ${className}`}>
      <AvatarOrb seed={seed} className="h-full w-full" />
    </div>
  );
}
