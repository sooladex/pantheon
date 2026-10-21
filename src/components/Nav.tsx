import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import SearchBar from "@/components/SearchBar";
import LogoutButton from "@/components/LogoutButton";

export default async function Nav() {
  const user = await getSessionUser();

  return (
    <header className="sticky top-0 z-50 border-b border-edge/70 bg-ink/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Link href="/" className="shrink-0 text-lg font-black tracking-[0.18em] text-text">
          PANTHÉON
        </Link>

        <nav className="hidden shrink-0 gap-4 text-xs uppercase tracking-[0.18em] text-muted md:flex">
          <Link href="/decouvrir" className="transition hover:text-gold">
            Découvrir
          </Link>
          <Link href="/classement" className="transition hover:text-gold">
            Classement
          </Link>
          <Link href="/critiques" className="transition hover:text-gold">
            Critiques
          </Link>
          <Link href="/listes" className="transition hover:text-gold">
            Listes
          </Link>
        </nav>

        <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-3">
          <SearchBar />
          {user ? (
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href={`/u/${user.username}`}
                className="rounded-full border border-edge px-3 py-1.5 text-xs transition hover:border-gold hover:text-gold"
              >
                {user.displayName}
              </Link>
              <LogoutButton />
            </div>
          ) : (
            <div className="flex shrink-0 items-center gap-2">
              <Link href="/connexion" className="text-xs text-muted transition hover:text-text">
                Connexion
              </Link>
              <Link
                href="/inscription"
                className="rounded-full bg-gold px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-gold/85"
              >
                Créer un compte
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
