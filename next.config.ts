import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * CSP pensada para este app:
 * - WebGL precisa de 'unsafe-eval' em dev (Turbopack) mas nao em producao
 * - 'unsafe-inline' em style-src: Next/Tailwind injetam style tags
 * - fonts do Google sao carregados via <link>, entao font-src precisa deles
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' blob: data: ws: wss:",
  "media-src 'self' blob: data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  isDev ? "" : "upgrade-insecure-requests",
]
  .filter(Boolean)
  .join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    // microphone/geometer NAO sao usados; camera tambem nao (avatares sao procedurais)
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["three"],
  async headers() {
    return [
      {
        // /api/media fica de fora de proposito: aquela rota define um CSP bem
        // mais restritivo (sandbox, sem scripts) e o header global sobrescreve.
        source: "/((?!api/media).*)",
        headers: securityHeaders,
      },
      {
        source: "/api/media/:path*",
        headers: [
          { key: "Content-Security-Policy", value: "default-src 'none'; sandbox; img-src 'self'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [{ key: "X-Content-Type-Options", value: "nosniff" }],
      },
    ];
  },
};

export default nextConfig;