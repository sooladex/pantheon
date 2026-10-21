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
    <div className="mx-auto max-w-7xl px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />

      <header className="flex flex-wrap items-end gap-6 border-b border-edge/60 pb-8">
        <div className="flex min-w-0 items-center gap-4">
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatarUrl}
              alt=""
              className="h-20 w-20 shrink-0 rounded-full border border-edge object-cover"
            />
          ) : (
            <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-edge bg-surface text-xl font-black uppercase text-muted">
              {profile.displayName.slice(0, 2)}
            </span>
          )}
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.3em] text-gold/80">Panthéon de</p>
            <h1 className="mt-1 truncate text-4xl font-black">{profile.displayName}</h1>
            <p className="text-sm text-muted">@{profile.username}</p>
          </div>
        </div>

        <dl className="ml-auto flex gap-6 text-center sm:gap-8">
          <Stat label="Notés" value={String(rated.length)} />
          <Stat label="Abonnés" value={String(counts.followers)} />
          <Stat label="Abonnements" value={String(counts.following)} />
          <Stat label="Moyenne" value={average > 0 ? (average / 2).toFixed(1) : "—"} />
        </dl>

        <div className="flex w-full flex-wrap items-center gap-3">
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

        {profile.bio && (
          <p className="w-full max-w-2xl text-sm leading-relaxed text-muted">{profile.bio}</p>
        )}
      </header>

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
      <dd className="text-2xl font-black">{value}</dd>
      <dt className="text-[10px] uppercase tracking-[0.2em] text-muted">{label}</dt>
    </div>
  );
}
