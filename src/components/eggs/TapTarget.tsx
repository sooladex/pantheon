"use client";

import { useRef } from "react";
import { useEggs } from "@/components/eggs/EggProvider";

/**
 * Trois tapes rapides sur le portrait déclenchent l'œuf `tap_x3`.
 * Le compteur se vide après 600 ms de silence, pour ne pas confondre
 * trois clics espacés avec une intention.
 */
export default function TapTarget({ children }: { children: React.ReactNode }) {
  const { fire } = useEggs();
  const taps = useRef(0);
  const timer = useRef<number | null>(null);

  function onTap() {
    taps.current += 1;
    if (timer.current) window.clearTimeout(timer.current);

    if (taps.current >= 3) {
      taps.current = 0;
      fire("tap_x3");
      return;
    }

    timer.current = window.setTimeout(() => {
      taps.current = 0;
    }, 600);
  }

  return (
    <div onPointerDown={onTap} className="contents">
      {children}
    </div>
  );
}
