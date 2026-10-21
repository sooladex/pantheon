"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);

    const form = new FormData(e.currentTarget);
    const body = isRegister
      ? {
          username: String(form.get("username") ?? "").toLowerCase().trim(),
          email: String(form.get("email") ?? "").trim(),
          password: String(form.get("password") ?? ""),
          displayName: String(form.get("displayName") ?? "").trim(),
        }
      : {
          email: String(form.get("email") ?? "").trim(),
          password: String(form.get("password") ?? ""),
        };

    const res = await fetch(`/api/auth/${isRegister ? "register" : "login"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = (await res.json().catch(() => ({}))) as { error?: string; username?: string };
    setBusy(false);

    if (!res.ok) {
      setError(data.error ?? "Une erreur est survenue.");
      return;
    }

    router.replace(data.username ? `/u/${data.username}` : "/");
    router.refresh();
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-20">
      <h1 className="text-3xl font-black">{isRegister ? "Créer un compte" : "Connexion"}</h1>
      <p className="mt-2 text-sm text-muted">
        {isRegister ? "Ton panthéon personnel commence ici." : "Retrouve ton mur de visages."}
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        {isRegister && (
          <>
            <Field name="displayName" label="Nom affiché" required maxLength={60} />
            <Field
              name="username"
              label="Pseudo"
              required
              pattern="[a-zA-Z0-9_]{3,24}"
              hint="3 à 24 caractères : lettres, chiffres, _"
            />
          </>
        )}
        <Field name="email" label="Email" type="email" required autoComplete="email" />
        <Field
          name="password"
          label="Mot de passe"
          type="password"
          required
          minLength={isRegister ? 8 : undefined}
          autoComplete={isRegister ? "new-password" : "current-password"}
        />

        {error && <p className="text-sm text-music">{error}</p>}

        <button
          disabled={busy}
          className="w-full rounded-full bg-gold py-2.5 text-sm font-semibold text-ink transition hover:bg-gold/85 disabled:opacity-50"
        >
          {busy ? "…" : isRegister ? "Créer mon panthéon" : "Entrer"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-muted">
        {isRegister ? "Déjà inscrit ? " : "Pas encore de compte ? "}
        <Link href={isRegister ? "/connexion" : "/inscription"} className="text-gold hover:underline">
          {isRegister ? "Se connecter" : "S'inscrire"}
        </Link>
      </p>
    </div>
  );
}

function Field({
  name,
  label,
  hint,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { name: string; label: string; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] uppercase tracking-[0.2em] text-muted">{label}</span>
      <input
        name={name}
        {...rest}
        className="w-full rounded-xl border border-edge bg-surface/60 px-4 py-2.5 text-sm outline-none transition focus:border-gold/60"
      />
      {hint && <span className="mt-1 block text-[11px] text-muted/70">{hint}</span>}
    </label>
  );
}
