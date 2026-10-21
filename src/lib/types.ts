export type ArtistKind = "screen" | "music";

/** Forme normalisee : un acteur TMDB et un chanteur Spotify rentrent dedans. */
export type ArtistCard = {
  kind: ArtistKind;
  externalId: string;
  name: string;
  imageUrl: string | null;
  role: string;
  tags: string[];
  popularity: number;
};

export type CreditItem = {
  id: string;
  title: string;
  subtitle: string;
  year: string | null;
  imageUrl: string | null;
};

export type ArtistDetail = ArtistCard & {
  bio: string;
  birthday: string | null;
  birthplace: string | null;
  /** Filmographie (screen) ou discographie (music). */
  credits: CreditItem[];
  externalUrl: string | null;
};

export type CommunityStats = {
  average: number | null;
  count: number;
  histogram: number[]; // 10 cases, score 1..10
};

export type ReviewItem = {
  id: number;
  score: number;
  review: string;
  favorite: boolean;
  createdAt: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};
