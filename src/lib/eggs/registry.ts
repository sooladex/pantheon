/* ------------------------------------------------------------------ *
 *  Registre des easter eggs.
 *
 *  Règle absolue : aucun identifiant TMDB n'est écrit ici. Chaque œuf
 *  déclare ce qu'il faut CHERCHER (un titre, une personne) ; la
 *  résolution passe par l'API TMDB et le résultat est mis en cache en
 *  base. Un identifiant deviné finirait par pointer sur la mauvaise
 *  œuvre le jour où TMDB réorganise son catalogue.
 *
 *  Panthéon note des PERSONNES. Un œuf lié à un film se déclenche donc
 *  sur les fiches des gens qui l'ont fait.
 * ------------------------------------------------------------------ */

export type EggTrigger =
  | "on_open"   // ouverture d'une fiche artiste
  | "on_rate"   // au moment de poser une note
  | "on_log"    // à la publication d'une critique
  | "on_save"   // pendant l'enregistrement
  | "tap_x3"    // trois tapes rapides sur le portrait
  | "konami"    // la séquence du Konami Code
  | "date"      // une date précise dans l'année
  | "random";   // au hasard, selon la rareté

export type EggKind = "movie" | "tv" | "album" | "person";

/** Clé du composant d'effet, chargé en lazy au moment du déclenchement. */
export type EggEffect =
  | "beetlejuice"
  | "one-battle"
  | "coraline"
  | "inception"
  | "catch-me"
  | "matrix"
  | "shining"
  | "back-to-the-future";

export type EasterEgg = {
  id: string;
  /** Titre affiché dans les réglages, pour que l'utilisateur sache ce qu'il coupe. */
  label: string;
  /** L'œuvre de référence : cherchée par titre + année, jamais par identifiant. */
  work: { kind: EggKind; query: string; year?: number };
  /** Les artistes sur lesquels l'œuf se déclenche, cherchés par nom. */
  people: string[];
  triggers: EggTrigger[];
  effect: EggEffect;
  /** Durée de l'effet en millisecondes. */
  duration: number;
  /** Probabilité de base, entre 0 et 1. */
  rarity: number;
  /** Jour de déclenchement pour les œufs "date" : "MM-JJ". */
  day?: string;
};

export const EASTER_EGGS: EasterEgg[] = [
  {
    id: "beetlejuice",
    label: "Rayures",
    work: { kind: "movie", query: "Beetlejuice", year: 1988 },
    people: ["Michael Keaton", "Winona Ryder", "Catherine O'Hara", "Tim Burton"],
    triggers: ["tap_x3"],
    effect: "beetlejuice",
    duration: 5000,
    rarity: 1,
  },
  {
    id: "one-battle",
    label: "Alerte amicale",
    work: { kind: "movie", query: "One Battle After Another", year: 2025 },
    people: ["Leonardo DiCaprio", "Paul Thomas Anderson", "Sean Penn", "Benicio del Toro"],
    triggers: ["on_log"],
    effect: "one-battle",
    duration: 0, // la modale attend une réponse, puis se ferme
    rarity: 0.9,
  },
  {
    id: "coraline",
    label: "Boutons cousus",
    work: { kind: "movie", query: "Coraline", year: 2009 },
    people: ["Dakota Fanning", "Henry Selick", "Teri Hatcher", "Keith David"],
    triggers: ["on_open", "on_rate"],
    effect: "coraline",
    duration: 3600, // le bandeau s'efface ; les boutons cousus restent
    rarity: 0.85,
  },
  {
    id: "inception",
    label: "Toupie",
    work: { kind: "movie", query: "Inception", year: 2010 },
    people: ["Leonardo DiCaprio", "Christopher Nolan", "Marion Cotillard", "Joseph Gordon-Levitt"],
    triggers: ["on_save"],
    effect: "inception",
    duration: 6500,
    rarity: 0.8,
  },
  {
    id: "catch-me",
    label: "Avis de recherche",
    work: { kind: "movie", query: "Catch Me If You Can", year: 2002 },
    people: ["Leonardo DiCaprio", "Tom Hanks", "Steven Spielberg", "Christopher Walken"],
    triggers: ["on_log"],
    effect: "catch-me",
    duration: 7000,
    rarity: 0.75,
  },
  {
    id: "matrix",
    label: "Pilule",
    work: { kind: "movie", query: "The Matrix", year: 1999 },
    people: ["Keanu Reeves", "Laurence Fishburne", "Carrie-Anne Moss", "Lana Wachowski"],
    triggers: ["on_log"],
    effect: "matrix",
    duration: 3000,
    rarity: 0.7,
  },
  {
    id: "shining",
    label: "Fissure",
    work: { kind: "movie", query: "The Shining", year: 1980 },
    people: ["Jack Nicholson", "Shelley Duvall", "Stanley Kubrick"],
    triggers: ["on_open"],
    effect: "shining",
    duration: 2600,
    rarity: 0.55,
  },
  {
    id: "back-to-the-future",
    label: "88 mph",
    work: { kind: "movie", query: "Back to the Future", year: 1985 },
    people: ["Michael J. Fox", "Christopher Lloyd", "Robert Zemeckis", "Lea Thompson"],
    triggers: ["on_log"],
    effect: "back-to-the-future",
    duration: 4200,
    rarity: 0.7,
  },
];

export function eggById(id: string) {
  return EASTER_EGGS.find((e) => e.id === id) ?? null;
}

/**
 * Un œuf déjà vu revient, mais plus rarement : la probabilité est
 * divisée par deux à chaque apparition, avec un plancher à 5 %.
 */
export function effectiveRarity(base: number, seenCount: number) {
  if (seenCount <= 0) return base;
  return Math.max(0.05, base / Math.pow(2, seenCount));
}
