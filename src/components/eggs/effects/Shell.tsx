"use client";

import { useEffect } from "react";

/**
 * Enveloppe commune à tous les effets : couche au-dessus de la page,
 * fermable en un clic et à la touche Échap, jamais bloquante pour
 * l'action en cours (`pointer-events` seulement là où c'est utile).
 */
export default function EggShell({
  children,
  onClose,
  label,
  blocking = false,
}: {
  children: React.ReactNode;
  onClose: () => void;
  label: string;
  /** true seulement pour les effets qui attendent une réponse. */
  blocking?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-label={label}
      className={`fixed inset-0 z-[140] ${blocking ? "" : "pointer-events-none"}`}
    >
      {children}

      <button
        onClick={onClose}
        aria-label="Fermer la surprise"
        className="pointer-events-auto absolute right-5 top-5 border border-edge bg-ink-2/90 px-3 py-1.5 text-[10px] uppercase tracking-[0.3em] text-muted backdrop-blur transition-colors hover:border-gold hover:text-gold"
      >
        Fermer
      </button>
    </div>
  );
}
