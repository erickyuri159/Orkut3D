export function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

export function publicUid() {
  const block = () => Math.floor(1000 + Math.random() * 9000).toString();
  return `${block()}-${block()}-${block()}`;
}

const THUMBS = ["\u{1F44B}", "\u{1F4AA}", "\u{1F602}", "\u{1F60D}", "\u{1F495}", "\u{1F44F}", "\u{2764}\u{FE0F}", "\u{1F389}", "\u{1F525}", "\u{1F918}"];

export function randomThumb() {
  return THUMBS[Math.floor(Math.random() * THUMBS.length)];
}

/** Hash estavel -> string de 0..n, para gerar avatares/cores procedural. */
export function hashCode(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function relativeTime(date: Date | string) {
  const value = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - value.getTime()) / 1000);
  if (seconds < 60) return "agora";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mes`;
  return `${Math.floor(months / 12)}a`;
}

export function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export const POKE_COOLDOWN_MS = 1000 * 60 * 60 * 3;

export function clampText(value: FormDataEntryValue | null, max: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}
