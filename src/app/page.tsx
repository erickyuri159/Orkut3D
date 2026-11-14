import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Flame,
  Ghost,
  Globe,
  Hand,
  LayoutGrid,
  MessagesSquare,
  Newspaper,
  Radio,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTheme } from "@/lib/theme";
import { HeroScene } from "@/components/HeroScene";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProfileVista, ProfileVistaLegacy, ProfileVistaNight } from "@/components/ProfileVista";

const FEATURES = [
  {
    icon: Ghost,
    title: "Scrapbook",
    body: "O livro de recados: cada perfil tem um mural, com comentários públicos ou privados.",
  },
  {
    icon: Hand,
    title: "Cutucadas",
    body: "Cutuque, chame, dê high-five. Devolva. See quem te cutucou e há quanto tempo.",
  },
  {
    icon: Globe,
    title: "Comunidades",
    body: "Fóruns com dono, moderadores, tópico fixado, trancagem e tema de cor próprio.",
  },
  {
    icon: MessagesSquare,
    title: "Mensagens privadas",
    body: "Caixa de entrada com conversas, não lidas e resposta em um clique.",
  },
  {
    icon: Newspaper,
    title: "Recados",
    body: "Feed cronológico que chega para todos os seus amigos de uma vez.",
  },
  {
    icon: Trophy,
    title: "Ranking",
    body: "Perfis mais visitados, comunidades mais ativas e a lista dos mais antigos.",
  },
  {
    icon: LayoutGrid,
    title: "Classificados",
    body: "Mercado com categorias, busca por região e conversa direta com o vendedor.",
  },
  {
    icon: Users,
    title: "Grafo de conexões",
    body: "Sua rede inteira projetada como uma constelação tridimensional em WebGL.",
  },
];

export default async function LandingPage() {
  const user = await currentUser();
  if (user) redirect("/app/feed");

  const theme = await getTheme();
  const [users, communities, scraps, listings] = await Promise.all([
    prisma.user.count(),
    prisma.community.count(),
    prisma.scrap.count(),
    prisma.listing.count(),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-5 pb-8">
      <nav className="flex items-center justify-between py-7">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full border border-cyan/40 bg-cyan/10 font-display text-[10px] font-bold text-cyan">
            ORB
          </span>
          <span className="font-display text-sm tracking-[0.32em] uppercase">
            ORB<span className="text-cyan">{"//2088"}</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle current={theme} />
          <Link href="/login" className="btn btn-ghost">
            Entrar
          </Link>
          <Link href="/registrar" className="btn btn-primary">
            Criar perfil
          </Link>
        </div>
      </nav>

      <section className="relative mt-6 grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <span className="chip">
            <Sparkles size={13} /> Rede social em 3D
          </span>
          <h1 className="mt-6 font-display text-[clamp(2.6rem,7vw,4.6rem)] leading-[0.95] font-bold tracking-tight">
            Cada pessoa é uma <span className="neon-text">esfera.</span>
            <br />
            A rede inteira é o céu.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted">
            ORB // 2088 é uma rede social independente com amigos, comunidades, scraps,
            cutucadas, recados, mensagens e classificados — reconstruída com WebGL no lugar
            das fotos de 2004.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/registrar" className="btn btn-primary px-6 py-3">
              Entrar na rede <ArrowRight size={16} />
            </Link>
            <Link href="/login" className="btn btn-ghost px-6 py-3">
              Já tenho perfil
            </Link>
          </div>

          <dl className="mt-10 grid max-w-lg grid-cols-4 gap-3">
            {[
              ["Perfis", users],
              ["Comunidades", communities],
              ["Scraps", scraps],
              ["Anúncios", listings],
            ].map(([label, value]) => (
              <div key={String(label)} className="panel px-3 py-3 text-center">
                <dt className="label">{label}</dt>
                <dd className="font-display text-xl text-cyan">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative h-[380px] sm:h-[460px]">
          {theme === "klass" ? (
            <div className="panel h-full w-full overflow-hidden">
              <ProfileVistaLegacy seed={137} />
            </div>
          ) : theme === "noite" ? (
            <div className="panel h-full w-full overflow-hidden">
              <ProfileVistaNight seed={137} />
            </div>
          ) : (
            <>
              <HeroScene className="absolute inset-0" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-void to-transparent" />
            </>
          )}
        </div>
      </section>

      <section className="mt-24">
        <h2 className="panel-title mb-6">Funcionalidades</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="panel corner-frame group p-5 transition-transform duration-300 hover:-translate-y-1">
              <feature.icon className="text-cyan" size={22} />
              <h3 className="mt-3 font-display text-sm tracking-[0.14em] uppercase">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted">{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-20 grid gap-6 lg:grid-cols-2">
        <div className="panel corner-frame overflow-hidden">
          <div className="h-48">
            {theme === "klass" ? (
              <ProfileVistaLegacy seed={42} />
            ) : theme === "noite" ? (
              <ProfileVistaNight seed={42} />
            ) : (
              <ProfileVista seed={42} className="h-full w-full" />
            )}
          </div>
          <div className="px-6 py-5">
            <h2 className="font-display text-xl uppercase">Vistas procedurais</h2>
            <p className="mt-2 text-sm text-muted">
              Cada perfil tem uma VISTA gerada em tempo real a partir da sua semente: sol com
              fendas, montanhas por ruído fractal, mar de grade em perspectiva e estrelas que
              piscam. Ninguém tem a mesma vista que você.
            </p>
          </div>
        </div>

        <div className="panel corner-frame flex flex-col justify-between px-6 py-8">
          <Flame className="text-magenta" size={28} />
          <h2 className="mt-4 font-display text-2xl uppercase">
            Ou volte para <span className="neon-text">2004</span>
          </h2>
          <p className="mt-3 text-sm text-muted">
            Um botão troca o site inteiro: Verdana 11px, bordas duras, botões salientes, fundo
            branco e as Vistas viram um GIF de grade. O mesmo produto, renderizado como era
            renderizado antes.
          </p>
          <div className="mt-6">
            <ThemeToggle current={theme} />
          </div>
        </div>
      </section>

      <section className="panel corner-frame scanline relative mt-20 overflow-hidden px-8 py-14 text-center">
        <Radio className="mx-auto text-cyan" size={30} />
        <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
          Seu perfil tem um <span className="neon-text">corpo 3D</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-muted">
          Sem foto, sem upload: o núcleo de cada usuário é gerado proceduralmente em tempo real a
          partir do nome e da semente do perfil. Ninguém é igual a ninguém — literalmente por
          geometria.
        </p>
        <Link href="/registrar" className="btn btn-primary mt-8 px-7 py-3">
          Gerar meu núcleo <ArrowRight size={16} />
        </Link>
      </section>
    </main>
  );
}
