"use client";

import { useEffect, useRef, useState } from "react";
import EggShell from "@/components/eggs/effects/Shell";
import type { EggEffectProps } from "@/components/eggs/EggProvider";

/** Pilule rouge ou bleue. La rouge ouvre trois secondes de pluie de code. */
export default function Matrix({ egg, onClose }: EggEffectProps) {
  const [phase, setPhase] = useState<"choice" | "rain">("choice");
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (phase !== "rain") return;
    const el = canvas.current;
    if (!el) return;

    const ctx = el.getContext("2d");
    if (!ctx) return;

    el.width = window.innerWidth;
    el.height = window.innerHeight;

    const size = 16;
    const columns = Math.floor(el.width / size);
    const drops = new Array(columns).fill(0).map(() => Math.random() * -40);
    const glyphs = "アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789";

    let frame = 0;
    const draw = () => {
      ctx.fillStyle = "rgba(10, 14, 10, 0.08)";
      ctx.fillRect(0, 0, el.width, el.height);
      ctx.font = `${size}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const ch = glyphs[Math.floor(Math.random() * glyphs.length)];
        ctx.fillStyle = Math.random() > 0.97 ? "#d8ffd8" : "#3fbf5f";
        ctx.fillText(ch, i * size, drops[i] * size);
        if (drops[i] * size > el.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);

    const stop = window.setTimeout(onClose, 3000);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(stop);
    };
  }, [phase, onClose]);

  if (phase === "rain") {
    return (
      <EggShell onClose={onClose} label={`Surprise liée à ${egg.workTitle}`}>
        <canvas ref={canvas} className="absolute inset-0 h-full w-full" />
      </EggShell>
    );
  }

  return (
    <EggShell onClose={onClose} label={`Surprise liée à ${egg.workTitle}`} blocking>
      <div className="absolute inset-0 flex items-center justify-center bg-ink/75 p-5 backdrop-blur-sm">
        <div className="card pointer-events-auto w-full max-w-md p-7 text-center">
          <p className="eyebrow text-gold">Easter egg · {egg.workTitle}</p>
          <h2 className="display mt-3 text-3xl">Dernière chance</h2>
          <p className="mt-3 text-sm text-muted">
            Ta critique part dans tous les cas. Mais choisis quand même.
          </p>

          <div className="mt-7 flex justify-center gap-5">
            <button
              onClick={() => setPhase("rain")}
              aria-label="Pilule rouge"
              className="group flex flex-col items-center gap-2"
            >
              <span className="block h-12 w-20 rounded-full bg-[#8c3b2e] transition-transform group-hover:scale-110" />
              <span className="text-[10px] uppercase tracking-[0.25em] text-muted">Rouge</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Pilule bleue"
              className="group flex flex-col items-center gap-2"
            >
              <span className="block h-12 w-20 rounded-full bg-[#1d3350] transition-transform group-hover:scale-110" />
              <span className="text-[10px] uppercase tracking-[0.25em] text-muted">Bleue</span>
            </button>
          </div>
        </div>
      </div>
    </EggShell>
  );
}
