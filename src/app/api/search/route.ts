import { NextResponse } from "next/server";
import { searchArtists } from "@/lib/artists";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  try {
    return NextResponse.json({ results: await searchArtists(q) });
  } catch (err) {
    console.error("[search]", err);
    return NextResponse.json({ results: [], error: "Recherche indisponible" }, { status: 502 });
  }
}
