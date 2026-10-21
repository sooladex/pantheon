/**
 * ads.txt — déclare qui a le droit de vendre l'inventaire publicitaire
 * du domaine. Google exige ce fichier pour lever les avertissements
 * "vendeurs non autorisés" dans AdSense.
 *
 * Le fichier se construit tout seul à partir de l'identifiant éditeur :
 * pas de valeur en dur à maintenir.
 */
export const dynamic = "force-static";
export const revalidate = 86400;

export function GET() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "";
  const publisherId = client.replace(/^ca-/, "");

  const body = publisherId
    ? `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`
    : "# Aucun éditeur publicitaire configuré.\n";

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
