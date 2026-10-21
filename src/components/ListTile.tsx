import Link from "next/link";
import type { ListSummary } from "@/lib/social";

export default function ListTile({ list }: { list: ListSummary }) {
  return (
    <Link
      href={`/u/${list.username}/listes/${list.slug}`}
      className="group block rounded-xl border border-edge bg-surface/40 p-4 transition hover:border-gold/50"
    >
      <div className="flex gap-1.5">
        {Array.from({ length: 4 }, (_, i) => {
          const src = list.covers[i];
          return src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt=""
              loading="lazy"
              className="h-24 w-16 rounded object-cover object-top transition duration-500 group-hover:-translate-y-0.5"
              style={{ transitionDelay: `${i * 40}ms` }}
            />
          ) : (
            <div key={i} className="h-24 w-16 rounded bg-gradient-to-br from-surface to-ink-2" />
          );
        })}
      </div>

      <p className="mt-3 truncate text-sm font-bold">{list.title}</p>
      {list.description && (
        <p className="mt-1 line-clamp-2 text-xs text-muted">{list.description}</p>
      )}
      <p className="mt-2 text-[11px] text-muted">
        {list.count} artiste{list.count > 1 ? "s" : ""} · par {list.displayName}
      </p>
    </Link>
  );
}
