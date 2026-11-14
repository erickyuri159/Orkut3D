/**
 * Regras de negocio puras — sem banco, sem request, sem React.
 * Tudo que decide "pode" ou "nao pode" mora aqui para ser testado isolado.
 */

export const POKE_COOLDOWN_MS = 1000 * 60 * 60 * 3;
export const POKE_CREDIT_COST = 2;
export const SCRAP_MAX_LENGTH = 900;
export const SCRAP_COMMENT_MAX_LENGTH = 400;
export const SHOUT_MAX_LENGTH = 500;
export const MESSAGE_MAX_LENGTH = 2000;
export const COMMUNITY_POST_MAX_LENGTH = 6000;
export const COMMUNITY_COMMENT_MAX_LENGTH = 2000;
export const PROFILE_VIEW_WINDOW_MS = 1000 * 60 * 30;

export type FriendState = "none" | "sent" | "received" | "friends";

/** Um scrap so e visivel para o dono do perfil, o autor, ou se nao for privado. */
export function canViewScrap(input: {
  isPrivate: boolean;
  profileId: string;
  authorId: string;
  viewerId: string | null;
}) {
  if (!input.isPrivate) return true;
  if (!input.viewerId) return false;
  return input.viewerId === input.profileId || input.viewerId === input.authorId;
}

/**
 * Filtro de visibilidade, no formato de `where` do Prisma.
 * Recebe o UID do perfil porque o ID interno ainda nao existe nessa query.
 *
 * IMPORTANTE: o retorno precisa ser usado como `where:` dentro do include
 * aninhado. Espalhar no nivel dos argumentos faz o Prisma reclamar
 * "Unknown argument".
 */
export function scrapVisibilityWhere(profileUid: string, viewerId: string | null) {
  const profile = { uid: profileUid };
  if (!viewerId) return { profile, private: false };
  return {
    profile,
    OR: [{ private: false }, { authorId: viewerId }, { profile }],
  };
}

export type FriendshipLink = {
  id: string;
  status: string;
  requesterId: string;
  addresseeId: string;
};

/** Estado do vinculo entre viewer e target a partir das linhas de Friendship. */
export function resolveFriendState(
  links: FriendshipLink[],
  viewerId: string,
  targetId: string,
): { state: FriendState; friendshipId: string | null } {
  let state: FriendState = "none";
  let friendshipId: string | null = null;

  for (const link of links) {
    if (link.requesterId !== targetId && link.addresseeId !== targetId) continue;
    friendshipId = link.id;
    if (link.status === "ACCEPTED") state = "friends";
    else if (link.requesterId === viewerId) state = "sent";
    else state = "received";
  }

  return { state, friendshipId };
}

/** O poke ainda esta em resfriamento? */
export function isPokeCoolingDown(lastPokeAt: Date | null | undefined, now: number) {
  if (!lastPokeAt) return false;
  return now - lastPokeAt.getTime() < POKE_COOLDOWN_MS;
}

export function pokeCooldownRemainingMs(lastPokeAt: Date | null | undefined, now: number) {
  if (!lastPokeAt) return 0;
  return Math.max(0, POKE_COOLDOWN_MS - (now - lastPokeAt.getTime()));
}

/**
 * Quem pode moderar um topico: o dono da comunidade, um moderador,
 * ou o proprio autor do topico (para apagar o proprio post).
 */
export function canModeratePost(input: {
  communityOwnerId: string;
  postAuthorId: string;
  viewerId: string;
  memberRole?: string | null;
}) {
  if (input.viewerId === input.communityOwnerId) return true;
  if (input.memberRole === "MODERATOR") return true;
  return input.viewerId === input.postAuthorId;
}

/** Deletar exige permissao; fixar e trancar sao so da moderacao. */
export function canApplyPostAction(
  action: "delete" | "pin" | "lock",
  input: {
    communityOwnerId: string;
    postAuthorId: string;
    viewerId: string;
    memberRole?: string | null;
  },
) {
  if (action === "delete") return canModeratePost(input);
  return input.viewerId === input.communityOwnerId || input.memberRole === "MODERATOR";
}

/** Uma visita so conta uma vez por janela, por visitante. */
export function shouldCountVisit(lastVisitAt: Date | null | undefined, now: number) {
  if (!lastVisitAt) return true;
  return now - lastVisitAt.getTime() >= PROFILE_VIEW_WINDOW_MS;
}

/**
 * Preco: invalido ou negativo vira null (a acao rejeita).
 * Atencao: null/vazio NAO viram 0 — um campo em branco e erro de digitacao,
 * nao "de graca". Number(null) seria 0 e criaria anuncios de R$ 0,00.
 */
export function normalizePrice(value: unknown) {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim() === "") return null;

  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;

  // toFixed arredonda em decimal, ao contrario de Math.round(x*100)/100
  // que erra em casos como 1.005 por causa da representacao binaria.
  return Number(parsed.toFixed(2));
}

/**
 * Valida e NORMALIZA texto.
 * Texto acima do maximo e rejeitado (nao truncado silenciosamente): o form
 * ja tem maxLength, entao isso so acontece em request forjado, e recusar e
 * mais seguro do que postar conteudo diferente do que a pessoa digitou.
 */
export function validateText(
  value: unknown,
  options: { min?: number; max: number },
): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof value !== "string") return { ok: false, error: "Conteudo invalido" };
  const trimmed = value.trim();
  const min = options.min ?? 1;
  if (trimmed.length < min) {
    return { ok: false, error: `Escreva ao menos ${min} caractere(s)` };
  }
  if (trimmed.length > options.max) {
    return { ok: false, error: `Maximo de ${options.max} caracteres` };
  }
  return { ok: true, value: trimmed };
}

/** Creditos nunca ficam negativos. */
export function creditsAfterPoke(current: number, cost = POKE_CREDIT_COST) {
  return Math.max(0, current - cost);
}

export function hasEnoughCredits(current: number, cost = POKE_CREDIT_COST) {
  return current >= cost;
}