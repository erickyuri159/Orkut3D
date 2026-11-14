"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { clampText, hashCode, slugify } from "@/lib/format";
import { notify, notifyFriends } from "@/lib/notify";
import { LIMITS, consume, humanizeRetry } from "@/lib/rate-limit";
import {
  COMMUNITY_COMMENT_MAX_LENGTH,
  COMMUNITY_POST_MAX_LENGTH,
  MESSAGE_MAX_LENGTH,
  SHOUT_MAX_LENGTH,
  canApplyPostAction,
  normalizePrice,
  validateText,
} from "@/lib/rules";

async function friendIdsOf(userId: string) {
  const links = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    select: { requesterId: true, addresseeId: true },
  });
  return links.map((l) => (l.requesterId === userId ? l.addresseeId : l.requesterId));
}

export async function createShout(formData: FormData) {
  const me = await requireUser();

  const body = validateText(formData.get("body"), { min: 1, max: SHOUT_MAX_LENGTH });
  if (!body.ok) return { error: body.error };

  const shout = await prisma.shout.create({
    data: { authorId: me.id, body: body.value },
    include: { author: { select: { name: true, username: true, uid: true } } },
  });

  await notifyFriends(await friendIdsOf(me.id), {
    actorId: me.id,
    type: "shout",
    body: `${me.name} postou um novo recado`,
    href: "/app/feed",
  });

  revalidatePath("/app/feed");
  return { ok: true, id: shout.id };
}

export async function toggleShoutLike(shoutId: string) {
  const me = await requireUser();

  const existing = await prisma.shoutLike.findUnique({
    where: { shoutId_userId: { shoutId, userId: me.id } },
  });

  if (existing) {
    await prisma.shoutLike.delete({ where: { id: existing.id } });
  } else {
    await prisma.shoutLike.create({ data: { shoutId, userId: me.id } });
  }

  revalidatePath("/app/feed");
  return { ok: true, liked: !existing };
}

export async function deleteShout(shoutId: string) {
  const me = await requireUser();

  const shout = await prisma.shout.findUnique({ where: { id: shoutId } });
  if (!shout || shout.authorId !== me.id) return { error: "Sem permissao" };

  await prisma.shout.delete({ where: { id: shoutId } });
  revalidatePath("/app/feed");
  return { ok: true };
}

export async function sendMessage(formData: FormData) {
  const me = await requireUser();

  const limit = consume(`message:${me.id}`, LIMITS.message);
  if (!limit.ok) {
    return { error: `Voce envia mensagens rapido demais. Tente ${humanizeRetry(limit.retryInMs)}.` };
  }

  const toUid = clampText(formData.get("toUid"), 32);
  const body = validateText(formData.get("body"), { min: 1, max: MESSAGE_MAX_LENGTH });
  if (!body.ok) return { error: body.error };
  if (!toUid) return { error: "Destinatario invalido" };

  const to = await prisma.user.findUnique({
    where: { uid: toUid },
    select: { id: true, name: true },
  });
  if (!to) return { error: "Destinatario nao encontrado" };
  if (to.id === me.id) return { error: "Voce nao pode se mandar mensagem" };

  await prisma.message.create({
    data: { fromId: me.id, toId: to.id, body: body.value },
  });

  await notify({
    userId: to.id,
    actorId: me.id,
    type: "message",
    body: `${me.name} enviou uma mensagem privada`,
    href: `/app/mensagens?to=${toUid}`,
  });

  revalidatePath("/app/mensagens");
  return { ok: true };
}

export async function readConversation(peerUid: string) {
  const me = await requireUser();

  const peer = await prisma.user.findUnique({ where: { uid: peerUid }, select: { id: true } });
  if (!peer) return { error: "Perfil nao encontrado" };

  await prisma.message.updateMany({
    where: { fromId: peer.id, toId: me.id, readAt: null },
    data: { readAt: new Date() },
  });

  revalidatePath("/app/mensagens");
  return { ok: true };
}

export async function createListing(formData: FormData) {
  const me = await requireUser();

  const limit = consume(`listing:${me.id}`, LIMITS.listing);
  if (!limit.ok) {
    return { error: `Muitos anuncios. Tente ${humanizeRetry(limit.retryInMs)}.` };
  }

  const title = validateText(formData.get("title"), { min: 3, max: 90 });
  if (!title.ok) return { error: title.error };

  const price = normalizePrice(formData.get("price"));
  if (price === null) return { error: "Preco invalido" };

  await prisma.listing.create({
    data: {
      sellerId: me.id,
      title: title.value,
      description: clampText(formData.get("description"), 900),
      category: clampText(formData.get("category"), 30) || "outros",
      location: clampText(formData.get("location"), 90),
      price,
      seed: String(hashCode(title.value) % 360),
    },
  });

  revalidatePath("/app/classificados");
  return { ok: true };
}

