import Link from "next/link";
import { Search as SearchIcon } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Panel, EmptyState } from "@/components/ui/Panel";
import { Avatar } from "@/components/ui/Avatar";

export const metadata = { title: "Busca" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const viewer = await currentUser();
  if (!viewer) return null;

  const { q } = await searchParams;
  const term = (q ?? "").trim();
  const active = term.length >= 2;

  const [users, communities, listings] = active
    ? await Promise.all([
        prisma.user.findMany({
          where: {
            OR: [
              { name: { contains: term } },
              { username: { contains: term } },
              { headline: { contains: term } },
              { hobbies: { contains: term } },
              { quote: { contains: term } },
            ],
          },
          take: 24,
          select: { id: true, name: true, uid: true, username: true, avatarSeed: true, headline: true, city: true },
        }),
        prisma.community.findMany({
          where: {
            OR: [{ name: { contains: term } }, { tagline: { contains: term } }, { description: { contains: term } }],
          },
          take: 12,
          include: { _count: { select: { members: true } } },
        }),
        prisma.listing.findMany({
          where: { OR: [{ title: { contains: term } }, { description: { contains: term } }] },
          take: 12,
          include: { seller: { select: { name: true, uid: true } } },
        }),
      ])
    : [[], [], []];

  const total = users.length + communities.length + listings.length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Panel>
        <form action="/app/busca" className="px-5 py-5">
          <label className="label" htmlFor="q">
            Buscar pessoas, comunidades e anúncios
          </label>
          <div className="relative">
            <input
              id="q"
              name="q"
              className="field py-3 pl-10 text-base"
              placeholder="ex.: vaporwave, ana, videogame…"
              defaultValue={term}
              autoFocus
            />
            <SearchIcon size={18} className="absolute top-1/2 left-3 -translate-y-1/2 text-cyan" />
          </div>
        </form>
      </Panel>

      {active && total === 0 ? (
        <Panel>
          <EmptyState
            icon={<SearchIcon size={26} />}
            title="Nada encontrado"
            hint={`Nenhum resultado para "${term}". Tente outro termo.`}
          />
        </Panel>
      ) : null}

      {users.length > 0 ? (
        <Panel title={`Pessoas (${users.length})`}>
          <ul className="divide-y divide-cyan/8">
            {users.map((person) => (
              <li key={person.id}>
                <Link href={`/app/profile/${person.uid}`} className="flex items-center gap-3 px-5 py-3 hover:bg-cyan/6">
                  <Avatar name={person.name} seed={person.avatarSeed} size={42} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{person.name}</p>
                    <p className="truncate font-mono text-[11px] text-muted">
                      @{person.username}
                      {person.city ? ` · ${person.city}` : ""}
                    </p>
                    {person.headline ? (
                      <p className="truncate text-xs text-muted">{person.headline}</p>
                    ) : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      {communities.length > 0 ? (
        <Panel title={`Comunidades (${communities.length})`}>
          <ul className="divide-y divide-cyan/8">
            {communities.map((community) => (
              <li key={community.id}>
                <Link href={`/app/comunidades/${community.slug}`} className="flex items-center gap-3 px-5 py-3 hover:bg-cyan/6">
                  <span className="h-4 w-4 rounded-full" style={{ backgroundColor: community.theme }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{community.name}</p>
                    <p className="truncate text-xs text-muted">{community.tagline || community.description}</p>
                  </div>
                  <span className="font-mono text-[11px] text-muted">{community._count.members} membros</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      {listings.length > 0 ? (
        <Panel title={`Anúncios (${listings.length})`}>
          <ul className="divide-y divide-cyan/8">
            {listings.map((listing) => (
              <li key={listing.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{listing.title}</p>
                  <p className="truncate font-mono text-[11px] text-muted">
                    por {listing.seller.name} · {listing.location || "sem local"}
                  </p>
                </div>
                <Link href={`/app/mensagens?to=${listing.seller.uid}`} className="btn btn-ghost px-3 py-1.5 text-[11px]">
                  {listing.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}
