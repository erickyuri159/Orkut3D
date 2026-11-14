/**
 * Rate limit em memoria com janela deslizante simples (sliding window logica).
 *
 * ATENCAO: em processo unico (uma instancia do Node) funciona perfeitamente.
 * Para rodar em multiplas replicas, trocar o Map por Redis (mesma interface).
 * O resto do codigo so depende de checkRateLimit(), entao a troca e local.
 */

import { createLogger } from "@/lib/logger";

/**
 * O limiter e importado por testes puros. O logger nao importa nada de `next/*`,
 * entao um import estatico aqui funciona tanto no app quanto no vitest.
 */
const rateLogger = createLogger("rate-limit");

export type LimitRule = {
  limit: number;
  windowMs: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const globalStore = globalThis as unknown as { orbRateLimits?: Map<string, Bucket> };

function store() {
  if (!globalStore.orbRateLimits) globalStore.orbRateLimits = new Map();
  return globalStore.orbRateLimits;
}

export const LIMITS = {
  login: { limit: 8, windowMs: 60_000 },
  register: { limit: 3, windowMs: 60 * 60_000 },
  scrap: { limit: 6, windowMs: 10 * 60_000 },
  message: { limit: 20, windowMs: 60_000 },
  poke: { limit: 30, windowMs: 60 * 60_000 },
  friendRequest: { limit: 20, windowMs: 60 * 60_000 },
  communityPost: { limit: 6, windowMs: 60 * 60_000 },
  communityComment: { limit: 25, windowMs: 60 * 60_000 },
  listing: { limit: 8, windowMs: 60 * 60_000 },
  profileUpdate: { limit: 20, windowMs: 60 * 60_000 },
} satisfies Record<string, LimitRule>;

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryInMs: number;
};

export function checkRateLimit(
  key: string,
  rule: LimitRule,
  now: number = Date.now(),
): RateLimitResult {
  const buckets = store();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + rule.windowMs });
    if (buckets.size > 5000) prune(buckets, now);
    return { ok: true, remaining: rule.limit - 1, retryInMs: 0 };
  }

  if (existing.count >= rule.limit) {
    // Espaco de usuario vai para o log: repeticao aqui pode ser abuso.
    const scope = key.split(":")[0] ?? key;
    rateLogger.warn("rate limit atingido", { scope, key, retryInMs: existing.resetAt - now });
    return { ok: false, remaining: 0, retryInMs: existing.resetAt - now };
  }

  existing.count += 1;
  return { ok: true, remaining: rule.limit - existing.count, retryInMs: 0 };
}

/** Consome uma unidade e devolve o resultado (atalho para guards em actions). */
export function consume(
  key: string,
  rule: LimitRule,
  now?: number,
): RateLimitResult {
  return checkRateLimit(key, rule, now);
}

export function resetRateLimit(key: string) {
  store().delete(key);
}

export function resetAllRateLimits() {
  store().clear();
}

export function humanizeRetry(ms: number) {
  const minutes = Math.ceil(ms / 60_000);
  if (minutes <= 1) return "em instantes";
  if (minutes < 60) return `em ${minutes} minutos`;
  const hours = Math.ceil(minutes / 60);
  return `em ${hours} hora${hours > 1 ? "s" : ""}`;
}

function prune(buckets: Map<string, Bucket>, now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}