import {
  pgTable,
  text,
  integer,
  timestamp,
  uniqueIndex,
  index,
  smallint,
  serial,
  boolean,
} from "drizzle-orm/pg-core";

/**
 * Un "artiste" est une PERSONNE : un acteur (source TMDB) ou un
 * chanteur / groupe (source Spotify). On ne note pas les oeuvres,
 * on note la personne et sa carriere.
 */
export const artistKinds = ["screen", "music"] as const;
export type ArtistKind = (typeof artistKinds)[number];

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    username: text("username").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    displayName: text("display_name").notNull(),
    bio: text("bio").notNull().default(""),
    avatarUrl: text("avatar_url"),
    /** Interrupteur "Surprises" des parametres — active par defaut. */
    surprisesEnabled: boolean("surprises_enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("users_username_uq").on(t.username),
    uniqueIndex("users_email_uq").on(t.email),
  ],
);

/**
 * Cache local des artistes ramenes de TMDB / Spotify.
 * Evite de re-taper les APIs a chaque affichage d'un mur.
 */
export const artists = pgTable(
  "artists",
  {
    id: serial("id").primaryKey(),
    kind: text("kind").$type<ArtistKind>().notNull(),
    externalId: text("external_id").notNull(),
    name: text("name").notNull(),
    imageUrl: text("image_url"),
    // "Acteur", "Chanteuse", "Groupe"...
    role: text("role").notNull().default(""),
    // genres musicaux ou departement TMDB, separes par des virgules
    tags: text("tags").notNull().default(""),
    popularity: integer("popularity").notNull().default(0),
    refreshedAt: timestamp("refreshed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("artists_source_uq").on(t.kind, t.externalId),
    index("artists_name_idx").on(t.name),
  ],
);

/**
 * La note d'un utilisateur sur un artiste : 1 a 10 (= 0.5 a 5 etoiles),
 * plus une critique optionnelle. Une seule note par couple user/artiste,
 * comme sur Letterboxd.
 */
export const ratings = pgTable(
  "ratings",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    artistId: integer("artist_id").notNull().references(() => artists.id, { onDelete: "cascade" }),
    score: smallint("score").notNull(),
    review: text("review").notNull().default(""),
    favorite: boolean("favorite").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("ratings_user_artist_uq").on(t.userId, t.artistId),
    index("ratings_artist_idx").on(t.artistId),
    index("ratings_recent_idx").on(t.createdAt),
  ],
);

/** Suivre un artiste sans forcement le noter (watchlist facon Letterboxd). */
export const follows = pgTable(
  "follows",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    artistId: integer("artist_id").notNull().references(() => artists.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("follows_user_artist_uq").on(t.userId, t.artistId)],
);

export type User = typeof users.$inferSelect;
export type Artist = typeof artists.$inferSelect;
export type Rating = typeof ratings.$inferSelect;

/* ------------------------------------------------------------------ *
 *  Couche sociale : on suit des gens, on aime leurs critiques,
 *  on range les artistes dans des listes.
 * ------------------------------------------------------------------ */

/** Un utilisateur suit un autre utilisateur (asymetrique, facon Letterboxd). */
export const userFollows = pgTable(
  "user_follows",
  {
    id: serial("id").primaryKey(),
    followerId: integer("follower_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    followingId: integer("following_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("user_follows_uq").on(t.followerId, t.followingId),
    index("user_follows_following_idx").on(t.followingId),
  ],
);

/** Like sur une critique. */
export const reviewLikes = pgTable(
  "review_likes",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    ratingId: integer("rating_id").notNull().references(() => ratings.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("review_likes_uq").on(t.userId, t.ratingId),
    index("review_likes_rating_idx").on(t.ratingId),
  ],
);

/** Liste thematique : "Les meilleurs seconds roles", "Voix des annees 90"... */
export const lists = pgTable(
  "lists",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    isPublic: boolean("is_public").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("lists_user_slug_uq").on(t.userId, t.slug),
    index("lists_recent_idx").on(t.createdAt),
  ],
);

export const listItems = pgTable(
  "list_items",
  {
    id: serial("id").primaryKey(),
    listId: integer("list_id").notNull().references(() => lists.id, { onDelete: "cascade" }),
    artistId: integer("artist_id").notNull().references(() => artists.id, { onDelete: "cascade" }),
    note: text("note").notNull().default(""),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("list_items_uq").on(t.listId, t.artistId),
    index("list_items_order_idx").on(t.listId, t.position),
  ],
);

export type UserFollow = typeof userFollows.$inferSelect;
export type ReviewLike = typeof reviewLikes.$inferSelect;
export type ArtistList = typeof lists.$inferSelect;
export type ListItem = typeof listItems.$inferSelect;

/* ------------------------------------------------------------------ *
 *  Easter eggs : de petites surprises liées à une œuvre précise.
 *  On ne stocke jamais d'identifiant TMDB en dur dans le code : il est
 *  resolu via l'API puis mis en cache ici.
 * ------------------------------------------------------------------ */

/** Cache de resolution : "Leonardo DiCaprio" -> identifiant TMDB. */
export const eggTargets = pgTable(
  "egg_targets",
  {
    id: serial("id").primaryKey(),
    eggId: text("egg_id").notNull(),
    /** "person" | "movie" | "tv" | "album" */
    kind: text("kind").notNull(),
    query: text("query").notNull(),
    tmdbId: text("tmdb_id"),
    /** Photo de profil, utile aux effets qui affichent un visage. */
    imageUrl: text("image_url"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("egg_targets_uq").on(t.eggId, t.kind, t.query)],
);

/** Un œuf deja vu revient, mais plus rarement. */
export const eggSightings = pgTable(
  "egg_sightings",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    eggId: text("egg_id").notNull(),
    seenCount: integer("seen_count").notNull().default(1),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("egg_sightings_uq").on(t.userId, t.eggId)],
);

export type EggTarget = typeof eggTargets.$inferSelect;
export type EggSighting = typeof eggSightings.$inferSelect;
