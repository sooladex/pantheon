import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { recordSighting } from "@/lib/eggs/server";

const Body = z.object({ eggId: z.string().min(1).max(60) });

/**
 * Enregistre qu'une surprise a été vue. Sans compte, on ne mémorise
 * rien — et surtout, on ne renvoie jamais d'erreur visible : un œuf qui
 * échoue à se compter ne doit pas gêner l'utilisateur.
 */
export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ ok: true, stored: false });

    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ ok: true, stored: false });

    await recordSighting(user.id, parsed.data.eggId);
    return NextResponse.json({ ok: true, stored: true });
  } catch {
    return NextResponse.json({ ok: true, stored: false });
  }
}
