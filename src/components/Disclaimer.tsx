import Link from "next/link";

export function Disclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <footer
      className={`mt-16 border-t border-cyan/12 px-5 py-8 text-center ${compact ? "mt-10" : ""}`}
      data-theme-note
    >
      <p className="mx-auto max-w-3xl text-xs leading-relaxed text-muted">
        <strong className="text-cyan-soft">ORB // 2088</strong> é um projeto independente e não
        oficial: uma homenagem às redes sociais de comunidades, scraps e cutucadas dos anos
        2000, reconstruída com renderização tridimensional. Não somos afiliados, patrocinados ou
        endossados por Orkut, Google, Meta ou por qualquer rede social mencionada como referência
        histórica. Todas as marcas citadas pertencem aos seus respectivos proprietários. ORB é um
        nome original deste projeto.
      </p>
      <nav className="mt-4 flex flex-wrap items-center justify-center gap-4 text-[11px] tracking-[0.16em] uppercase">
        <Link href="/" className="text-cyan hover:underline">
          Início
        </Link>
        <Link href="/login" className="text-cyan hover:underline">
          Entrar
        </Link>
        <Link href="/registrar" className="text-cyan hover:underline">
          Criar perfil
        </Link>
      </nav>
    </footer>
  );
}
