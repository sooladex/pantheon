import Link from "next/link";
import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth";
import { fetchReviews } from "@/lib/social";
import ReviewCard from "@/components/ReviewCard";
import AdSlot from "@/components/AdSlot";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export const metadata: Metadata = pageMetadata({
  title: "Critiques d'artistes publiées par la communauté",
  description:
    "Les dernières critiques d'acteurs, actrices, chanteurs et groupes écrites par la communauté Panthéon.",
  path: "/critiques",
});

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string; suivis?: string }>;
}) {
  const { p, suivis } = await searchParams;
  const page = Math.max(1, Number(p) || 1);
  const user = await getSessionUser();
  const onlyFollowing = suivis === "1" && Boolean(user);

  const reviews = await fetchReviews(
    onlyFollowing && user ? { kind: "following", userId: user.id } : { kind: "all" },
    {
      viewerId: user?.id,
      limit: PAGE_SIZE + 1,
      offset: (page - 1) * PAGE_SIZE,
      withTextOnly: true,
    },
  ).catch(() => []);

  const hasNext = reviews.length > PAGE_SIZE;
  const shown = reviews.slice(0, PAGE_SIZE);

  const base = onlyFollowing ? "/critiques?suivis=1&" : "/critiques?";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-[11px] uppercase tracking-[0.3em] text-gold/80">Communauté</p>
      <h1 className="mt-2 text-4xl font-black">Critiques</h1>

      {user && (
        <nav className="mt-5 flex gap-2">
          <Link
            href="/critiques"
            className={`rounded-full border px-4 py-1.5 text-xs transition ${
              onlyFollowing
                ? "border-edge text-muted hover:text-text"
                : "border-gold bg-gold/15 text-gold"
            }`}
          >
            Tout le monde
          </Link>
          <Link
            href="/critiques?suivis=1"
            className={`rounded-full border px-4 py-1.5 text-xs transition ${
              onlyFollowing
                ? "border-gold bg-gold/15 text-gold"
                : "border-edge text-muted hover:text-text"
            }`}
          >
            Mes abonnements
          </Link>
        </nav>
      )}

      {shown.length === 0 ? (
        <p className="mt-10 text-sm text-muted">
          {onlyFollowing
            ? "Les gens que tu suis n'ont encore rien publié. Suis quelques profils depuis les critiques publiques."
            : "Aucune critique publiée pour l'instant."}
        </p>
      ) : (
        <div className="mt-8 space-y-4">
          {shown.map((r, i) => (
            <div key={r.id}>
              <ReviewCard review={r} signedIn={Boolean(user)} />
              {i === 6 && <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_FEED} format="fluid" />}
            </div>
          ))}
        </div>
      )}

      {(page > 1 || hasNext) && (
        <nav className="mt-10 flex items-center justify-between text-xs">
          {page > 1 ? (
            <Link
              href={`${base}p=${page - 1}`}
              className="rounded-full border border-edge px-4 py-2 transition hover:border-gold hover:text-gold"
            >
              ← Plus récentes
            </Link>
          ) : (
            <span />
          )}
          <span className="text-muted">Page {page}</span>
          {hasNext ? (
            <Link
              href={`${base}p=${page + 1}`}
              className="rounded-full border border-edge px-4 py-2 transition hover:border-gold hover:text-gold"
            >
              Plus anciennes →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
