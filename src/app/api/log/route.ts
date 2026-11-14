import { NextResponse } from "next/server";
import { z } from "zod";
import { createLogger } from "@/lib/logger";

/**
 * Receptor de erros do cliente.
 *
 * O error boundary so existe enquanto a aba esta aberta — se a renderizacao
 * quebrar as 4h da manha, ninguem ve nada. Aqui o stack chega no log do
 * servidor, com sessao para reproduzir.
 */

const logger = createLogger("client");

const payloadSchema = z.object({
  message: z.string().max(500),
  stack: z.string().max(8000).optional(),
  name: z.string().max(200).optional(),
  digest: z.string().max(200).optional(),
  pathname: z.string().max(500).optional(),
  userAgent: z.string().max(300).optional(),
  userId: z.string().max(60).optional(),
  context: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "payload invalido" }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "payload invalido" }, { status: 400 });
  }

  const data = parsed.data;

  logger.error("erro no cliente", {
    message: data.message,
    name: data.name,
    digest: data.digest,
    pathname: data.pathname,
    userAgent: data.userAgent,
    userId: data.userId,
    context: data.context,
    stack: data.stack,
  });

  return NextResponse.json({ ok: true });
}

export function GET() {
  return NextResponse.json(
    { error: "use POST" },
    { status: 405, headers: { allow: "POST" } },
  );
}