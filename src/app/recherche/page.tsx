import type { Metadata } from "next";
import { searchArtists } from "@/lib/artists";
import ArtistWall from "@/components/ArtistWall";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  const term = (q ?? "").trim();

  return {
    title: term ? `Recherche : ${term}` : "Recherche",
    description: term
      ? `Résultats pour « ${term} » sur Panthéon : acteurs, actrices, chanteurs et groupes à noter.`
      : "Cherche un acteur, une actrice, un chanteur ou un groupe à noter sur Panthéon.",
    // Les pages de résultats ne doivent pas encombrer l'index.
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const term = (q ?? "").trim();
  const results = term.length >= 2 ? await searchArtists(term).catch(() => []) : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <p className="text-[11px] uppercase tracking-[0.3em] text-muted">Recherche</p>
      <h1 className="mt-2 text-3xl font-black">{term || "…"}</h1>
      <p className="mt-1 text-sm text-muted">
        {results.length} artiste{results.length > 1 ? "s" : ""} trouvé{results.length > 1 ? "s" : ""}
      </p>

      <div className="mt-8">
        {results.length > 0 ? (
          <ArtistWall artists={results} />
        ) : (
          <p className="text-sm text-muted">
            Rien pour cette recherche. Essaie un nom complet, ou vérifie tes clés d&apos;API.
          </p>
        )}
      </div>
    </div>
  );
}
