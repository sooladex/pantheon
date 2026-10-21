import Link from "next/link";
import type { ArtistCard } from "@/lib/types";
import { Stars } from "@/components/Stars";

const ACCENT: Record<ArtistCard["kind"], string> = {
  screen: "text-screen border-screen/40 bg-screen/10",
  music: "text-music border-music/40 bg-music/10",
};

const LABEL: Record<ArtistCard["kind"], string> = { screen: "Écran", music: "Musique" };

export default function ArtistCardTile({
  artist,
  score,
  priority = false,
}: {
  artist: ArtistCard;
  score?: number | null;
  priority?: boolean;
}) {
  return (
    <Link
      href={`/artiste/${artist.kind}/${artist.externalId}`}
      className="tilt-scene group block"
    >
      <div className="tilt sheen relative aspect-[2/3] overflow-hidden rounded-xl border border-edge bg-surface">
        {artist.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={artist.imageUrl}
            alt={artist.name}
            loading={priority ? "eager" : "lazy"}
            className="h-full w-full object-cover object-top transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-surface to-ink-2 text-4xl font-black text-edge">
            {artist.name.slice(0, 2).toUpperCase()}
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/25 to-transparent" />

        <span
          className={`absolute left-2 top-2 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] backdrop-blur ${ACCENT[artist.kind]}`}
        >
          {LABEL[artist.kind]}
        </span>

        <div className="tilt-layer absolute inset-x-0 bottom-0 p-3">
          <p className="truncate text-sm font-semibold leading-tight">{artist.name}</p>
          <p className="mt-0.5 truncate text-[11px] text-muted">
            {artist.tags.length ? artist.tags.slice(0, 2).join(" · ") : artist.role}
          </p>
          {typeof score === "number" && (
            <div className="mt-1.5">
              <Stars score={score} size={12} />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
