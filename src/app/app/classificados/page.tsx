import Link from "next/link";
import { MapPin, ShoppingBag } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatBRL, hashCode, relativeTime } from "@/lib/format";
import { LISTING_CATEGORIES } from "@/lib/enums";
import { Panel, EmptyState } from "@/components/ui/Panel";
import { Avatar } from "@/components/ui/Avatar";
import { NewListingForm, ListingActions } from "@/components/marketplace/ListingForms";

export const metadata = { title: "Classificados" };

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const viewer = await currentUser();
  if (!viewer) return null;

  const { cat } = await searchParams;
  const activeCategory = LISTING_CATEGORIES.find((item) => item.id === cat);

  const listings = await prisma.listing.findMany({
    where: activeCategory ? { category: activeCategory.id } : undefined,
    orderBy: { createdAt: "desc" },
    take: 60,
    include: { seller: { select: { id: true, name: true, uid: true, avatarSeed: true } } },
  });

  return (
    <div className="space-y-6">
      <Panel title="Publicar anúncio">
        <div className="px-5 py-4">
          <NewListingForm />
        </div>
      </Panel>

      <div className="flex flex-wrap gap-2">
        <Link href="/app/classificados" className={`btn ${!activeCategory ? "btn-primary" : "btn-ghost"} px-3 py-1.5 text-[11px]`}>
          Todas
        </Link>
        {LISTING_CATEGORIES.map((category) => (
          <Link
            key={category.id}
            href={`/app/classificados?cat=${category.id}`}
            className={`btn px-3 py-1.5 text-[11px] ${cat === category.id ? "btn-primary" : "btn-ghost"}`}
          >
            {category.label}
          </Link>
        ))}
      </div>

      {listings.length === 0 ? (
        <Panel>
          <EmptyState icon={<ShoppingBag size={26} />} title="Nada à venda" hint="Seja o primeiro a anunciar." />
        </Panel>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => {
            const hue = hashCode(listing.seed) % 360;
            return (
              <article key={listing.id} className="panel corner-frame overflow-hidden">
                <div
                  className="relative h-28"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, hsl(${(hue + 50) % 360} 92% 62% / 0.85), transparent 55%), linear-gradient(135deg, #060a18, #101a3c)`,
                  }}
                >
                  <div className="grid-floor absolute inset-0" />
                  {listing.sold ? (
                    <span className="absolute top-2 right-2 rounded-full bg-magenta px-2 py-0.5 text-[10px] font-bold uppercase">
                      vendido
                    </span>
                  ) : null}
                </div>
                <div className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-display text-base leading-snug">{listing.title}</h2>
                    <p className="font-display text-lg whitespace-nowrap text-cyan">
                      {formatBRL(listing.price)}
                    </p>
                  </div>
                  {listing.description ? (
                    <p className="mt-2 line-clamp-2 text-xs text-muted">{listing.description}</p>
                  ) : null}

                  <p className="mt-3 flex items-center gap-1 font-mono text-[11px] text-muted">
                    <MapPin size={11} /> {listing.location || "sem local"}
                  </p>

                  <div className="mt-3 flex items-center gap-2 border-t border-cyan/10 pt-3">
                    <Avatar name={listing.seller.name} seed={listing.seller.avatarSeed} size={28} />
                    <Link
                      href={`/app/profile/${listing.seller.uid}`}
                      className="min-w-0 flex-1 truncate text-xs text-cyan hover:underline"
                    >
                      {listing.seller.name}
                    </Link>
                    <span className="font-mono text-[10px] text-muted">
                      {relativeTime(listing.createdAt)}
                    </span>
                  </div>

                  {listing.seller.id === viewer.id ? (
                    <div className="mt-3 flex justify-end">
                      <ListingActions
                        listingId={listing.id}
                        sold={listing.sold}
                        isOwner={listing.seller.id === viewer.id}
                      />
                    </div>
                  ) : (
                    <div className="mt-3 flex justify-end">
                      <Link href={`/app/mensagens?to=${listing.seller.uid}`} className="btn btn-ghost px-3 py-1.5 text-[11px]">
                        Falar com o vendedor
                      </Link>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
