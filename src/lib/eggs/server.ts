import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { eggSightings, eggTargets, users } from "@/lib/db/schema";
import { EASTER_EGGS, effectiveRarity, type EasterEgg, type EggTrigger } from "@/lib/eggs/registry";

const TMDB = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p/w342";

/** Ce que le client reçoit : l'œuf, ses cibles résolues, sa probabilité du moment. */
export type ArmedEgg = {
  id: string;
  label: string;
  effect: EasterEgg["effect"];
  triggers: EggTrigger[];
  duration: number;
  chance: number;
  /** Identifiants TMDB des personnes concernées, résolus par l'API. */
  personIds: string[];
  /** Portrait de la personne concernée par la fiche en cours, s'il y en a une. */
  portraitUrl: string | null;
  /** Nom de la personne concernée, pour les effets qui l'affichent. */
  personName: string | null;
  workTitle: string;
  workYear: number | null;
};

/**
 * Résout un nom en identifiant TMDB, une seule fois, puis garde le
 * résultat en base. Sans clé TMDB, la résolution renvoie null et les
 * œufs restent simplement inactifs — jamais d'erreur visible.
 */
async function resolvePerson(eggId: string, name: string) {
  const [cached] = await db
    .select()
    .from(eggTargets)
    .where(and(eq(eggTargets.eggId, eggId), eq(eggTargets.kind, "person"), eq(eggTargets.query, name)))
    .limit(1);

  if (cached) return cached;

  const key = process.env.TMDB_API_KEY;
  if (!key) return null;

  try {
    const url = new URL(`${TMDB}/search/person`);
    url.searchParams.set("api_key", key);
    url.searchParams.set("query", name);
    url.searchParams.set("include_adult", "false");

    const res = await fetch(url, { next: { revalidate: 60 * 60 * 24 * 30 } });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      results?: { id: number; name: string; profile_path: string | null; popularity?: number }[];
    };

    // On prend la correspondance exacte la plus populaire : "Tom Hanks"
    // ne doit pas tomber sur un homonyme obscur.
    const exact = (data.results ?? [])
      .filter((r) => r.name.toLowerCase() === name.toLowerCase())
      .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));

    const hit = exact[0] ?? data.results?.[0];
    if (!hit) return null;

    const [row] = await db
      .insert(eggTargets)
      .values({
        eggId,
        kind: "person",
        query: name,
        tmdbId: String(hit.id),
        imageUrl: hit.profile_path ? `${IMG}${hit.profile_path}` : null,
      })
      .onConflictDoUpdate({
        target: [eggTargets.eggId, eggTargets.kind, eggTargets.query],
        set: {
          tmdbId: String(hit.id),
          imageUrl: hit.profile_path ? `${IMG}${hit.profile_path}` : null,
          resolvedAt: new Date(),
        },
      })
      .returning();

    return row;
  } catch {
    return null;
  }
}

/** L'utilisateur a-t-il laissé les surprises activées ? */
export async function surprisesEnabled(userId: number | null) {
  if (!userId) return true; // visiteur : les œufs sans compte restent possibles
  try {
    const [row] = await db
      .select({ on: users.surprisesEnabled })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return row?.on ?? true;
  } catch {
    return true;
  }
}

/**
 * Prépare les œufs pertinents pour une fiche artiste donnée.
 * Si `tmdbPersonId` est fourni, seuls les œufs liés à cette personne
 * sortent — c'est ce qui rend la surprise spécifique plutôt que générique.
 */
export async function armEggs(opts: {
  userId: number | null;
  tmdbPersonId?: string | null;
  personName?: string | null;
}): Promise<ArmedEgg[]> {
  const { userId, tmdbPersonId = null, personName = null } = opts;

  if (!(await surprisesEnabled(userId))) return [];
  if (!process.env.TMDB_API_KEY) return [];

  // Combien de fois cet utilisateur a déjà vu chaque œuf.
  const seen = new Map<string, number>();
  if (userId) {
    try {
      const rows = await db
        .select({ eggId: eggSightings.eggId, n: eggSightings.seenCount })
        .from(eggSightings)
        .where(
          and(
            eq(eggSightings.userId, userId),
            inArray(eggSightings.eggId, EASTER_EGGS.map((e) => e.id)),
          ),
        );
      for (const r of rows) seen.set(r.eggId, r.n);
    } catch {
      /* base indisponible : on considère que rien n'a été vu */
    }
  }

  const today = new Date();
  const mmdd = `${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const armed: ArmedEgg[] = [];

  for (const egg of EASTER_EGGS) {
    const targets = await Promise.all(egg.people.map((n) => resolvePerson(egg.id, n)));
    const resolved = targets.filter((t): t is NonNullable<typeof t> => Boolean(t?.tmdbId));
    const personIds = resolved.map((t) => t.tmdbId!).filter(Boolean);

    if (personIds.length === 0) continue;

    // Œuf lié à une personne : il ne sort que sur la bonne fiche.
    if (tmdbPersonId && !personIds.includes(String(tmdbPersonId))) continue;

    if (egg.triggers.includes("date") && egg.day && egg.day !== mmdd) continue;

    const match = tmdbPersonId ? resolved.find((t) => t.tmdbId === String(tmdbPersonId)) : null;

    armed.push({
      id: egg.id,
      label: egg.label,
      effect: egg.effect,
      triggers: egg.triggers,
      duration: egg.duration,
      chance: effectiveRarity(egg.rarity, seen.get(egg.id) ?? 0),
      personIds,
      portraitUrl: match?.imageUrl ?? null,
      personName: match ? match.query : personName,
      workTitle: egg.work.query,
      workYear: egg.work.year ?? null,
    });
  }

  return armed;
}

/** Enregistre qu'un œuf a été vu : il reviendra moins souvent. */
export async function recordSighting(userId: number, eggId: string) {
  if (!EASTER_EGGS.some((e) => e.id === eggId)) return;

  await db
    .insert(eggSightings)
    .values({ userId, eggId })
    .onConflictDoUpdate({
      target: [eggSightings.userId, eggSightings.eggId],
      set: {
        seenCount: sql`${eggSightings.seenCount} + 1`,
        lastSeenAt: new Date(),
      },
    });
}
