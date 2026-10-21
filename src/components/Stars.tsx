import { useId } from "react";

/** Affichage d'une note sur 10 en 5 étoiles (demi-étoiles gérées). */
export function Stars({ score, size = 14 }: { score: number; size?: number }) {
  const full = Math.floor(score / 2);
  const half = score % 2 === 1;

  return (
    <span className="inline-flex items-center gap-0.5 align-middle" aria-label={`${score / 2} sur 5`}>
      {Array.from({ length: 5 }, (_, i) => {
        const state = i < full ? "full" : i === full && half ? "half" : "empty";
        return <Star key={i} state={state} size={size} />;
      })}
    </span>
  );
}

const PATH = "M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4 6.2 20.5l1.1-6.5L2.6 9.4l6.5-.9z";

function Star({ state, size }: { state: "full" | "half" | "empty"; size: number }) {
  // useId : l'identifiant du dégradé doit être stable entre serveur et client.
  const id = useId();

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      {state === "half" && (
        <defs>
          <linearGradient id={id}>
            <stop offset="50%" stopColor="var(--color-gold)" />
            <stop offset="50%" stopColor="#2a2a36" />
          </linearGradient>
        </defs>
      )}
      <path
        d={PATH}
        fill={state === "full" ? "var(--color-gold)" : state === "half" ? `url(#${id})` : "#2a2a36"}
      />
    </svg>
  );
}
