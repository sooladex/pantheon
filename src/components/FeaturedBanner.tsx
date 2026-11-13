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
        {/* Fond : le portrait flouté remplit le cadre */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={`bg-${a.externalId}`}
          src={a.imageUrl!}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full scale-125 object-cover opacity-60 blur-3xl transition-opacity duration-1000"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(9_9_12/0.92)_0%,rgb(9_9_12/0.6)_50%,rgb(9_9_12/0.25)_100%)]" />

        {/* Portrait net, posé à droite comme une affiche */}
        <div className="absolute bottom-0 right-[12%] top-8 hidden w-[34%] max-w-[330px] md:block">
          {picks.map((p, n) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={p.externalId}
              src={p.imageUrl!}
              alt={n === i ? p.name : ""}
              className={`absolute inset-0 h-full w-full rounded-t-[1.75rem] object-cover object-top shadow-[0_30px_80px_-20px_rgb(0_0_0/0.9)] transition-all duration-700 ${
                n === i ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
              }`}
            />
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/80 to-transparent" />

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

        <div className="absolute right-5 top-1/2 hidden -translate-y-1/2 flex-col gap-2 lg:flex">
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
