import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireUser, UnauthorizedError } from "@/lib/auth";

const Body = z.object({
  displayName: z.string().min(1).max(60),
  bio: z.string().max(400).default(""),
  avatarUrl: z.string().url().max(500).or(z.literal("")).nullable().default(null),
  surprisesEnabled: z.boolean().default(true),
});

export async function PATCH(req: Request) {
  try {
    const me = await requireUser();
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Donnees invalides" },
        { status: 400 },
      );
    }

    const { displayName, bio, avatarUrl, surprisesEnabled } = parsed.data;

    await db
      .update(users)
      .set({ displayName, bio, avatarUrl: avatarUrl ? avatarUrl : null, surprisesEnabled })
      .where(eq(users.id, me.id));

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }
    console.error("[profile]", err);
    return NextResponse.json({ error: "Enregistrement impossible" }, { status: 500 });
  }
}
