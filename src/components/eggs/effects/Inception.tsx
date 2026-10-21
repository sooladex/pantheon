"use client";

import EggShell from "@/components/eggs/effects/Shell";
import type { EggEffectProps } from "@/components/eggs/EggProvider";

/**
 * Pendant l'enregistrement, une toupie tourne dans un coin. Elle ralentit
 * sans jamais tout à fait s'arrêter : la durée de rotation s'allonge
 * indéfiniment, l'animation ne se termine pas.
 */
export default function Inception({ egg, onClose }: EggEffectProps) {
  return (
    <EggShell onClose={onClose} label={`Surprise liée à ${egg.workTitle}`}>
      <div className="absolute bottom-10 left-10 flex flex-col items-center gap-3">
        <div
          className="h-20 w-20"
          style={{ animation: "egg-top-spin 0.42s linear infinite, egg-top-slow 6.5s ease-out forwards" }}
        >
          <svg viewBox="0 0 80 80" className="h-full w-full" aria-hidden="true">
            <ellipse cx="40" cy="62" rx="22" ry="6" fill="#0d0906" opacity="0.5" />
            <path d="M40 66 L24 34 h32 z" fill="#c89a4a" />
            <ellipse cx="40" cy="34" rx="16" ry="5" fill="#e2b964" />
            <rect x="37" y="12" width="6" height="22" rx="2" fill="#8a6526" />
            <ellipse cx="40" cy="12" rx="3" ry="2" fill="#c89a4a" />
          </svg>
        </div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted">
          {egg.workTitle}
        </p>
      </div>

      <style>{`
        @keyframes egg-top-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        /* Elle ralentit — mais la dernière image n'est jamais l'arrêt. */
        @keyframes egg-top-slow {
          from { animation-duration: 0.42s; }
          to { animation-duration: 1.4s; }
        }
      `}</style>
    </EggShell>
  );
}
