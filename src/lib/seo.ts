import type { Metadata } from "next";

/**
 * URL canonique du site. En production on veut le domaine propre ;
 * sur une preview Vercel on retombe sur l'URL de la preview pour que
 * les images OpenGraph pointent au bon endroit.
 */
export const SITE_URL = (() => {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.NEXT_PUBLIC_VERCEL_URL ?? process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
})();

export const SITE_NAME = "Panthéon";
export const SITE_TAGLINE = "Note les artistes, pas leurs œuvres";
export const SITE_DESCRIPTION =
  "Panthéon est un Letterboxd pour les personnes : note et critique les acteurs, actrices, chanteurs et groupes sur 5 étoiles, et construis ton mur de visages.";

export function absolute(path: string) {
  return new URL(path, SITE_URL).toString();
}

/** Coupe proprement une description pour les métadonnées (~160 caractères). */
export function clamp(text: string, max = 160) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).replace(/[\s,;:.]+\S*$/, "") + "…";
}

type PageMetaInput = {
  title: string;
  description: string;
  path: string;
  images?: string[];
  type?: "website" | "article" | "profile";
  noIndex?: boolean;
};

/** Fabrique un bloc Metadata cohérent : canonical + OpenGraph + Twitter. */
export function pageMetadata({
  title,
  description,
  path,
  images,
  type = "website",
  noIndex = false,
}: PageMetaInput): Metadata {
  const url = absolute(path);
  const ogImages = images?.length ? images : [absolute("/opengraph-image")];

  return {
    title,
    description: clamp(description),
    alternates: { canonical: url },
    robots: noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      type,
      url,
      siteName: SITE_NAME,
      title,
      description: clamp(description),
      locale: "fr_FR",
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: clamp(description),
      images: ogImages,
    },
  };
}

/** Sérialise un objet JSON-LD pour l'injecter dans un <script>. */
export function jsonLd(data: Record<string, unknown>) {
  // On échappe "<" pour qu'un nom d'artiste ne puisse pas fermer le script.
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
