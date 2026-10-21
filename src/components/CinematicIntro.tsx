"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

type Props = { images: string[]; onDone: () => void };

/** Charge une texture sans jamais faire planter la scene si l'URL echoue. */
function useSafeTextures(urls: string[]) {
  const [textures, setTextures] = useState<(THREE.Texture | null)[]>(() => urls.map(() => null));

  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");

    urls.forEach((url, i) => {
      loader.load(
        url,
        (tex) => {
          if (cancelled) {
            tex.dispose();
            return;
          }
          tex.colorSpace = THREE.SRGBColorSpace;
          setTextures((prev) => {
            const next = [...prev];
            next[i] = tex;
            return next;
          });
        },
        undefined,
        () => {
          /* image indisponible : le panneau reste une plaque de marbre */
        },
      );
    });

    return () => {
      cancelled = true;
    };
  }, [urls]);

  return textures;
}

const PANEL_W = 1.5;
const PANEL_H = 2.25;
const RADIUS = 4.6;

function Rotunda({ images }: { images: string[] }) {
  const group = useRef<THREE.Group>(null);
  const textures = useSafeTextures(images);
  const count = images.length;

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.16;
  });

  type Placement = { position: [number, number, number]; rotation: [number, number, number] };

  const placements = useMemo<Placement[]>(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2;
        // deux anneaux superposes : plus dense, plus "cathedrale"
        const tier = i % 2 === 0 ? -0.15 : 1.9;
        return {
          position: [Math.sin(angle) * RADIUS, tier, Math.cos(angle) * RADIUS],
          rotation: [0, angle + Math.PI, 0],
        };
      }),
    [count],
  );

  return (
    <group ref={group}>
      {placements.map((p, i) => (
        <mesh key={i} position={p.position} rotation={p.rotation}>
          <planeGeometry args={[PANEL_W, PANEL_H]} />
          <meshStandardMaterial
            map={textures[i] ?? undefined}
            color={textures[i] ? "#ffffff" : "#1d1d27"}
            roughness={0.55}
            metalness={0.25}
            side={THREE.DoubleSide}
            transparent
            opacity={0.94}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Travelling avant : la camera sort du noir et entre dans la rotonde. */
function DollyRig() {
  const { camera } = useThree();
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    elapsed.current += delta;
    const t = Math.min(elapsed.current / 5, 1);
    const eased = 1 - Math.pow(1 - t, 3);

    camera.position.z = 13 - eased * 12.4;
    camera.position.y = 1.6 - eased * 1.5;
    camera.rotation.z = (1 - eased) * 0.09;
    camera.lookAt(0, 0.6, 0);
  });

  return null;
}

function Dust() {
  const points = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = 380;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 16;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 10;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 16;
    }
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, []);

  useFrame((state) => {
    if (points.current) {
      points.current.rotation.y = state.clock.elapsedTime * 0.03;
      points.current.position.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
    }
  });

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial size={0.035} color="#d9a441" transparent opacity={0.55} sizeAttenuation />
    </points>
  );
}

export default function CinematicIntro({ images, onDone }: Props) {
  const [leaving, setLeaving] = useState(false);

  const close = useMemo(
    () => () => {
      setLeaving(true);
      window.setTimeout(onDone, 900);
    },
    [onDone],
  );

  useEffect(() => {
    const timer = window.setTimeout(close, 5600);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [close]);

  return (
    <div
      className={`fixed inset-0 z-[100] bg-ink transition-opacity duration-[900ms] ${
        leaving ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <Canvas
        camera={{ position: [0, 1.6, 13], fov: 52 }}
        dpr={[1, 1.8]}
        gl={{ antialias: true }}
        onCreated={({ scene }) => {
          scene.fog = new THREE.FogExp2(0x08080b, 0.075);
        }}
      >
        <ambientLight intensity={0.55} />
        <pointLight position={[0, 4, 0]} intensity={38} color="#d9a441" distance={20} />
        <pointLight position={[-6, -2, 4]} intensity={16} color="#4cc9f0" distance={18} />
        <pointLight position={[6, -2, -4]} intensity={16} color="#f072b6" distance={18} />
        <Rotunda images={images} />
        <Dust />
        <DollyRig />
      </Canvas>

      {/* Vignette + titre */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,#08080b_88%)]" />

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <p
          className="rise text-[0.6rem] uppercase tracking-[0.75em] text-gold/80"
          style={{ animationDelay: "1.1s" }}
        >
          Le mur des visages
        </p>
        <h1
          className="rise mt-5 text-[13vw] leading-[0.85] font-black tracking-[0.06em] text-text md:text-[8rem]"
          style={{ animationDelay: "1.5s" }}
        >
          PANTHÉON
        </h1>
        <p
          className="rise mt-6 max-w-md px-6 text-sm text-muted"
          style={{ animationDelay: "2.3s" }}
        >
          Note les acteurs et les chanteurs, pas leurs œuvres.
        </p>
      </div>

      <button
        onClick={close}
        className="absolute bottom-8 right-8 rounded-full border border-edge bg-ink-2/70 px-5 py-2 text-xs uppercase tracking-[0.25em] text-muted backdrop-blur transition hover:border-gold hover:text-gold"
      >
        Entrer
      </button>
    </div>
  );
}
