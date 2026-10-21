"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ArtistCard } from "@/lib/types";

export default function SearchBar() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ArtistCard[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Recherche differee : on attend 280 ms de silence avant d'appeler l'API.
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        });
        const data = (await res.json()) as { results?: ArtistCard[] };
        setResults(data.results ?? []);
        setOpen(true);
      } catch {
        /* requete annulee ou reseau : on laisse l'ancien resultat */
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [q]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={box} className="relative w-full max-w-xs">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && q.trim().length >= 2) {
            setOpen(false);
            router.push(`/recherche?q=${encodeURIComponent(q.trim())}`);
          }
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="Un acteur, un chanteur…"
        className="w-full rounded-full border border-edge bg-surface/70 px-4 py-1.5 text-sm outline-none transition placeholder:text-muted/70 focus:border-gold/60"
      />

      {loading && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted">…</span>
      )}

      {open && results.length > 0 && (
        <ul className="absolute right-0 top-full z-50 mt-2 max-h-96 w-80 overflow-auto rounded-xl border border-edge bg-ink-2/95 p-1 shadow-2xl backdrop-blur-xl">
          {results.map((r) => (
            <li key={`${r.kind}:${r.externalId}`}>
              <button
                onClick={() => {
                  setOpen(false);
                  setQ("");
                  router.push(`/artiste/${r.kind}/${r.externalId}`);
                }}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-surface"
              >
                {r.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.imageUrl} alt="" className="h-11 w-8 rounded object-cover object-top" />
                ) : (
                  <div className="h-11 w-8 rounded bg-surface" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{r.name}</span>
                  <span className="block truncate text-[11px] text-muted">
                    {r.tags.slice(0, 2).join(" · ") || r.role}
                  </span>
                </span>
                <span
                  className={`text-[9px] uppercase tracking-widest ${
                    r.kind === "screen" ? "text-screen" : "text-music"
                  }`}
                >
                  {r.kind === "screen" ? "Écran" : "Musique"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
