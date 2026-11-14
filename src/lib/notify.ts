import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { safeHref } from "@/lib/routes";

export type NotifyInput = {
  userId: string;
  actorId: string;
  type: string;
  body: string;
  href: string;
};

export const NOTIFICATION_TYPES = [
  "poke",
  "scrap",
  "message",
  "friend_request",
  "friend_accepted",
  "shout",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/**
 * Grava notificacoes sempre revalidando o LAYOUT, e nao so a rota.
 *
 * O contador do sino vive em src/app/app/layout.tsx. Se revalidarmos apenas
 * "/app/mensagens", o layout nao e reconstruido e o usuario nao ve o badge
 * mudar — foi exatamente o bug reportado.
 */
export async function notify(inputs: NotifyInput | NotifyInput[]) {
  const batch = Array.isArray(inputs) ? inputs : [inputs];
  if (batch.length === 0) return;

  const rows = batch.map((input) => ({
    userId: input.userId,
    actorId: input.actorId,
    type: input.type,
    body: input.body,
    href: safeHref(input.href),
  }));

  await prisma.notification.createMany({ data: rows });

  // Destinos que mudaram junto com a notificacao.
  const touched = new Set(
    rows.flatMap((row) => [safeHref(row.href).split("?")[0], "/app/notificacoes"]),
  );

  for (const path of touched) {
    revalidatePath(path);
  }
  // O sino vive no layout: sem isso o badge fica congelado.
  revalidatePath("/app", "layout");
}

export async function notifyFriends(
  friendIds: string[],
  base: Omit<NotifyInput, "userId">,
) {
  if (friendIds.length === 0) return;
  await notify(friendIds.map((userId) => ({ ...base, userId })));
}