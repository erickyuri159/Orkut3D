"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/auth";
import { hashCode, publicUid } from "@/lib/format";
import { LIMITS, consume, humanizeRetry } from "@/lib/rate-limit";
import { ipKey } from "@/lib/request";
import { createLogger } from "@/lib/logger";

const authLog = createLogger("auth");

const registerSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(60),
  email: z.string().trim().toLowerCase().email("E-mail invalido"),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Minimo 3 letras")
    .max(20, "Maximo 20 letras")
    .regex(/^[a-z0-9_.]+$/, "Use apenas letras, numeros, ponto e _"),
  password: z.string().min(6, "Minimo 6 caracteres").max(200),
});

export type AuthState = { error?: string } | null;

export async function registerAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const limit = consume(await ipKey("register"), LIMITS.register);
  if (!limit.ok) {
    return { error: `Muitas tentativas de cadastro. Tente ${humanizeRetry(limit.retryInMs)}.` };
  }

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados invalidos" };
  }

  const { name, email, username, password } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { email: true, username: true },
  });
  if (existing) {
    authLog.warn("cadastro com dado ja existente", {
      username,
      email,
      conflict: existing.email === email ? "email" : "username",
    });
    return {
      error:
        existing.email === email
          ? "Esse e-mail ja esta cadastrado"
          : "Esse username ja esta em uso",
    };
  }

  await prisma.user.create({
    data: {
      name,
      email,
      username,
      passwordHash: await bcrypt.hash(password, 10),
      uid: publicUid(),
      avatarSeed: String(hashCode(username) % 360),
      headline: "Acabei de chegar no ORB // 2088",
      bio: "Espaco recem-criado. Me encontra nas comunidades!",
      quote: "A rede social nao morreu — so estava esperando um novo renderizador.",
    },
  });

  authLog.info("conta criada", { username });

  const user = await prisma.user.findUniqueOrThrow({
    where: { email },
    select: { id: true },
  });
  await createSession(user.id);
  redirect("/app/feed");
}

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const limit = consume(await ipKey("login"), LIMITS.login);
  if (!limit.ok) {
    return { error: `Muitas tentativas de login. Tente ${humanizeRetry(limit.retryInMs)}.` };
  }

  const identifier = String(formData.get("identifier") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!identifier || !password) {
    return { error: "Preencha usuario/e-mail e senha" };
  }

  const user = await prisma.user.findFirst({
    where: { OR: [{ email: identifier }, { username: identifier }] },
    select: { id: true, passwordHash: true },
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    authLog.warn("login recusado", { identifier });
    return { error: "Credenciais invalidas" };
  }

  authLog.info("login ok", { userId: user.id });
  await createSession(user.id);
  redirect("/app/feed");
}

export async function logoutAction() {
  authLog.info("logout");
  await destroySession();
  redirect("/");
}