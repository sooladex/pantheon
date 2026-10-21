import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { hash, compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

const COOKIE = "pantheon_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 jours

function secret() {
  return new TextEncoder().encode(process.env.AUTH_SECRET ?? "dev-secret-change-me");
}

export type SessionUser = {
  id: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

export async function hashPassword(plain: string) {
  return hash(plain, 10);
}

export async function verifyPassword(plain: string, stored: string) {
  return compare(plain, stored);
}

export async function createSession(userId: number) {
  const token = await new SignJWT({ sub: String(userId) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

/** Retourne l'utilisateur connecte, ou null. Jamais d'exception. */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const jar = await cookies();
    const token = jar.get(COOKIE)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, secret());
    const id = Number(payload.sub);
    if (!Number.isFinite(id)) return null;

    const [row] = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return row ?? null;
  } catch {
    return null;
  }
}

/** Variante pour les routes API : leve une 401 exploitable. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Non authentifie");
  }
}
