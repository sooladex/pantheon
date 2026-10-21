"use client";

import EggShell from "@/components/eggs/effects/Shell";
import type { EggEffectProps } from "@/components/eggs/EggProvider";

/** À l'ouverture de la fiche, une fissure traverse l'écran puis s'efface. */
export default function Shining({ egg, onClose }: EggEffectProps) {
  return (
    <EggShell onClose={onClose} label={`Surprise liée à ${egg.workTitle}`}>
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M50 -2 L47 16 L53 28 L44 44 L52 58 L46 74 L54 88 L49 102"
          stroke="#f2ebdd"
          strokeWidth="0.5"
          fill="none"
          vectorEffect="non-scaling-stroke"
          style={{
            strokeDasharray: 200,
            strokeDashoffset: 200,
            animation: "egg-crack 0.9s cubic-bezier(0.16,1,0.3,1) forwards, egg-fade 2.6s ease-out forwards",
          }}
        />
        <path
          d="M47 16 L36 12 M53 28 L66 22 M44 44 L30 40 M52 58 L68 54 M46 74 L32 72"
          stroke="#f2ebdd"
          strokeWidth="0.3"
          fill="none"
          vectorEffect="non-scaling-stroke"
          style={{
            strokeDasharray: 120,
            strokeDashoffset: 120,
            animation: "egg-crack 0.7s 0.35s cubic-bezier(0.16,1,0.3,1) forwards, egg-fade 2.6s ease-out forwards",
          }}
        />
      </svg>

      <style>{`
        @keyframes egg-crack { to { stroke-dashoffset: 0; } }
        @keyframes egg-fade { 0%, 55% { opacity: 1; } 100% { opacity: 0; } }
      `}</style>
    </EggShell>
  );
}
