"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ArtistCard } from "@/lib/types";

type MyList = { id: number; title: string; slug: string; contains: boolean };

/**
 * Menu "Ajouter à une liste" : coche les listes existantes, ou en crée
 * une nouvelle à la volée avec l'artiste déjà dedans.
 */
export default function ListPicker({
  artist,
  myLists,
  signedIn,
}: {
  artist: ArtistCard;
  myLists: MyList[];
  signedIn: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<Record<number, boolean>>(
    Object.fromEntries(myLists.map((l) => [l.id, l.contains])),
  );
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  if (!signedIn) return null;

  async function toggle(listId: number) {
    const next = !state[listId];
    setState((s) => ({ ...s, [listId]: next }));

    const res = await fetch("/api/lists", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listId, artist, included: next, note: "" }),
    }).catch(() => null);

    if (!res || !res.ok) setState((s) => ({ ...s, [listId]: !next }));
    else router.refresh();
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    setError("");

    const res = await fetch("/api/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), artist }),
    });

    setCreating(false);

    if (res.ok) {
      setTitle("");
      setOpen(false);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Création impossible.");
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full rounded-full border border-edge px-4 py-1.5 text-xs text-muted transition hover:border-gold hover:text-gold"
      >
        + Ajouter à une liste
      </button>

      {open && (
        <div className="absolute z-40 mt-2 w-full rounded-xl border border-edge bg-ink-2/95 p-2 shadow-2xl backdrop-blur-xl">
          {myLists.length > 0 && (
            <ul className="mb-2 max-h-56 overflow-auto">
              {myLists.map((l) => (
                <li key={l.id}>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition hover:bg-surface">
                    <input
                      type="checkbox"
                      checked={Boolean(state[l.id])}
                      onChange={() => toggle(l.id)}
                      className="accent-[var(--color-gold)]"
                    />
                    <span className="truncate">{l.title}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={create} className="flex gap-1.5 border-t border-edge/60 pt-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              placeholder="Nouvelle liste…"
              className="min-w-0 flex-1 rounded-lg border border-edge bg-surface/60 px-2 py-1.5 text-xs outline-none focus:border-gold/60"
            />
            <button
              disabled={creating}
              className="rounded-lg bg-gold px-3 text-xs font-semibold text-ink transition hover:bg-gold/85 disabled:opacity-50"
            >
              {creating ? "…" : "Créer"}
            </button>
          </form>

          {error && <p className="mt-1.5 px-1 text-[11px] text-music">{error}</p>}
        </div>
      )}
    </div>
  );
}
