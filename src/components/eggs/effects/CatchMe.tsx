"use client";

import EggShell from "@/components/eggs/effects/Shell";
import type { EggEffectProps } from "@/components/eggs/EggProvider";

/**
 * Avis de recherche à l'ancienne, affiché après la publication d'une
 * critique. Le cartouche nomme explicitement le film : c'est le
 * personnage qui est "recherché", pas la personne réelle.
 */
export default function CatchMe({ egg, onClose }: EggEffectProps) {
  return (
    <EggShell onClose={onClose} label={`Surprise liée à ${egg.workTitle}`}>
      <div className="absolute inset-0 flex items-center justify-center p-5">
        <div
          className="w-full max-w-sm border-[3px] border-[#3b2f25] bg-[#d9cdb4] p-6 text-center text-[#241b14] shadow-2xl"
          style={{
            animation: "egg-stamp 0.5s cubic-bezier(0.16,1,0.3,1) both",
            transform: "rotate(-2deg)",
          }}
        >
          <p className="text-[10px] uppercase tracking-[0.35em]">Avis de recherche</p>

          <h2
            className="display mt-2 text-2xl leading-none"
            style={{ color: "#241b14" }}
          >
            Have you seen
            <br />
            this man?
          </h2>

          <div className="mx-auto mt-5 w-40 border-[3px] border-[#3b2f25] bg-[#c3b596]">
            {egg.portraitUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={egg.portraitUrl}
                alt={egg.personName ?? ""}
                className="aspect-[2/3] w-full object-cover object-top grayscale contrast-125"
              />
            ) : (
              <div className="aspect-[2/3] w-full" />
            )}
          </div>

          {egg.personName && (
            <p className="mt-3 text-sm font-bold uppercase tracking-[0.12em]">
              {egg.personName}
            </p>
          )}

          <p className="mx-auto mt-3 max-w-[30ch] text-[12px] leading-relaxed">
            Recherché pour s&apos;être fait passer pour un pilote, un médecin
            et un avocat.
          </p>

          <p className="mt-4 border-t border-[#3b2f25]/40 pt-3 text-[9px] uppercase tracking-[0.25em] opacity-70">
            D&apos;après {egg.workTitle} ({egg.workYear})
          </p>
        </div>
      </div>

      <style>{`
        @keyframes egg-stamp {
          from { opacity: 0; transform: rotate(-2deg) scale(1.12); }
          to { opacity: 1; transform: rotate(-2deg) scale(1); }
        }
      `}</style>
    </EggShell>
  );
}
