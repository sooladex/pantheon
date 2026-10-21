import type { ArtistCard } from "@/lib/types";
import ArtistCardTile from "@/components/ArtistCardTile";

export default function ArtistWall({
  artists,
  scores,
}: {
  artists: ArtistCard[];
  scores?: Record<string, number>;
}) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
      {artists.map((a, i) => (
        <div
          key={`${a.kind}:${a.externalId}`}
          className="rise"
          style={{ animationDelay: `${Math.min(i * 35, 700)}ms` }}
        >
          <ArtistCardTile
            artist={a}
            score={scores?.[`${a.kind}:${a.externalId}`]}
            priority={i < 8}
          />
        </div>
      ))}
    </div>
  );
}
