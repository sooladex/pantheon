"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FollowUserButton({
  username,
  initialFollowing,
  signedIn,
  isSelf,
}: {
  username: string;
  initialFollowing: boolean;
  signedIn: boolean;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);

  if (isSelf) {
    return (
      <a
        href="/reglages"
        className="rounded-full border border-edge px-4 py-1.5 text-xs text-muted transition hover:border-gold hover:text-gold"
      >
        Modifier mon profil
      </a>
    );
  }

  if (!signedIn) {
    return (
      <a
        href="/connexion"
        className="rounded-full border border-edge px-4 py-1.5 text-xs text-muted transition hover:border-gold hover:text-gold"
      >
        Se connecter pour suivre
      </a>
    );
  }

  async function toggle() {
    const next = !following;
    setFollowing(next);
    setBusy(true);

    const res = await fetch("/api/user-follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, following: next }),
    }).catch(() => null);

    if (!res || !res.ok) setFollowing(!next);
    else router.refresh();

    setBusy(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`rounded-full px-4 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
        following
          ? "border border-edge text-muted hover:text-text"
          : "bg-gold text-ink hover:bg-gold/85"
      }`}
    >
      {following ? "Abonné" : "Suivre"}
    </button>
  );
}
