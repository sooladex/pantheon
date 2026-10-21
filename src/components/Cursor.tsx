"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Curseur discret : un petit disque crème qui suit le pointeur, et un
 * anneau qui le rattrape avec du retard. Il grossit au-dessus des
 * éléments cliquables. Rien au doigt, rien en mouvement réduit.
 */
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) {
      document.documentElement.classList.remove("custom-cursor-active");
      return;
    }
    setEnabled(true);

    const target = { x: innerWidth / 2, y: innerHeight / 2 };
    const current = { x: target.x, y: target.y };
    let frame = 0;

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      if (dot.current) {
        dot.current.style.transform = `translate3d(${e.clientX - 3}px, ${e.clientY - 3}px, 0)`;
      }

      const el = e.target as HTMLElement | null;
      const interactive = el?.closest("a, button, input, textarea, select, [role='button']");
      ring.current?.classList.toggle("scale-[2.1]", Boolean(interactive));
      ring.current?.classList.toggle("opacity-90", Boolean(interactive));
    };

    const loop = () => {
      current.x += (target.x - current.x) * 0.16;
      current.y += (target.y - current.y) * 0.16;
      if (ring.current) {
        ring.current.style.transform = `translate3d(${current.x - 15}px, ${current.y - 15}px, 0)`;
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    window.addEventListener("pointermove", onMove);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  if (!enabled) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[120]">
      <div ref={dot} className="absolute left-0 top-0 h-1.5 w-1.5 rounded-full bg-text" />
      <div
        ref={ring}
        className="absolute left-0 top-0 h-[30px] w-[30px] rounded-full border border-text/45 opacity-60 transition-[transform,opacity] duration-300 ease-out"
      />
    </div>
  );
}
