import { describe, expect, it } from "vitest";
import { safeHref, APP_SECTIONS } from "@/lib/routes";

describe("safeHref", () => {
  it("deixa passar rotas reais", () => {
    for (const section of APP_SECTIONS) {
      if (section === "profile" || section === "perfil") continue;
      expect(safeHref(`/app/${section}`)).toBe(`/app/${section}`);
    }
  });

  it("bloqueia a rota que causou o bug do /app/friends", () => {
    expect(safeHref("/app/friends")).toBe("/app/feed");
    expect(safeHref("/app/messages?to=123")).toBe("/app/feed");
  });

  it("bloqueia rotas inventadas", () => {
    expect(safeHref("/app/nao-existe")).toBe("/app/feed");
    expect(safeHref("/app/admin")).toBe("/app/feed");
  });

  it("bloqueia caminhos fora de /app", () => {
    expect(safeHref("/")).toBe("/app/feed");
    expect(safeHref("/login")).toBe("/app/feed");
    expect(safeHref("https://exemplo.com")).toBe("/app/feed");
    expect(safeHref("//evil.com")).toBe("/app/feed");
  });

  it("preserva query string em rotas validas", () => {
    expect(safeHref("/app/mensagens?to=1000-2000-3000")).toBe(
      "/app/mensagens?to=1000-2000-3000",
    );
  });

  it("exige uid valido em perfil", () => {
    expect(safeHref("/app/profile/1000-2000-3000")).toBe("/app/profile/1000-2000-3000");
    expect(safeHref("/app/profile")).toBe("/app/feed");
    expect(safeHref("/app/profile/")).toBe("/app/feed");
    expect(safeHref("/app/profile/../../etc/passwd")).toBe("/app/feed");
    expect(safeHref("/app/profile/abc def")).toBe("/app/feed");
  });

  it("nao deixa passar entrada malformada", () => {
    expect(safeHref("")).toBe("/app/feed");
    expect(safeHref("?")).toBe("/app/feed");
    expect(safeHref("app")).toBe("/app/feed");
  });
});