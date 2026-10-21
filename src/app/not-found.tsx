import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-32 text-center">
      <p className="text-[11px] uppercase tracking-[0.4em] text-gold/80">404</p>
      <h1 className="mt-3 text-4xl font-black">Ce visage n&apos;est pas au Panthéon</h1>
      <p className="mt-3 text-sm text-muted">
        La page ou l&apos;artiste demandé n&apos;existe pas.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-full border border-edge px-6 py-2.5 text-sm transition hover:border-gold hover:text-gold"
      >
        Retour au mur
      </Link>
    </div>
  );
}
