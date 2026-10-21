import type { MetadataRoute } from "next";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { artists, lists, users } from "@/lib/db/schema";
import { absolute } from "@/lib/seo";

export const revalidate = 3600;

/**
 * Le sitemap n'inclut que ce qui existe vraiment en base : un artiste
 * qui n'a jamais été noté n'a pas de page à indexer (elle serait vide
 * et dupliquerait TMDB / Spotify).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: absolute("/"), changeFrequency: "daily", priority: 1 },
    { url: absolute("/decouvrir"), changeFrequency: "daily", priority: 0.9 },
    { url: absolute("/classement"), changeFrequency: "daily", priority: 0.8 },
    { url: absolute("/critiques"), changeFrequency: "hourly", priority: 0.8 },
    { url: absolute("/listes"), changeFrequency: "daily", priority: 0.7 },
  ];

  try {
    const [artistRows, userRows, listRows] = await Promise.all([
      db
        .select({
          kind: artists.kind,
          externalId: artists.externalId,
          refreshedAt: artists.refreshedAt,
        })
        .from(artists)
        .orderBy(desc(artists.refreshedAt))
        .limit(20000),
      db
        .select({ username: users.username, createdAt: users.createdAt })
        .from(users)
        .limit(5000),
      db
        .select({
          slug: lists.slug,
          username: users.username,
          updatedAt: lists.updatedAt,
        })
        .from(lists)
        .innerJoin(users, eq(users.id, lists.userId))
        .where(eq(lists.isPublic, true))
        .limit(5000),
    ]);

    return [
      ...staticPages,
      ...artistRows.map((a) => ({
        url: absolute(`/artiste/${a.kind}/${a.externalId}`),
        lastModified: a.refreshedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...userRows.map((u) => ({
        url: absolute(`/u/${u.username}`),
        lastModified: u.createdAt,
        changeFrequency: "weekly" as const,
        priority: 0.5,
      })),
      ...listRows.map((l) => ({
        url: absolute(`/u/${l.username}/listes/${l.slug}`),
        lastModified: l.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    ];
  } catch {
    // Base injoignable : on sert au moins les pages fixes plutôt qu'une 500.
    return staticPages;
  }
}
