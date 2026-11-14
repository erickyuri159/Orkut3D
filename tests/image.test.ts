import { describe, expect, it } from "vitest";
import {
  ALLOWED_MIME_LIST,
  REJECTED_MIME_LIST,
  buildMediaKey,
  detectImageType,
  formatBytes,
  isRejectedMime,
  isSafeKey,
} from "@/lib/image";

/** Constroi um buffer com assinatura real de cada formato. */
function makeHeader(bytes: number[]): Uint8Array {
  const out = new Uint8Array(Math.max(16, bytes.length));
  out.set(bytes, 0);
  return out;
}

const JPEG = makeHeader([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
const PNG = makeHeader([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
const GIF87 = makeHeader([0x47, 0x49, 0x46, 0x38, 0x37, 0x61, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00]);
const GIF89 = makeHeader([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00]);
const WEBP = makeHeader([
  0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]);
const AVIF = makeHeader([
  0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66,
]);

describe("detectImageType por magic bytes", () => {
  it("reconhece os formatos permitidos", () => {
    expect(detectImageType(JPEG)).toBe("jpeg");
    expect(detectImageType(PNG)).toBe("png");
    expect(detectImageType(GIF87)).toBe("gif");
    expect(detectImageType(GIF89)).toBe("gif");
    expect(detectImageType(WEBP)).toBe("webp");
    expect(detectImageType(AVIF)).toBe("avif");
  });

  it("nao confia em extensao nem em Content-Type: so nos bytes", () => {
    // Um HTML que se disfarça de .png e renomeado para .jpg
    const html = makeHeader([0x3c, 0x21, 0x44, 0x4f, 0x43, 0x54, 0x59, 0x50, 0x45, 0x20, 0x68, 0x74]);
    expect(detectImageType(html)).toBeNull();
  });

  it("rejeita SVG mesmo comassinatura de arquivo de texto", () => {
    const svg = makeHeader([0x3c, 0x3f, 0x78, 0x6d, 0x6c, 0x20, 0x76, 0x65, 0x72, 0x73, 0x69, 0x6f]);
    expect(detectImageType(svg)).toBeNull();
  });

  it("rejeita PDF, ZIP e executavel", () => {
    expect(detectImageType(makeHeader([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37, 0, 0, 0, 0]))).toBeNull();
    expect(detectImageType(makeHeader([0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0, 0, 0, 0, 0]))).toBeNull();
    expect(detectImageType(makeHeader([0x4d, 0x5a, 0x90, 0x00, 0, 0, 0, 0, 0, 0, 0, 0]))).toBeNull();
  });

  it("nao quebra com buffer curto demais", () => {
    expect(detectImageType(new Uint8Array(0))).toBeNull();
    expect(detectImageType(new Uint8Array([0xff, 0xd8]))).toBeNull();
  });
});

describe("mime rejeitado", () => {
  it("bloqueia SVG e XML/HTML", () => {
    for (const mime of REJECTED_MIME_LIST) {
      expect(isRejectedMime(mime)).toBe(true);
    }
  });

  it("nao bloqueia os formatos permitidos", () => {
    for (const mime of ALLOWED_MIME_LIST) {
      expect(isRejectedMime(mime)).toBe(false);
    }
  });

  it("normaliza caixa e espaco", () => {
    expect(isRejectedMime(" IMAGE/SVG+XML ")).toBe(true);
  });
});

describe("chave de storage", () => {
  it("usa uuid e extensao derivada do sniffing", () => {
    const key = buildMediaKey("clabcdefgh1234567890", "webp");
    expect(key.endsWith(".webp")).toBe(true);
    expect(isSafeKey(key)).toBe(true);
  });

  it("nunca usa o nome enviado pelo cliente", () => {
    const key = buildMediaKey("clabcdefgh1234567890", "png");
    expect(key).not.toContain("minha");
    expect(key).not.toContain("foto");
  });

  it("valida formato de chave", () => {
    const folder = "abcdef12"; // hex valido: as 8 chars precisam ser a-f0-9
    expect(isSafeKey(`${folder}/../../etc/passwd`)).toBe(false);
    expect(isSafeKey("../../secrets")).toBe(false);
    expect(isSafeKey(`${folder}/def.svg`)).toBe(false);
    expect(isSafeKey(`${folder}/xyz.png`)).toBe(false);
    expect(isSafeKey("sem-barra.png")).toBe(false);
    expect(isSafeKey(`${folder}/${"f".repeat(31)}.png`)).toBe(false);
    expect(isSafeKey(`${folder}/${"f".repeat(32)}.png`)).toBe(true);
    // fora do alfabeto hex, tanto na pasta quanto no nome
    expect(isSafeKey(`${folder}/${"z".repeat(32)}.png`)).toBe(false);
    expect(isSafeKey(`abcdefgh/${"f".repeat(32)}.png`)).toBe(false);
    expect(isSafeKey(`ABCDEF12/${"f".repeat(32)}.png`)).toBe(false);
  });

  it("rejeita extensao fora da lista", () => {
    const folder = "abcdef12";
    for (const ext of ["svg", "exe", "php", "html", "png.php", ""]) {
      expect(isSafeKey(`${folder}/${"f".repeat(32)}.${ext}`)).toBe(false);
    }
  });
});

describe("formatBytes", () => {
  it("escolhe a unidade certa", () => {
    expect(formatBytes(500)).toBe("500 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});