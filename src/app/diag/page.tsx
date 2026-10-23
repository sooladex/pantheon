// Page de diagnostic temporaire.
export const dynamic = "force-dynamic";

async function token() {
  const id = process.env.SPOTIFY_CLIENT_ID ?? "";
  const secret = process.env.SPOTIFY_CLIENT_SECRET ?? "";
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) throw new Error("auth " + res.status);
  const j = (await res.json()) as { access_token: string };
  return j.access_token;
}

async function probe() {
  const t = await token();
  const out: Record<string, string>[] = [];

  for (const limit of ["1", "5", "10", "11", "15", "20", "50"]) {
    const url = new URL("https://api.spotify.com/v1/search");
    url.searchParams.set("q", "a");
    url.searchParams.set("type", "artist");
    url.searchParams.set("limit", limit);
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${t}` },
      cache: "no-store",
    });
    let note = "ok";
    if (!r.ok) note = (await r.text()).slice(0, 120);
    else {
      const j = (await r.json()) as { artists?: { items?: unknown[] } };
      note = "ok, recus=" + (j.artists?.items ?? []).length;
    }
    out.push({ test: `search limit=${limit}`, http: String(r.status), note });
  }

  for (const limit of ["10", "20", "30", "50"]) {
    const url = new URL("https://api.spotify.com/v1/artists/4tZwfgrHOc3mvqYlEYSvVi/albums");
    url.searchParams.set("include_groups", "album,single");
    url.searchParams.set("limit", limit);
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${t}` },
      cache: "no-store",
    });
    let note = "ok";
    if (!r.ok) note = (await r.text()).slice(0, 120);
    else {
      const j = (await r.json()) as { items?: unknown[] };
      note = "ok, recus=" + (j.items ?? []).length;
    }
    out.push({ test: `albums limit=${limit}`, http: String(r.status), note });
  }

  return out;
}

export default async function DiagPage() {
  let data: unknown;
  try {
    data = await probe();
  } catch (e) {
    data = { erreur: String(e) };
  }
  return (
    <pre style={{ padding: 24, fontSize: 14, whiteSpace: "pre-wrap" }}>
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
