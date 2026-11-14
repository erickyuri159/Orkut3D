"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * VISTAS — o wallpaper procedural do perfil.
 *
 * Cada pessoa recebe uma vista diferente derivada da seed do perfil:
 * ceu degradê, sol com fendas, montanhas por fBm, mar de grade em perspectiva,
 * estrelas piscando, varredura e grão. Tudo em um único fragment shader.
 */

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uSeed;
  uniform vec2  uResolution;
  uniform float uClassic;

  varying vec2 vUv;

  float hash11(float p) {
    p = fract(p * 0.1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
  }

  float hash21(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float total = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 5; i++) {
      total += amp * valueNoise(p);
      p = p * 2.03 + vec2(1.7, 9.2);
      amp *= 0.5;
    }
    return total;
  }

  vec3 hueShift(vec3 color, float angle) {
    const vec3 k = vec3(0.57735);
    float cosA = cos(angle);
    return color * cosA + cross(k, color) * sin(angle) + k * dot(k, color) * (1.0 - cosA);
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 p = vec2((uv.x - 0.5) * aspect, uv.y);
    float t = uTime * 0.06;

    float h1 = hash11(uSeed + 1.0);
    float h2 = hash11(uSeed + 2.0);
    float h3 = hash11(uSeed + 3.0);
    float h4 = hash11(uSeed + 4.0);

    float horizon = 0.44 + (h1 - 0.5) * 0.10;
    vec2 sunCenter = vec2((h2 - 0.5) * 0.85 * aspect, horizon + 0.16 + h3 * 0.14);
    float sunRadius = 0.13 + h4 * 0.09;

    float sky = clamp((uv.y - horizon) / max(1.0 - horizon, 0.001), 0.0, 1.0);
    vec3 top = vec3(0.02, 0.02, 0.10);
    vec3 mid = mix(vec3(0.18, 0.05, 0.36), vec3(0.05, 0.20, 0.48), h1);
    vec3 low = mix(vec3(0.62, 0.10, 0.42), vec3(0.95, 0.36, 0.30), h2);

    vec3 color = mix(mix(low, mid, smoothstep(0.0, 0.55, sky)), top, smoothstep(0.45, 1.0, sky));

    vec2 starGrid = vec2(uv.x * aspect * 90.0, uv.y * 90.0);
    vec2 starCell = floor(starGrid);
    float starRand = hash21(starCell + uSeed);
    if (starRand > 0.965 && uv.y > horizon) {
      float twinkle = 0.5 + 0.5 * sin(uTime * (1.4 + starRand * 5.0) + starRand * 60.0);
      float local = length(fract(starGrid) - 0.5);
      color += vec3(0.9, 0.97, 1.0) * smoothstep(0.28, 0.0, local) * twinkle * 0.9;
    }

    float sunDist = length(p - sunCenter);
    float disc = smoothstep(sunRadius, sunRadius - 0.004, sunDist);
    float slit = step(0.42, fract((p.y - sunCenter.y) * 46.0 + t * 0.6));
    slit = mix(1.0, slit, smoothstep(-0.02, 0.16, sunRadius - sunDist));
    float sunGlow = smoothstep(sunRadius * 4.2, 0.0, sunDist) * 0.55;
    vec3 sunColor = mix(vec3(1.0, 0.86, 0.32), vec3(1.0, 0.24, 0.52), smoothstep(0.0, 1.0, sky * 0.6));
    color += sunColor * disc * slit * 1.25;
    color += sunColor * sunGlow;

    float ridge = fbm(vec2(p.x * 2.1 + h1 * 12.0, h2 * 30.0)) * 0.55
                + fbm(vec2(p.x * 5.3 + h3 * 20.0, h4 * 24.0)) * 0.22;
    float mountainTop = horizon + 0.015 + ridge * 0.14;
    float mountain = step(uv.y, mountainTop) * step(horizon - 0.22, uv.y);
    color = mix(color, mix(vec3(0.03, 0.02, 0.08), vec3(0.10, 0.04, 0.22), h3), mountain * 0.92);

    float below = step(horizon, 1.0 - uv.y);
    float floorY = horizon - uv.y;
    if (below > 0.5 && floorY > 0.0005) {
      float depth = 1.0 / floorY;
      vec2 gridUv = vec2(p.x * depth * 0.55, depth * 0.9 - t * 6.0);
      vec2 grid = abs(fract(gridUv) - 0.5);
      float lineWidth = 0.035 + depth * 0.0016;
      float lineX = smoothstep(lineWidth, 0.0, grid.x);
      float lineY = smoothstep(lineWidth * 0.7, 0.0, grid.y);
      float gridMask = max(lineX, lineY) * exp(-floorY * 3.4);

      vec3 floorBase = mix(vec3(0.02, 0.01, 0.07), vec3(0.10, 0.02, 0.16), h2);
      color = mix(color, floorBase, 0.94);
      color += vec3(0.35, 0.12, 0.75) * gridMask * 1.25;
      color += vec3(1.0, 0.32, 0.72) * gridMask * gridMask * 1.6;
      color += sunColor * exp(-floorY * 6.0) * 0.18;
    }

    color += sunColor * exp(-abs(uv.y - horizon) * 26.0) * 0.30;
    color = hueShift(color, (uSeed / 360.0) * 6.2831);

    float vignette = smoothstep(1.25, 0.25, length((uv - 0.5) * vec2(1.15, 1.0)));
    color *= mix(0.55, 1.0, vignette);

    float scan = 0.94 + 0.06 * sin(uv.y * uResolution.y * 1.6);
    color *= scan;

    float grain = hash21(uv * uResolution + fract(uTime) * 91.7);
    color += (grain - 0.5) * 0.045;

    color = pow(max(color, 0.0), vec3(0.92));

    if (uClassic > 0.5) {
      vec2 cell = floor(uv * uResolution / 3.0);
      float d = hash21(cell);
      color = floor(color * 6.0 + d * 0.8) / 6.0;
      color = mix(color, color.grb, 0.06);
      color = clamp(color * 1.05, 0.0, 1.0);
    }

    gl_FragColor = vec4(color, 1.0);
  }
`;

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

function VistaQuad({ seed, classic }: { seed: number; classic: boolean }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const width = useThree((state) => state.size.width);
  const height = useThree((state) => state.size.height);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSeed: { value: seed },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uClassic: { value: classic ? 1 : 0 },
    }),
    [seed, classic],
  );

  useFrame((_, delta) => {
    const material = materialRef.current;
    if (!material) return;
    material.uniforms.uTime.value += delta;
    material.uniforms.uSeed.value = seed;
    material.uniforms.uClassic.value = classic ? 1 : 0;
    material.uniforms.uResolution.value.set(width, height);
  });

  return (
    <mesh scale={[4, 4, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}

export function VistaRenderer({
  seed = 0,
  classic = false,
  className = "",
}: {
  seed?: number;
  classic?: boolean;
  className?: string;
}) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 2.4], fov: 65 }}
      className={className}
    >
      <VistaQuad seed={seed} classic={classic} />
    </Canvas>
  );
}
