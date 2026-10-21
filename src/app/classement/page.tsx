import Link from "next/link";
import type { Metadata } from "next";
import { Stars } from "@/components/Stars";
import AdSlot from "@/components/AdSlot";
import { leaderboard } from "@/lib/social";
import { jsonLd, pageMetadata, absolute } from "@/lib/seo";
import type { ArtistCard } from "@/lib/types";

export const dynamic = "force-dynamic";

type Filter = "all" | "screen" | "music";

const LABELS: Record<Filter, string> = {
  all: "Tous les artistes",
  screen: "Écran",
  music: "Musique",
};

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: "Classement des artistes les mieux notés",
    description:
      "Le classement Panthéon des acteurs, actrices, chanteurs et groupes les mieux notés par la communauté. Moyenne pondérée : un seul 5/5 ne bat pas soixante 4,6/5.",
    path: "/classement",
  });
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const filter: Filter = type === "screen" || type === "music" ? type : "all";

  const ranked = await leaderboard(filter === "all" ? "all" : filter, 100).catch(() => []);

  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Classement Panthéon — ${LABELS[filter]}`,
    url: absolute("/classement"),
    numberOfItems: ranked.length,
    itemListElement: ranked.slice(0, 25).map((r, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absolute(`/artiste/${r.card.kind}/${r.card.externalId}`),
      name: r.card.name,
    })),
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />

      <p className="text-[11px] uppercase tracking-[0.3em] text-gold/80">Classement</p>
      <h1 className="mt-2 text-4xl font-black">Les mieux notés</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Moyenne pondérée : il faut convaincre plusieurs personnes, pas une seule.
        Un artiste noté 5/5 par un seul compte reste derrière un artiste noté
        4,6/5 par soixante.
      </p>

      <nav className="mt-6 flex gap-2">
        {(Object.keys(LABELS) as Filter[]).map((f) => (
          <Link
            key={f}
            href={f === "all" ? "/classement" : `/classement?type=${f}`}
            className={`rounded-full border px-4 py-1.5 text-xs transition ${
              filter === f
                ? "border-gold bg-gold/15 text-gold"
                : "border-edge text-muted hover:text-text"
            }`}
          >
            {LABELS[f]}
          </Link>
        ))}
      </nav>

      {ranked.length === 0 ? (
        <p className="mt-10 text-sm text-muted">
          Pas encore assez de notes pour établir un classement. Note quelques
          artistes et reviens.
        </p>
      ) : (
        <ol className="mt-8 space-y-2">
          {ranked.map((r, i) => (
            <RankRow key={`${r.card.kind}:${r.card.externalId}`} rank={i + 1} {...r} />
          ))}
        </ol>
      )}

      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_FOOTER} />
    </div>
  );
}

function RankRow({
  rank,
  card,
  average,
  count,
}: {
  rank: number;
  card: ArtistCard;
  average: number;
  count: number;
}) {
  return (
    <li>
      <Link
        href={`/artiste/${card.kind}/${card.externalId}`}
        className="flex items-center gap-4 rounded-xl border border-edge bg-surface/40 p-3 transition hover:border-gold/50"
      >
        <span
          className={`w-8 shrink-0 text-center text-lg font-black ${
            rank <= 3 ? "text-gold" : "text-edge"
          }`}
        >
          {rank}
        </span>

        {card.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.imageUrl}
            alt=""
            loading="lazy"
            className="h-16 w-12 shrink-0 rounded object-cover object-top"
          />
        ) : (
          <div className="h-16 w-12 shrink-0 rounded bg-surface" />
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{card.name}</p>
          <p className="truncate text-[11px] text-muted">
            {card.tags.slice(0, 2).join(" · ") || card.role}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <Stars score={Math.round(average * 2)} size={12} />
          <p className="mt-0.5 text-xs text-gold">{average.toFixed(1)}</p>
          <p className="text-[10px] text-muted">
            {count} note{count > 1 ? "s" : ""}
          </p>
        </div>
      </Link>
    </li>
  );
}
