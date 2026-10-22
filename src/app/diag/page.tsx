// Page de diagnostic temporaire — a supprimer une fois Spotify repare.
// N'affiche jamais de valeur secrete.
import { searchMusicArtists, trendingMusicArtists } from "@/lib/spotify";

export const dynamic = "force-dynamic";

async function raw() {
  const id = process.env.SPOTIFY_CLIENT_ID ?? "";
  const secret = process.env.SPOTIFY_CLIENT_SECRET ?? "";
  const out: Record<string, unknown> = {
    id_longueur: id.length,
    secret_longueur: secret.length,
  };
  if (!id || !secret) return { ...out, etape: "variable vide" };

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  out.auth_http = res.status;
  if (!res.ok) return out;
  const { access_token } = (await res.json()) as { access_token: string };

  // Exactement les memes options que la lib de l'app (cache 6h)
  const url = new URL("https://api.spotify.com/v1/search");
  url.searchParams.set("q", "daft punk");
  url.searchParams.set("type", "artist");
  url.searchParams.set("limit", "3");
  try {
    const r2 = await fetch(url, {
      headers: { Authorization: `Bearer ${access_token}` },
      next: { revalidate: 60 * 60 * 6 },
    });
    out.search_avec_cache_http = r2.status;
    if (r2.ok) {
      const j = (await r2.json()) as { artists?: { items?: { name: string }[] } };
      out.search_avec_cache = (j.artists?.items ?? []).map((a) => a.name);
    }
  } catch (e) {
    out.search_avec_cache_exception = String(e);
  }
  return out;
}

async function viaLib() {
  const out: Record<string, unknown> = {};
  try {
    out.searchMusicArtists = (await searchMusicArtists("daft punk")).map((a) => a.name);
  } catch (e) {
    out.searchMusicArtists_erreur = String(e);
  }
  try {
    out.trendingMusicArtists_nb = (await trendingMusicArtists()).length;
  } catch (e) {
    out.trendingMusicArtists_erreur = String(e);
  }
  return out;
}

export default async function DiagPage() {
  const [a, b] = await Promise.all([
    raw().catch((e) => ({ raw_erreur: String(e) })),
    viaLib(),
  ]);
  return (
    <pre style={{ padding: 24, fontSize: 14, whiteSpace: "pre-wrap" }}>
      {JSON.stringify({ brut: a, via_lib: b }, null, 2)}
    </pre>
  );
}
