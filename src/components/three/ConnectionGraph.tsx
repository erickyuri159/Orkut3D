"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

export type GraphNode = {
  id: string;
  label: string;
  href?: string;
  hue: number;
  size: number;
  isCenter?: boolean;
};

export type GraphEdge = { from: string; to: string };

const CENTER_SLOT = 0;

const TARGET_COLORS = {
  cool: new THREE.Color("#00e5ff"),
  hot: new THREE.Color("#ff3d81"),
};

/** Layout determinístico em espiral esférica (golden angle) — estável entre renders. */
function layout(nodes: GraphNode[]) {
  const positions = new Map<string, THREE.Vector3>();
  const golden = Math.PI * (3 - Math.sqrt(5));

  nodes.forEach((node, index) => {
    if (node.isCenter) {
      positions.set(node.id, new THREE.Vector3(0, 0, 0));
      return;
    }
    const ring = 1.9 + (index % 3) * 1.45;
    const y = index === CENTER_SLOT ? 0 : 1 - (index / Math.max(1, nodes.length - 1)) * 2;
    const radius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * index;
    positions.set(
      node.id,
      new THREE.Vector3(
        Math.cos(theta) * radius * ring,
        y * ring * 0.85,
        Math.sin(theta) * radius * ring,
      ),
    );
  });

  return positions;
}

function Graph({ nodes, edges }: { nodes: GraphNode[]; edges: GraphEdge[] }) {
  const group = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const positions = useMemo(() => layout(nodes), [nodes]);

  const { line, material } = useMemo(() => {
    const points: THREE.Vector3[] = [];

    for (const edge of edges) {
      const a = positions.get(edge.from);
      const b = positions.get(edge.to);
      if (!a || !b) continue;
      const mid = a.clone().add(b).multiplyScalar(0.5).multiplyScalar(0.82);
      points.push(...new THREE.QuadraticBezierCurve3(a, mid, b).getPoints(16));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color("#00e5ff"),
      transparent: true,
      opacity: 0.26,
    });

    return { line: new THREE.Line(geometry, lineMaterial), material: lineMaterial };
  }, [edges, positions]);

  const materialRef = useRef<THREE.LineBasicMaterial | null>(null);

  useEffect(() => {
    materialRef.current = material;
  }, [material]);

  useEffect(
    () => () => {
      line.geometry.dispose();
      material.dispose();
    },
    [line, material],
  );

  const pulses = useMemo(
    () =>
      edges.map((edge, index) => ({
        a: positions.get(edge.from),
        b: positions.get(edge.to),
        offset: (index % 7) / 7,
      })),
    [edges, positions],
  );

  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.085;
      group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.18;
    }
    const active = materialRef.current;
    if (!active) return;
    active.color.lerp(TARGET_COLORS[hovered ? "hot" : "cool"], Math.min(1, delta * 8));
    active.opacity += ((hovered ? 0.55 : 0.26) - active.opacity) * Math.min(1, delta * 8);
  });

  return (
    <group ref={group}>
      <primitive object={line} />

      {pulses.map((pulse, index) =>
        pulse.a && pulse.b ? (
          <Pulse key={index} from={pulse.a} to={pulse.b} offset={pulse.offset} />
        ) : null,
      )}

      {nodes.map((node) => {
        const position = positions.get(node.id);
        if (!position) return null;
        const color = new THREE.Color().setHSL(node.hue / 360, 0.9, 0.6);
        return (
          <mesh
            key={node.id}
            position={position}
            onPointerOver={() => setHovered(node.id)}
            onPointerOut={() => setHovered(null)}
            scale={node.isCenter ? 1 : 0.55}
          >
            {node.isCenter ? (
              <icosahedronGeometry args={[0.42, 1]} />
            ) : (
              <sphereGeometry args={[0.3, 24, 18]} />
            )}
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={node.isCenter ? 1.8 : 0.9}
              roughness={0.25}
              metalness={0.6}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function Pulse({
  from,
  to,
  offset,
}: {
  from: THREE.Vector3;
  to: THREE.Vector3;
  offset: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = (state.clock.elapsedTime * 0.24 + offset) % 1;
    const mid = from.clone().add(to).multiplyScalar(0.5).multiplyScalar(0.82);
    const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
    ref.current.position.copy(curve.getPoint(t));
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.055, 10, 8]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.95} />
    </mesh>
  );
}

export function ConnectionGraph({
  nodes,
  edges,
  className = "",
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  className?: string;
}) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [0, 1.5, 11], fov: 55 }}
      className={className}
    >
      <ambientLight intensity={0.55} />
      <pointLight position={[5, 5, 6]} intensity={70} distance={30} color="#00e5ff" />
      <pointLight position={[-6, -4, 5]} intensity={55} distance={30} color="#a855f7" />
      <Graph nodes={nodes} edges={edges} />
    </Canvas>
  );
}
