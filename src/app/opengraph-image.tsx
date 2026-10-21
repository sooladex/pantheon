import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/seo";

export const runtime = "edge";
export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Carte de partage par défaut du site. */
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#08080b",
          backgroundImage:
            "radial-gradient(ellipse at top, rgba(217,164,65,0.22), transparent 62%)",
          color: "#eceaf2",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 20,
            letterSpacing: 18,
            color: "#d9a441",
            textTransform: "uppercase",
          }}
        >
          Le mur des visages
        </div>
        <div style={{ fontSize: 150, fontWeight: 900, letterSpacing: 6, marginTop: 16 }}>
          PANTHÉON
        </div>
        <div style={{ fontSize: 38, color: "#8f8da4", marginTop: 12 }}>{SITE_TAGLINE}</div>
        <div
          style={{
            display: "flex",
            gap: 14,
            marginTop: 52,
            fontSize: 22,
            color: "#8f8da4",
          }}
        >
          <span style={{ color: "#4cc9f0" }}>Acteurs</span>
          <span>·</span>
          <span style={{ color: "#f072b6" }}>Chanteurs</span>
          <span>·</span>
          <span>5 étoiles</span>
        </div>
      </div>
    ),
    size,
  );
}
