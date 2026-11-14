"use client";

import dynamic from "next/dynamic";
import type { GraphEdge, GraphNode } from "@/components/three/ConnectionGraph";

const ConnectionGraph = dynamic(
  () => import("@/components/three/ConnectionGraph").then((m) => m.ConnectionGraph),
  { ssr: false },
);

export function GraphView({ nodes, edges }: { nodes: GraphNode[]; edges: GraphEdge[] }) {
  if (nodes.length < 2) {
    return (
      <div className="grid h-[320px] place-items-center text-center text-sm text-muted">
        Precisa de pelo menos duas conexões para projetar a constelação.
      </div>
    );
  }

  return (
    <ConnectionGraph nodes={nodes} edges={edges} className="h-[380px] w-full sm:h-[460px]" />
  );
}
