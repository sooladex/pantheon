import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type DB = NeonHttpDatabase<typeof schema>;

let instance: DB | null = null;

function connect(): DB {
  if (instance) return instance;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL manquant : copie .env.example vers .env.local et renseigne ta base Neon.",
    );
  }

  instance = drizzle(neon(url), { schema });
  return instance;
}

/**
 * Connexion paresseuse : on ne touche a Neon qu'au premier appel reel.
 * Sans ca, `next build` planterait en collectant les routes API, faute
 * d'avoir DATABASE_URL a ce moment-la.
 */
export const db = new Proxy({} as DB, {
  get(_target, prop, receiver) {
    return Reflect.get(connect() as object, prop, receiver);
  },
});

export { schema };
