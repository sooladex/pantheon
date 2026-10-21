"use client";

import { useRef } from "react";

/**
 * Hover magnétique : l'élément suit le curseur de quelques pixels et
 * revient en place à la sortie. Désactivé au doigt et quand l'utilisateur
 * demande moins d'animation.
 */
export default function MagneticButton({
  children,
  strength = 0.28,
}: {
  children: React.ReactNode;
  strength?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  function onMove(e: React.MouseEvent<HTMLSpanElement>) {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
  }

  function reset() {
    if (ref.current) ref.current.style.transform = "";
  }

  return (
    <span
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      className="inline-block will-change-transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
    >
      {children}
    </span>
  );
}
