"use client";

import { useEffect } from "react";
import EggShell from "@/components/eggs/effects/Shell";
import type { EggEffectProps } from "@/components/eggs/EggProvider";

/**
 * Trois tapes sur le portrait : la page vire au noir et blanc et une
 * silhouette rayée monte du bas de l'écran.
 *
 * Note : la silhouette est un motif original (rayures et chapeau), pas
 * une reproduction du personnage du film.
 */
export default function Beetlejuice({ egg, onClose }: EggEffectProps) {
  useEffect(() => {
    document.documentElement.classList.add("egg-monochrome");
    return () => document.documentElement.classList.remove("egg-monochrome");
  }, []);

  return (
    <EggShell onClose={onClose} label={`Surprise liée à ${egg.workTitle}`}>
      <div className="absolute inset-x-0 bottom-0 flex justify-center overflow-hidden">
        <div
          className="h-[46vh] w-[22vh] min-w-[150px] origin-bottom"
          style={{ animation: "egg-rise-up 0.75s cubic-bezier(0.16,1,0.3,1) both" }}
        >
          <svg viewBox="0 0 120 240" className="h-full w-full" aria-hidden="true">
            <defs>
              <pattern id="egg-stripes" width="16" height="16" patternUnits="userSpaceOnUse">
                <rect width="16" height="16" fill="#f2ebdd" />
                <rect width="8" height="16" fill="#16110d" />
              </pattern>
            </defs>
            {/* chapeau */}
            <rect x="24" y="8" width="72" height="10" rx="3" fill="#16110d" />
            <rect x="38" y="-16" width="44" height="28" rx="4" fill="#16110d" />
            {/* tête */}
            <ellipse cx="60" cy="42" rx="26" ry="28" fill="#e6dcc6" />
            <circle cx="50" cy="38" r="4" fill="#16110d" />
            <circle cx="70" cy="38" r="4" fill="#16110d" />
            <path d="M46 56 q14 10 28 0" stroke="#16110d" strokeWidth="3" fill="none" strokeLinecap="round" />
            {/* costume rayé */}
            <path d="M28 76 q32 -12 64 0 l10 164 h-84 z" fill="url(#egg-stripes)" />
            <path d="M52 76 h16 l-4 30 h-8 z" fill="#f2ebdd" />
          </svg>
        </div>
      </div>

      <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-[10px] uppercase tracking-[0.32em] text-muted">
        {egg.workTitle} · {egg.workYear}
      </p>

      <style>{`
        @keyframes egg-rise-up {
          from { transform: translateY(100%); }
          to { transform: translateY(14%); }
        }
      `}</style>
    </EggShell>
  );
}
