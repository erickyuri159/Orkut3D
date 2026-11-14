export const POKE_KINDS = [
  { id: "poke", label: "Cutucou", emoji: "\u{1F91E}", verb: "cutucou" },
  { id: "wave", label: "Abraçou", emoji: "\u{1F44B}", verb: "chamou" },
  { id: "high-five", label: "Dá um high-five", emoji: "\u{1F64C}", verb: "deu high-five em" },
  { id: "hug", label: "Abraço", emoji: "\u{1F917}", verb: "mandou um abraço para" },
  { id: "insult", label: "Zoeira", emoji: "\u{1F608}", verb: "zoou" },
] as const;

export type PokeKind = (typeof POKE_KINDS)[number]["id"];

export const LISTING_CATEGORIES = [
  { id: "eletronicos", label: "Eletrônicos" },
  { id: "moda", label: "Moda" },
  { id: "casa", label: "Casa" },
  { id: "games", label: "Games" },
  { id: "musica", label: "Instrumentos" },
  { id: "veiculos", label: "Veículos" },
  { id: "outros", label: "Outros" },
] as const;

export const COMMUNITY_THEMES = [
  "#00e5ff",
  "#a855f7",
  "#ff3d81",
  "#7cff4f",
  "#ffb300",
  "#4f7cff",
] as const;

export const RELATIONSHIPS = [
  "Solteiro(a)",
  "Namorando",
  "Noivo(a)",
  "Casado(a)",
] as const;

export const GENDERS = ["Feminino", "Masculino", "Outro", "Prefiro não dizer"] as const;
