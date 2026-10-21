import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  artists,
  listItems,
  lists,
  ratings,
  reviewLikes,
  userFollows,
  users,
} from "@/lib/db/schema";
import type { ArtistCard } from "@/lib/types";

export function rowToCard(r: {
  kind: ArtistCard["kind"];
  externalId: string;
  name: string;
  imageUrl: string | null;
  role: string;
  tags: string;
  popularity: number;
}): ArtistCard {
  return {
    kind: r.kind,
    externalId: r.externalId,
    name: r.name,
    imageUrl: r.imageUrl,
    role: r.role,
    tags: r.tags ? r.tags.split(",").filter(Boolean) : [],
    popularity: r.popularity,
  };
}

/** Transforme un titre libre en identifiant d'URL stable. */
export function slugify(input: string) {
  const base = input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || "liste";
}

/* ----------------------------- Critiques ----------------------------- */

export type FeedReview = {
  id: number;
  score: number;
  review: string;
  favorite: boolean;
  createdAt: string;
  likes: number;
  likedByMe: boolean;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  artist: ArtistCard;
};

type ReviewScope =
  | { kind: "all" }
  | { kind: "artist"; artistId: number }
  | { kind: "following"; userId: number }
  | { kind: "user"; userId: number };

/**
 * Une seule requête sert le fil d'accueil, la page critiques, la fiche
 * artiste et le feed des abonnements — seule la clause WHERE change.
 */
export async function fetchReviews(
  scope: ReviewScope,
  opts: { viewerId?: number | null; limit?: number; offset?: number; withTextOnly?: boolean } = {},
): Promise<FeedReview[]> {
  const { viewerId = null, limit = 20, offset = 0, withTextOnly = false } = opts;

  const conditions = [];
  if (withTextOnly) conditions.push(sql`length(${ratings.review}) > 0`);

  if (scope.kind === "artist") conditions.push(eq(ratings.artistId, scope.artistId));
  if (scope.kind === "user") conditions.push(eq(ratings.userId, scope.userId));
  if (scope.kind === "following") {
    conditions.push(
      sql`${ratings.userId} IN (SELECT ${userFollows.followingId} FROM ${userFollows} WHERE ${userFollows.followerId} = ${scope.userId})`,
    );
  }

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
      kind: artists.kind,
      externalId: artists.externalId,
      name: artists.name,
      imageUrl: artists.imageUrl,
      role: artists.role,
      tags: artists.tags,
      popularity: artists.popularity,
      likes: sql<number>`(SELECT count(*)::int FROM ${reviewLikes} WHERE ${reviewLikes.ratingId} = ${ratings.id})`,
      likedByMe: viewerId
        ? sql<boolean>`EXISTS (SELECT 1 FROM ${reviewLikes} WHERE ${reviewLikes.ratingId} = ${ratings.id} AND ${reviewLikes.userId} = ${viewerId})`
        : sql<boolean>`false`,
    })
    .from(ratings)
    .innerJoin(users, eq(users.id, ratings.userId))
    .innerJoin(artists, eq(artists.id, ratings.artistId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(ratings.createdAt))
    .limit(limit)
    .offset(offset);

  return rows.map((r) => ({
    id: r.id,
    score: r.score,
    review: r.review,
    favorite: r.favorite,
    createdAt: r.createdAt.toISOString(),
    likes: r.likes,
    likedByMe: Boolean(r.likedByMe),
    username: r.username,
    displayName: r.displayName,
    avatarUrl: r.avatarUrl,
    artist: rowToCard(r),
  }));
}

/* ----------------------------- Classement ----------------------------- */

export type RankedArtist = {
  card: ArtistCard;
  average: number;
  count: number;
};

/**
 * Classement pondéré (moyenne bayésienne) : un artiste noté 5/5 une
 * seule fois ne doit pas dépasser un artiste noté 4,6/5 par soixante
 * personnes. C'est la formule utilisée par IMDb et Letterboxd.
 */
export async function leaderboard(
  kind: ArtistCard["kind"] | "all" = "all",
  limit = 50,
): Promise<RankedArtist[]> {
  const MIN_VOTES = 3;
  const PRIOR = 6; // moyenne a priori sur 10, soit 3 étoiles

  const rows = await db
    .select({
      kind: artists.kind,
      externalId: artists.externalId,
      name: artists.name,
      imageUrl: artists.imageUrl,
      role: artists.role,
      tags: artists.tags,
      popularity: artists.popularity,
      avg: sql<number>`avg(${ratings.score})::float`,
      n: sql<number>`count(*)::int`,
      weighted: sql<number>`((count(*)::float * avg(${ratings.score})) + (${MIN_VOTES} * ${PRIOR})) / (count(*)::float + ${MIN_VOTES})`,
    })
    .from(ratings)
    .innerJoin(artists, eq(artists.id, ratings.artistId))
    .where(kind === "all" ? undefined : eq(artists.kind, kind))
    .groupBy(
      artists.id,
      artists.kind,
      artists.externalId,
      artists.name,
      artists.imageUrl,
      artists.role,
      artists.tags,
      artists.popularity,
    )
    .orderBy(
      desc(
        sql`((count(*)::float * avg(${ratings.score})) + (${MIN_VOTES} * ${PRIOR})) / (count(*)::float + ${MIN_VOTES})`,
      ),
    )
    .limit(limit);

  return rows.map((r) => ({ card: rowToCard(r), average: r.avg / 2, count: r.n }));
}

