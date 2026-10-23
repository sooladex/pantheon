import type { ArtistCard, ArtistDetail, CreditItem } from "@/lib/types";

const BASE = "https://api.spotify.com/v1";

export function spotifyConfigured() {
  return Boolean(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET);
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function token(): Promise<string> {
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) throw new Error("Identifiants Spotify manquants");

  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.value;

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Spotify auth ${res.status}`);

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.value;
}

async function spotify<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${await token()}` },
    next: { revalidate: 60 * 60 * 6 },
  });
  if (!res.ok) throw new Error(`Spotify ${res.status} sur ${path}`);
  return res.json() as Promise<T>;
}

type SpotifyArtist = {
  id: string;
  name: string;
  images?: { url: string; width: number }[];
  genres?: string[];
  popularity?: number;
  followers?: { total: number };
  external_urls?: { spotify?: string };
};

function biggestImage(a: SpotifyArtist) {
  const imgs = [...(a.images ?? [])].sort((x, y) => (y.width ?? 0) - (x.width ?? 0));
  return imgs[0]?.url ?? null;
}

function toCard(a: SpotifyArtist): ArtistCard {
  return {
    kind: "music",
    externalId: a.id,
    name: a.name,
    imageUrl: biggestImage(a),
    role: "Musique",
    tags: (a.genres ?? []).slice(0, 3),
    popularity: a.popularity ?? 0,
  };
}

export async function searchMusicArtists(query: string): Promise<ArtistCard[]> {
  if (!spotifyConfigured() || !query.trim()) return [];
  const data = await spotify<{ artists: { items: SpotifyArtist[] } }>("/search", {
    q: query,
    type: "artist",
    // Spotify plafonne "limit" a 10 pour les apps en client_credentials.
    limit: "10",
  });
  return data.artists.items.map(toCard);
}

/**
 * Spotify n'expose pas de "top artistes mondiaux" en client_credentials.
 * On passe par une playlist editoriale large et on deduit les artistes.
 */
export async function trendingMusicArtists(): Promise<ArtistCard[]> {
  if (!spotifyConfigured()) return [];
  try {
    const seeds = ["a", "e", "i", "o", "u", "s"];
    const seen = new Map<string, ArtistCard>();
    for (const s of seeds) {
      const data = await spotify<{ artists: { items: SpotifyArtist[] } }>("/search", {
        q: s,
        type: "artist",
        limit: "10",
      });
      for (const a of data.artists.items) {
        if (!seen.has(a.id)) seen.set(a.id, toCard(a));
      }
    }
    return [...seen.values()].sort((a, b) => b.popularity - a.popularity).slice(0, 18);
  } catch {
    return [];
  }
}

export async function getMusicArtist(id: string): Promise<ArtistDetail | null> {
  if (!spotifyConfigured()) return null;

  const artist = await spotify<SpotifyArtist>(`/artists/${id}`);
  // Spotify plafonne "limit" a 10 : on pagine pour garder une discographie fournie.
  type AlbumPage = {
    items: { id: string; name: string; album_type: string; release_date: string; images?: { url: string }[] }[];
  };
  const pages = await Promise.all(
    ["0", "10", "20"].map((offset) =>
      spotify<AlbumPage>(`/artists/${id}/albums`, {
        include_groups: "album,single",
        limit: "10",
        offset,
      }).catch(() => ({ items: [] }) as AlbumPage),
    ),
  );
  const albumItems = pages.flatMap((p) => p.items);

  const seen = new Set<string>();
  const credits: CreditItem[] = [];
  for (const al of albumItems) {
    const key = al.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    credits.push({
      id: al.id,
      title: al.name,
      subtitle: al.album_type === "single" ? "Single" : "Album",
      year: al.release_date ? al.release_date.slice(0, 4) : null,
      imageUrl: al.images?.[0]?.url ?? null,
    });
  }
  credits.sort((a, b) => Number(b.year ?? 0) - Number(a.year ?? 0));

  const followers = artist.followers?.total ?? 0;
  const bio = followers
    ? `${new Intl.NumberFormat("fr-FR").format(followers)} auditeurs suivent cet artiste sur Spotify.`
    : "";

  return {
    ...toCard(artist),
    bio,
    birthday: null,
    birthplace: null,
    credits: credits.slice(0, 24),
    externalUrl: artist.external_urls?.spotify ?? null,
  };
}
