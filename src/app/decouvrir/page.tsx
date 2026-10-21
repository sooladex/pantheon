import type { Metadata } from "next";
import { trendingArtists } from "@/lib/artists";
import ArtistWall from "@/components/ArtistWall";
import AdSlot from "@/components/AdSlot";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 1800;

export const metadata: Metadata = pageMetadata({
  title: "Découvrir des acteurs et des chanteurs à noter",
  description:
    "Parcours les acteurs, actrices, chanteurs et groupes du moment, et note-les sur 5 étoiles. Données TMDB et Spotify.",
  path: "/decouvrir",
});

export default async function DiscoverPage() {
  const artists = await trendingArtists().catch(() => []);
  const screen = artists.filter((a) => a.kind === "screen");
  const music = artists.filter((a) => a.kind === "music");

  return (
    <div className="mx-auto max-w-7xl space-y-14 px-4 py-12">
      <header>
        <p className="text-[11px] uppercase tracking-[0.3em] text-gold/80">Découvrir</p>
        <h1 className="mt-2 text-4xl font-black">Des visages à juger</h1>
      </header>

      <section>
        <h2 className="mb-4 text-lg font-bold text-screen">Écran</h2>
        {screen.length ? (
          <ArtistWall artists={screen} />
        ) : (
          <p className="text-sm text-muted">TMDB n&apos;est pas configuré.</p>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold text-music">Musique</h2>
        {music.length ? (
          <ArtistWall artists={music} />
        ) : (
          <p className="text-sm text-muted">Spotify n&apos;est pas configuré.</p>
        )}
      </section>

      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_FOOTER} />
    </div>
  );
}
