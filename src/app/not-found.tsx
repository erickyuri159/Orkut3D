import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-5">
      <div className="panel corner-frame max-w-lg px-8 py-12 text-center">
        <p className="font-display text-6xl font-bold neon-text">404</p>
        <h1 className="mt-4 font-display text-xl tracking-[0.2em] uppercase">Perfil não encontrado</h1>
        <p className="mt-3 text-sm text-muted">
          Esse endereço não existe na rede — ou o perfil foi removido antes do algoritmo
          conseguir indexá-lo.
        </p>
        <Link href="/app/feed" className="btn btn-primary mt-7">
          Voltar ao feed
        </Link>
      </div>
    </main>
  );
}
