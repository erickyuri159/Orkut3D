import { describe, expect, it } from "vitest";
import { formatBRL, hashCode, initials, randomThumb, relativeTime, slugify } from "@/lib/format";

describe("slugify", () => {
  it("remove acentos", () => {
    expect(slugify("Programadores 3D")).toBe("programadores-3d");
    expect(slugify("Coração")).toBe("coracao");
  });

  it("normaliza para minusculas com hifen", () => {
    expect(slugify("Vaporwave  Brasil")).toBe("vaporwave-brasil");
  });

  it("junta separadores", () => {
    expect(slugify("a___b")).toBe("a-b");
  });

  it("corta nas bordas", () => {
    expect(slugify("---oi---")).toBe("oi");
  });

  it("vazio vira string vazia", () => {
    expect(slugify("!!!")).toBe("");
  });
});

describe("hashCode", () => {
  it("e estavel para a mesma entrada", () => {
    expect(hashCode("erick")).toBe(hashCode("erick"));
  });

  it("e sempre positivo", () => {
    for (const input of ["", "a", "zzzzzzzzzz", "-12345"]) {
      expect(hashCode(input)).toBeGreaterThanOrEqual(0);
    }
  });

  it("diferencia entradas parecidas", () => {
    expect(hashCode("erick")).not.toBe(hashCode("erick2"));
  });
});

describe("initials", () => {
  it("pega as duas primeiras palavras", () => {
    expect(initials("Erick Barros")).toBe("EB");
    expect(initials("Ana")).toBe("A");
  });

  it("ignora espacos extras", () => {
    expect(initials("  Ana   Baena ")).toBe("AB");
  });

  it("vazio nao quebra", () => {
    expect(initials("")).toBe("");
  });
});

describe("relativeTime", () => {
  const now = Date.now();

  it("formata por faixa", () => {
    expect(relativeTime(new Date(now - 5_000))).toBe("agora");
    expect(relativeTime(new Date(now - 5 * 60_000))).toBe("5 min");
    expect(relativeTime(new Date(now - 3 * 3_600_000))).toBe("3h");
    expect(relativeTime(new Date(now - 5 * 86_400_000))).toBe("5d");
    expect(relativeTime(new Date(now - 40 * 86_400_000))).toBe("1mes");
    expect(relativeTime(new Date(now - 800 * 86_400_000))).toBe("2a");
  });

  it("aceita string", () => {
    expect(relativeTime(new Date(now - 1_000).toISOString())).toBe("agora");
  });
});

describe("formatBRL", () => {
  it("formata real", () => {
    expect(formatBRL(0)).toContain("0,00");
    expect(formatBRL(19.9)).toContain("19,90");
  });
});

describe("randomThumb", () => {
  it("devolve um thumb valido", () => {
    expect(randomThumb().length).toBeGreaterThan(0);
  });
});