import type { ArtistCard, ArtistDetail, CreditItem } from "@/lib/types";

const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";

export function tmdbConfigured() {
  return Boolean(process.env.TMDB_API_KEY);
}

async function tmdb<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error("TMDB_API_KEY manquant");

  const url = new URL(BASE + path);
  url.searchParams.set("api_key", key);
  url.searchParams.set("language", "fr-FR");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url, { next: { revalidate: 60 * 60 * 6 } });
  if (!res.ok) throw new Error(`TMDB ${res.status} sur ${path}`);
  return res.json() as Promise<T>;
}

type TmdbPerson = {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department?: string | null;
  popularity?: number;
  biography?: string;
  birthday?: string | null;
  place_of_birth?: string | null;
  gender?: number;
  known_for?: { title?: string; name?: string }[];
};

const DEPARTMENTS: Record<string, string> = {
  Acting: "Acteur",
  Directing: "Realisation",
  Writing: "Scenario",
  Production: "Production",
  Sound: "Musique de film",
};

function toCard(p: TmdbPerson): ArtistCard {
  const known = (p.known_for ?? [])
    .map((k) => k.title ?? k.name)
    .filter((x): x is string => Boolean(x))
    .slice(0, 3);

  return {
    kind: "screen",
    externalId: String(p.id),
    name: p.name,
    imageUrl: p.profile_path ? `${IMG}/w500${p.profile_path}` : null,
    role: DEPARTMENTS[p.known_for_department ?? ""] ?? "Ecran",
    tags: known,
    popularity: Math.round(p.popularity ?? 0),
  };
}

export async function searchScreenArtists(query: string): Promise<ArtistCard[]> {
  if (!tmdbConfigured() || !query.trim()) return [];
  const data = await tmdb<{ results: TmdbPerson[] }>("/search/person", {
    query,
    include_adult: "false",
  });
  return data.results.slice(0, 12).map(toCard);
}

export async function trendingScreenArtists(): Promise<ArtistCard[]> {
  if (!tmdbConfigured()) return [];
  const data = await tmdb<{ results: TmdbPerson[] }>("/person/popular");
  return data.results.slice(0, 18).map(toCard);
}

export async function getScreenArtist(id: string): Promise<ArtistDetail | null> {
  if (!tmdbConfigured()) return null;

  const person = await tmdb<TmdbPerson>(`/person/${id}`);
  const credits = await tmdb<{
    cast: { id: number; title?: string; name?: string; character?: string; release_date?: string; first_air_date?: string; poster_path: string | null; vote_count?: number }[];
  }>(`/person/${id}/combined_credits`);

  const items: CreditItem[] = (credits.cast ?? [])
    .sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0))
    .slice(0, 24)
    .map((c) => {
      const date = c.release_date || c.first_air_date || "";
      return {
        id: String(c.id),
        title: c.title ?? c.name ?? "Sans titre",
        subtitle: c.character ? `dans le role de ${c.character}` : "",
        year: date ? date.slice(0, 4) : null,
        imageUrl: c.poster_path ? `${IMG}/w342${c.poster_path}` : null,
      };
    });

  return {
    ...toCard(person),
    bio: person.biography?.trim() || "",
    birthday: person.birthday ?? null,
    birthplace: person.place_of_birth ?? null,
    credits: items,
    externalUrl: `https://www.themoviedb.org/person/${id}`,
  };
}
