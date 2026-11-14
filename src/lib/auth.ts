import { cookies } from "next/headers";
import { cache } from "react";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const COOKIE = "orb_session";
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "orb2088-dev-secret-troque-em-producao",
);

export type SessionUser = {
  id: string;
  uid: string;
  name: string;
  username: string;
  avatarSeed: string;
  credits: number;
};

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}
export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function readSessionUserId(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

/** Usuario da sessao (memoizado por request). */
export const currentUser = cache(async (): Promise<SessionUser | null> => {
  const id = await readSessionUserId();
  if (!id) return null;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      uid: true,
      name: true,
      username: true,
      avatarSeed: true,
      credits: true,
    },
  });
  return user;
});

export async function requireUser(): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export const SESSION_COOKIE = COOKIE;
