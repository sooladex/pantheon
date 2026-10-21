import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { reviewLikes } from "@/lib/db/schema";
import { requireUser, UnauthorizedError } from "@/lib/auth";

const Body = z.object({ ratingId: z.number().int().positive(), liked: z.boolean() });

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Donnees invalides" }, { status: 400 });

    const { ratingId, liked } = parsed.data;

    if (liked) {
      await db.insert(reviewLikes).values({ userId: user.id, ratingId }).onConflictDoNothing();
    } else {
      await db
        .delete(reviewLikes)
        .where(and(eq(reviewLikes.userId, user.id), eq(reviewLikes.ratingId, ratingId)));
    }
    return NextResponse.json({ ok: true, liked });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Connecte-toi pour aimer une critique." }, { status: 401 });
    }
    console.error("[likes]", err);
    return NextResponse.json({ error: "Operation impossible" }, { status: 500 });
  }
}
