import { headers } from "next/headers";

/** IP do cliente, normalizado. Varios proxies podem encadear headers. */
export async function clientIp() {
  const h = await headers();

  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return (
    h.get("x-real-ip") ??
    h.get("cf-connecting-ip") ??
    h.get("fly-client-ip") ??
    "local"
  );
}

/** User-Agent curto, para reduzir volume de chave no rate limit. */
export async function clientFingerprint() {
  const h = await headers();
  return (h.get("user-agent") ?? "desconhecido").slice(0, 80);
}

export async function ipKey(prefix: string) {
  return `${prefix}:ip:${await clientIp()}`;
}