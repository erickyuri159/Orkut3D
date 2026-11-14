"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

type OrbProps = { hue: number; radius: number; size: number; speed: number; phase: number };

function Orb({ hue, radius, size, speed, phase }: OrbProps) {
  const ref = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const color = useMemo(() => new THREE.Color().setHSL(hue / 360, 0.9, 0.58), [hue]);
  const color2 = useMemo(() => new THREE.Color().setHSL(((hue + 60) % 360) / 360, 0.95, 0.45), [hue]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime * speed + phase;
    ref.current.position.set(Math.cos(t) * radius, Math.sin(t * 1.35) * radius * 0.45, Math.sin(t) * radius);
    ref.current.rotation.x += delta * 0.4;
    ref.current.rotation.y += delta * 0.55;
    if (materialRef.current) materialRef.current.emissiveIntensity = 1.1 + Math.sin(t * 2) * 0.4;
  });

  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[size, 3]} />
      <meshStandardMaterial
        ref={materialRef}
        color={color}
        emissive={color2}
        emissiveIntensity={1.2}
        roughness={0.18}
        metalness={0.75}
        flatShading
      />
    </mesh>
  );
}

function Core() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.18;
    ref.current.rotation.z += delta * 0.07;
  });
  return (
    <mesh ref={ref}>
      <dodecahedronGeometry args={[1.05, 0]} />
      <meshStandardMaterial color="#e9f6ff" emissive="#00e5ff" emissiveIntensity={0.9} metalness={1} roughness={0.1} />
    </mesh>
  );
}

const ORBS: OrbProps[] = [
  { hue: 188, radius: 3.1, size: 0.42, speed: 0.42, phase: 0 },
  { hue: 275, radius: 3.9, size: 0.34, speed: 0.3, phase: 1.4 },
  { hue: 335, radius: 4.6, size: 0.28, speed: 0.24, phase: 2.6 },
  { hue: 95, radius: 2.6, size: 0.24, speed: 0.55, phase: 3.8 },
  { hue: 42, radius: 5.2, size: 0.22, speed: 0.19, phase: 5 },
];

export function HeroCluster({ className = "" }: { className?: string }) {
  return (
    <Canvas
      dpr={[1, 1.8]}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [0, 1.2, 9], fov: 50 }}
      className={className}
    >
      <ambientLight intensity={0.6} />
      <pointLight position={[4, 5, 7]} intensity={90} distance={40} color="#00e5ff" />
      <pointLight position={[-6, -3, 6]} intensity={70} distance={40} color="#a855f7" />
      <pointLight position={[0, -6, 2]} intensity={45} distance={30} color="#ff3d81" />
      <Core />
      {ORBS.map((orb, index) => (
        <Orb key={index} {...orb} />
      ))}
    </Canvas>
  );
}