/* ------------------------------- Listes ------------------------------- */

export type ListSummary = {
  id: number;
  slug: string;
  title: string;
  description: string;
  isPublic: boolean;
  updatedAt: string;
  username: string;
  displayName: string;
  count: number;
  covers: (string | null)[];
};

export async function fetchLists(
  opts: { userId?: number; publicOnly?: boolean; limit?: number } = {},
): Promise<ListSummary[]> {
  const { userId, publicOnly = true, limit = 40 } = opts;

  const conditions = [];
  if (userId) conditions.push(eq(lists.userId, userId));
  if (publicOnly) conditions.push(eq(lists.isPublic, true));

  const rows = await db
    .select({
      id: lists.id,
      slug: lists.slug,
      title: lists.title,
      description: lists.description,
      isPublic: lists.isPublic,
      updatedAt: lists.updatedAt,
      username: users.username,
      displayName: users.displayName,
      count: sql<number>`(SELECT count(*)::int FROM ${listItems} WHERE ${listItems.listId} = ${lists.id})`,
    })
    .from(lists)
    .innerJoin(users, eq(users.id, lists.userId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(lists.updatedAt))
    .limit(limit);

  if (rows.length === 0) return [];

  // Quatre portraits par liste pour la mosaïque de couverture.
  const covers = await db
    .select({
      listId: listItems.listId,
      imageUrl: artists.imageUrl,
      position: listItems.position,
    })
    .from(listItems)
    .innerJoin(artists, eq(artists.id, listItems.artistId))
    .where(inArray(listItems.listId, rows.map((r) => r.id)))
    .orderBy(listItems.listId, listItems.position);

  const byList = new Map<number, (string | null)[]>();
  for (const c of covers) {
    const arr = byList.get(c.listId) ?? [];
    if (arr.length < 4) arr.push(c.imageUrl);
    byList.set(c.listId, arr);
  }

  return rows.map((r) => ({
    ...r,
    updatedAt: r.updatedAt.toISOString(),
    covers: byList.get(r.id) ?? [],
  }));
}

export async function fetchList(username: string, slug: string) {
  const [row] = await db
    .select({
      id: lists.id,
      userId: lists.userId,
      slug: lists.slug,
      title: lists.title,
      description: lists.description,
      isPublic: lists.isPublic,
      createdAt: lists.createdAt,
      updatedAt: lists.updatedAt,
      username: users.username,
      displayName: users.displayName,
    })
    .from(lists)
    .innerJoin(users, eq(users.id, lists.userId))
    .where(and(eq(users.username, username.toLowerCase()), eq(lists.slug, slug)))
    .limit(1);

  if (!row) return null;

  const items = await db
    .select({
      note: listItems.note,
      position: listItems.position,
      kind: artists.kind,
      externalId: artists.externalId,
      name: artists.name,
      imageUrl: artists.imageUrl,
      role: artists.role,
      tags: artists.tags,
      popularity: artists.popularity,
    })
    .from(listItems)
    .innerJoin(artists, eq(artists.id, listItems.artistId))
    .where(eq(listItems.listId, row.id))
    .orderBy(listItems.position);

  return {
    ...row,
    items: items.map((i) => ({ note: i.note, card: rowToCard(i) })),
  };
}

/* --------------------------- Utilisateurs --------------------------- */

export async function socialCounts(userId: number, viewerId?: number | null) {
  const [row] = await db
    .select({
      followers: sql<number>`(SELECT count(*)::int FROM ${userFollows} WHERE ${userFollows.followingId} = ${userId})`,
      following: sql<number>`(SELECT count(*)::int FROM ${userFollows} WHERE ${userFollows.followerId} = ${userId})`,
      followedByViewer: viewerId
        ? sql<boolean>`EXISTS (SELECT 1 FROM ${userFollows} WHERE ${userFollows.followerId} = ${viewerId} AND ${userFollows.followingId} = ${userId})`
        : sql<boolean>`false`,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return {
    followers: row?.followers ?? 0,
    following: row?.following ?? 0,
    followedByViewer: Boolean(row?.followedByViewer),
  };
}
