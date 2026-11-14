import { execFileSync } from "node:child_process";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";

/**
 * Integracao contra um Postgres dedicado (DATABASE_URL_TEST).
 * Verifica as restricoes que o codigo da aplicacao pressupoe existir:
 * sem isso, um bug de schema so apareceria em producao.
 */

const TEST_URL =
  process.env.DATABASE_URL_TEST ??
  "postgresql://postgres:postgres@localhost:5432/orb2088_test?schema=public";

let prisma: PrismaClient;

async function makeUser(username: string) {
  return prisma.user.create({
    data: {
      uid: `uid-${username}`,
      username,
      email: `${username}@teste.dev`,
      passwordHash: "x",
      name: username,
      credits: 50,
    },
  });
}

beforeAll(async () => {
  // npx.cmd nao existe em todo ambiente; invocar o binario pelo node e portable.
  const prismaCli = require.resolve("prisma/build/index.js");
  execFileSync(process.execPath, [prismaCli, "db", "push", "--force-reset", "--skip-generate"], {
    env: { ...process.env, DATABASE_URL: TEST_URL },
    stdio: "pipe",
  });

  prisma = new PrismaClient({ datasources: { db: { url: TEST_URL } } });
  await prisma.$connect();
}, 180_000);

afterAll(async () => {
  await prisma?.$disconnect();
});

describe("Friendship", () => {
  it("impede pedido duplicado no mesmo sentido", async () => {
    const [ana, bob] = await Promise.all([makeUser("dup1"), makeUser("dup2")]);

    await prisma.friendship.create({
      data: { requesterId: ana.id, addresseeId: bob.id, status: "PENDING" },
    });

    await expect(
      prisma.friendship.create({
        data: { requesterId: ana.id, addresseeId: bob.id, status: "PENDING" },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
  });

  it("apagar usuario leva as amizades junto", async () => {
    const [x, y] = await Promise.all([makeUser("casc1"), makeUser("casc2")]);
    const link = await prisma.friendship.create({
      data: { requesterId: x.id, addresseeId: y.id, status: "ACCEPTED" },
    });

    await prisma.user.delete({ where: { id: x.id } });

    expect(await prisma.friendship.findUnique({ where: { id: link.id } })).toBeNull();
  });
});

describe("Scrap", () => {
  it("apagar o dono do perfil leva o mural junto", async () => {
    const owner = await makeUser("dono");
    const visitor = await makeUser("visitante");

    const scrap = await prisma.scrap.create({
      data: { profileId: owner.id, authorId: visitor.id, message: "oi", thumb: "x" },
    });
    await prisma.scrapComment.create({
      data: { scrapId: scrap.id, authorId: owner.id, body: "obrigado" },
    });

    await prisma.user.delete({ where: { id: owner.id } });

    expect(await prisma.scrap.findUnique({ where: { id: scrap.id } })).toBeNull();
    expect(
      await prisma.scrapComment.findMany({ where: { scrapId: scrap.id } }),
    ).toHaveLength(0);
  });

  it("apagar o scrap apaga os comentarios dele", async () => {
    const owner = await makeUser("dono2");
    const visitor = await makeUser("visitante2");
    const scrap = await prisma.scrap.create({
      data: { profileId: owner.id, authorId: visitor.id, message: "oi", thumb: "x" },
    });
    await prisma.scrapComment.create({
      data: { scrapId: scrap.id, authorId: owner.id, body: "ok" },
    });

    await prisma.scrap.delete({ where: { id: scrap.id } });

    expect(
      await prisma.scrapComment.findMany({ where: { scrapId: scrap.id } }),
    ).toHaveLength(0);
  });
});

describe("ShoutLike", () => {
  it("uma curtida por pessoa", async () => {
    const [a, b] = await Promise.all([makeUser("curte1"), makeUser("curte2")]);
    const shout = await prisma.shout.create({ data: { authorId: a.id, body: "oi" } });

    await prisma.shoutLike.create({ data: { shoutId: shout.id, userId: b.id } });

    await expect(
      prisma.shoutLike.create({ data: { shoutId: shout.id, userId: b.id } }),
    ).rejects.toMatchObject({ code: "P2002" });

    expect(await prisma.shoutLike.count({ where: { shoutId: shout.id } })).toBe(1);
  });
});

describe("CommunityMember", () => {
  it("uma entrada por pessoa por comunidade", async () => {
    const owner = await makeUser("comowner");
    const member = await makeUser("commember");

    const community = await prisma.community.create({
      data: {
        slug: `slug-${Date.now()}`,
        name: "Comunidade de teste",
        ownerId: owner.id,
      },
    });

    await prisma.communityMember.create({
      data: { communityId: community.id, userId: member.id },
    });

    await expect(
      prisma.communityMember.create({
        data: { communityId: community.id, userId: member.id },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
  });
});

describe("User", () => {
  it("username e email sao unicos", async () => {
    await makeUser("ana");

    await expect(makeUser("ana")).rejects.toMatchObject({ code: "P2002" });

    await expect(
      prisma.user.create({
        data: {
          uid: "uid-outro",
          username: "outro",
          email: "ana@teste.dev",
          passwordHash: "x",
          name: "Outro",
        },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
  });

  it("uid e unico", async () => {
    await makeUser("ana2");

    await expect(
      prisma.user.create({
        data: {
          uid: "uid-ana2",
          username: "terceiro",
          email: "terceiro@teste.dev",
          passwordHash: "x",
          name: "Terceiro",
        },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
  });
});

describe("ProfileVisit", () => {
  it("guarda varias visitas do mesmo visitante", async () => {
    const [profile, visitor] = await Promise.all([makeUser("perfil"), makeUser("visitante3")]);

    await prisma.profileVisit.create({ data: { profileId: profile.id, visitorId: visitor.id } });
    await prisma.profileVisit.create({ data: { profileId: profile.id, visitorId: visitor.id } });

    expect(
      await prisma.profileVisit.count({
        where: { profileId: profile.id, visitorId: visitor.id },
      }),
    ).toBe(2);
  });
});