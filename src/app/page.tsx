import Link from "next/link";
import { trendingArtists } from "@/lib/artists";
import { getSessionUser } from "@/lib/auth";
import { fetchLists, fetchReviews, leaderboard } from "@/lib/social";
import ArtistWall from "@/components/ArtistWall";
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

      <div className="mx-auto max-w-7xl space-y-16 px-4 py-14">
        {followingFeed.length > 0 && (
          <section>
            <SectionTitle title="Tes abonnements" hint="Ce que les gens que tu suis viennent de noter" />
            <div className="grid gap-3 md:grid-cols-2">
              {followingFeed.map((r) => (
                <ReviewCard key={r.id} review={r} signedIn={Boolean(user)} />
              ))}
            </div>
          </section>
        )}

        {wall.length > 0 ? (
          <section>
            <SectionTitle title="En ce moment" hint="Les visages les plus regardés cette semaine" />
            <ArtistWall artists={wall.slice(0, 24)} />
          </section>
        ) : (
          <MissingKeysNotice />
        )}

        <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME} />

        {top.length > 0 && (
          <section>
            <SectionTitle title="Les mieux notés" hint="Moyenne pondérée de la communauté" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {top.map(({ card, average, count }) => (
                <Link
                  key={`${card.kind}:${card.externalId}`}
                  href={`/artiste/${card.kind}/${card.externalId}`}
                  className="flex items-center gap-3 rounded-xl border border-edge bg-surface/40 p-3 transition hover:border-gold/50"
                >
                  {card.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={card.imageUrl}
                      alt=""
                      loading="lazy"
                      className="h-14 w-10 rounded object-cover object-top"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{card.name}</p>
                    <Stars score={Math.round(average * 2)} size={11} />
                    <p className="text-[11px] text-muted">
                      {count} note{count > 1 ? "s" : ""}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            <Link
              href="/classement"
              className="mt-4 inline-block text-xs text-muted underline underline-offset-4 transition hover:text-gold"
            >
              Voir le classement complet
            </Link>
          </section>
        )}

        {recentLists.length > 0 && (
          <section>
            <SectionTitle title="Listes récentes" hint="Des sélections rangées à la main" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {recentLists.map((l) => (
                <ListTile key={l.id} list={l} />
              ))}
            </div>
          </section>
        )}

        {activity.length > 0 && (
          <section>
            <SectionTitle title="Dernières critiques" hint="Ce que la communauté vient de publier" />
            <div className="grid gap-3 md:grid-cols-2">
              {activity.map((r) => (
                <ReviewCard key={r.id} review={r} signedIn={Boolean(user)} />
              ))}
            </div>
            <Link
              href="/critiques"
              className="mt-4 inline-block text-xs text-muted underline underline-offset-4 transition hover:text-gold"
            >
              Toutes les critiques
            </Link>
          </section>
        )}
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
    <div className="rounded-2xl border border-gold/30 bg-gold/5 p-8 text-center">
      <h2 className="text-lg font-bold">Ajoute tes clés d&apos;API</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm text-muted">
        Le mur est vide parce que <code className="text-gold">TMDB_API_KEY</code> et les identifiants
        Spotify ne sont pas renseignés dans les variables d&apos;environnement.
      </p>
    </div>
  );
}
