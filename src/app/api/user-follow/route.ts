import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { userFollows, users } from "@/lib/db/schema";
import { requireUser, UnauthorizedError } from "@/lib/auth";

const Body = z.object({ username: z.string().min(1), following: z.boolean() });

export async function POST(req: Request) {
  try {
    const me = await requireUser();
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Donnees invalides" }, { status: 400 });

    const [target] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, parsed.data.username.toLowerCase()))
      .limit(1);

    if (!target) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    if (target.id === me.id) {
      return NextResponse.json({ error: "On ne se suit pas soi-meme." }, { status: 400 });
    }

    if (parsed.data.following) {
      await db
        .insert(userFollows)
        .values({ followerId: me.id, followingId: target.id })
        .onConflictDoNothing();
    } else {
      await db
        .delete(userFollows)
        .where(and(eq(userFollows.followerId, me.id), eq(userFollows.followingId, target.id)));
    }

    return NextResponse.json({ ok: true, following: parsed.data.following });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Connecte-toi d'abord." }, { status: 401 });
    }
    console.error("[user-follow]", err);
    return NextResponse.json({ error: "Operation impossible" }, { status: 500 });
  }
}
