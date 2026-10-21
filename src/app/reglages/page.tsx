import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth";
import ProfileForm from "@/components/ProfileForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Réglages du profil",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const me = await getSessionUser();
  if (!me) redirect("/connexion");

  const [profile] = await db
    .select({
      displayName: users.displayName,
      bio: users.bio,
      avatarUrl: users.avatarUrl,
      surprisesEnabled: users.surprisesEnabled,
      username: users.username,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, me.id))
    .limit(1);

  if (!profile) redirect("/connexion");

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <p className="text-[11px] uppercase tracking-[0.3em] text-gold/80">Réglages</p>
      <h1 className="mt-2 text-3xl font-black">Mon profil</h1>
      <p className="mt-2 text-sm text-muted">
        @{profile.username} · {profile.email}
      </p>

      <ProfileForm
        username={profile.username}
        initial={{
          displayName: profile.displayName,
          bio: profile.bio,
          avatarUrl: profile.avatarUrl ?? "",
          surprisesEnabled: profile.surprisesEnabled,
        }}
      />
    </div>
  );
}
