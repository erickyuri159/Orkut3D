export const APP_SECTIONS = [
  "feed",
  "amigos",
  "cutucadas",
  "mensagens",
  "comunidades",
  "classificados",
  "ranking",
  "notificacoes",
  "busca",
  "config",
  "perfil",
  "profile",
] as const;

export type AppSection = (typeof APP_SECTIONS)[number];

const SECTION_SET = new Set<string>(APP_SECTIONS);

const FALLBACK = "/app/feed";

/**
 * Garante que o destino de uma notificacao aponte para uma rota que existe.
 * Sem isso, um link digitado errado vira 404 na hora do clique.
 */
export function safeHref(href: string): string {
  try {
    const [path, query] = href.split("?");
    const parts = path.split("/").filter(Boolean);

    if (parts[0] !== "app") return FALLBACK;
    if (!parts[1] || !SECTION_SET.has(parts[1])) return FALLBACK;
    if (parts[1] === "profile" && !/^[\w-]+$/.test(parts[2] ?? "")) return FALLBACK;

    return query ? `${path}?${query}` : path;
  } catch {
    return FALLBACK;
  }
}
