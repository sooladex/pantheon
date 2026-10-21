"use client";

import Link from "next/link";
import { useState } from "react";
import { Stars } from "@/components/Stars";
import type { FeedReview } from "@/lib/social";

function Avatar({ url, name, size = 28 }: { url: string | null; name: string; size?: number }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-edge text-[10px] font-bold uppercase text-muted"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {name.slice(0, 2)}
    </span>
  );
}

export default function ReviewCard({
  review,
  signedIn,
  showArtist = true,
}: {
  review: FeedReview;
  signedIn: boolean;
  showArtist?: boolean;
}) {
  const [liked, setLiked] = useState(review.likedByMe);
  const [likes, setLikes] = useState(review.likes);
  const [busy, setBusy] = useState(false);

  async function toggleLike() {
    if (!signedIn || busy) return;

    // Optimiste : on bascule tout de suite, on annule si le serveur refuse.
    const next = !liked;
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
    setBusy(true);

    const res = await fetch("/api/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ratingId: review.id, liked: next }),
    }).catch(() => null);

    if (!res || !res.ok) {
      setLiked(!next);
      setLikes((n) => n + (next ? -1 : 1));
    }
    setBusy(false);
  }

  const artistHref = `/artiste/${review.artist.kind}/${review.artist.externalId}`;

  return (
    <article className="flex gap-4 rounded-xl border border-edge bg-surface/40 p-4 transition hover:border-edge">
      {showArtist && (
        <Link href={artistHref} className="shrink-0">
          {review.artist.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={review.artist.imageUrl}
              alt={review.artist.name}
              loading="lazy"
              className="h-28 w-20 rounded-lg object-cover object-top"
            />
          ) : (
            <div className="h-28 w-20 rounded-lg bg-surface" />
          )}
        </Link>
      )}

      <div className="min-w-0 flex-1">
        {showArtist && (
          <Link href={artistHref} className="text-base font-bold hover:text-gold">
            {review.artist.name}
          </Link>
        )}

        <div className="mt-1 flex flex-wrap items-center gap-2">
          <Stars score={review.score} size={13} />
          {review.favorite && (
            <span className="text-[10px] text-gold" title="Dans son panthéon">
              ★ panthéon
            </span>
          )}
          <Link
            href={`/u/${review.username}`}
            className="flex items-center gap-1.5 text-xs text-muted transition hover:text-gold"
          >
            <Avatar url={review.avatarUrl} name={review.displayName} size={20} />
            {review.displayName}
          </Link>
          <time className="text-[11px] text-muted" dateTime={review.createdAt}>
            {new Date(review.createdAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </time>
        </div>

        {review.review && (
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">
            {review.review}
          </p>
        )}

        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={toggleLike}
            disabled={!signedIn || busy}
            aria-pressed={liked}
            title={signedIn ? "J'aime cette critique" : "Connecte-toi pour aimer"}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition ${
              liked
                ? "border-gold bg-gold/15 text-gold"
                : "border-edge text-muted hover:text-text disabled:opacity-40"
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
              <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 10-7.8 7.8l8.8 8.8 8.8-8.8a5.5 5.5 0 000-7.8z" />
            </svg>
            {likes > 0 ? likes : "J'aime"}
          </button>
        </div>
      </div>
    </article>
  );
}
