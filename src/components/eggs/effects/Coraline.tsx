"use client";

import EggShell from "@/components/eggs/effects/Shell";
import type { EggEffectProps } from "@/components/eggs/EggProvider";

/**
 * Les cinq étoiles deviennent cinq boutons cousus. L'échelle ne change
 * pas : mêmes dix demi-valeurs, mêmes libellés, même navigation clavier.
 * Seul le dessin change — c'est le `SewnButton` ci-dessous que le
 * panneau de notation substitue à l'étoile.
 */
export function SewnButton({
  state,
  size = 36,
}: {
  state: "full" | "half" | "empty";
  size?: number;
}) {
  const thread = "#f2ebdd";
  const body = state === "empty" ? "#3b2f25" : "#c87137";

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <clipPath id={`sewn-half-${size}`}>
          <rect x="0" y="0" width="12" height="24" />
        </clipPath>
      </defs>

      {/* corps du bouton */}
      <circle cx="12" cy="12" r="9.5" fill="#3b2f25" />
      <circle cx="12" cy="12" r="9.5" fill={body} clipPath={state === "half" ? `url(#sewn-half-${size})` : undefined} />
      <circle cx="12" cy="12" r="9.5" fill="none" stroke="#241b14" strokeWidth="1" />
      <circle cx="12" cy="12" r="6.6" fill="none" stroke="#241b14" strokeWidth="0.7" opacity="0.6" />

      {/* quatre trous */}
      <circle cx="9.4" cy="9.4" r="1.15" fill="#16110d" />
      <circle cx="14.6" cy="9.4" r="1.15" fill="#16110d" />
      <circle cx="9.4" cy="14.6" r="1.15" fill="#16110d" />
      <circle cx="14.6" cy="14.6" r="1.15" fill="#16110d" />

      {/* le fil, en croix */}
      <path
        d="M9.4 9.4 L14.6 14.6 M14.6 9.4 L9.4 14.6"
        stroke={thread}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity={state === "empty" ? 0.35 : 0.95}
      />
    </svg>
  );
}

/** Le mot qui accompagne la transformation, discret et auto-effacé. */
export default function Coraline({ egg, onClose }: EggEffectProps) {
  return (
    <EggShell onClose={onClose} label={`Surprise liée à ${egg.workTitle}`}>
      <div className="absolute inset-x-0 bottom-10 flex justify-center px-5">
        <div
          className="card flex items-center gap-4 px-6 py-4"
          style={{ animation: "egg-slide-up 0.45s cubic-bezier(0.16,1,0.3,1) both" }}
        >
          <SewnButton state="full" size={30} />
          <div>
            <p className="text-sm font-semibold">Quelqu&apos;un a cousu tes étoiles.</p>
            <p className="eyebrow mt-1">
              {egg.workTitle} · {egg.workYear}
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes egg-slide-up {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: none; }
        }
      `}</style>
    </EggShell>
  );
}
