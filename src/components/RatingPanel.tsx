"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ArtistCard } from "@/lib/types";
import { useEggs } from "@/components/eggs/EggProvider";
import { SewnButton } from "@/components/eggs/effects/Coraline";

type Props = {
  artist: ArtistCard;
  signedIn: boolean;
  initial: { score: number; review: string; favorite: boolean } | null;
  initialFollowing: boolean;
};

export default function RatingPanel({ artist, signedIn, initial, initialFollowing }: Props) {
  const router = useRouter();
  const { fire, coralineActive } = useEggs();

  const [score, setScore] = useState(initial?.score ?? 0);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState(initial?.review ?? "");
  const [favorite, setFavorite] = useState(initial?.favorite ?? false);
  const [following, setFollowing] = useState(initialFollowing);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  const shown = hover || score;

  if (!signedIn) {
    return (
      <div className="card p-6 text-center">
        <p className="text-sm text-muted">Crée un compte pour noter {artist.name}.</p>
        <a
          href="/inscription"
          className="mt-4 inline-block bg-gold px-6 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-ink transition-colors hover:bg-brass"
        >
          Rejoindre le Panthéon
        </a>
      </div>
    );
  }

  async function save(nextScore = score, withReview = false) {
    if (nextScore < 1) {
      setStatus("error");
      setMessage("Donne au moins une demi-étoile.");
      return;
    }

    setStatus("saving");
    fire("on_save"); // la surprise tourne pendant l'enregistrement, sans le bloquer

    const res = await fetch("/api/ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ artist, score: nextScore, review, favorite }),
    });

    if (res.ok) {
      setStatus("saved");
      setMessage("Note enregistrée.");
      router.refresh();
      // La critique est publiée : c'est maintenant qu'on tente l'œuf.
      if (withReview) fire("on_log");
      else fire("on_rate");
    } else {
      const data = await res.json().catch(() => ({}));
      setStatus("error");
      setMessage(data.error ?? "Échec de l'enregistrement.");
    }
  }

  async function toggleFollow() {
    const next = !following;
    setFollowing(next);
    const res = await fetch("/api/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ artist, following: next }),
    });
    if (!res.ok) setFollowing(!next);
    else router.refresh();
  }

  return (
    <div className="card p-6">
      <p className="eyebrow">Ta note</p>

      {/* Dix demi-valeurs : chaque marque a deux zones cliquables.
          Les boutons cousus ne changent que le dessin — mêmes valeurs,
          mêmes libellés, même parcours au clavier. */}
      <div
        className="mt-3 flex gap-1"
        onMouseLeave={() => setHover(0)}
        role="radiogroup"
        aria-label="Note sur 5"
      >
        {Array.from({ length: 5 }, (_, i) => {
          const left = i * 2 + 1;
          const right = i * 2 + 2;
          const fill = shown >= right ? "full" : shown === left ? "half" : "empty";

          return (
            <span key={i} className="relative block h-9 w-9">
              {coralineActive ? <SewnButton state={fill} /> : <StarShape state={fill} />}
              <button
                role="radio"
                aria-checked={score === left}
                aria-label={`${left / 2} étoile`}
                className="absolute inset-y-0 left-0 w-1/2 cursor-pointer"
                onMouseEnter={() => setHover(left)}
                onFocus={() => setHover(left)}
                onBlur={() => setHover(0)}
                onClick={() => {
                  setScore(left);
                  void save(left);
                }}
              />
              <button
                role="radio"
                aria-checked={score === right}
                aria-label={`${right / 2} étoiles`}
                className="absolute inset-y-0 right-0 w-1/2 cursor-pointer"
                onMouseEnter={() => setHover(right)}
                onFocus={() => setHover(right)}
                onBlur={() => setHover(0)}
                onClick={() => {
                  setScore(right);
                  void save(right);
                }}
              />
            </span>
          );
        })}
        <span className="ml-3 self-center text-sm text-muted">
          {shown ? `${shown / 2} / 5` : "—"}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          onClick={() => {
            setFavorite(!favorite);
            if (score > 0) void save();
          }}
          className={`border px-4 py-1.5 text-[11px] uppercase tracking-[0.18em] transition-colors ${
            favorite ? "border-gold bg-gold/15 text-gold" : "border-edge text-muted hover:text-text"
          }`}
        >
          {favorite ? "★ Dans mon panthéon" : "☆ Ajouter au panthéon"}
        </button>

        <button
          onClick={toggleFollow}
          className={`border px-4 py-1.5 text-[11px] uppercase tracking-[0.18em] transition-colors ${
            following ? "border-forest bg-forest/25 text-text" : "border-edge text-muted hover:text-text"
          }`}
        >
          {following ? "Suivi" : "Suivre"}
        </button>
      </div>

      <textarea
        value={review}
        onChange={(e) => setReview(e.target.value)}
        rows={4}
        maxLength={4000}
        placeholder={`Pourquoi ${artist.name} mérite cette note…`}
        className="mt-5 w-full resize-y border border-edge bg-ink-2/70 p-3 text-sm outline-none transition-colors placeholder:text-muted/60 focus:border-gold/60"
      />

      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={() => void save(score, true)}
          disabled={status === "saving"}
          className="bg-gold px-6 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-ink transition-colors hover:bg-brass disabled:opacity-50"
        >
          {status === "saving" ? "Enregistrement…" : "Publier la critique"}
        </button>
        {message && (
          <span className={`text-xs ${status === "error" ? "text-music" : "text-muted"}`}>
            {message}
          </span>
        )}
      </div>
    </div>
  );
}

function StarShape({ state }: { state: "full" | "half" | "empty" }) {
  const gid = state === "half" ? "panel-half" : undefined;
  return (
    <svg viewBox="0 0 24 24" className="h-9 w-9" aria-hidden="true">
      {gid && (
        <defs>
          <linearGradient id={gid}>
            <stop offset="50%" stopColor="var(--color-brass)" />
            <stop offset="50%" stopColor="#3b2f25" />
          </linearGradient>
        </defs>
      )}
      <path
        d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4 6.2 20.5l1.1-6.5L2.6 9.4l6.5-.9z"
        fill={state === "full" ? "var(--color-brass)" : gid ? `url(#${gid})` : "#3b2f25"}
      />
    </svg>
  );
}
