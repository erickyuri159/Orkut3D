import { describe, expect, it } from "vitest";
import {
  POKE_COOLDOWN_MS,
  POKE_CREDIT_COST,
  canApplyPostAction,
  canModeratePost,
  canViewScrap,
  creditsAfterPoke,
  hasEnoughCredits,
  isPokeCoolingDown,
  normalizePrice,
  pokeCooldownRemainingMs,
  resolveFriendState,
  scrapVisibilityWhere,
  shouldCountVisit,
  validateText,
} from "@/lib/rules";

describe("scrap privado", () => {
  it("publico e visivel para qualquer um", () => {
    expect(
      canViewScrap({ isPrivate: false, profileId: "p1", authorId: "a1", viewerId: "x" }),
    ).toBe(true);
    expect(
      canViewScrap({ isPrivate: false, profileId: "p1", authorId: "a1", viewerId: null }),
    ).toBe(true);
  });

  it("privado esconde de quem nao e dono nem autor", () => {
    expect(
      canViewScrap({ isPrivate: true, profileId: "p1", authorId: "a1", viewerId: "outro" }),
    ).toBe(false);
    expect(
      canViewScrap({ isPrivate: true, profileId: "p1", authorId: "a1", viewerId: null }),
    ).toBe(false);
  });

  it("privado aparece para o dono do perfil e para o autor", () => {
    expect(
      canViewScrap({ isPrivate: true, profileId: "p1", authorId: "a1", viewerId: "p1" }),
    ).toBe(true);
    expect(
      canViewScrap({ isPrivate: true, profileId: "p1", authorId: "a1", viewerId: "a1" }),
    ).toBe(true);
  });

  it("sem sessao o filtro SQL so deixa passar scraps publicos", () => {
    expect(scrapVisibilityWhere("uid-1", null)).toEqual({
      profile: { uid: "uid-1" },
      private: false,
    });
  });

  it("com sessao o filtro SQL libera autor e dono", () => {
    const where = scrapVisibilityWhere("uid-1", "me");
    expect(where.profile).toEqual({ uid: "uid-1" });
    expect(where.OR).toEqual([
      { private: false },
      { authorId: "me" },
      { profile: { uid: "uid-1" } },
    ]);
  });
});

describe("estado de amizade", () => {
  const links = [
    { id: "f1", status: "ACCEPTED", requesterId: "eu", addresseeId: "ele" },
  ];

  it("sem vinculo", () => {
    expect(resolveFriendState([], "eu", "ele")).toEqual({
      state: "none",
      friendshipId: null,
    });
  });

  it("pedido enviado por mim", () => {
    expect(
      resolveFriendState(
        [{ id: "f2", status: "PENDING", requesterId: "eu", addresseeId: "ele" }],
        "eu",
        "ele",
      ),
    ).toEqual({ state: "sent", friendshipId: "f2" });
  });

  it("pedido recebido", () => {
    expect(
      resolveFriendState(
        [{ id: "f3", status: "PENDING", requesterId: "ele", addresseeId: "eu" }],
        "eu",
        "ele",
      ),
    ).toEqual({ state: "received", friendshipId: "f3" });
  });

  it("amigos aceitos", () => {
    expect(resolveFriendState(links, "eu", "ele")).toEqual({
      state: "friends",
      friendshipId: "f1",
    });
  });

  it("ignora vinculos com outras pessoas", () => {
    expect(
      resolveFriendState(
        [{ id: "f9", status: "ACCEPTED", requesterId: "eu", addresseeId: "terceira" }],
        "eu",
        "ele",
      ).state,
    ).toBe("none");
  });
});

describe("cooldown e creditos do poke", () => {
  const now = 1_700_000_000_000;

  it("sem poke anterior nao ha resfriamento", () => {
    expect(isPokeCoolingDown(null, now)).toBe(false);
    expect(pokeCooldownRemainingMs(null, now)).toBe(0);
  });

  it("dentro da janela bloqueia", () => {
    const last = new Date(now - 60_000);
    expect(isPokeCoolingDown(last, now)).toBe(true);
    expect(pokeCooldownRemainingMs(last, now)).toBe(POKE_COOLDOWN_MS - 60_000);
  });

  it("exatamente na borda libera", () => {
    const last = new Date(now - POKE_COOLDOWN_MS);
    expect(isPokeCoolingDown(last, now)).toBe(false);
  });

  it("apos a janela libera e zera o restante", () => {
    const last = new Date(now - POKE_COOLDOWN_MS - 10_000);
    expect(isPokeCoolingDown(last, now)).toBe(false);
    expect(pokeCooldownRemainingMs(last, now)).toBe(0);
  });

  it("creditos nunca ficam negativos", () => {
    expect(creditsAfterPoke(10)).toBe(10 - POKE_CREDIT_COST);
    expect(creditsAfterPoke(1)).toBe(0);
    expect(creditsAfterPoke(0)).toBe(0);
    expect(creditsAfterPoke(-5)).toBe(0);
  });

  it("exige creditos suficientes", () => {
    expect(hasEnoughCredits(2)).toBe(true);
    expect(hasEnoughCredits(1)).toBe(false);
  });
});

