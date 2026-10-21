"use client";

import { useState } from "react";

/**
 * Partage natif sur mobile, copie du lien ailleurs. Pas de dépendance
 * réseau sociale : un seul bouton qui fait ce que l'appareil sait faire.
 */
export default function ShareButton({ title, text }: { title: string; text?: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        /* partage annulé : on retombe sur la copie */
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* presse-papiers refusé : rien à faire de plus */
    }
  }

  return (
    <button
      onClick={share}
      className="inline-flex items-center gap-1.5 rounded-full border border-edge px-4 py-1.5 text-xs text-muted transition hover:border-gold hover:text-gold"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
      </svg>
      {copied ? "Lien copié" : "Partager"}
    </button>
  );
}
