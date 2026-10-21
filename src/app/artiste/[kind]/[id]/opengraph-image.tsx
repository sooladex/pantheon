import { ImageResponse } from "next/og";
import { getArtistDetail } from "@/lib/artists";

export const runtime = "nodejs";
export const alt = "Fiche artiste sur Panthéon";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Carte de partage d'un artiste : portrait à gauche, nom à droite.
 * Si l'API externe ne répond pas, on dégrade vers une carte générique
 * plutôt que de renvoyer une erreur (une OG cassée casse le partage).
 */
export default async function Image({
  params,
}: {
  params: { kind: string; id: string };
}) {
  const artist = await getArtistDetail(params.kind, params.id).catch(() => null);

  const accent = params.kind === "music" ? "#f072b6" : "#4cc9f0";
  const label = params.kind === "music" ? "MUSIQUE" : "ÉCRAN";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#08080b",
          color: "#eceaf2",
          fontFamily: "sans-serif",
        }}
      >
        {artist?.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={artist.imageUrl}
            alt=""
            width={420}
            height={630}
            style={{ objectFit: "cover", objectPosition: "top" }}
          />
        ) : (
          <div style={{ width: 420, height: 630, background: "#14141d", display: "flex" }} />
        )}

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 64px",
          }}
        >
          <div style={{ fontSize: 20, letterSpacing: 10, color: accent }}>{label}</div>
          <div
            style={{
              fontSize: artist && artist.name.length > 18 ? 66 : 88,
              fontWeight: 900,
              lineHeight: 1.05,
              marginTop: 18,
            }}
          >
            {artist?.name ?? "Panthéon"}
          </div>
          {artist?.tags?.length ? (
            <div style={{ fontSize: 26, color: "#8f8da4", marginTop: 20 }}>
              {artist.tags.slice(0, 3).join(" · ")}
            </div>
          ) : null}
          <div
            style={{
              fontSize: 22,
              color: "#d9a441",
              marginTop: 48,
              letterSpacing: 6,
              textTransform: "uppercase",
            }}
          >
            Noté sur Panthéon
          </div>
        </div>
      </div>
    ),
    size,
  );
}
