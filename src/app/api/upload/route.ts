import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { readSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { createLogger, serializeError } from "@/lib/logger";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
  buildMediaKey,
  detectImageType,
  isRejectedMime,
} from "@/lib/image";

const logger = createLogger("upload");

export const dynamic = "force-dynamic";

/**
 * POST /api/upload  (multipart/form-data)
 *
 * Pipeline de seguranca:
 *  1. exige sessao
 *  2. barra SVG/XML/HTML pelo Content-Type declarado
 *  3. barra por tamanho (header E o tamanho real)
 *  4. checa MAGIC BYTES — o cliente pode declarar qualquer coisa
 *  5. reprocessa com sharp: tira EXIF (local da pessoa), normaliza e redimensiona
 *  6. nome do arquivo e uuid; o nome enviado pelo cliente e descartado
 */

const VARIANTS = {
  avatar: { maxEdge: 512, quality: 82 },
  cover: { maxEdge: 1920, quality: 78 },
  photo: { maxEdge: 1600, quality: 80 },
  scrap: { maxEdge: 1200, quality: 80 },
} as const;

type UploadKind = keyof typeof VARIANTS;

function isUploadKind(value: FormDataEntryValue | null): value is UploadKind {
  return typeof value === "string" && value in VARIANTS;
}

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const userId = await readSessionUserId();
  if (!userId) return fail("nao autenticado", 401);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("formato invalido", 400);
  }

  const file = form.get("file");
  const kind = form.get("kind");

  if (!(file instanceof File)) return fail("arquivo ausente", 400);
  if (!isUploadKind(kind)) return fail("tipo de upload invalido", 400);

  if (isRejectedMime(file.type)) {
    logger.warn("upload com mime bloqueado", { userId, mime: file.type });
    return fail("tipo de arquivo nao permitido", 415);
  }

  // Barra pelo header antes de ler qualquer byte.
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_UPLOAD_BYTES * 2) {
    return fail("arquivo grande demais", 413);
  }

  const input = Buffer.from(await file.arrayBuffer());
  if (input.byteLength === 0) return fail("arquivo vazio", 400);
  if (input.byteLength > MAX_UPLOAD_BYTES) {
    logger.warn("upload acima do limite", { userId, bytes: input.byteLength });
    return fail("arquivo grande demais", 413);
  }

  const sniffed = detectImageType(input);
  if (!sniffed) {
    logger.warn("arquivo sem assinatura de imagem", {
      userId,
      declaredMime: file.type,
    });
    return fail("isso nao parece uma imagem", 415);
  }

  // Cliente dizia PNG, o arquivo e JPEG: acreditamos nos bytes.
  if (file.type && ALLOWED_IMAGE_TYPES[sniffed].mime !== file.type) {
    logger.info("mime declarado diferente do real", {
      userId,
      declared: file.type,
      real: ALLOWED_IMAGE_TYPES[sniffed].mime,
    });
  }

  const { maxEdge, quality } = VARIANTS[kind];
  const isGif = sniffed === "gif";

  let processed: Buffer;
  let width = 0;
  let height = 0;

  try {
    const pipeline = sharp(input, { failOn: "error" })
      .rotate()
      .resize({
        width: maxEdge,
        height: maxEdge,
        fit: "inside",
        withoutEnlargement: true,
      });

    // animated GIF nao pode virar JPEG parado
    processed = isGif
      ? await pipeline.gif().toBuffer()
      : await pipeline.webp({ quality }).toBuffer();

    const meta = await sharp(processed).metadata();
    width = meta.width ?? 0;
    height = meta.height ?? 0;
  } catch (error) {
    logger.warn("falha ao processar imagem", {
      userId,
      error: serializeError(error),
    });
    return fail("nao conseguimos ler essa imagem", 422);
  }

  // A extensao vem do que gravamos de fato, nunca do que o cliente mandou.
  const outputType = isGif ? "gif" : "webp";
  const key = buildMediaKey(userId, outputType);
  const contentType = ALLOWED_IMAGE_TYPES[outputType].mime;

  try {
    await storage.put(key, processed, contentType);

    const media = await prisma.media.create({
      data: {
        userId,
        key,
        mime: contentType,
        size: processed.byteLength,
        width,
        height,
        kind,
        caption: String(form.get("caption") ?? "").slice(0, 120),
      },
    });

    logger.info("upload concluido", {
      userId,
      kind,
      bytes: processed.byteLength,
      width,
      height,
    });

    return NextResponse.json({
      id: media.id,
      url: `/api/media/${key}`,
      key: media.key,
      mime: media.mime,
      size: media.size,
      width: media.width,
      height: media.height,
      requestId: request.headers.get("x-request-id"),
    });
  } catch (error) {
    logger.error("falha ao gravar upload", {
      userId,
      key,
      requestId: request.headers.get("x-request-id") ?? randomUUID(),
      error: serializeError(error),
    });
    return fail("falha ao salvar o arquivo", 500);
  }
}

export function GET() {
  return NextResponse.json({ error: "use POST" }, { status: 405, headers: { allow: "POST" } });
}