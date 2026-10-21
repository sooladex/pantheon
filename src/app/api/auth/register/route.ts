import { NextResponse } from "next/server";
import { z } from "zod";
import { or, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { createSession, hashPassword } from "@/lib/auth";

const Body = z.object({
  username: z.string().min(3).max(24).regex(/^[a-z0-9_]+$/, "lettres minuscules, chiffres et _ uniquement"),
  email: z.string().email(),
  password: z.string().min(8, "8 caracteres minimum"),
  displayName: z.string().min(1).max(60),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Donnees invalides" }, { status: 400 });
  }
  const { username, email, password, displayName } = parsed.data;

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(or(eq(users.username, username), eq(users.email, email)))
    .limit(1);

  if (existing.length) {
    return NextResponse.json({ error: "Ce pseudo ou cet email est deja pris." }, { status: 409 });
  }

  const [row] = await db
    .insert(users)
    .values({ username, email, displayName, passwordHash: await hashPassword(password) })
    .returning({ id: users.id });

  await createSession(row.id);
  return NextResponse.json({ ok: true, username });
}
