import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { follows, listItems, lists, ratings } from "@/lib/db/schema";
import { communityStats, findArtistId, getArtistDetail } from "@/lib/artists";
import { fetchReviews } from "@/lib/social";
import { getSessionUser } from "@/lib/auth";
import RatingPanel from "@/components/RatingPanel";
import ReviewCard from "@/components/ReviewCard";
import ListPicker from "@/components/ListPicker";
import ShareButton from "@/components/ShareButton";
import AdSlot from "@/components/AdSlot";
import { Stars } from "@/components/Stars";
import { absolute, clamp, jsonLd, pageMetadata } from "@/lib/seo";
import EggProvider from "@/components/eggs/EggProvider";
import TapTarget from "@/components/eggs/TapTarget";
import { armEggs } from "@/lib/eggs/server";

export const dynamic = "force-dynamic";

const KIND_LABEL = { screen: "Écran", music: "Musique" } as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ kind: string; id: string }>;
}): Promise<Metadata> {
  const { kind, id } = await params;
  if (kind !== "screen" && kind !== "music") {
    return { title: "Artiste introuvable", robots: { index: false, follow: false } };
  }

  const artist = await getArtistDetail(kind, id).catch(() => null);
  if (!artist) {
    return { title: "Artiste introuvable", robots: { index: false, follow: false } };
  }

  const work = kind === "screen" ? "filmographie" : "discographie";
  const description =
    artist.bio ||
    `Note et critique ${artist.name} sur Panthéon : ${work}, avis de la communauté et note sur 5 étoiles.`;

  return pageMetadata({
    title: `${artist.name} — noter et critiquer`,
    description: clamp(description),
    path: `/artiste/${kind}/${id}`,
    type: "profile",
  });
}

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ kind: string; id: string }>;
}) {
  const { kind, id } = await params;
  if (kind !== "screen" && kind !== "music") notFound();

  const artist = await getArtistDetail(kind, id).catch(() => null);
  if (!artist) notFound();

  const user = await getSessionUser();
  const artistId = await findArtistId(kind, id).catch(() => null);

  const [stats, reviews] = await Promise.all([
    communityStats(artistId).catch(() => ({
      average: null as number | null,
      count: 0,
      histogram: Array(10).fill(0) as number[],
    })),
    artistId
      ? fetchReviews({ kind: "artist", artistId }, { viewerId: user?.id, withTextOnly: true }).catch(
          () => [],
        )
      : Promise.resolve([]),
  ]);

  let mine: { score: number; review: string; favorite: boolean } | null = null;
  let following = false;
  let myLists: { id: number; title: string; slug: string; contains: boolean }[] = [];

  if (user) {
    if (artistId) {
      const [row] = await db
        .select({ score: ratings.score, review: ratings.review, favorite: ratings.favorite })
        .from(ratings)
        .where(and(eq(ratings.userId, user.id), eq(ratings.artistId, artistId)))
        .limit(1);
      mine = row ?? null;

      const [f] = await db
        .select({ id: follows.id })
        .from(follows)
        .where(and(eq(follows.userId, user.id), eq(follows.artistId, artistId)))
        .limit(1);
      following = Boolean(f);
    }

    myLists = await db
      .select({
        id: lists.id,
        title: lists.title,
        slug: lists.slug,
        contains: artistId
          ? sql<boolean>`EXISTS (SELECT 1 FROM ${listItems} WHERE ${listItems.listId} = ${lists.id} AND ${listItems.artistId} = ${artistId})`
          : sql<boolean>`false`,
      })
      .from(lists)
      .where(eq(lists.userId, user.id))
      .catch(() => []);
  }

  const card = {
    kind: artist.kind,
    externalId: artist.externalId,
    name: artist.name,
    imageUrl: artist.imageUrl,
    role: artist.role,
    tags: artist.tags,
    popularity: artist.popularity,
  };

  // Les surprises ne sortent que sur les fiches des gens concernés.
  const armedEggs =
    kind === "screen"
      ? await armEggs({ userId: user?.id ?? null, tmdbPersonId: id, personName: artist.name }).catch(
          () => [],
        )
      : [];

  const accent = kind === "screen" ? "text-screen" : "text-music";
  const maxBar = Math.max(1, ...stats.histogram);

  const personSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: artist.name,
    url: absolute(`/artiste/${kind}/${id}`),
    image: artist.imageUrl ?? undefined,
    description: artist.bio || undefined,
    birthDate: artist.birthday ?? undefined,
    birthPlace: artist.birthplace ?? undefined,
    jobTitle: artist.role || undefined,
    sameAs: artist.externalUrl ? [artist.externalUrl] : undefined,
  };

  if (stats.average !== null && stats.count > 0) {
    personSchema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(stats.average.toFixed(2)),
      bestRating: 5,
      worstRating: 0.5,
      ratingCount: stats.count,
    };
  }

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Panthéon", item: absolute("/") },
      { "@type": "ListItem", position: 2, name: KIND_LABEL[kind], item: absolute("/decouvrir") },
      { "@type": "ListItem", position: 3, name: artist.name, item: absolute(`/artiste/${kind}/${id}`) },
    ],
  };

  return (
    <EggProvider armed={armedEggs}>
      <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(personSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumb) }} />

      <section className="relative overflow-hidden border-b border-edge/60">
        {artist.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={artist.imageUrl}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full scale-110 object-cover object-top opacity-25 blur-2xl"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-ink/60 via-ink/85 to-ink" />

        <div className="relative mx-auto flex max-w-5xl flex-col gap-8 px-4 py-14 md:flex-row">
          <TapTarget>
          <div className="tilt-scene mx-auto w-48 shrink-0 cursor-pointer md:mx-0">
            <div className="tilt overflow-hidden border border-edge shadow-2xl">
              {artist.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={artist.imageUrl}
                  alt={artist.name}
                  className="aspect-[2/3] w-full object-cover object-top"
                />
              ) : (
                <div className="flex aspect-[2/3] items-center justify-center bg-surface text-4xl font-black text-edge">
                  {artist.name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
          </div>
          </TapTarget>

          <div className="min-w-0 flex-1">
            <p className={`text-[11px] uppercase tracking-[0.3em] ${accent}`}>
              {KIND_LABEL[kind]} · {artist.role}
            </p>
            <h1 className="mt-2 text-4xl font-black leading-tight md:text-5xl">{artist.name}</h1>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              {stats.average !== null ? (
                <span className="flex items-center gap-2">
                  <Stars score={Math.round(stats.average * 2)} size={16} />
                  <span className="text-sm text-gold">{stats.average.toFixed(1)}</span>
                  <span className="text-xs text-muted">
                    · {stats.count} note{stats.count > 1 ? "s" : ""}
                  </span>
                </span>
              ) : (
                <span className="text-xs text-muted">Pas encore noté — sois le premier.</span>
              )}
              <ShareButton title={`${artist.name} sur Panthéon`} />
            </div>

            {artist.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {artist.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-edge px-3 py-1 text-[11px] text-muted"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            {(artist.birthday || artist.birthplace) && (
              <p className="mt-4 text-xs text-muted">
                {artist.birthday &&
                  `Né(e) le ${new Date(artist.birthday).toLocaleDateString("fr-FR")}`}
                {artist.birthday && artist.birthplace && " · "}
                {artist.birthplace}
              </p>
            )}

            {artist.bio && (
              <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted line-clamp-6">
                {artist.bio}
              </p>
            )}

            {artist.externalUrl && (
              <a
                href={artist.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block text-xs text-muted underline underline-offset-4 transition hover:text-gold"
              >
                Voir la fiche source
              </a>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-12">
          <section>
            <h2 className="mb-4 text-lg font-bold">
              {kind === "screen" ? "Filmographie" : "Discographie"}
            </h2>
            {artist.credits.length === 0 ? (
              <p className="text-sm text-muted">Aucune œuvre trouvée.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                {artist.credits.map((c) => (
                  <div key={c.id} className="group">
                    <div className="sheen relative overflow-hidden rounded-lg border border-edge bg-surface">
                      {c.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.imageUrl}
                          alt={c.title}
                          loading="lazy"
                          className="aspect-[2/3] w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="aspect-[2/3] w-full bg-gradient-to-br from-surface to-ink-2" />
                      )}
                    </div>
                    <p className="mt-1.5 truncate text-[11px] font-medium">{c.title}</p>
                    <p className="truncate text-[10px] text-muted">
                      {c.year ?? "—"}
                      {c.subtitle && ` · ${c.subtitle}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE} />

          <section>
            <h2 className="mb-4 text-lg font-bold">
              Critiques {reviews.length > 0 && <span className="text-muted">({reviews.length})</span>}
            </h2>
            {reviews.length === 0 ? (
              <p className="text-sm text-muted">
                Personne n&apos;a encore écrit sur {artist.name}.
              </p>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <ReviewCard key={r.id} review={r} signedIn={Boolean(user)} showArtist={false} />
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <RatingPanel
            artist={card}
            signedIn={Boolean(user)}
            initial={mine}
            initialFollowing={following}
          />

          <ListPicker artist={card} myLists={myLists} signedIn={Boolean(user)} />

          {stats.count > 0 && (
            <div className="rounded-2xl border border-edge bg-surface/50 p-5">
              <p className="text-[11px] uppercase tracking-[0.25em] text-muted">Répartition</p>
              <div className="mt-4 flex h-24 items-end gap-1">
                {stats.histogram.map((n, i) => (
                  <div key={i} className="flex-1" title={`${(i + 1) / 2} étoile(s) — ${n}`}>
                    <div
                      className="w-full rounded-t bg-gold/70 transition-all"
                      style={{ height: `${(n / maxBar) * 100}%`, minHeight: n > 0 ? 3 : 1 }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-muted">
                <span>0.5</span>
                <span>5</span>
              </div>
            </div>
          )}

          <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR} format="rectangle" />
        </aside>
      </div>
      </div>
    </EggProvider>
  );
}