export async function markListingSold(listingId: string) {
  const me = await requireUser();

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.sellerId !== me.id) return { error: "Sem permissao" };

  await prisma.listing.update({ where: { id: listingId }, data: { sold: !listing.sold } });
  revalidatePath("/app/classificados");
  return { ok: true };
}

export async function updateProfile(formData: FormData) {
  const me = await requireUser();

  const limit = consume(`profile:${me.id}`, LIMITS.profileUpdate);
  if (!limit.ok) {
    return { error: `Muitos salvamentos seguidos. Tente ${humanizeRetry(limit.retryInMs)}.` };
  }

  const text = (key: string, max: number) => clampText(formData.get(key), max);
  const birthdayRaw = text("birthday", 20);
  const parsed = birthdayRaw ? new Date(`${birthdayRaw}T00:00:00`) : null;
  const birthday = parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;

  await prisma.user.update({
    where: { id: me.id },
    data: {
      headline: text("headline", 120),
      bio: text("bio", 400),
      aboutMe: text("aboutMe", 3000),
      gender: text("gender", 30),
      city: text("city", 60),
      state: text("state", 60),
      country: text("country", 60) || "BR",
      relationship: text("relationship", 40),
      lookingFor: text("lookingFor", 120),
      hobbies: text("hobbies", 300),
      job: text("job", 120),
      school: text("school", 120),
      favoriteMus: text("favoriteMus", 300),
      quote: text("quote", 240),
      avatarSeed: text("avatarSeed", 10) || me.avatarSeed,
      isPublic: formData.get("isPublic") === "on",
      birthday,
    },
  });

  revalidatePath(`/app/profile/${me.uid}`);
  revalidatePath("/app/config");
  return { ok: true };
}

export async function addProfileItem(kind: FormDataEntryValue, formData: FormData) {
  const me = await requireUser();
  const seed = String(hashCode(`${me.id}-${Date.now()}`) % 360);

  if (kind === "photo") {
    await prisma.photo.create({
      data: { userId: me.id, seed, caption: clampText(formData.get("caption"), 120) },
    });
  } else if (kind === "video") {
    const title = validateText(formData.get("title"), { min: 2, max: 120 });
    if (!title.ok) return { error: title.error };
    await prisma.video.create({ data: { userId: me.id, title: title.value, seed } });
  } else if (kind === "track") {
    const title = validateText(formData.get("title"), { min: 1, max: 120 });
    const artist = validateText(formData.get("artist"), { min: 1, max: 120 });
    if (!title.ok) return { error: title.error };
    if (!artist.ok) return { error: artist.error };
    await prisma.track.create({
      data: { userId: me.id, title: title.value, artist: artist.value, seed },
    });
  } else if (kind === "book") {
    const title = validateText(formData.get("title"), { min: 1, max: 120 });
    if (!title.ok) return { error: title.error };
    await prisma.book.create({
      data: {
        userId: me.id,
        title: title.value,
        author: clampText(formData.get("author"), 120) || "Autor desconhecido",
        status: clampText(formData.get("status"), 20) || "reading",
      },
    });
  } else {
    return { error: "Tipo invalido" };
  }

  revalidatePath(`/app/profile/${me.uid}`);
  return { ok: true };
}

export async function removeProfileItem(kind: FormDataEntryValue, id: string) {
  const me = await requireUser();

  const map = {
    photo: prisma.photo,
    video: prisma.video,
    track: prisma.track,
    book: prisma.book,
  } as const;

  const delegate = map[kind as keyof typeof map];
  if (!delegate) return { error: "Tipo invalido" };

  const record = await (
    delegate as { findUnique: (a: unknown) => Promise<{ userId: string } | null> }
  ).findUnique({ where: { id } });

  if (!record || record.userId !== me.id) return { error: "Sem permissao" };

  await (delegate as { delete: (a: unknown) => Promise<unknown> }).delete({ where: { id } });
  revalidatePath(`/app/profile/${me.uid}`);
  return { ok: true };
}

export async function updateCommunityTheme(communityId: string, formData: FormData) {
  const me = await requireUser();

  const community = await prisma.community.findUnique({ where: { id: communityId } });
  if (!community) return { error: "Comunidade inexistente" };

  const role = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId, userId: me.id } },
  });
  if (community.ownerId !== me.id && role?.role !== "MODERATOR") {
    return { error: "Apenas moderadores alteram o tema" };
  }

  const theme = clampText(formData.get("theme"), 9) || community.theme;

  await prisma.community.update({ where: { id: communityId }, data: { theme } });
  revalidatePath(`/app/comunidades/${community.slug}`);
  return { ok: true };
}

