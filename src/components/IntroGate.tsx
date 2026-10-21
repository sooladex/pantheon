"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const CinematicIntro = dynamic(() => import("@/components/CinematicIntro"), { ssr: false });

const KEY = "pantheon_intro_seen";

/** L'intro 3D ne joue qu'une fois par session, et jamais si l'utilisateur
 *  a demande a reduire les animations. */
export default function IntroGate({ images }: { images: string[] }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = sessionStorage.getItem(KEY) === "1";
    if (!reduced && !seen && images.length > 0) setShow(true);
  }, [images.length]);

  if (!show) return null;

  return (
    <CinematicIntro
      images={images}
      onDone={() => {
        try {
          sessionStorage.setItem(KEY, "1");
        } catch {
          /* mode prive : tant pis, elle rejouera */
        }
        setShow(false);
      }}
    />
  );
}
