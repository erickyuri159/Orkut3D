"use client";

import dynamic from "next/dynamic";

const HeroCluster = dynamic(
  () => import("@/components/three/HeroCluster").then((m) => m.HeroCluster),
  { ssr: false },
);

export function HeroScene({ className = "" }: { className?: string }) {
  return <HeroCluster className={className} />;
}
