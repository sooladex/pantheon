import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { artists, follows, ratings, users } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth";
import { fetchLists, fetchReviews, rowToCard, socialCounts } from "@/lib/social";
import ArtistWall from "@/components/ArtistWall";
import ReviewCard from "@/components/ReviewCard";
import ListTile from "@/components/ListTile";
import FollowUserButton from "@/components/FollowUserButton";
import ShareButton from "@/components/ShareButton";
import AdSlot from "@/components/AdSlot";
import { Stars } from "@/components/Stars";
import { absolute, jsonLd, pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

async function loadProfile(username: string) {
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.username, username.toLowerCase()))
    .limit(1);
  return row ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const profile = await loadProfile(username).catch(() => null);

  if (!profile) {
    return { title: "Profil introuvable", robots: { index: false, follow: false } };
  }

  return pageMetadata({
    title: `Le panthéon de ${profile.displayName}`,
    description:
      profile.bio ||
      `Les acteurs et chanteurs notés par ${profile.displayName} (@${profile.username}) sur Panthéon.`,
    path: `/u/${profile.username}`,
    type: "profile",
  });
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await loadProfile(username).catch(() => null);
  if (!profile) notFound();

  const viewer = await getSessionUser();
  const isSelf = viewer?.id === profile.id;

  const [rated, followed, aggRows, counts, userLists, theirReviews] = await Promise.all([
    db
      .select({
        score: ratings.score,
        favorite: ratings.favorite,
        kind: artists.kind,
        externalId: artists.externalId,
        name: artists.name,
        imageUrl: artists.imageUrl,
        role: artists.role,
        tags: artists.tags,
        popularity: artists.popularity,
      })
      .from(ratings)
      .innerJoin(artists, eq(artists.id, ratings.artistId))
      .where(eq(ratings.userId, profile.id))
      .orderBy(desc(ratings.updatedAt))
      .catch(() => []),
    db
      .select({
        kind: artists.kind,
        externalId: artists.externalId,
        name: artists.name,
        imageUrl: artists.imageUrl,
        role: artists.role,
        tags: artists.tags,
        popularity: artists.popularity,
      })
      .from(follows)
      .innerJoin(artists, eq(artists.id, follows.artistId))
      .where(eq(follows.userId, profile.id))
      .orderBy(desc(follows.createdAt))
      .catch(() => []),
    db
      .select({ avg: sql<number>`coalesce(avg(${ratings.score}), 0)::float` })
      .from(ratings)
      .where(eq(ratings.userId, profile.id))
      .catch(() => [{ avg: 0 }]),
    socialCounts(profile.id, viewer?.id).catch(() => ({
      followers: 0,
      following: 0,
      followedByViewer: false,
    })),
    fetchLists({ userId: profile.id, publicOnly: !isSelf, limit: 12 }).catch(() => []),
    fetchReviews(
      { kind: "user", userId: profile.id },
      { viewerId: viewer?.id, limit: 8, withTextOnly: true },
    ).catch(() => []),
  ]);

  const average = aggRows[0]?.avg ?? 0;

  const scores: Record<string, number> = {};
  for (const r of rated) scores[`${r.kind}:${r.externalId}`] = r.score;

  const pantheon = rated.filter((r) => r.favorite).map(rowToCard);
  const all = rated.map(rowToCard);

  const schema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    dateCreated: profile.createdAt.toISOString(),
    mainEntity: {
      "@type": "Person",
      name: profile.displayName,
      alternateName: profile.username,
      description: profile.bio || undefined,
      image: profile.avatarUrl ?? undefined,
      url: absolute(`/u/${profile.username}`),
      interactionStatistic: [
        {
          "@type": "InteractionCounter",
          interactionType: "https://schema.org/FollowAction",
          userInteractionCount: counts.followers,
        },
        {
          "@type": "InteractionCounter",
          interactionType: "https://schema.org/ReviewAction",
          userInteractionCount: rated.length,
        },
      ],
    },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 md:pl-24 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />

      {(() => {
        const cover = (pantheon[0] ?? all[0])?.imageUrl ?? null;
        return (
          <header className="glass relative overflow-hidden rounded-[2rem]">
            {cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cover}
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full scale-110 object-cover object-top opacity-35 blur-2xl"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-br from-ink/60 via-ink/80 to-ink" />
            <div className="relative grid gap-8 p-6 md:grid-cols-[minmax(0,1fr)_auto] md:p-10">
              <div className="min-w-0">
                <div className="flex items-center gap-4">
                  {profile.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatarUrl}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-2xl border border-white/15 object-cover"
                    />
                  ) : (
                    <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gold text-xl font-black uppercase text-ink">
                      {profile.displayName.slice(0, 2)}
                    </span>
                  )}
                  <p className="text-sm text-muted">@{profile.username}</p>
                </div>
                <h1 className="mt-5 break-words text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
                  {profile.displayName}
                </h1>
                {profile.bio && (
                  <p className="mt-4 max-w-xl text-base leading-relaxed text-text/80">{profile.bio}</p>
                )}
                <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-4">
                  <Stat label="Notés" value={String(rated.length)} />
                  <Stat label="Abonnés" value={String(counts.followers)} />
                  <Stat label="Abonnements" value={String(counts.following)} />
                  <Stat label="Moyenne" value={average > 0 ? (average / 2).toFixed(1) : "—"} />
                </dl>
                {pantheon.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {pantheon.slice(0, 5).map((a) => (
                      <span
                        key={a.externalId}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted"
                      >
                        {a.name}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <FollowUserButton
                    username={profile.username}
                    initialFollowing={counts.followedByViewer}
                    signedIn={Boolean(viewer)}
                    isSelf={isSelf}
                  />
                  <ShareButton title={`Le panthéon de ${profile.displayName}`} />
                  {average > 0 && (
                    <span className="flex items-center gap-2 text-xs text-muted">
                      Note moyenne donnée : <Stars score={Math.round(average)} size={13} />
                    </span>
                  )}
                </div>
              </div>

              {pantheon.length > 0 && (
                <div className="hidden items-center md:flex">
                  <div className="relative h-64 w-56">
                    {pantheon.slice(0, 3).map((a, n) =>
                      a.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={a.externalId}
                          src={a.imageUrl}
                          alt={a.name}
                          className="absolute h-56 w-40 rounded-[1.5rem] border border-white/15 object-cover object-top shadow-2xl"
                          style={{
                            left: n * 26,
                            top: n * 10,
                            transform: `rotate(${(n - 1) * 6}deg)`,
                            zIndex: 3 - n,
                          }}
                        />
                      ) : null,
                    )}
                  </div>
                </div>
              )}
            </div>
          </header>
        );
      })()}

      {pantheon.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-bold text-gold">★ Le panthéon</h2>
          <ArtistWall artists={pantheon} scores={scores} />
        </section>
      )}

      {userLists.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-bold">Ses listes</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {userLists.map((l) => (
              <ListTile key={l.id} list={l} />
            ))}
          </div>
        </section>
      )}

      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_FOOTER} />

      <section className="mt-12">
        <h2 className="mb-4 text-lg font-bold">Tous les artistes notés</h2>
        {all.length ? (
          <ArtistWall artists={all} scores={scores} />
        ) : (
          <p className="text-sm text-muted">
            Aucune note pour l&apos;instant.{" "}
            {isSelf && (
              <Link href="/decouvrir" className="text-gold underline underline-offset-4">
                Commence par découvrir des artistes
              </Link>
            )}
          </p>
        )}
      </section>

      {theirReviews.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-bold">Ses critiques</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {theirReviews.map((r) => (
              <ReviewCard key={r.id} review={r} signedIn={Boolean(viewer)} />
            ))}
          </div>
        </section>
      )}

      {followed.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-bold">Artistes suivis</h2>
          <ArtistWall artists={followed.map(rowToCard)} />
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dd className="text-3xl font-bold tracking-tight">{value}</dd>
      <dt className="text-xs text-muted">{label}</dt>
    </div>
  );
}
