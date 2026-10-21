import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { follows } from "@/lib/db/schema";
import { requireUser, UnauthorizedError } from "@/lib/auth";
import { upsertArtist } from "@/lib/artists";

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
  following: z.boolean(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Donnees invalides" }, { status: 400 });

    const artistId = await upsertArtist(parsed.data.artist);

    if (parsed.data.following) {
      await db.insert(follows).values({ userId: user.id, artistId }).onConflictDoNothing();
    } else {
      await db.delete(follows).where(and(eq(follows.userId, user.id), eq(follows.artistId, artistId)));
    }
    return NextResponse.json({ ok: true, following: parsed.data.following });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Connecte-toi d'abord." }, { status: 401 });
    }
    console.error("[follow]", err);
    return NextResponse.json({ error: "Operation impossible" }, { status: 500 });
  }
}
