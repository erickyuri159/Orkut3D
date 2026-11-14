"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { randomThumb } from "@/lib/format";
import { POKE_KINDS } from "@/lib/enums";
import { notify } from "@/lib/notify";
import { createLogger } from "@/lib/logger";

const socialLog = createLogger("social");
import { LIMITS, consume, humanizeRetry } from "@/lib/rate-limit";
import {
  SCRAP_COMMENT_MAX_LENGTH,
  SCRAP_MAX_LENGTH,
  creditsAfterPoke,
  hasEnoughCredits,
  isPokeCoolingDown,
  pokeCooldownRemainingMs,
  validateText,
} from "@/lib/rules";

export async function sendFriendRequest(targetUid: string) {
  const me = await requireUser();

  const limit = consume(`friendRequest:${me.id}`, LIMITS.friendRequest);
  if (!limit.ok) {
    return { error: `Muitos pedidos enviados. Tente ${humanizeRetry(limit.retryInMs)}.` };
  }

  if (targetUid === me.uid) return { error: "Voce nao pode se adicionar" };

  const target = await prisma.user.findUnique({
    where: { uid: targetUid },
    select: { id: true, name: true, uid: true },
  });
  if (!target) return { error: "Perfil nao encontrado" };

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: me.id, addresseeId: target.id },
        { requesterId: target.id, addresseeId: me.id },
      ],
    },
  });
  if (existing) return { error: "Voces ja estao conectados" };

  await prisma.friendship.create({
    data: { requesterId: me.id, addresseeId: target.id, status: "PENDING" },
  });
  socialLog.info("pedido de amizade", { from: me.id, to: target.id });

  await notify({
    userId: target.id,
    actorId: me.id,
    type: "friend_request",
    body: `${me.name} quer ser seu amigo no ORB // 2088`,
    href: "/app/amigos",
  });

  revalidatePath(`/app/profile/${targetUid}`);
  return { ok: true };
}

export async function respondFriendRequest(friendshipId: string, accept: boolean) {
  const me = await requireUser();

  const friendship = await prisma.friendship.findUnique({
    where: { id: friendshipId },
    include: { requester: { select: { id: true, name: true, uid: true } } },
  });
  if (!friendship || friendship.addresseeId !== me.id) {
    return { error: "Pedido invalido" };
  }

  if (!accept) {
    await prisma.friendship.delete({ where: { id: friendshipId } });
    revalidatePath("/app/amigos");
    return { ok: true };
  }

  await prisma.friendship.update({
    where: { id: friendshipId },
    data: { status: "ACCEPTED", respondedAt: new Date() },
  });

  await notify({
    userId: friendship.requester.id,
    actorId: me.id,
    type: "friend_accepted",
    body: `${me.name} aceitou seu pedido de amizade`,
    href: `/app/profile/${me.uid}`,
  });

  revalidatePath("/app/amigos");
  revalidatePath(`/app/profile/${friendship.requester.uid}`);
  return { ok: true };
}

export async function unfriend(friendshipId: string) {
  const me = await requireUser();

  const friendship = await prisma.friendship.findUnique({ where: { id: friendshipId } });
  if (!friendship) return { error: "Conexao invalida" };
  if (friendship.requesterId !== me.id && friendship.addresseeId !== me.id) {
    return { error: "Conexao invalida" };
  }

  await prisma.friendship.delete({ where: { id: friendshipId } });
  revalidatePath("/app/amigos");
  return { ok: true };
}

