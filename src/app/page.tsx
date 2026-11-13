import Link from "next/link";
import { trendingArtists } from "@/lib/artists";
import { getSessionUser } from "@/lib/auth";
import { fetchLists, fetchReviews, leaderboard } from "@/lib/social";
import ArtistCardTile from "@/components/ArtistCardTile";
import FeaturedBanner from "@/components/FeaturedBanner";
import Shelf from "@/components/Shelf";
import Hero from "@/components/Hero";
import ReviewCard from "@/components/ReviewCard";
import ListTile from "@/components/ListTile";
import AdSlot from "@/components/AdSlot";
import { Stars } from "@/components/Stars";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getSessionUser();

  const [wall, activity, top, recentLists, followingFeed] = await Promise.all([
    trendingArtists(),
    fetchReviews({ kind: "all" }, { viewerId: user?.id, limit: 6, withTextOnly: true }).catch(() => []),
    leaderboard("all", 8).catch(() => []),
    fetchLists({ publicOnly: true, limit: 4 }).catch(() => []),
    user
      ? fetchReviews({ kind: "following", userId: user.id }, { viewerId: user.id, limit: 6 }).catch(
          () => [],
        )
      : Promise.resolve([]),
  ]);

  return (
    <>
      <Hero signedIn={Boolean(user)} username={user?.username} />

      <div className="mx-auto grid max-w-[1400px] gap-6 px-4 py-10 md:pl-24 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* Colonne latérale : dernières critiques, façon « nouvelles bandes-annonces » */}
        <aside className="order-2 space-y-4 lg:order-1">
          <div className="glass rounded-[1.75rem] p-5 lg:sticky lg:top-24">
            <p className="text-lg font-bold">Dernières critiques 🔥</p>
            <p className="text-xs text-muted">Publiées par la communauté</p>
            <div className="mt-4 space-y-3">
              {activity.slice(0, 5).map((r) => (
                <Link
                  key={r.id}
                  href={`/artiste/${r.artist.kind}/${r.artist.externalId}`}
                  className="group relative block h-28 overflow-hidden rounded-2xl"
                >
                  {r.artist.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.artist.imageUrl}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover object-[center_25%] transition duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full bg-surface" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/30 to-transparent" />
                  <div className="absolute inset-x-3 bottom-2.5 flex items-end justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{r.artist.name}</p>
                      <p className="truncate text-[11px] text-muted">par {r.displayName}</p>
                    </div>
                    <span className="glass shrink-0 rounded-full px-2 py-0.5 text-[11px]">
                      ★ {(r.score / 2).toFixed(1)}
                    </span>
                  </div>
                </Link>
              ))}
              {activity.length === 0 && (
                <p className="text-xs text-muted">Aucune critique pour l&apos;instant.</p>
              )}
            </div>
            <Link
              href="/critiques"
              className="mt-4 block rounded-full bg-white/5 py-2 text-center text-xs text-muted transition hover:bg-white/10 hover:text-text"
            >
              Toutes les critiques
            </Link>
          </div>
        </aside>

        <div className="order-1 min-w-0 space-y-12 lg:order-2">
          {wall.length > 0 ? <FeaturedBanner artists={wall} /> : <MissingKeysNotice />}

          {followingFeed.length > 0 && (
            <Shelf title="Tes abonnements" hint="Ce que les gens que tu suis viennent de noter">
              {followingFeed.map((r) => (
                <div key={r.id} className="w-[min(420px,85vw)]">
                  <ReviewCard review={r} signedIn={Boolean(user)} />
                </div>
              ))}
            </Shelf>
          )}

          {wall.length > 0 && (
            <Shelf
              title="En ce moment"
              hint="Les visages les plus regardés cette semaine"
              more={{ href: "/decouvrir", label: "Tout voir" }}
            >
              {wall.slice(0, 24).map((a, i) => (
                <div key={`${a.kind}:${a.externalId}`} className="w-36 sm:w-44">
                  <ArtistCardTile artist={a} priority={i < 6} />
                </div>
              ))}
            </Shelf>
          )}

          <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME} />

          {top.length > 0 && (
            <Shelf
              title="Les mieux notés"
              hint="Moyenne pondérée de la communauté"
              more={{ href: "/classement", label: "Classement" }}
            >
              {top.map(({ card, average, count }, n) => (
                <Link
                  key={`${card.kind}:${card.externalId}`}
                  href={`/artiste/${card.kind}/${card.externalId}`}
                  className="group relative block h-56 w-[min(300px,78vw)] overflow-hidden rounded-[1.5rem] border border-white/10"
                >
                  {card.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={card.imageUrl}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover object-[center_20%] transition duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full bg-surface" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
                  <span className="display absolute left-4 top-3 text-5xl text-white/25">{n + 1}</span>
                  <div className="absolute inset-x-4 bottom-3 flex items-end justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{card.name}</p>
                      <div className="flex items-center gap-2 text-[11px] text-muted">
                        <Stars score={Math.round(average * 2)} size={11} />
                        {count} note{count > 1 ? "s" : ""}
                      </div>
                    </div>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-ink">
                      ★
                    </span>
                  </div>
                </Link>
              ))}
            </Shelf>
          )}

          {recentLists.length > 0 && (
            <Shelf
              title="Listes récentes"
              hint="Des sélections rangées à la main"
              more={{ href: "/listes", label: "Toutes" }}
            >
              {recentLists.map((l) => (
                <div key={l.id} className="w-[min(320px,80vw)]">
                  <ListTile list={l} />
                </div>
              ))}
            </Shelf>
          )}
        </div>
      </div>
    </>
  );
}

function SectionTitle({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      <p className="text-xs text-muted">{hint}</p>
    </div>
  );
}

function MissingKeysNotice() {
  return (
    <div className="glass rounded-[2rem] p-8 text-center">
      <h2 className="text-lg font-bold">Ajoute tes clés d&apos;API</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm text-muted">
        Le mur est vide parce que <code className="text-gold">TMDB_API_KEY</code> et les identifiants
        Spotify ne sont pas renseignés dans les variables d&apos;environnement.
      </p>
    </div>
  );
}
