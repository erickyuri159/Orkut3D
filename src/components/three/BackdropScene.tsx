"use client";

import { Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, Float } from "@react-three/drei";
import { NebulaShell, DataStream, WireMonolith } from "./ScenePrimitives";

function CameraDrift() {
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    state.camera.position.x = Math.sin(t * 0.08) * 1.4;
    state.camera.position.y = Math.cos(t * 0.06) * 0.9;
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

/** Cena de fundo global: nebulosa procedural + estrelas + fluxo de dados. */
export function BackdropScene() {
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 11], fov: 58 }}
      className="!fixed inset-0"
    >
      <color attach="background" args={["#04060f"]} />
      <fog attach="fog" args={["#04060f", 14, 46]} />

      <Suspense fallback={null}>
        <CameraDrift />
        <NebulaShell radius={62} intensity={1.1} />
        <Stars radius={70} depth={30} count={2600} factor={3.4} saturation={0} fade speed={0.6} />
        <DataStream count={280} spread={34} />

        <Float speed={1.1} rotationIntensity={0.25} floatIntensity={1.4}>
          <WireMonolith position={[-9.5, 2.4, -16]} scale={2.4} color="#00e5ff" geometry="icosahedron" />
          <WireMonolith position={[10.5, -2.8, -20]} scale={3.1} color="#a855f7" geometry="torus" speed={0.14} />
          <WireMonolith position={[7.5, 4.2, -24]} scale={1.7} color="#ff3d81" geometry="octahedron" speed={0.3} />
          <WireMonolith position={[-8, -4.5, -26]} scale={2.1} color="#7cff4f" geometry="dodecahedron" speed={0.18} />
        </Float>

        <ambientLight intensity={0.5} />
        <pointLight position={[6, 6, 8]} intensity={60} color="#00e5ff" distance={40} />
        <pointLight position={[-8, -5, 6]} intensity={45} color="#a855f7" distance={40} />
      </Suspense>
    </Canvas>
  );
}
