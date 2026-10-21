"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Initial = {
  displayName: string;
  bio: string;
  avatarUrl: string;
  surprisesEnabled: boolean;
};

export default function ProfileForm({
  username,
  initial,
}: {
  username: string;
  initial: Initial;
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  function set<K extends keyof Initial>(key: K, value: Initial[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setStatus("idle");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: form.displayName.trim(),
        bio: form.bio.trim(),
        avatarUrl: form.avatarUrl.trim() || null,
        surprisesEnabled: form.surprisesEnabled,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      setStatus("saved");
      setMessage("Profil mis à jour.");
      router.refresh();
    } else {
      setStatus("error");
      setMessage(data.error ?? "Enregistrement impossible.");
    }
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-5">
      <label className="block">
        <span className="mb-1.5 block text-[11px] uppercase tracking-[0.2em] text-muted">
          Nom affiché
        </span>
        <input
          value={form.displayName}
          onChange={(e) => set("displayName", e.target.value)}
          maxLength={60}
          required
          className="w-full rounded-xl border border-edge bg-surface/60 px-4 py-2.5 text-sm outline-none transition focus:border-gold/60"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-[11px] uppercase tracking-[0.2em] text-muted">Bio</span>
        <textarea
          value={form.bio}
          onChange={(e) => set("bio", e.target.value)}
          rows={4}
          maxLength={400}
          placeholder="Ce que tu regardes, ce que tu écoutes, ce que tu défends."
          className="w-full resize-y rounded-xl border border-edge bg-surface/60 px-4 py-2.5 text-sm outline-none transition placeholder:text-muted/60 focus:border-gold/60"
        />
        <span className="mt-1 block text-right text-[11px] text-muted/70">
          {form.bio.length} / 400
        </span>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-[11px] uppercase tracking-[0.2em] text-muted">
          Avatar (URL d&apos;image)
        </span>
        <input
          value={form.avatarUrl}
          onChange={(e) => set("avatarUrl", e.target.value)}
          type="url"
          maxLength={500}
          placeholder="https://…"
          className="w-full rounded-xl border border-edge bg-surface/60 px-4 py-2.5 text-sm outline-none transition placeholder:text-muted/60 focus:border-gold/60"
        />
        <span className="mt-1 block text-[11px] text-muted/70">
          Colle le lien d&apos;une image déjà en ligne. L&apos;envoi de fichier arrivera plus tard.
        </span>
      </label>

      <div className="card flex items-start gap-4 p-4">
        <input
          id="surprises"
          type="checkbox"
          checked={form.surprisesEnabled}
          onChange={(e) => set("surprisesEnabled", e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-gold)]"
        />
        <label htmlFor="surprises" className="cursor-pointer">
          <span className="block text-sm font-semibold">Surprises</span>
          <span className="mt-1 block text-xs leading-relaxed text-muted">
            De petits clins d&apos;œil cachés apparaissent parfois quand tu ouvres
            une fiche ou publies une critique. Ils ne bloquent jamais rien et se
            ferment en un clic. Décoche pour ne plus en voir.
          </span>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          disabled={status === "saving"}
          className="rounded-full bg-gold px-5 py-2 text-sm font-semibold text-ink transition hover:bg-gold/85 disabled:opacity-50"
        >
          {status === "saving" ? "Enregistrement…" : "Enregistrer"}
        </button>
        <a
          href={`/u/${username}`}
          className="text-xs text-muted underline underline-offset-4 transition hover:text-gold"
        >
          Voir mon profil
        </a>
        {message && (
          <span className={`text-xs ${status === "error" ? "text-music" : "text-muted"}`}>
            {message}
          </span>
        )}
      </div>
    </form>
  );
}
