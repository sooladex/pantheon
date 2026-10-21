"use client";

import dynamic from "next/dynamic";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ArmedEgg } from "@/lib/eggs/server";
import type { EggTrigger } from "@/lib/eggs/registry";

/* Chaque effet est un module séparé : rien ne part dans le bundle tant
   que l'œuf ne se déclenche pas. */
const EFFECTS = {
  beetlejuice: dynamic(() => import("@/components/eggs/effects/Beetlejuice")),
  "one-battle": dynamic(() => import("@/components/eggs/effects/OneBattle")),
  coraline: dynamic(() => import("@/components/eggs/effects/Coraline")),
  inception: dynamic(() => import("@/components/eggs/effects/Inception")),
  "catch-me": dynamic(() => import("@/components/eggs/effects/CatchMe")),
  matrix: dynamic(() => import("@/components/eggs/effects/Matrix")),
  shining: dynamic(() => import("@/components/eggs/effects/Shining")),
  "back-to-the-future": dynamic(() => import("@/components/eggs/effects/BackToTheFuture")),
} as const;

export type EggContextValue = {
  /** Tente de déclencher un œuf. Ne bloque jamais l'action en cours. */
  fire: (trigger: EggTrigger) => void;
  /** Un œuf "coraline" est-il actif ? (les étoiles deviennent des boutons) */
  coralineActive: boolean;
  /** Les œufs disponibles sur cette page. */
  armed: ArmedEgg[];
};

const EggContext = createContext<EggContextValue>({
  fire: () => {},
  coralineActive: false,
  armed: [],
});

export function useEggs() {
  return useContext(EggContext);
}

const KONAMI = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
  "b", "a",
];

export default function EggProvider({
  armed,
  children,
}: {
  armed: ArmedEgg[];
  children: React.ReactNode;
}) {
  const [active, setActive] = useState<ArmedEgg | null>(null);
  const [coralineActive, setCoralineActive] = useState(false);
  const firedOnOpen = useRef(false);
  const konamiPos = useRef(0);

  const reduced = useRef(false);
  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const close = useCallback(() => setActive(null), []);

  /** Signale au serveur qu'un œuf a été vu, sans bloquer l'affichage. */
  const report = useCallback((eggId: string) => {
    void fetch("/api/eggs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eggId }),
    }).catch(() => {});
  }, []);

  const fire = useCallback(
    (trigger: EggTrigger) => {
      if (active) return; // jamais deux surprises en même temps
      const candidates = armed.filter((e) => e.triggers.includes(trigger));
      if (candidates.length === 0) return;

      // On tire au sort parmi les candidats, pondéré par la rareté.
      const picked = candidates.find((e) => Math.random() < e.chance);
      if (!picked) return;

      if (picked.effect === "coraline") setCoralineActive(true);

      setActive(picked);
      report(picked.id);

      if (picked.duration > 0) {
        window.setTimeout(() => {
          setActive((cur) => (cur?.id === picked.id ? null : cur));
        }, picked.duration);
      }
    },
    [active, armed, report],
  );

  // on_open : une seule fois par montage de page.
  useEffect(() => {
    if (firedOnOpen.current || armed.length === 0) return;
    firedOnOpen.current = true;
    const t = window.setTimeout(() => fire("on_open"), 900);
    return () => window.clearTimeout(t);
  }, [armed, fire]);

  // Konami Code.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const expected = KONAMI[konamiPos.current];
      if (e.key.toLowerCase() === expected.toLowerCase()) {
        konamiPos.current += 1;
        if (konamiPos.current === KONAMI.length) {
          konamiPos.current = 0;
          fire("konami");
        }
      } else {
        konamiPos.current = e.key === KONAMI[0] ? 1 : 0;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fire]);

  const value = useMemo<EggContextValue>(
    () => ({ fire, coralineActive, armed }),
    [fire, coralineActive, armed],
  );

  const Effect = active ? EFFECTS[active.effect] : null;

  return (
    <EggContext.Provider value={value}>
      {children}
      {Effect && active && <Effect egg={active} onClose={close} />}
    </EggContext.Provider>
  );
}

/** Props communes à tous les effets. */
export type EggEffectProps = {
  egg: ArmedEgg;
  onClose: () => void;
};
