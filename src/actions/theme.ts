"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { THEME_COOKIE, normalizeTheme } from "@/lib/theme";

/** Alterna entre 2088 (3D), noite (escuro leve) e klass (tabelas 2004). */
export async function setTheme(formData: FormData) {
  const jar = await cookies();
  jar.set(THEME_COOKIE, normalizeTheme(String(formData.get("theme") ?? "")), {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
}
