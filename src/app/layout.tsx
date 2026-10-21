import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import Nav from "@/components/Nav";
import ConsentGate from "@/components/ConsentGate";
import SmoothScroll from "@/components/SmoothScroll";
import Cursor from "@/components/Cursor";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL, absolute, jsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "noter des acteurs",
    "noter des chanteurs",
    "critique d'artistes",
    "letterboxd des artistes",
    "classement acteurs",
    "avis artistes",
    "fiche acteur",
    "fiche chanteur",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: { canonical: SITE_URL },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export const viewport: Viewport = {
  themeColor: "#08080b",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

const siteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  alternateName: "Pantheon",
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  inLanguage: "fr-FR",
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: absolute("/recherche?q={search_term_string}") },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="custom-cursor-active">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(siteSchema) }}
        />
        {/* Les portraits viennent de TMDB et Spotify : on ouvre la connexion tôt. */}
        {/* Grotesque resserrée : 800 pour les titres géants.
            Chargée par le navigateur plutôt que par next/font — le build
            tourne derrière un proxy qui ne joint pas Google Fonts. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;700;800&display=swap"
        />
        <link rel="preconnect" href="https://image.tmdb.org" />
        <link rel="preconnect" href="https://i.scdn.co" />
        <link rel="dns-prefetch" href="https://image.tmdb.org" />
        <link rel="dns-prefetch" href="https://i.scdn.co" />
      </head>
      <body className="grain flex min-h-dvh flex-col bg-ink text-text">
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-gold focus:px-4 focus:py-2 focus:text-sm focus:text-ink"
        >
          Aller au contenu
        </a>

        <Nav />
        <main id="contenu" className="flex-1">
          {children}
        </main>

        <footer className="mt-24 border-t border-edge/60">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 text-sm sm:grid-cols-3">
            <div>
              <p className="text-base font-black tracking-[0.18em]">PANTHÉON</p>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                Le mur des visages. On note les artistes, pas leurs œuvres.
              </p>
            </div>
            <nav className="flex flex-col gap-1.5 text-xs text-muted">
              <Link href="/decouvrir" className="transition hover:text-gold">Découvrir</Link>
              <Link href="/classement" className="transition hover:text-gold">Classement</Link>
              <Link href="/critiques" className="transition hover:text-gold">Critiques</Link>
              <Link href="/listes" className="transition hover:text-gold">Listes</Link>
            </nav>
            <div className="text-xs text-muted">
              <p>
                Données écran fournies par{" "}
                <a
                  href="https://www.themoviedb.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 hover:text-gold"
                >
                  TMDB
                </a>
                , données musique par{" "}
                <a
                  href="https://developer.spotify.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 hover:text-gold"
                >
                  Spotify
                </a>
                .
              </p>
              <p className="mt-2">
                Ce produit utilise l&apos;API TMDB mais n&apos;est ni approuvé ni certifié par TMDB.
              </p>
            </div>
          </div>
        </footer>

        <SmoothScroll />
        <Cursor />
        <ConsentGate />
      </body>
    </html>
  );
}
