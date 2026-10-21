import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { listItems, lists } from "@/lib/db/schema";
import { requireUser, UnauthorizedError } from "@/lib/auth";
import { upsertArtist } from "@/lib/artists";
import { slugify } from "@/lib/social";

const ArtistInput = z.object({
  kind: z.enum(["screen", "music"]),
  externalId: z.string().min(1),
  name: z.string().min(1),
  imageUrl: z.string().nullable(),
  role: z.string().default(""),
  tags: z.array(z.string()).default([]),
  popularity: z.number().default(0),
});

const CreateBody = z.object({
  title: z.string().min(1).max(80),
  description: z.string().max(500).default(""),
  isPublic: z.boolean().default(true),
  /** Optionnel : on crée la liste et on y met tout de suite un artiste. */
  artist: ArtistInput.optional(),
});

const ItemBody = z.object({
  listId: z.number().int().positive(),
  artist: ArtistInput,
  included: z.boolean(),
  note: z.string().max(280).default(""),
});

/** Crée une liste. Le slug est dérivé du titre, suffixé en cas de collision. */
export async function POST(req: Request) {
  try {
    const me = await requireUser();
    const parsed = CreateBody.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Donnees invalides" },
        { status: 400 },
      );
    }

    const { title, description, isPublic, artist } = parsed.data;
    const base = slugify(title);

    const taken = await db
      .select({ slug: lists.slug })
      .from(lists)
      .where(and(eq(lists.userId, me.id), sql`${lists.slug} LIKE ${base + "%"}`));

    const used = new Set(taken.map((t) => t.slug));
    let slug = base;
    let n = 2;
    while (used.has(slug)) slug = `${base}-${n++}`;

    const [row] = await db
      .insert(lists)
      .values({ userId: me.id, slug, title, description, isPublic })
      .returning({ id: lists.id, slug: lists.slug });

    if (artist) {
      const artistId = await upsertArtist(artist);
      await db.insert(listItems).values({ listId: row.id, artistId, position: 0 }).onConflictDoNothing();
    }

    return NextResponse.json({ ok: true, id: row.id, slug: row.slug });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Connecte-toi pour creer une liste." }, { status: 401 });
    }
    console.error("[lists:create]", err);
    return NextResponse.json({ error: "Creation impossible" }, { status: 500 });
  }
}

/** Ajoute ou retire un artiste d'une liste dont on est propriétaire. */
export async function PUT(req: Request) {
  try {
    const me = await requireUser();
    const parsed = ItemBody.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Donnees invalides" }, { status: 400 });

    const { listId, artist, included, note } = parsed.data;

    // On vérifie la propriété avant toute écriture.
    const [owned] = await db
      .select({ id: lists.id })
      .from(lists)
      .where(and(eq(lists.id, listId), eq(lists.userId, me.id)))
      .limit(1);

    if (!owned) return NextResponse.json({ error: "Liste introuvable" }, { status: 404 });

    const artistId = await upsertArtist(artist);

    if (included) {
      const [{ next }] = await db
        .select({ next: sql<number>`coalesce(max(${listItems.position}), -1) + 1` })
        .from(listItems)
        .where(eq(listItems.listId, listId));

      await db
        .insert(listItems)
        .values({ listId, artistId, note, position: next })
        .onConflictDoUpdate({
          target: [listItems.listId, listItems.artistId],
          set: { note },
        });
    } else {
      await db
        .delete(listItems)
        .where(and(eq(listItems.listId, listId), eq(listItems.artistId, artistId)));
    }

    await db.update(lists).set({ updatedAt: new Date() }).where(eq(lists.id, listId));

    return NextResponse.json({ ok: true, included });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }
    console.error("[lists:item]", err);
    return NextResponse.json({ error: "Operation impossible" }, { status: 500 });
  }
}

/** Supprime une liste entière (seulement la sienne). */
export async function DELETE(req: Request) {
  try {
    const me = await requireUser();
    const id = Number(new URL(req.url).searchParams.get("id"));
    if (!Number.isFinite(id)) return NextResponse.json({ error: "Identifiant manquant" }, { status: 400 });

    await db.delete(lists).where(and(eq(lists.id, id), eq(lists.userId, me.id)));
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }
    return NextResponse.json({ error: "Suppression impossible" }, { status: 500 });
  }
}
