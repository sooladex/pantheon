"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

const KEY = "pantheon_consent_v1";
const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

type Choice = "granted" | "denied";

function read(): Choice | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

/**
 * Bandeau de consentement + chargement conditionnel d'AdSense.
 *
 * Le script publicitaire n'est JAMAIS injecté avant un "oui" explicite :
 * c'est ce qu'exige le RGPD, et AdSense refuse les sites européens qui
 * chargent des annonces personnalisées sans recueil de consentement.
 * Sans NEXT_PUBLIC_ADSENSE_CLIENT, rien ne s'affiche du tout.
 */
export default function ConsentGate() {
  const [choice, setChoice] = useState<Choice | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setChoice(read());
    setReady(true);
  }, []);

  function decide(next: Choice) {
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* navigation privée : le choix ne survivra pas, tant pis */
    }
    setChoice(next);
  }

  if (!CLIENT || !ready) return null;

  if (choice === "granted") {
    return (
      <Script
        id="adsbygoogle-init"
        async
        strategy="afterInteractive"
        crossOrigin="anonymous"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}`}
      />
    );
  }

  if (choice === "denied") return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Consentement aux cookies publicitaires"
      className="fixed inset-x-3 bottom-3 z-[150] mx-auto max-w-2xl rounded-2xl border border-edge bg-ink-2/95 p-5 shadow-2xl backdrop-blur-xl sm:inset-x-6"
    >
      <p className="text-sm font-semibold">Publicité et cookies</p>
      <p className="mt-2 text-xs leading-relaxed text-muted">
        Panthéon est gratuit et financé par la publicité. Avec ton accord, Google peut
        déposer des cookies pour afficher des annonces. Tu peux refuser : le site
        fonctionne exactement pareil, simplement sans annonces.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => decide("granted")}
          className="rounded-full bg-gold px-5 py-2 text-xs font-semibold text-ink transition hover:bg-gold/85"
        >
          Accepter
        </button>
        <button
          onClick={() => decide("denied")}
          className="rounded-full border border-edge px-5 py-2 text-xs text-muted transition hover:text-text"
        >
          Refuser
        </button>
      </div>
    </div>
  );
}
