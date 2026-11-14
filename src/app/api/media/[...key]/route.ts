import { NextResponse } from "next/server";
import { stat } from "node:fs/promises";
import { storage, STORAGE_ROOT } from "@/lib/storage";
import { prisma } from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import { isSafeKey } from "@/lib/image";
import { join } from "node:path";

const logger = createLogger("media");

export const dynamic = "force-dynamic";

/**
 * GET /api/media/<pasta>/<arquivo>
 *
 * A chave tem barra, entao a rota e catch-all ([...key]).
 *
 * Serve com nosniff e CSP sandbox: mesmo que um HTML/SVG escapasse do
 * pipeline de upload, ele rodaria isolado e sem acesso a origem.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key: segments } = await params;
  const key = segments.map((part) => decodeURIComponent(part)).join("/");

  if (!isSafeKey(key)) {
    return NextResponse.json({ error: "chave invalida" }, { status: 400 });
  }

  const record = await prisma.media.findUnique({
    where: { key },
    select: { mime: true, size: true, createdAt: true, id: true },
  });

  if (!record) {
    return NextResponse.json({ error: "nao encontrado" }, { status: 404 });
  }

  const path = join(STORAGE_ROOT, key);

  let etag: string;
  let lastModified: Date;

  try {
    const info = await stat(path);
    etag = `"${info.size.toString(16)}-${info.mtimeMs.toString(16)}"`;
    lastModified = info.mtime;
  } catch {
    // Registro existe mas arquivo sumiu (deploy novo, disco trocado).
    logger.error("midia sem arquivo", { key, mediaId: record.id });
    return NextResponse.json({ error: "arquivo indisponivel" }, { status: 410 });
  }

  const data = await storage.get(key);
  if (!data) {
    logger.error("leitura falhou", { key });
    return NextResponse.json({ error: "arquivo indisponivel" }, { status: 410 });
  }

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "content-type": record.mime,
      "content-length": String(data.byteLength),
      "cache-control": "public, max-age=31536000, immutable",
      etag,
      "last-modified": lastModified.toUTCString(),
      "x-content-type-options": "nosniff",
      "x-frame-options": "DENY",
      "content-security-policy": "default-src 'none'; sandbox; img-src 'self'",
      "referrer-policy": "no-referrer",
      "content-disposition": "inline",
    },
  });
}