"use client";

import { useEffect, useRef, useState } from "react";

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

type Props = {
  /** Identifiant d'emplacement créé dans l'interface AdSense. */
  slot?: string;
  format?: "auto" | "fluid" | "rectangle" | "horizontal";
  layoutKey?: string;
  className?: string;
  /** Libellé au-dessus du bloc, exigé par plusieurs régies. */
  label?: string;
};

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * Un emplacement publicitaire qui ne réserve de la place que s'il a
 * vraiment quelque chose à afficher : sans identifiant client, sans
 * identifiant d'emplacement, ou sans consentement, le composant ne rend
 * rien du tout — pas de trou blanc dans la page.
 */
export default function AdSlot({
  slot,
  format = "auto",
  layoutKey,
  className = "",
  label = "Publicité",
}: Props) {
  const ref = useRef<HTMLModElement>(null);
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    try {
      setConsented(localStorage.getItem("pantheon_consent_v1") === "granted");
    } catch {
      setConsented(false);
    }
  }, []);

  useEffect(() => {
    if (!consented || !CLIENT || !slot || !ref.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle ?? []).push({});
    } catch {
      /* bloqueur de pub ou script pas encore prêt : sans conséquence */
    }
  }, [consented, slot]);

  if (!CLIENT || !slot || !consented) return null;

  return (
    <aside className={`my-8 text-center ${className}`}>
      <p className="mb-1 text-[10px] uppercase tracking-[0.3em] text-muted/60">{label}</p>
      <ins
        ref={ref}
        className="adsbygoogle block"
        style={{ display: "block" }}
        data-ad-client={CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-ad-layout-key={layoutKey}
        data-full-width-responsive="true"
      />
    </aside>
  );
}
