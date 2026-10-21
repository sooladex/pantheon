import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { ratings } from "@/lib/db/schema";
import { requireUser, UnauthorizedError } from "@/lib/auth";
import { findArtistId, upsertArtist } from "@/lib/artists";

const Body = z.object({
  artist: z.object({
    kind: z.enum(["screen", "music"]),
    externalId: z.string().min(1),
    name: z.string().min(1),
    imageUrl: z.string().nullable(),
    role: z.string().default(""),
    tags: z.array(z.string()).default([]),
    popularity: z.number().default(0),
  }),
  score: z.number().int().min(1).max(10),
  review: z.string().max(4000).default(""),
  favorite: z.boolean().default(false),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Donnees invalides" }, { status: 400 });

    const { artist, score, review, favorite } = parsed.data;
    const artistId = await upsertArtist(artist);

    await db
      .insert(ratings)
      .values({ userId: user.id, artistId, score, review, favorite })
      .onConflictDoUpdate({
        target: [ratings.userId, ratings.artistId],
        set: { score, review, favorite, updatedAt: new Date() },
      });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Connecte-toi pour noter." }, { status: 401 });
    }
    console.error("[ratings]", err);
    return NextResponse.json({ error: "Enregistrement impossible" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const kind = url.searchParams.get("kind") ?? "";
    const externalId = url.searchParams.get("externalId") ?? "";

    const artistId = await findArtistId(kind, externalId);
    if (artistId) {
      await db.delete(ratings).where(and(eq(ratings.userId, user.id), eq(ratings.artistId, artistId)));
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }
    return NextResponse.json({ error: "Suppression impossible" }, { status: 500 });
  }
}
