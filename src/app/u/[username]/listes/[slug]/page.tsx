import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import ArtistWall from "@/components/ArtistWall";
import ShareButton from "@/components/ShareButton";
import AdSlot from "@/components/AdSlot";
import { fetchList } from "@/lib/social";
import { absolute, jsonLd, pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string; slug: string }>;
}): Promise<Metadata> {
  const { username, slug } = await params;
  const list = await fetchList(username, slug).catch(() => null);

  if (!list) return { title: "Liste introuvable", robots: { index: false, follow: false } };

  const names = list.items.slice(0, 5).map((i) => i.card.name).join(", ");

  return pageMetadata({
    title: `${list.title} — une liste de ${list.displayName}`,
    description:
      list.description ||
      `Une sélection de ${list.items.length} artistes par ${list.displayName} sur Panthéon${names ? ` : ${names}` : ""}.`,
    path: `/u/${list.username}/listes/${list.slug}`,
    noIndex: !list.isPublic,
  });
}

export default async function ListPage({
  params,
}: {
  params: Promise<{ username: string; slug: string }>;
}) {
  const { username, slug } = await params;
  const list = await fetchList(username, slug).catch(() => null);

  if (!list || !list.isPublic) notFound();

  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: list.title,
    description: list.description,
    url: absolute(`/u/${list.username}/listes/${list.slug}`),
    numberOfItems: list.items.length,
    itemListElement: list.items.slice(0, 50).map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.card.name,
      url: absolute(`/artiste/${it.card.kind}/${it.card.externalId}`),
    })),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />

      <header className="border-b border-edge/60 pb-8">
        <p className="text-[11px] uppercase tracking-[0.3em] text-gold/80">Liste</p>
        <h1 className="mt-2 text-4xl font-black">{list.title}</h1>
        <p className="mt-2 text-sm text-muted">
          {list.items.length} artiste{list.items.length > 1 ? "s" : ""} · par{" "}
          <Link href={`/u/${list.username}`} className="hover:text-gold">
            {list.displayName}
          </Link>
        </p>
        {list.description && (
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">{list.description}</p>
        )}
        <div className="mt-5">
          <ShareButton title={`${list.title} — Panthéon`} text={list.description} />
        </div>
      </header>

      <div className="mt-8">
        {list.items.length === 0 ? (
          <p className="text-sm text-muted">Cette liste est encore vide.</p>
        ) : (
          <ArtistWall artists={list.items.map((i) => i.card)} />
        )}
      </div>

      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_FOOTER} />
    </div>
  );
}