export async function createCommunity(formData: FormData) {
  const me = await requireUser();

  const limit = consume(`community:${me.id}`, LIMITS.communityPost);
  if (!limit.ok) {
    return { error: `Voce criou comunidades demais. Tente ${humanizeRetry(limit.retryInMs)}.` };
  }

  const name = validateText(formData.get("name"), { min: 3, max: 60 });
  if (!name.ok) return { error: name.error };

  const base = slugify(name.value) || "comunidade";
  let slug = base;
  let attempt = 1;
  while (await prisma.community.findUnique({ where: { slug } })) {
    attempt += 1;
    slug = `${base}-${attempt}`;
  }

  const community = await prisma.community.create({
    data: {
      slug,
      name: name.value,
      tagline: clampText(formData.get("tagline"), 120),
      description: clampText(formData.get("description"), 900),
      theme: clampText(formData.get("theme"), 9) || "#00e5ff",
      seed: String(hashCode(name.value) % 360),
      ownerId: me.id,
      members: { create: { userId: me.id, role: "MODERATOR" } },
    },
  });

  revalidatePath("/app/comunidades");
  return { ok: true, slug: community.slug };
}

export async function toggleMembership(communityId: string) {
  const me = await requireUser();

  const existing = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId, userId: me.id } },
  });

  const community = await prisma.community.findUniqueOrThrow({
    where: { id: communityId },
    select: { slug: true, ownerId: true },
  });

  if (existing) {
    if (community.ownerId === me.id) return { error: "Voce e o dono, nao pode sair" };
    await prisma.communityMember.delete({ where: { id: existing.id } });
  } else {
    await prisma.communityMember.create({ data: { communityId, userId: me.id } });
  }

  revalidatePath("/app/comunidades");
  revalidatePath(`/app/comunidades/${community.slug}`);
  return { ok: true, joined: !existing };
}

export async function createCommunityPost(communityId: string, formData: FormData) {
  const me = await requireUser();

  const community = await prisma.community.findUnique({
    where: { id: communityId },
    select: { slug: true },
  });
  if (!community) return { error: "Comunidade inexistente" };

  const limit = consume(`post:${me.id}`, LIMITS.communityPost);
  if (!limit.ok) {
    return { error: `Muitos topicos seguidos. Tente ${humanizeRetry(limit.retryInMs)}.` };
  }

  const member = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId, userId: me.id } },
  });
  if (!member) return { error: "Entre na comunidade para postar" };

  const title = validateText(formData.get("title"), { min: 3, max: 140 });
  if (!title.ok) return { error: title.error };

  const body = validateText(formData.get("body"), {
    min: 3,
    max: COMMUNITY_POST_MAX_LENGTH,
  });
  if (!body.ok) return { error: body.error };

  await prisma.communityPost.create({
    data: { communityId, authorId: me.id, title: title.value, body: body.value },
  });

  revalidatePath(`/app/comunidades/${community.slug}`);
  return { ok: true };
}

export async function commentOnPost(postId: string, formData: FormData) {
  const me = await requireUser();

  const post = await prisma.communityPost.findUnique({
    where: { id: postId },
    include: { community: { select: { id: true, slug: true } } },
  });
  if (!post) return { error: "Post inexistente" };
  if (post.locked) return { error: "Post trancado" };

  const limit = consume(`comment:${me.id}`, LIMITS.communityComment);
  if (!limit.ok) {
    return { error: `Muitos comentarios seguidos. Tente ${humanizeRetry(limit.retryInMs)}.` };
  }

  const member = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId: post.community.id, userId: me.id } },
  });
  if (!member) return { error: "Entre na comunidade para comentar" };

  const body = validateText(formData.get("body"), {
    min: 1,
    max: COMMUNITY_COMMENT_MAX_LENGTH,
  });
  if (!body.ok) return { error: body.error };

  await prisma.communityComment.create({
    data: { postId, authorId: me.id, body: body.value },
  });

  revalidatePath(`/app/comunidades/${post.community.slug}`);
  return { ok: true };
}

export async function moderatePost(postId: string, action: FormDataEntryValue) {
  const me = await requireUser();

  const post = await prisma.communityPost.findUnique({
    where: { id: postId },
    include: { community: { select: { id: true, slug: true, ownerId: true } } },
  });
  if (!post) return { error: "Post inexistente" };

  const member = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId: post.community.id, userId: me.id } },
  });

  const input = {
    communityOwnerId: post.community.ownerId,
    postAuthorId: post.authorId,
    viewerId: me.id,
    memberRole: member?.role ?? null,
  };

  if (action === "delete") {
    if (!canApplyPostAction("delete", input)) {
      return { error: "Apenas moderadores podem apagar este topico" };
    }
    await prisma.communityPost.delete({ where: { id: postId } });
  } else if (action === "pin") {
    if (!canApplyPostAction("pin", input)) {
      return { error: "Apenas moderadores podem fixar" };
    }
    await prisma.communityPost.update({ where: { id: postId }, data: { pinned: !post.pinned } });
  } else if (action === "lock") {
    if (!canApplyPostAction("lock", input)) {
      return { error: "Apenas moderadores podem trancar" };
    }
    await prisma.communityPost.update({ where: { id: postId }, data: { locked: !post.locked } });
  } else {
    return { error: "Acao invalida" };
  }

  revalidatePath(`/app/comunidades/${post.community.slug}`);
  return { ok: true };
}