export async function sendPoke(targetUid: string, kind: string) {
  const me = await requireUser();

  const limit = consume(`poke:${me.id}`, LIMITS.poke);
  if (!limit.ok) {
    return { error: `Voce cutucou demais. Tente ${humanizeRetry(limit.retryInMs)}.` };
  }

  if (targetUid === me.uid) return { error: "Nao e possivel se cutucar" };

  const pokeKind = POKE_KINDS.some((p) => p.id === kind) ? kind : "poke";

  const target = await prisma.user.findUnique({
    where: { uid: targetUid },
    select: { id: true, name: true, credits: true },
  });
  if (!target) return { error: "Perfil nao encontrado" };

  const recent = await prisma.poke.findFirst({
    where: { fromId: me.id, toId: target.id },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  const now = Date.now();
  if (isPokeCoolingDown(recent?.createdAt, now)) {
    const wait = pokeCooldownRemainingMs(recent?.createdAt, now);
    return {
      error: `Voce ja cutucou essa pessoa. Tente ${humanizeRetry(wait)}.`,
    };
  }

  if (!hasEnoughCredits(me.credits)) {
    return { error: "Creditos insuficientes para cutucar." };
  }

  await prisma.poke.create({ data: { fromId: me.id, toId: target.id, kind: pokeKind } });
  socialLog.info("poke enviado", { from: me.id, to: target.id, kind: pokeKind });
  await prisma.user.update({
    where: { id: me.id },
    data: { credits: { set: creditsAfterPoke(me.credits) } },
  });

  const label = POKE_KINDS.find((p) => p.id === pokeKind);
  await notify({
    userId: target.id,
    actorId: me.id,
    type: "poke",
    body: `${me.name} ${label?.verb ?? "cutucou"} voce! ${label?.emoji ?? ""}`,
    href: `/app/profile/${targetUid}`,
  });

  revalidatePath("/app/cutucadas");
  revalidatePath(`/app/profile/${targetUid}`);
  return { ok: true, kind: pokeKind };
}

export async function pokeBack(pokeId: string) {
  const me = await requireUser();

  const poke = await prisma.poke.findUnique({
    where: { id: pokeId },
    include: { from: { select: { id: true, uid: true, name: true } } },
  });
  if (!poke || poke.toId !== me.id || poke.seenAt) {
    return { error: "Poke indisponivel" };
  }

  await prisma.poke.update({ where: { id: pokeId }, data: { seenAt: new Date() } });
  revalidatePath("/app/cutucadas");
  return { ok: true, targetUid: poke.from.uid, targetName: poke.from.name };
}

export async function leaveScrap(profileUid: string, formData: FormData) {
  const me = await requireUser();

  const limit = consume(`scrap:${me.id}`, LIMITS.scrap);
  if (!limit.ok) {
    return { error: `Muitos scraps enviados. Tente ${humanizeRetry(limit.retryInMs)}.` };
  }

  const message = validateText(formData.get("message"), {
    min: 2,
    max: SCRAP_MAX_LENGTH,
  });
  if (!message.ok) return { error: message.error };

  const profile = await prisma.user.findUnique({
    where: { uid: profileUid },
    select: { id: true, name: true },
  });
  if (!profile) return { error: "Perfil nao encontrado" };
  if (profile.id === me.id) {
    return { error: "Voce nao deixa scrap em si mesmo. Nao funciona." };
  }

  const thumb = (clampShort(formData.get("thumb"), 8)) || randomThumb();
  const isPrivate = formData.get("private") === "on";

  socialLog.info("scrap criado", { from: me.id, to: profile.id, private: isPrivate });

  await prisma.scrap.create({
    data: {
      profileId: profile.id,
      authorId: me.id,
      message: message.value,
      thumb,
      private: isPrivate,
    },
  });

  await notify({
    userId: profile.id,
    actorId: me.id,
    type: "scrap",
    body: isPrivate
      ? `${me.name} deixou um scrap privado no seu perfil`
      : `${me.name} deixou um scrap no seu perfil`,
    href: `/app/profile/${profileUid}`,
  });

  revalidatePath(`/app/profile/${profileUid}`);
  return { ok: true };
}

export async function deleteScrap(scrapId: string) {
  const me = await requireUser();

  const scrap = await prisma.scrap.findUnique({
    where: { id: scrapId },
    include: { profile: { select: { uid: true } } },
  });
  if (!scrap) return { error: "Scrap inexistente" };
  if (scrap.authorId !== me.id && scrap.profileId !== me.id) {
    return { error: "Sem permissao" };
  }

  await prisma.scrap.delete({ where: { id: scrapId } });
  revalidatePath(`/app/profile/${scrap.profile.uid}`);
  return { ok: true };
}

export async function commentScrap(scrapId: string, formData: FormData) {
  const me = await requireUser();

  const body = validateText(formData.get("body"), {
    min: 1,
    max: SCRAP_COMMENT_MAX_LENGTH,
  });
  if (!body.ok) return { error: body.error };

  const scrap = await prisma.scrap.findUnique({
    where: { id: scrapId },
    include: { profile: { select: { uid: true } } },
  });
  if (!scrap) return { error: "Scrap inexistente" };

  await prisma.scrapComment.create({
    data: { scrapId, authorId: me.id, body: body.value },
  });

  revalidatePath(`/app/profile/${scrap.profile.uid}`);
  return { ok: true };
}

export async function markNotificationsRead() {
  const me = await requireUser();

  await prisma.notification.updateMany({
    where: { userId: me.id, readAt: null },
    data: { readAt: new Date() },
  });

  revalidatePath("/app/notificacoes");
  revalidatePath("/app", "layout");
  return { ok: true };
}

function clampShort(value: FormDataEntryValue | null, max: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}