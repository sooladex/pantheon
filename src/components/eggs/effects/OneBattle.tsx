"use client";

import EggShell from "@/components/eggs/effects/Shell";
import type { EggEffectProps } from "@/components/eggs/EggProvider";

/**
 * Fausse alerte, volontairement ridicule : le ton est celui d'un gag, pas
 * celui d'une vraie alerte système. La critique est déjà enregistrée —
 * les deux boutons ferment simplement la modale.
 */
export default function OneBattle({ egg, onClose }: EggEffectProps) {
  return (
    <EggShell onClose={onClose} label={`Surprise liée à ${egg.workTitle}`} blocking>
      <div className="absolute inset-0 flex items-center justify-center bg-ink/70 p-5 backdrop-blur-sm">
        <div
          className="card pointer-events-auto w-full max-w-md p-7"
          style={{ animation: "egg-pop 0.35s cubic-bezier(0.16,1,0.3,1) both" }}
        >
          <p className="eyebrow text-gold">Easter egg · {egg.workTitle}</p>

          <h2 className="display mt-3 text-3xl">Security Alert</h2>

          <p className="mt-4 text-sm leading-relaxed text-muted">
            Cette critique a été signalée par le{" "}
            <span className="text-text">Christmas Adventurers Club</span>.
            Nos agents sont formellement contre. Continuer&nbsp;?
          </p>

          <p className="mt-3 text-[11px] leading-relaxed text-muted/70">
            (Ta critique est déjà enregistrée. Ceci est un clin d&apos;œil au film,
            pas un vrai signalement.)
          </p>

          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gold px-5 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-ink transition-colors hover:bg-brass"
            >
              Oui
            </button>
            <button
              onClick={onClose}
              className="flex-1 border border-edge px-5 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-muted transition-colors hover:border-gold hover:text-gold"
            >
              Non
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes egg-pop {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: none; }
        }
      `}</style>
    </EggShell>
  );
}
