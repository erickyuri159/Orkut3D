import { SignJWT } from "jose";
import { PrismaClient } from "@prisma/client";

const BASE = process.env.BASE ?? "http://localhost:4502";
const prisma = new PrismaClient();
const user = await prisma.user.findUniqueOrThrow({
  where: { username: process.env.USER ?? "erick" },
  select: { id: true },
});
const secret = new TextEncoder().encode(
  "orb2088-dev-secret-troque-em-producao-0000000000000000000",
);
const token = await new SignJWT({ sub: user.id })
  .setProtectedHeader({ alg: "HS256" })
  .setIssuedAt()
  .setExpirationTime("30d")
  .sign(secret);
await prisma.$disconnect();

const routes = [
  "/",
  "/login",
  "/app/feed",
  "/app/amigos",
  "/app/cutucadas",
  "/app/mensagens",
  "/app/comunidades",
  "/app/comunidades/vaporwave-brasil",
  "/app/classificados",
  "/app/ranking",
  "/app/notificacoes",
  "/app/config",
  "/app/busca?q=vapor",
  "/app/profile/1000-2000-3000",
  "/api/health",
];

for (const theme of ["holo", "noite", "klass"]) {
  const codes = [];
  for (const route of routes) {
    const res = await fetch(`${BASE}${route}`, {
      redirect: "manual",
      headers: {
        cookie: `orb_session=${token}; orb_theme=${theme}`,
      },
    });
    codes.push(res.status);
  }
  const bad = codes.map((c, i) => [routes[i], c]).filter(([, c]) => c !== 200 && c !== 307);
  console.log(`${theme.padEnd(6)} ${codes.join(" ")}`);
  if (bad.length) console.log(`       NAO 200: ${bad.map(([r, c]) => `${r}=${c}`).join(", ")}`);
}

const media = await fetch(`${BASE}/api/media/032e9228/c24820b46c274396807084412a2080d8.webp`, {
  headers: { cookie: `orb_session=${token}` },
});
console.log(`\nmidia: ${media.status} ${media.headers.get("content-type")}`);
