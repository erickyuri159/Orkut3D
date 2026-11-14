import { cookies } from "next/headers";

export const THEME_COOKIE = "orb_theme";

export const THEME_VALUES = ["holo", "noite", "klass"] as const;

export type Theme = (typeof THEME_VALUES)[number];

export function normalizeTheme(value: string | undefined): Theme {
  if (value === "noite" || value === "klass") return value;
  return "holo";
}

/** So o tema holo usa WebGL: noite e klass sao 100% CPU/CSS. */
export function usesWebGL(theme: Theme) {
  return theme === "holo";
}

export async function getTheme(): Promise<Theme> {
  const jar = await cookies();
  return normalizeTheme(jar.get(THEME_COOKIE)?.value);
}
