"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** Esfera de nebulosa procedural: plasma fBm em shader, vista por dentro. */
export function NebulaShell({
  radius = 60,
  intensity = 1,
  speed = 0.02,
}: {
  radius?: number;
  intensity?: number;
  speed?: number;
}) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: intensity },
      uSpeed: { value: speed },
    }),
    [intensity, speed],
  );

  const vertexShader = useMemo(
    () => `
      varying vec3 vPos;
      varying vec3 vNormalW;
      void main() {
        vPos = position;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    [],
  );

  const fragmentShader = useMemo(
    () => `
      uniform float uTime;
      uniform float uIntensity;
      uniform float uSpeed;
      varying vec3 vPos;
      varying vec3 vNormalW;

      vec3 hash3(vec3 p) {
        p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
                 dot(p, vec3(269.5, 183.3, 246.1)),
                 dot(p, vec3(113.5, 271.9, 124.6)));
        return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
      }

      float noise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        vec3 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(dot(hash3(i + vec3(0,0,0)), f - vec3(0,0,0)),
                           dot(hash3(i + vec3(1,0,0)), f - vec3(1,0,0)), u.x),
                       mix(dot(hash3(i + vec3(0,1,0)), f - vec3(0,1,0)),
                           dot(hash3(i + vec3(1,1,0)), f - vec3(1,1,0)), u.x), u.y),
                   mix(mix(dot(hash3(i + vec3(0,0,1)), f - vec3(0,0,1)),
                           dot(hash3(i + vec3(1,0,1)), f - vec3(1,0,1)), u.x),
                       mix(dot(hash3(i + vec3(0,1,1)), f - vec3(0,1,1)),
                           dot(hash3(i + vec3(1,1,1)), f - vec3(1,1,1)), u.x), u.y), u.z);
      }

      float fbm(vec3 p) {
        float total = 0.0;
        float amplitude = 0.5;
        for (int i = 0; i < 5; i++) {
          total += amplitude * noise(p);
          p *= 2.02;
          amplitude *= 0.5;
        }
        return total;
      }

      void main() {
        vec3 dir = normalize(vPos);
        float t = uTime * uSpeed;
        float base = fbm(dir * 2.2 + vec3(0.0, t * 0.6, t * 0.25));
        float detail = fbm(dir * 6.5 - vec3(t * 0.3, t * 0.15, 0.0));

        float density = smoothstep(-0.15, 0.62, base + detail * 0.35);

        vec3 deep = vec3(0.016, 0.027, 0.078);
        vec3 cyan = vec3(0.0, 0.72, 1.0);
        vec3 violet = vec3(0.44, 0.12, 0.85);
        vec3 magenta = vec3(0.95, 0.13, 0.42);

        vec3 color = mix(deep, violet, smoothstep(0.0, 0.55, density));
        color = mix(color, cyan, smoothstep(0.35, 0.85, density) * 0.7);
        color = mix(color, magenta, smoothstep(0.72, 1.0, density) * 0.55);

        float rim = pow(1.0 - abs(dot(normalize(vNormalW), vec3(0.0, 0.0, 1.0))), 2.0);
        color += vec3(0.02, 0.06, 0.12) * rim;

        float stars = step(0.9985, fract(sin(dot(dir * 91.7, vec3(12.9898, 78.233, 37.719))) * 43758.5453));
        color += stars * vec3(0.9, 0.98, 1.0) * 1.6;

        gl_FragColor = vec4(color * uIntensity, 1.0);
      }
    `,
    [],
  );

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <mesh scale={radius}>
      <sphereGeometry args={[1, 64, 48]} />
      <shaderMaterial
        ref={materialRef}
        side={THREE.BackSide}
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  );
}

/** PRNG deterministico: mesma cena em toda renderizacao, sem Math.random. */
function pseudoRandom(index: number, salt: number) {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

/** Feixe de partículas que flutua em direção ao observador. */
export function DataStream({ count = 260, spread = 26 }: { count?: number; spread?: number }) {
  const ref = useRef<THREE.Points>(null);

  const { positions, colors, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const palette = [
      new THREE.Color("#00e5ff"),
      new THREE.Color("#a855f7"),
      new THREE.Color("#ff3d81"),
      new THREE.Color("#7cff4f"),
    ];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (pseudoRandom(i, 1) - 0.5) * spread;
      positions[i * 3 + 1] = (pseudoRandom(i, 2) - 0.5) * spread;
      positions[i * 3 + 2] = (pseudoRandom(i, 3) - 0.5) * spread;
      const color = palette[Math.floor(pseudoRandom(i, 4) * palette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      seeds[i] = pseudoRandom(i, 5);
    }
    return { positions, colors, seeds };
  }, [count, spread]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [positions, colors]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    const attr = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    const array = attr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      array[i * 3 + 1] += (0.12 + seeds[i] * 0.35) * delta;
      if (array[i * 3 + 1] > spread / 2) array[i * 3 + 1] = -spread / 2;
    }
    attr.needsUpdate = true;
    ref.current.rotation.y = state.clock.elapsedTime * 0.012;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        size={0.09}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/** Poliedro de arame neon girando devagar — usado como ornamento da cena. */
export function WireMonolith({
  position = [0, 0, 0] as [number, number, number],
  scale = 1,
  color = "#00e5ff",
  speed = 0.22,
  geometry = "icosahedron" as "icosahedron" | "octahedron" | "torus" | "dodecahedron",
}: {
  position?: [number, number, number];
  scale?: number;
  color?: string;
  speed?: number;
  geometry?: "icosahedron" | "octahedron" | "torus" | "dodecahedron";
}) {
  const group = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!group.current) return;
    group.current.rotation.x += delta * speed * 0.6;
    group.current.rotation.y += delta * speed;
  });

  return (
    <group ref={group} position={position} scale={scale}>
      {geometry === "torus" ? (
        <mesh>
          <torusKnotGeometry args={[1, 0.32, 128, 20]} />
          <meshBasicMaterial color={color} wireframe transparent opacity={0.22} />
        </mesh>
      ) : (
        <mesh>
          {geometry === "icosahedron" && <icosahedronGeometry args={[1.4, 0]} />}
          {geometry === "octahedron" && <octahedronGeometry args={[1.5, 0]} />}
          {geometry === "dodecahedron" && <dodecahedronGeometry args={[1.35, 0]} />}
          <meshBasicMaterial color={color} wireframe transparent opacity={0.2} />
        </mesh>
      )}
    </group>
  );
}
