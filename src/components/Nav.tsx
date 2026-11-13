import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import SearchBar from "@/components/SearchBar";
import LogoutButton from "@/components/LogoutButton";
import RailNav from "@/components/RailNav";

export default async function Nav() {
  const user = await getSessionUser();

  return (
    <>
      <header className="sticky top-0 z-40 px-4 pt-3 md:pl-24">
        <div className="glass mx-auto flex max-w-7xl items-center gap-3 rounded-full py-2 pl-5 pr-2">
          <Link href="/" className="shrink-0 text-base font-black tracking-[0.18em] text-text">
            PANTHÉON
          </Link>

          <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2">
            <SearchBar />
            {user ? (
              <div className="flex shrink-0 items-center gap-1">
                <Link
                  href={`/u/${user.username}`}
                  className="flex items-center gap-2 rounded-full bg-white/5 py-1 pl-1 pr-3 text-xs transition hover:bg-white/10"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-gold text-[11px] font-bold text-ink">
                    {user.displayName.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="hidden max-w-[10ch] truncate sm:inline">{user.displayName}</span>
                </Link>
                <span className="hidden sm:inline">
                  <LogoutButton />
                </span>
              </div>
            ) : (
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href="/connexion"
                  className="hidden text-xs text-muted transition hover:text-text sm:inline"
                >
                  Connexion
                </Link>
                <Link
                  href="/inscription"
                  className="rounded-full bg-gold px-4 py-2 text-xs font-semibold text-ink transition hover:bg-brass"
                >
                  Créer un compte
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
      <RailNav username={user?.username} />
    </>
  );
}
