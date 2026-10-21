import { and, eq, sql, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { artists, ratings, users } from "@/lib/db/schema";
import type { ArtistCard, ArtistDetail, CommunityStats, ReviewItem } from "@/lib/types";
import { getScreenArtist, searchScreenArtists, trendingScreenArtists } from "@/lib/tmdb";
import { getMusicArtist, searchMusicArtists, trendingMusicArtists } from "@/lib/spotify";

/** Recherche unifiee : acteurs (TMDB) + chanteurs (Spotify), melanges par popularite. */
export async function searchArtists(query: string): Promise<ArtistCard[]> {
  const [screen, music] = await Promise.all([
    searchScreenArtists(query).catch(() => []),
    searchMusicArtists(query).catch(() => []),
  ]);
  return [...screen, ...music].sort((a, b) => b.popularity - a.popularity);
}

export async function trendingArtists(): Promise<ArtistCard[]> {
  const [screen, music] = await Promise.all([
    trendingScreenArtists().catch(() => []),
    trendingMusicArtists().catch(() => []),
  ]);
  // On alterne pour que le mur melange cinema et musique.
  const out: ArtistCard[] = [];
  const max = Math.max(screen.length, music.length);
  for (let i = 0; i < max; i++) {
    if (screen[i]) out.push(screen[i]);
    if (music[i]) out.push(music[i]);
  }
  return out;
}

export async function getArtistDetail(
  kind: string,
  externalId: string,
): Promise<ArtistDetail | null> {
  if (kind === "screen") return getScreenArtist(externalId);
  if (kind === "music") return getMusicArtist(externalId);
  return null;
}

/**
 * Trouve la ligne locale d'un artiste, ou la cree a partir de la carte
 * fournie par l'API externe. C'est l'ancre de toutes les notes.
 */
export async function upsertArtist(card: ArtistCard): Promise<number> {
  const [row] = await db
    .insert(artists)
    .values({
      kind: card.kind,
      externalId: card.externalId,
      name: card.name,
      imageUrl: card.imageUrl,
      role: card.role,
      tags: card.tags.join(","),
      popularity: card.popularity,
    })
    .onConflictDoUpdate({
      target: [artists.kind, artists.externalId],
      set: {
        name: card.name,
        imageUrl: card.imageUrl,
        role: card.role,
        tags: card.tags.join(","),
        popularity: card.popularity,
        refreshedAt: new Date(),
      },
    })
    .returning({ id: artists.id });

  return row.id;
}

export async function findArtistId(kind: string, externalId: string): Promise<number | null> {
  const [row] = await db
    .select({ id: artists.id })
    .from(artists)
    .where(and(eq(artists.kind, kind as ArtistCard["kind"]), eq(artists.externalId, externalId)))
    .limit(1);
  return row?.id ?? null;
}

export async function communityStats(artistId: number | null): Promise<CommunityStats> {
  const empty: CommunityStats = { average: null, count: 0, histogram: Array(10).fill(0) };
  if (!artistId) return empty;

  const rows = await db
    .select({ score: ratings.score, n: sql<number>`count(*)::int` })
    .from(ratings)
    .where(eq(ratings.artistId, artistId))
    .groupBy(ratings.score);

  if (rows.length === 0) return empty;

  const histogram = Array(10).fill(0);
  let total = 0;
  let sum = 0;
  for (const r of rows) {
    const idx = Math.min(9, Math.max(0, r.score - 1));
    histogram[idx] += r.n;
    total += r.n;
    sum += r.score * r.n;
  }
  return { average: sum / total / 2, count: total, histogram };
}

export async function artistReviews(artistId: number | null, limit = 20): Promise<ReviewItem[]> {
  if (!artistId) return [];
  const rows = await db
    .select({
      id: ratings.id,
      score: ratings.score,
      review: ratings.review,
      favorite: ratings.favorite,
      createdAt: ratings.createdAt,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(ratings)
    .innerJoin(users, eq(users.id, ratings.userId))
    .where(and(eq(ratings.artistId, artistId), sql`length(${ratings.review}) > 0`))
    .orderBy(desc(ratings.createdAt))
    .limit(limit);

  return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
}
