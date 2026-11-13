"use client";

import Link from "next/link";
import { useRef } from "react";

/** Rangée défilante horizontale avec flèches, façon plateforme de streaming. */
export default function Shelf({
  title,
  hint,
  more,
  children,
}: {
  title: string;
  hint?: string;
  more?: { href: string; label: string };
  children: React.ReactNode;
}) {
  const row = useRef<HTMLDivElement>(null);
  const go = (dir: number) =>
    row.current?.scrollBy({ left: dir * row.current.clientWidth * 0.85, behavior: "smooth" });

  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight md:text-2xl">{title}</h2>
          {hint && <p className="text-xs text-muted">{hint}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {more && (
            <Link
              href={more.href}
              className="glass rounded-full px-3 py-1.5 text-xs text-muted transition hover:text-text"
            >
              {more.label}
            </Link>
          )}
          <button
            onClick={() => go(-1)}
            aria-label="Précédent"
            className="glass hidden h-8 w-8 place-items-center rounded-full text-muted transition hover:text-text sm:grid"
          >
            ‹
          </button>
          <button
            onClick={() => go(1)}
            aria-label="Suivant"
            className="glass hidden h-8 w-8 place-items-center rounded-full text-muted transition hover:text-text sm:grid"
          >
            ›
          </button>
        </div>
      </div>
      <div ref={row} className="shelf -mx-1">
        {children}
      </div>
    </section>
  );
}
