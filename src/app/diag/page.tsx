// Page de diagnostic temporaire — a supprimer une fois Spotify repare.
import { searchMusicArtists, trendingMusicArtists } from "@/lib/spotify";

export const dynamic = "force-dynamic";

async function token() {
  const id = process.env.SPOTIFY_CLIENT_ID ?? "";
  const secret = process.env.SPOTIFY_CLIENT_SECRET ?? "";
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) throw new Error("auth " + res.status);
  const j = (await res.json()) as { access_token: string };
  return j.access_token;
}

/** Rejoue exactement les 4 appels de trendingMusicArtists, un par un. */
async function seeds() {
  const t = await token();
  const out: Record<string, unknown>[] = [];
  for (const s of ["a", "e", "i", "o"]) {
    const url = new URL("https://api.spotify.com/v1/search");
    url.searchParams.set("q", s);
    url.searchParams.set("type", "artist");
    url.searchParams.set("limit", "20");
    try {
      const r = await fetch(url, {
        headers: { Authorization: `Bearer ${t}` },
        next: { revalidate: 60 * 60 * 6 },
      });
      const row: Record<string, unknown> = { seed: s, http: r.status };
      if (!r.ok) {
        row.corps = (await r.text()).slice(0, 200);
      } else {
        const j = (await r.json()) as { artists?: { items?: { name: string }[] } };
        row.nb = (j.artists?.items ?? []).length;
        row.premier = j.artists?.items?.[0]?.name ?? null;
      }
      out.push(row);
    } catch (e) {
      out.push({ seed: s, exception: String(e) });
    }
  }
  return out;
}

export default async function DiagPage() {
  const data: Record<string, unknown> = {};
  try {
    data.seeds = await seeds();
  } catch (e) {
    data.seeds_erreur = String(e);
  }
  try {
    data.trending_nb = (await trendingMusicArtists()).length;
  } catch (e) {
    data.trending_erreur = String(e);
  }
  try {
    data.search_ok = (await searchMusicArtists("daft punk")).length;
  } catch (e) {
    data.search_erreur = String(e);
  }
  return (
    <pre style={{ padding: 24, fontSize: 14, whiteSpace: "pre-wrap" }}>
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
