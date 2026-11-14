import { prisma } from "@/lib/prisma";
import { shouldCountVisit } from "@/lib/rules";

/** Registra visita ao perfil, no maximo uma a cada 30 minutos por visitante. */
export async function recordProfileVisit(profileId: string, visitorId: string) {
  const last = await prisma.profileVisit.findFirst({
    where: { profileId, visitorId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  const now = new Date();
  if (!shouldCountVisit(last?.createdAt, now.getTime())) return false;

  await prisma.profileVisit.create({ data: { profileId, visitorId } });
  await prisma.user.update({
    where: { id: profileId },
    data: { profileViews: { increment: 1 } },
  });
  return true;
}
