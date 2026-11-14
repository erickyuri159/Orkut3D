"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = /* glsl */ `
  uniform float uTime;
  varying vec3 vNormalW;
  varying vec3 vPos;
  varying float vDisp;

  float hash(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
  }

  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
      f.z
    );
  }

  void main() {
    vPos = position;
    float n = noise(normalize(position) * 3.4 + vec3(0.0, uTime * 0.35, 0.0));
    vDisp = n;
    vec3 displaced = position + normal * n * 0.14;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying vec3 vNormalW;
  varying vec3 vPos;
  varying float vDisp;

  void main() {
    vec3 normal = normalize(vNormalW);
    float fresnel = pow(1.0 - clamp(dot(normal, vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 2.4);

    float bands = smoothstep(0.35, 0.75, sin(vPos.y * 14.0 - uTime * 1.6) * 0.5 + 0.5);

    vec3 base = mix(uColorA, uColorB, clamp(vDisp * 1.3, 0.0, 1.0));
    vec3 color = base * 0.35;
    color += uColorA * fresnel * 1.5;
    color += uColorB * bands * 0.28;
    color += vec3(0.9, 0.98, 1.0) * pow(fresnel, 4.0) * 0.8;

    gl_FragColor = vec4(color, 0.92);
  }
`;

function Orb({ seed }: { seed: number }) {
  const group = useRef<THREE.Group>(null);
  const shellRef = useRef<THREE.ShaderMaterial>(null);
  const ringA = useRef<THREE.Mesh>(null);
  const ringB = useRef<THREE.Mesh>(null);
  const ringC = useRef<THREE.Mesh>(null);

  const { uniforms, colorA, colorB } = useMemo(() => {
    const hue = (seed % 360) / 360;
    const a = new THREE.Color().setHSL(hue, 0.92, 0.58);
    const b = new THREE.Color().setHSL((hue + 0.42) % 1, 0.95, 0.62);
    return {
      uniforms: {
        uTime: { value: 0 },
        uColorA: { value: a },
        uColorB: { value: b },
      },
      colorA: a,
      colorB: b,
    };
  }, [seed]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (group.current) {
      group.current.rotation.y += delta * 0.32;
      group.current.position.y = Math.sin(t * 0.9) * 0.07;
    }
    if (shellRef.current) shellRef.current.uniforms.uTime.value = t;
    if (ringA.current) {
      ringA.current.rotation.z += delta * 0.7;
      ringA.current.rotation.x = 1.15 + Math.sin(t * 0.5) * 0.15;
    }
    if (ringB.current) {
      ringB.current.rotation.z -= delta * 1.05;
      ringB.current.rotation.y = 0.7 + Math.cos(t * 0.42) * 0.25;
    }
    if (ringC.current) {
      ringC.current.rotation.x += delta * 0.5;
      ringC.current.rotation.z = 0.4;
    }
  });

  return (
    <group ref={group}>
      <mesh>
        <icosahedronGeometry args={[1, 32]} />
        <shaderMaterial
          ref={shellRef}
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent
        />
      </mesh>

      <mesh ref={ringA}>
        <torusGeometry args={[1.55, 0.012, 12, 120]} />
        <meshBasicMaterial color={colorA} transparent opacity={0.85} />
      </mesh>
      <mesh ref={ringB}>
        <torusGeometry args={[1.82, 0.008, 12, 120]} />
        <meshBasicMaterial color={colorB} transparent opacity={0.6} />
      </mesh>
      <mesh ref={ringC}>
        <torusGeometry args={[2.08, 0.005, 10, 120]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.28} />
      </mesh>

      <points>
        <sphereGeometry args={[2.3, 32, 24]} />
        <pointsMaterial
          size={0.035}
          color={colorB}
          transparent
          opacity={0.75}
          sizeAttenuation
          depthWrite={false}
        />
      </points>

      <pointLight color={colorA} intensity={9} distance={12} />
    </group>
  );
}

export function AvatarOrb({ seed = 0, className = "" }: { seed?: number; className?: string }) {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [0, 0, 4.6], fov: 46 }}
      className={className}
    >
      <Orb seed={seed} />
    </Canvas>
  );
}
