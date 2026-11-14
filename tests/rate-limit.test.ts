import { beforeEach, describe, expect, it } from "vitest";
import {
  LIMITS,
  checkRateLimit,
  humanizeRetry,
  resetAllRateLimits,
  resetRateLimit,
} from "@/lib/rate-limit";

const T0 = 1_700_000_000_000;

beforeEach(() => resetAllRateLimits());

describe("rate limit", () => {
  it("libera ate o limite", () => {
    for (let i = 0; i < 3; i++) {
      const result = checkRateLimit("k", { limit: 3, windowMs: 1000 }, T0);
      expect(result.ok).toBe(true);
      expect(result.remaining).toBe(2 - i);
    }
  });

  it("bloqueia ao estourar", () => {
    const rule = { limit: 2, windowMs: 1000 };
    expect(checkRateLimit("k", rule, T0).ok).toBe(true);
    expect(checkRateLimit("k", rule, T0).ok).toBe(true);
    const blocked = checkRateLimit("k", rule, T0);
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryInMs).toBe(1000);
  });

  it("libera de novo quando a janela expira", () => {
    const rule = { limit: 1, windowMs: 1000 };
    expect(checkRateLimit("k", rule, T0).ok).toBe(true);
    expect(checkRateLimit("k", rule, T0).ok).toBe(false);
    expect(checkRateLimit("k", rule, T0 + 999).ok).toBe(false);
    expect(checkRateLimit("k", rule, T0 + 1000).ok).toBe(true);
  });

  it("chaves diferentes nao se interferedem", () => {
    const rule = { limit: 1, windowMs: 1000 };
    expect(checkRateLimit("a", rule, T0).ok).toBe(true);
    expect(checkRateLimit("b", rule, T0).ok).toBe(true);
    expect(checkRateLimit("a", rule, T0).ok).toBe(false);
  });

  it("resetRateLimit limpa uma chave so", () => {
    const rule = { limit: 1, windowMs: 1000 };
    checkRateLimit("a", rule, T0);
    checkRateLimit("b", rule, T0);
    resetRateLimit("a");
    expect(checkRateLimit("a", rule, T0).ok).toBe(true);
    expect(checkRateLimit("b", rule, T0).ok).toBe(false);
  });

  it("o scrap tem janela curta", () => {
    expect(LIMITS.scrap.windowMs).toBe(10 * 60_000);
    expect(LIMITS.scrap.limit).toBeGreaterThan(0);
  });

  it("login e cadastro sao bem mais apertados que mensagem", () => {
    expect(LIMITS.login.limit).toBeLessThan(LIMITS.message.limit);
    expect(LIMITS.register.limit).toBeLessThan(LIMITS.scrap.limit);
  });
});

describe("humanizeRetry", () => {
  it("formata minutos", () => {
    expect(humanizeRetry(30_000)).toBe("em instantes");
    expect(humanizeRetry(5 * 60_000)).toBe("em 5 minutos");
    expect(humanizeRetry(60 * 60_000)).toBe("em 1 hora");
    expect(humanizeRetry(3 * 60 * 60_000)).toBe("em 3 horas");
  });
});