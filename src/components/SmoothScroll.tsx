"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Scroll fluide (Lenis) + révélations au défilement (GSAP ScrollTrigger).
 *
 * Tout élément portant `data-reveal` entre en fondu décalé quand il
 * approche du bas de la fenêtre. Les enfants marqués `data-reveal-child`
 * se déclenchent en cascade.
 */
export default function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let lenis: { raf: (t: number) => void; destroy: () => void } | null = null;
    let frame = 0;
    let cleanupGsap: (() => void) | null = null;
    let cancelled = false;

    (async () => {
      const [{ default: Lenis }, { gsap }, { ScrollTrigger }] = await Promise.all([
        import("lenis"),
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger);

      if (!reduced) {
        lenis = new Lenis({
          duration: 1.1,
          easing: (t: number) => 1 - Math.pow(1 - t, 3),
          smoothWheel: true,
        });

        const raf = (time: number) => {
          lenis?.raf(time);
          frame = requestAnimationFrame(raf);
        };
        frame = requestAnimationFrame(raf);

        // Lenis déplace la page sans événement scroll natif régulier :
        // on prévient ScrollTrigger à chaque frame.
        ScrollTrigger.scrollerProxy(document.body, {});
        (lenis as unknown as { on: (e: string, cb: () => void) => void }).on(
          "scroll",
          ScrollTrigger.update,
        );
      }

      const ctx = gsap.context(() => {
        document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
          const children = el.querySelectorAll<HTMLElement>("[data-reveal-child]");
          const targets = children.length ? Array.from(children) : [el];

          gsap.fromTo(
            targets,
            { opacity: 0, y: reduced ? 0 : 26 },
            {
              opacity: 1,
              y: 0,
              duration: reduced ? 0.01 : 0.9,
              ease: "power3.out",
              stagger: reduced ? 0 : 0.08,
              scrollTrigger: {
                trigger: el,
                start: "top 88%",
                once: true,
              },
            },
          );
        });
      });

      cleanupGsap = () => {
        ctx.revert();
        ScrollTrigger.getAll().forEach((t) => t.kill());
      };
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      cleanupGsap?.();
      lenis?.destroy();
    };
  }, [pathname]);

  return null;
}
