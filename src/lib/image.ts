/**
 * Deteccao de tipo de imagem pelos MAGIC BYTES, nunca pelo Content-Type do
 * cliente (que qualquer um forja) nem pela extensao do nome.
 *
 * SVG e barrado de proposito: e XML executavel e uma porta classica de XSS
 * guardada em arquivo.
 */

export const ALLOWED_IMAGE_TYPES = {
  jpeg: { mime: "image/jpeg", ext: "jpg" },
  png: { mime: "image/png", ext: "png" },
  webp: { mime: "image/webp", ext: "webp" },
  gif: { mime: "image/gif", ext: "gif" },
  avif: { mime: "image/avif", ext: "avif" },
} as const;

export type AllowedImageType = keyof typeof ALLOWED_IMAGE_TYPES;

export const ALLOWED_MIME_LIST = Object.values(ALLOWED_IMAGE_TYPES).map((t) => t.mime);

/** Tipos que o cliente costuma declarar e que NAO sao aceitos. */
export const REJECTED_MIME_LIST = [
  "image/svg+xml",
  "text/html",
  "application/xhtml+xml",
  "application/xml",
  "text/xml",
];

export function detectImageType(buffer: Uint8Array): AllowedImageType | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpeg";

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "png";
  }

  // GIF: "GIF87a" / "GIF89a"
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return "gif";
  }

  // RIFF....WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "webp";
  }

  // AVIF: ....ftypavif
  if (
    buffer[4] === 0x66 &&
    buffer[5] === 0x74 &&
    buffer[6] === 0x79 &&
    buffer[7] === 0x70 &&
    buffer[8] === 0x61 &&
    buffer[9] === 0x76 &&
    buffer[10] === 0x69 &&
    buffer[11] === 0x66
  ) {
    return "avif";
  }

  return null;
}

export function isRejectedMime(mime: string) {
  return REJECTED_MIME_LIST.includes(mime.toLowerCase().trim());
}

/**
 * Chave do storage: pasta derivada de HASH do userId (hex) + uuid + extensao
 * do sniffing. Nao usa o id cru: cuid nao e hex e polui a validacao de chave.
 */
export function buildMediaKey(userId: string, type: AllowedImageType) {
  const { ext } = ALLOWED_IMAGE_TYPES[type];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }
  const folder = (Math.abs(hash) >>> 0).toString(16).padStart(8, "0").slice(-8);
  const id = crypto.randomUUID().replace(/-/g, "");
  return `${folder}/${id}.${ext}`;
}

/** Bloqueia traversal e qualquer coisa fora do formato aceito. */
export function isSafeKey(key: string) {
  return /^[a-f0-9]{8}\/[a-f0-9]{32}\.(jpg|png|webp|gif|avif)$/.test(key);
}

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export function humanFileSize(bytes: number) {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return humanFileSize(bytes);
}