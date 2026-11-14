/**
 * Log estruturado. Em producao emite JSON (uma linha por evento) para poder
 * ser ingerido por Loki/Datadog/CloudWatch sem regex. Em dev, saida legivel.
 *
 * Segredos sao redigidos por CHAVE, nunca por valor: um log com
 * `password: "***"` e um log vazio nao prestam a mesma evidencia.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const REDACT_KEYS = new Set([
  "password",
  "passwordhash",
  "newpassword",
  "token",
  "secret",
  "authorization",
  "cookie",
  "session",
  "authsecret",
  "apikey",
  "x-forwarded-for",
]);

const MAX_DEPTH = 4;

export type LogContext = Record<string, unknown>;

function redact(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (depth > MAX_DEPTH) return "[deep]";

  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) return serializeError(value);
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => redact(item, depth + 1));
  if (typeof value === "bigint") return value.toString();

  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      out[key] = REDACT_KEYS.has(key.toLowerCase()) ? "[redacted]" : redact(item, depth + 1);
    }
    return out;
  }

  return value;
}

export function serializeError(error: unknown) {
  if (!(error instanceof Error)) return { message: String(error) };
  return {
    name: error.name,
    message: error.message,
    stack: error.stack?.split("\n").slice(0, 12).join("\n"),
  };
}

/** Extrai codigo Prisma (ex.: P2002) para log sem stack Noise. */
export function prismaCode(error: unknown) {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string") return code;
  }
  return null;
}

const isProd = process.env.NODE_ENV === "production";
const minLevel: LogLevel =
  isProd ? ((process.env.LOG_LEVEL as LogLevel) ?? "info") : "debug";

function emit(level: LogLevel, scope: string, message: string, context?: LogContext) {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[minLevel]) return;

  const payload = {
    level,
    scope,
    message,
    time: new Date().toISOString(),
    ...(context ? (redact(context) as Record<string, unknown>) : {}),
  };

  if (isProd) {
    const line = JSON.stringify(payload);
    if (level === "error") process.stderr.write(`${line}\n`);
    else process.stdout.write(`${line}\n`);
    return;
  }

  const tint: Record<LogLevel, string> = {
    debug: "\u001b[90m",
    info: "\u001b[36m",
    warn: "\u001b[33m",
    error: "\u001b[31m",
  };
  const tag = `${tint[level]}${level.toUpperCase().padEnd(5)}\u001b[0m`;
  const extra = context ? ` ${JSON.stringify(redact(context))}` : "";
  const stream = level === "error" ? process.stderr : process.stdout;
  stream.write(`${tag} [${scope}] ${message}${extra}\n`);
}

export type Logger = {
  debug: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, context?: LogContext) => void;
  child: (subScope: string) => Logger;
};

export function createLogger(scope: string): Logger {
  return {
    debug: (message, context) => emit("debug", scope, message, context),
    info: (message, context) => emit("info", scope, message, context),
    warn: (message, context) => emit("warn", scope, message, context),
    error: (message, context) => emit("error", scope, message, context),
    child: (subScope) => createLogger(`${scope}:${subScope}`),
  };
}

export const log = createLogger("orb");

/** Cobre uma acao inteira: loga duracao, erro e codigo Prisma em um lugar so. */
export async function logAction<T>(
  scope: string,
  name: string,
  run: () => Promise<T>,
): Promise<T> {
  const logger = createLogger(`action:${scope}`);
  const started = Date.now();

  try {
    const result = await run();
    logger.debug(`${name} ok`, { ms: Date.now() - started });
    return result;
  } catch (error) {
    logger.error(`${name} falhou`, {
      ms: Date.now() - started,
      code: prismaCode(error),
      error: serializeError(error),
    });
    throw error;
  }
}