"use client";

import { useEffect, useState } from "react";
import EggShell from "@/components/eggs/effects/Shell";
import type { EggEffectProps } from "@/components/eggs/EggProvider";

/**
 * Le compteur s'emballe jusqu'à 88 mph, les dates défilent, puis tout
 * revient à aujourd'hui.
 */
export default function BackToTheFuture({ egg, onClose }: EggEffectProps) {
  const today = new Date();
  const [speed, setSpeed] = useState(0);
  const [date, setDate] = useState(today);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    let raf = 0;
    const started = performance.now();
    const RUN = 2600;

    const tick = (now: number) => {
      const t = Math.min((now - started) / RUN, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setSpeed(Math.round(eased * 88));

      if (t < 1) {
        const span = 1000 * 60 * 60 * 24 * 365 * 35;
        setDate(new Date(today.getTime() - Math.random() * span));
        raf = requestAnimationFrame(tick);
      } else {
        setDate(today);
        setSettled(true);
        window.setTimeout(onClose, 1400);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <EggShell onClose={onClose} label={`Surprise liée à ${egg.workTitle}`}>
      <div className="absolute inset-x-0 top-24 flex justify-center">
        <div className="card px-8 py-6 text-center font-mono">
          <p className="eyebrow">Destination</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-gold">
            {date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })}
          </p>
          <p
            className={`mt-4 text-5xl font-black tabular-nums ${settled ? "text-text" : "text-[#8c3b2e]"}`}
          >
            {speed}
            <span className="ml-2 text-base font-normal uppercase tracking-[0.25em] text-muted">
              mph
            </span>
          </p>
          <p className="mt-3 text-[10px] uppercase tracking-[0.3em] text-muted">
            {egg.workTitle}
          </p>
        </div>
      </div>
    </EggShell>
  );
}