describe("permissao de moderacao", () => {
  const base = {
    communityOwnerId: "dono",
    postAuthorId: "autor",
    viewerId: "visitante",
    memberRole: null,
  };

  it("membro comum nao pode", () => {
    expect(canModeratePost(base)).toBe(false);
    expect(canApplyPostAction("pin", base)).toBe(false);
    expect(canApplyPostAction("delete", base)).toBe(false);
  });

  it("moderador pode tudo", () => {
    const mod = { ...base, viewerId: "mod", memberRole: "MODERATOR" };
    expect(canModeratePost(mod)).toBe(true);
    expect(canApplyPostAction("pin", mod)).toBe(true);
    expect(canApplyPostAction("lock", mod)).toBe(true);
    expect(canApplyPostAction("delete", mod)).toBe(true);
  });

  it("dono da comunidade pode sem ser membro", () => {
    const owner = { ...base, viewerId: "dono", memberRole: null };
    expect(canApplyPostAction("lock", owner)).toBe(true);
  });

  it("autor apaga o proprio topico mas nao fixa nem tranca", () => {
    const author = { ...base, viewerId: "autor", memberRole: null };
    expect(canApplyPostAction("delete", author)).toBe(true);
    expect(canApplyPostAction("pin", author)).toBe(false);
    expect(canApplyPostAction("lock", author)).toBe(false);
  });
});

describe("visitas ao perfil", () => {
  const now = 1_700_000_000_000;

  it("primeira visita conta", () => {
    expect(shouldCountVisit(null, now)).toBe(true);
  });

  it("duas visitas seguidas nao contam", () => {
    expect(shouldCountVisit(new Date(now - 5 * 60_000), now)).toBe(false);
  });

  it("depois de 30 minutos conta de novo", () => {
    expect(shouldCountVisit(new Date(now - 31 * 60_000), now)).toBe(true);
  });
});

describe("preco", () => {
  it("aceita numeros e strings", () => {
    expect(normalizePrice(10)).toBe(10);
    expect(normalizePrice("19.90")).toBe(19.9);
  });

  it("arredonda em decimal, sem erro de ponto flutuante", () => {
    expect(normalizePrice(19.999)).toBe(20);
    expect(normalizePrice(0.1 + 0.2)).toBe(0.3);
    expect(normalizePrice(1234.567)).toBe(1234.57);
  });

  it("zero e valido", () => {
    expect(normalizePrice(0)).toBe(0);
    expect(normalizePrice("0")).toBe(0);
  });

  it("rejeita negativo, NaN, infinito e lixo", () => {
    expect(normalizePrice(-1)).toBeNull();
    expect(normalizePrice("abc")).toBeNull();
    expect(normalizePrice(Infinity)).toBeNull();
  });

  it("campo vazio e erro, nao announce de graca", () => {
    // Number(null) seria 0 — bug real que criaria anuncios de R$ 0,00.
    expect(normalizePrice(null)).toBeNull();
    expect(normalizePrice(undefined)).toBeNull();
    expect(normalizePrice("")).toBeNull();
    expect(normalizePrice("   ")).toBeNull();
  });
});

describe("validacao de texto", () => {
  it("apara espacos", () => {
    const result = validateText("   ola   ", { max: 100 });
    expect(result).toEqual({ ok: true, value: "ola" });
  });

  it("rejeita vazio", () => {
    expect(validateText("   ", { min: 2, max: 10 }).ok).toBe(false);
  });

  it("rejeita nao-string", () => {
    expect(validateText(null, { max: 10 }).ok).toBe(false);
    expect(validateText(42, { max: 10 }).ok).toBe(false);
  });

  it("rejeita texto acima do maximo em vez de truncalo", () => {
    // Silenciar o corte publicaria conteudo diferente do que a pessoa digitou.
    const result = validateText("abcdefghij", { max: 4 });
    expect(result.ok).toBe(false);
  });
});