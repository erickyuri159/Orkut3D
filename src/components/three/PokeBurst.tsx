"use client";

import { useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const RING_COLORS = ["#00e5ff", "#a855f7", "#ff3d81", "#7cff4f"];

function Shockwave({ trigger }: { trigger: number }) {
  const rings = useRef<THREE.Group>(null);
  const elapsed = useRef(99);
  const lastTrigger = useRef(trigger);

  useEffect(() => {
    if (lastTrigger.current !== trigger) {
      lastTrigger.current = trigger;
      elapsed.current = 0;
    }
  }, [trigger]);

  useFrame((_, delta) => {
    if (!rings.current) return;
    elapsed.current += delta;
    const t = elapsed.current;
    const active = t < 1.6;
    rings.current.visible = active;

    if (!active) return;

    rings.current.children.forEach((child, index) => {
      const mesh = child as THREE.Mesh;
      const local = Math.max(0, t - index * 0.16);
      mesh.scale.setScalar(0.4 + local * 5.4);
      const material = mesh.material as THREE.MeshBasicMaterial;
      material.opacity = Math.max(0, 0.85 - local * 0.6);
    });
  });

  return (
    <group ref={rings} visible={false}>
      {RING_COLORS.map((color) => (
        <mesh key={color}>
          <torusGeometry args={[1, 0.05, 10, 96]} />
          <meshBasicMaterial color={color} transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  );
}

/** Explosão tridimensional disparada quando você cutuca alguém. */
export function PokeBurst({ trigger }: { trigger: number }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-90">
      <Canvas
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 0, 6], fov: 50 }}
        style={{ pointerEvents: "none" }}
      >
        <ambientLight intensity={2.4} />
        <Shockwave trigger={trigger} />
      </Canvas>
    </div>
  );
}
