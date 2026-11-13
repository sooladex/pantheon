"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ArtistCard } from "@/lib/types";

const LABEL: Record<ArtistCard["kind"], string> = { screen: "Écran", music: "Musique" };

/**
 * Grand bandeau vedette : un artiste en plein cadre, titre géant,
 * boutons d'action et miniatures des suivants pour changer de vedette.
 */
export default function FeaturedBanner({ artists }: { artists: ArtistCard[] }) {
  const picks = artists.filter((a) => a.imageUrl).slice(0, 5);
  const [i, setI] = useState(0);

  useEffect(() => {
    if (picks.length < 2) return;
    const t = window.setInterval(() => setI((n) => (n + 1) % picks.length), 7000);
    return () => window.clearInterval(t);
  }, [picks.length]);

  if (!picks.length) return null;
  const a = picks[i];
  const href = `/artiste/${a.kind}/${a.externalId}`;

  return (
    <section className="glass relative overflow-hidden rounded-[2rem]">
      <div className="relative h-[420px] md:h-[460px]">
        {picks.map((p, n) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={p.externalId}
            src={p.imageUrl!}
            alt=""
            aria-hidden={n !== i}
            className={`absolute inset-0 h-full w-full object-cover object-[center_20%] transition-all duration-[1200ms] ${
              n === i ? "scale-100 opacity-100" : "scale-105 opacity-0"
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(9_9_12/0.92)_0%,rgb(9_9_12/0.55)_45%,transparent_75%)]" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink/90 to-transparent" />

        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10">
          <span className="glass mb-4 inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-[11px] text-text">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" /> En vedette · {LABEL[a.kind]}
          </span>
          <h2
            key={a.externalId}
            className="display rise max-w-[12ch] text-5xl md:text-7xl"
          >
            {a.name}
          </h2>
          <p className="mt-3 text-sm text-muted">
            {[a.role, ...a.tags.slice(0, 2)].filter(Boolean).join(" · ")}
          </p>
          <div className="mt-6 flex items-center gap-3">
            <Link
              href={href}
              className="rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-ink shadow-[0_10px_30px_-8px_rgb(239_122_59/0.8)] transition hover:bg-brass"
            >
              Noter
            </Link>
            <Link
              href={href}
              aria-label="Ajouter à une liste"
              className="glass grid h-10 w-10 place-items-center rounded-full text-lg text-text transition hover:bg-white/15"
            >
              +
            </Link>
          </div>
        </div>

        <div className="absolute bottom-6 right-6 hidden gap-2 md:flex">
          {picks.map((p, n) => (
            <button
              key={p.externalId}
              onClick={() => setI(n)}
              aria-label={p.name}
              className={`h-16 w-12 overflow-hidden rounded-xl border-2 transition ${
                n === i ? "border-gold" : "border-white/10 opacity-60 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.imageUrl!} alt="" className="h-full w-full object-cover object-top" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
