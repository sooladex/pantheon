"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; icon: React.ReactNode };

const I = {
  home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
    </>
  ),
  trophy: <path d="M7 4h10v4a5 5 0 0 1-10 0zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M12 13v4m-4 3h8" />,
  quote: <path d="M5 18h5v-6H6c0-3 1.5-4.5 4-5M14 18h5v-6h-4c0-3 1.5-4.5 4-5" />,
  list: <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
};

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/**
 * Navigation flottante : rail vertical en verre à gauche sur grand écran,
 * dock en pilule en bas sur mobile.
 */
export default function RailNav({ username }: { username?: string }) {
  const path = usePathname();
  const items: Item[] = [
    { href: "/", label: "Accueil", icon: I.home },
    { href: "/decouvrir", label: "Découvrir", icon: I.grid },
    { href: "/classement", label: "Classement", icon: I.trophy },
    { href: "/critiques", label: "Critiques", icon: I.quote },
    { href: "/listes", label: "Listes", icon: I.list },
    { href: "/recherche", label: "Recherche", icon: I.search },
  ];
  const mobile: Item[] = [
    items[0],
    items[1],
    items[5],
    items[2],
    { href: username ? `/u/${username}` : "/connexion", label: "Profil", icon: I.user },
  ];

  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <>
      <nav
        aria-label="Navigation principale"
        className="glass fixed left-4 top-1/2 z-50 hidden -translate-y-1/2 flex-col items-center gap-2 rounded-full p-2 md:flex"
      >
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            aria-label={it.label}
            title={it.label}
            className={`group relative grid h-11 w-11 place-items-center rounded-full transition ${
              active(it.href)
                ? "bg-gold text-ink shadow-[0_8px_24px_-6px_rgb(239_122_59/0.7)]"
                : "text-muted hover:bg-white/10 hover:text-text"
            }`}
          >
            <Icon>{it.icon}</Icon>
            <span className="glass-strong pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-full px-3 py-1 text-xs text-text opacity-0 transition group-hover:opacity-100">
              {it.label}
            </span>
          </Link>
        ))}
      </nav>

      <nav
        aria-label="Navigation mobile"
        className="glass-strong fixed inset-x-4 bottom-4 z-50 flex items-center justify-around rounded-full px-2 py-2 md:hidden"
      >
        {mobile.map((it) => (
          <Link
            key={it.href + it.label}
            href={it.href}
            aria-label={it.label}
            className={`grid h-11 w-11 place-items-center rounded-full transition ${
              active(it.href) ? "bg-gold text-ink" : "text-muted"
            }`}
          >
            <Icon>{it.icon}</Icon>
          </Link>
        ))}
      </nav>
    </>
  );
}
