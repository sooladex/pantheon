// Page de diagnostic temporaire — a supprimer une fois Spotify repare.
// N'affiche jamais de valeur secrete : seulement la presence des variables,
// leur longueur, et le code d'erreur renvoye par Spotify.
export const dynamic = "force-dynamic";

async function check() {
  const id = process.env.SPOTIFY_CLIENT_ID ?? "";
  const secret = process.env.SPOTIFY_CLIENT_SECRET ?? "";

  const base: Record<string, unknown> = {
    id_present: Boolean(id),
    id_longueur: id.length,
    id_propre: id === id.trim() && !/["']/.test(id),
    secret_present: Boolean(secret),
    secret_longueur: secret.length,
    secret_propre: secret === secret.trim() && !/["']/.test(secret),
  };

  if (!id || !secret) return { ...base, etape: "variable vide, rien teste" };

  let token = "";
  try {
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
      },
      body: "grant_type=client_credentials",
      cache: "no-store",
    });
    base.auth_http = res.status;
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as Record<string, string>;
      base.auth_erreur = j.error ?? "";
      base.auth_detail = j.error_description ?? "";
      return base;
    }
    const j = (await res.json()) as { access_token?: string };
    token = j.access_token ?? "";
    base.auth_ok = Boolean(token);
  } catch (e) {
    base.auth_exception = String(e);
    return base;
  }

  try {
    const url = new URL("https://api.spotify.com/v1/search");
    url.searchParams.set("q", "daft punk");
    url.searchParams.set("type", "artist");
    url.searchParams.set("limit", "3");
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    base.search_http = res.status;
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
      base.search_erreur = j.error?.message ?? "";
      return base;
    }
    const j = (await res.json()) as { artists?: { items?: { name: string }[] } };
    base.search_resultats = (j.artists?.items ?? []).map((a) => a.name);
  } catch (e) {
    base.search_exception = String(e);
  }

  return base;
}

export default async function DiagPage() {
  const data = await check();
  return (
    <pre style={{ padding: 24, fontSize: 14, whiteSpace: "pre-wrap" }}>
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
