import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { randomUUID } from "node:crypto";

const SESSION_COOKIE = "orb_session";
const DEV_FALLBACK_SECRET = "orb2088-dev-secret-troque-em-producao";

function getSecret() {
  const value = process.env.AUTH_SECRET;

  if (!value || value.length < 32) {
    if (process.env.NODE_ENV === "production") {
      // Falhar cedo e melhor do que emitir token com segredo previsivel.
      throw new Error(
        "AUTH_SECRET ausente ou curto demais. Gere com: openssl rand -base64 48",
      );
    }
    return new TextEncoder().encode(DEV_FALLBACK_SECRET);
  }

  return new TextEncoder().encode(value);
}

export async function isAuthenticated(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return false;

  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

/**
 * Proxy: bloqueia a area autenticada e propaga um request-id para correlacionar
 * o log do edge com o log da acao no servidor.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!(await isAuthenticated(request))) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const requestId = request.headers.get("x-request-id") ?? randomUUID();

  // Preservar os headers originais e ESSENCIAL: trocar por um Headers novo
  // descarta o Cookie e a pagina seguinte acha que a sessao sumiu.
  const headers = new Headers(request.headers);
  headers.set("x-request-id", requestId);

  const response = NextResponse.next({ request: { headers } });
  response.headers.set("x-request-id", requestId);
  return response;
}

export const config = {
  matcher: ["/app/:path*"],
};