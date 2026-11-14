import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createLogger, serializeError } from "@/lib/logger";

const logger = createLogger("health");

export const dynamic = "force-dynamic";

type Check = { ok: boolean; ms?: number; error?: string };

async function checkDatabase(): Promise<Check> {
  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, ms: Date.now() - started };
  } catch (error) {
    return {
      ok: false,
      ms: Date.now() - started,
      error: serializeError(error).message,
    };
  }
}

/**
 * GET /api/health
 * 200 = servico saudavel. 503 = pronto para receber trafego? nao.
 * Nao expoe stack trace: a causa do erro ja vai para o log.
 */
export async function GET() {
  const started = Date.now();

  const database = await checkDatabase();
  const healthy = database.ok;

  const body = {
    status: healthy ? "ok" : "degraded",
    uptimeSeconds: Math.round(process.uptime()),
    version: process.env.npm_package_version ?? "1.0.0",
    checks: { database },
    ms: Date.now() - started,
  };

  if (!healthy) {
    logger.error("health check falhou", { database });
  } else {
    logger.debug("health check ok", { ms: body.ms });
  }

  return NextResponse.json(body, {
    status: healthy ? 200 : 503,
    headers: { "cache-control": "no-store" },
  });
}