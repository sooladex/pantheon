import type { Metadata } from "next";
import { fetchLists } from "@/lib/social";
import ListTile from "@/components/ListTile";
import { pageMetadata } from "@/lib/seo";
import AdSlot from "@/components/AdSlot";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Listes d'artistes de la communauté",
  description:
    "Les collections d'artistes créées par la communauté Panthéon : seconds rôles inoubliables, voix des années 90, révélations de l'année…",
  path: "/listes",
});

export default async function ListsPage() {
  const all = await fetchLists({ publicOnly: true, limit: 60 }).catch(() => []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <p className="text-[11px] uppercase tracking-[0.3em] text-gold/80">Communauté</p>
      <h1 className="mt-2 text-4xl font-black">Listes</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Des sélections d&apos;artistes rangées à la main. Crée les tiennes depuis
        n&apos;importe quelle fiche artiste.
      </p>

      {all.length === 0 ? (
        <p className="mt-10 text-sm text-muted">
          Aucune liste publique pour l&apos;instant. Sois le premier à en créer une.
        </p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {all.map((l) => (
            <ListTile key={l.id} list={l} />
          ))}
        </div>
      )}

      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_FOOTER} />
    </div>
  );
}
