"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { storage } from "@/lib/storage";
import { createLogger } from "@/lib/logger";
import { LIMITS, consume, humanizeRetry } from "@/lib/rate-limit";

const logger = createLogger("media");

/** Apaga o registro e o arquivo. Sempre nos dois: banco sem arquivo e lixo. */
export async function deleteMedia(mediaId: string) {
  const me = await requireUser();

  const media = await prisma.media.findUnique({
    where: { id: mediaId },
    select: { id: true, key: true, userId: true, kind: true },
  });
  if (!media) return { error: "midia inexistente" };
  if (media.userId !== me.id) return { error: "sem permissao" };

  await prisma.media.delete({ where: { id: mediaId } });
  await storage.delete(media.key);

  logger.info("midia removida", { userId: me.id, key: media.key, kind: media.kind });
  revalidatePath(`/app/profile/${me.uid}`);
  revalidatePath("/app/config");
  return { ok: true };
}

/**
 * Define o avatar a partir de uma midia ja enviada.
 * O avatar 3D continua existindo como identidade; a foto substitui o
 * anel de fundo no cabecalho.
 */
export async function setAvatar(mediaId: string) {
  const me = await requireUser();

  const limit = consume(`avatar:${me.id}`, LIMITS.profileUpdate);
  if (!limit.ok) {
    return { error: `Muitas trocas seguidas. Tente ${humanizeRetry(limit.retryInMs)}.` };
  }

  const media = await prisma.media.findUnique({ where: { id: mediaId } });
  if (!media || media.userId !== me.id) return { error: "midia invalida" };

  await prisma.user.update({
    where: { id: me.id },
    data: { avatarUrl: `/api/media/${media.key}` },
  });

  logger.info("avatar atualizado", { userId: me.id, key: media.key });
  revalidatePath(`/app/profile/${me.uid}`);
  revalidatePath("/app/config");
  return { ok: true };
}

/** Remove o avatar, voltando para o fundo procedural. */
export async function clearAvatar() {
  const me = await requireUser();

  await prisma.user.update({ where: { id: me.id }, data: { avatarUrl: "" } });
  revalidatePath(`/app/profile/${me.uid}`);
  revalidatePath("/app/config");
  return { ok: true };
}