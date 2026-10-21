"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import MagneticButton from "@/components/MagneticButton";

const FlatLayScene = dynamic(() => import("@/components/scene/FlatLayScene"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-ink" />,
});

const TITLE = "PANTHÉON";

/** Découpe le titre en lettres animables, chacune avec son délai. */
function SplitTitle({ text, start }: { text: string; start: number }) {
  return (
    <h1 className="display text-[22vw] leading-[0.82] md:text-[13vw]" aria-label={text}>
      {text.split("").map((c, i) => (
        <span
          key={i}
          className="char"
          aria-hidden="true"
          style={{ animationDelay: `${start + i * 0.055}s` }}
        >
          {c}
        </span>
      ))}
    </h1>
  );
}

export default function Hero({ signedIn, username }: { signedIn: boolean; username?: string }) {
  const [introPlaying, setIntroPlaying] = useState(true);
  const [skipped, setSkipped] = useState(false);
  const section = useRef<HTMLElement>(null);

  // L'intro dure 2,4 s. Un clic n'importe où la coupe net.
  const skip = useCallback(() => {
    setSkipped(true);
    setIntroPlaying(false);
  }, []);

  useEffect(() => {
    if (!introPlaying) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") skip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [introPlaying, skip]);

  // Décalages de révélation : immédiats si l'intro a été coupée.
  const d = skipped ? 0 : 1;

  return (
    <section
      ref={section}
      onClick={introPlaying ? skip : undefined}
      className="relative min-h-[100svh] overflow-hidden border-b border-edge/60"
    >
      <FlatLayScene
        intro={!skipped}
        onIntroDone={() => setIntroPlaying(false)}
        className="absolute inset-0 h-full w-full"
      />

      {/* Voile pour asseoir le texte sur la scène, sans halo */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(22,17,13,0.55),rgba(22,17,13,0.15)_38%,rgba(22,17,13,0.82))]" />

      <div className="relative mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-between px-5 py-8 md:px-10 md:py-12">
        {/* Bandeau haut : deux encarts éditoriaux aux extrémités */}
        <div className="flex items-start justify-between gap-6">
          <p className="eyebrow rise" style={{ animationDelay: `${d * 1.9}s` }}>
            Le mur
            <br />
            des visages
          </p>
          <p
            className="eyebrow rise max-w-[16ch] text-right"
            style={{ animationDelay: `${d * 2.1}s` }}
          >
            Écran &amp; musique
            <br />
            Est. 2026
          </p>
        </div>

        {/* Titre, calé bas-gauche, très grand, asymétrique */}
        <div className="max-w-5xl">
          <SplitTitle text={TITLE} start={d * 1.2} />

          <div className="mt-8 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <p className="editorial rise" style={{ animationDelay: `${d * 2.3}s` }}>
              On ne note pas les films ni les albums. On note les gens qui les
              font — acteurs, actrices, chanteurs, groupes. Cinq étoiles, une
              critique, et un panthéon qui dit qui vous êtes.
            </p>

            <div
              className="rise flex shrink-0 flex-wrap gap-3"
              style={{ animationDelay: `${d * 2.5}s` }}
            >
              <MagneticButton>
                <Link
                  href={signedIn && username ? `/u/${username}` : "/inscription"}
                  className="inline-block bg-gold px-7 py-3 text-xs font-bold uppercase tracking-[0.22em] text-ink transition-colors hover:bg-brass"
                >
                  {signedIn ? "Mon panthéon" : "Commencer"}
                </Link>
              </MagneticButton>
              <MagneticButton>
                <Link
                  href="/decouvrir"
                  className="inline-block border border-edge px-7 py-3 text-xs font-bold uppercase tracking-[0.22em] text-text transition-colors hover:border-gold hover:text-gold"
                >
                  Découvrir
                </Link>
              </MagneticButton>
            </div>
          </div>
        </div>

        {/* Pied : indice de défilement + mention de l'intro */}
        <div className="flex items-end justify-between gap-6">
          <p className="eyebrow rise" style={{ animationDelay: `${d * 2.7}s` }}>
            Défilez
          </p>
          {introPlaying && (
            <button
              onClick={skip}
              className="eyebrow pointer-events-auto border border-edge px-4 py-2 transition-colors hover:border-gold hover:text-gold"
            >
              Passer
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
