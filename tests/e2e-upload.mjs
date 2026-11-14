import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Teste ponta a ponta do upload contra o servidor real:
 * imagem valida, arquivo disfarçado, SVG, traversal e sessao ausente.
 *
 * Usa node:test porque precisa subir um servidor e falar HTTP de verdade.
 */

const BASE = process.env.BASE ?? "http://localhost:4490";
const TOKEN = process.env.TOKEN ?? "";
const OUT = resolve(process.cwd(), "tests", ".tmp");

mkdirSync(OUT, { recursive: true });

// PNG minimo valido (1x1) e um SVG e um "PNG" que e na verdade texto.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);
const SVG = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>`,
  "utf8",
);
const FAKE_PNG = Buffer.from(`<?php system($_GET["c"]); ?>`, "utf8");
const EMPTY = Buffer.alloc(0);
const HUGE = Buffer.concat([PNG, Buffer.alloc(9 * 1024 * 1024)]);

writeFileSync(resolve(OUT, "ok.png"), PNG);
writeFileSync(resolve(OUT, "evil.svg"), SVG);
writeFileSync(resolve(OUT, "fake.png"), FAKE_PNG);
writeFileSync(resolve(OUT, "empty.png"), EMPTY);
writeFileSync(resolve(OUT, "huge.png"), HUGE);

async function upload(file, filename, type, kind = "photo") {
  const form = new FormData();
  form.set("file", new Blob([file], { type }), filename);
  form.set("kind", kind);

  const response = await fetch(`${BASE}/api/upload`, {
    method: "POST",
    headers: { cookie: `orb_session=${TOKEN}` },
    body: form,
  });

  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  return { status: response.status, body };
}

const results = [];

function check(name, condition, detail = "") {
  results.push({ name, ok: Boolean(condition), detail });
  console.log(`${condition ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function main() {
  console.log(`alvo: ${BASE}\n`);

  // 1. sem sessao
  const anon = await fetch(`${BASE}/api/upload`, { method: "POST" });
  check("sem sessao -> 401", anon.status === 401, `recebido ${anon.status}`);

  // 2. PNG valido
  const good = await upload(PNG, "minha-foto-secreta.png", "image/png");
  check("png valido -> 200", good.status === 200, JSON.stringify(good.body));
  check(
    "resposta traz url em /api/media",
    typeof good.body?.url === "string" && good.body.url.startsWith("/api/media/"),
    good.body?.url ?? "-",
  );
  check("nome do cliente nao vaza na chave", !String(good.body?.key).includes("secreta"), good.body?.key);

  // 3. svg bloqueado
  const svg = await upload(SVG, "malvado.svg", "image/svg+xml");
  check("svg -> 415", svg.status === 415, JSON.stringify(svg.body));

  // 4. png disfarcado (conteudo de texto)
  const fake = await upload(FAKE_PNG, "virus.png", "image/png");
  check("png disfarçado -> 415", fake.status === 415, JSON.stringify(fake.body));

  // 5. arquivo vazio
  const empty = await upload(EMPTY, "vazio.png", "image/png");
  check("vazio -> 400", empty.status === 400, JSON.stringify(empty.body));

  // 6. acima do limite
  const huge = await upload(HUGE, "gigante.png", "image/png");
  check("acima de 8MB -> 413", huge.status === 413, JSON.stringify(huge.body));

  // 7. kind invalido
  const badKind = await upload(PNG, "x.png", "image/png", "exe");
  check("kind invalido -> 400", badKind.status === 400, JSON.stringify(badKind.body));

  // 8. servir a midia
  if (good.body?.url) {
    const media = await fetch(`${BASE}${good.body.url}`);
    check("midia baixada -> 200", media.status === 200, `recebido ${media.status}`);
    check("content-type webp", media.headers.get("content-type") === "image/webp", String(media.headers.get("content-type")));
    check("nosniff", media.headers.get("x-content-type-options") === "nosniff");
    check("csp sandbox", (media.headers.get("content-security-policy") ?? "").includes("sandbox"));
    check("cache immutable", (media.headers.get("cache-control") ?? "").includes("immutable"));
    check("ETag presente", Boolean(media.headers.get("etag")));
  }

  // 9. traversal no caminho
  for (const bad of ["../../../../etc/passwd", "abcdef12/../../secrets.png", "x.svg", "%2e%2e%2f"]) {
    const res = await fetch(`${BASE}/api/media/${bad}`);
    check(`traversal bloqueado (${bad})`, res.status === 400 || res.status === 404, `recebido ${res.status}`);
  }

  // 10. mime enganoso: declara png, manda gif
  const lying = await upload(PNG, "x.png", "image/webp");
  check("mime declarado errado ainda aceito (bytes mandam)", lying.status === 200, `recebido ${lying.status}`);

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} verificacoes passaram`);

  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});