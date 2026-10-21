"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment } from "@react-three/drei";
import { EffectComposer, DepthOfField, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";

/* ------------------------------------------------------------------ *
 *  Flat-lay : on regarde un bureau de haut. Au centre, la médaille du
 *  Panthéon ; autour, une bande de pellicule et un disque — les deux
 *  familles d'artistes que l'app note.
 *
 *  Tout est procédural pour l'instant. Pour passer à un vrai modèle,
 *  il suffit de remplacer <Medal /> par un useGLTF("/models/medal.glb")
 *  compressé en Draco : la hiérarchie et les positions ne bougent pas.
 * ------------------------------------------------------------------ */

const PALETTE = {
  wood: "#2a2018",
  woodDark: "#1a130e",
  mat: "#2f4b3c",
  paper: "#d9cdb4",
  brass: "#c89a4a",
  brassDark: "#8a6526",
  terracotta: "#8c3b2e",
  cream: "#f2ebdd",
};

/** Texture de bois générée au vol : des veines, pas un bruit uniforme. */
function useWoodTexture() {
  return useMemo(() => {
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = PALETTE.wood;
    ctx.fillRect(0, 0, size, size);

    // Veines : des sinusoïdes légèrement bruitées, horizontales.
    for (let i = 0; i < 90; i++) {
      const y = Math.random() * size;
      const amp = 3 + Math.random() * 10;
      const alpha = 0.03 + Math.random() * 0.06;
      ctx.strokeStyle = Math.random() > 0.5 ? `rgba(0,0,0,${alpha})` : `rgba(220,190,150,${alpha * 0.5})`;
      ctx.lineWidth = 0.6 + Math.random() * 2.2;
      ctx.beginPath();
      for (let x = 0; x <= size; x += 6) {
        const yy = y + Math.sin((x / size) * Math.PI * (1 + Math.random() * 0.4)) * amp;
        if (x === 0) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
}

/** Le plateau : bois + un tapis de découpe vert en dessous de l'objet. */
function Desk() {
  const wood = useWoodTexture();

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.26, 0]} receiveShadow>
        <planeGeometry args={[42, 42]} />
        <meshStandardMaterial
          map={wood ?? undefined}
          color={wood ? "#ffffff" : PALETTE.wood}
          roughness={0.92}
          metalness={0}
        />
      </mesh>

      {/* Tapis de découpe : la surface de travail, légèrement surélevée */}
      <mesh rotation={[-Math.PI / 2, 0, 0.06]} position={[0, -0.24, 0]} receiveShadow>
        <planeGeometry args={[11, 8]} />
        <meshStandardMaterial color={PALETTE.mat} roughness={0.98} metalness={0} />
      </mesh>

      {/* Deux fiches bristol décalées, pour l'asymétrie éditoriale */}
      <mesh rotation={[-Math.PI / 2, 0, -0.14]} position={[-3.6, -0.22, 1.9]} receiveShadow>
        <planeGeometry args={[2.6, 1.7]} />
        <meshStandardMaterial color={PALETTE.paper} roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0.2]} position={[3.9, -0.225, -1.7]} receiveShadow>
        <planeGeometry args={[2.1, 1.4]} />
        <meshStandardMaterial color="#c9bb9f" roughness={0.95} />
      </mesh>
    </group>
  );
}

/** La médaille : un jeton de laiton avec une étoile en relief. */
function Medal({ spin }: { spin: React.MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null);

  // L'étoile à cinq branches, extrudée — le même symbole que les notes.
  const starGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    const outer = 0.62;
    const inner = 0.26;
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.07,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.015,
      bevelSegments: 3,
    });
    geo.center();
    return geo;
  }, []);

  useFrame((state, delta) => {
    if (!group.current) return;
    // Rotation continue, très lente, plus la rotation pilotée par le scroll.
    group.current.rotation.y += delta * 0.12;
    group.current.rotation.z = spin.current * 0.6;
    // Respiration : la médaille flotte d'un demi-millimètre.
    group.current.position.y = 0.12 + Math.sin(state.clock.elapsedTime * 0.8) * 0.03;
  });

  return (
    <group ref={group} position={[0, 0.12, 0]}>
      {/* Le disque */}
      <mesh castShadow receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 0.16, 96]} />
        <meshStandardMaterial
          color={PALETTE.brass}
          roughness={0.38}
          metalness={0.85}
          envMapIntensity={0.9}
        />
      </mesh>

      {/* Gorge périphérique, pour attraper la lumière sur la tranche */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <torusGeometry args={[1.38, 0.035, 12, 96]} />
        <meshStandardMaterial color={PALETTE.brassDark} roughness={0.5} metalness={0.8} />
      </mesh>

      {/* L'étoile en relief */}
      <mesh
        castShadow
        geometry={starGeometry}
        position={[0, 0.1, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={1.25}
      >
        <meshStandardMaterial color="#e2b964" roughness={0.3} metalness={0.9} />
      </mesh>
    </group>
  );
}

/** Bande de pellicule : le versant "écran". */
function FilmStrip() {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (group.current) {
      group.current.rotation.z = -0.38 + Math.sin(state.clock.elapsedTime * 0.4) * 0.012;
    }
  });

  const perforations = useMemo(() => Array.from({ length: 14 }, (_, i) => i), []);

  return (
    <group ref={group} position={[-3.5, -0.19, -0.4]} rotation={[-Math.PI / 2, 0, -0.38]}>
      <mesh receiveShadow castShadow>
        <planeGeometry args={[1.5, 6.4]} />
        <meshStandardMaterial color={PALETTE.woodDark} roughness={0.85} side={THREE.DoubleSide} />
      </mesh>

      {/* Photogrammes */}
      {[-2.1, -0.7, 0.7, 2.1].map((y, i) => (
        <mesh key={i} position={[0, y, 0.01]}>
          <planeGeometry args={[0.95, 1.15]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? "#3b2f25" : "#443629"}
            roughness={0.9}
          />
        </mesh>
      ))}

      {/* Perforations des deux côtés */}
      {perforations.map((i) => {
        const y = -2.95 + i * 0.45;
        return (
          <group key={i}>
            <mesh position={[-0.62, y, 0.01]}>
              <planeGeometry args={[0.14, 0.18]} />
              <meshStandardMaterial color={PALETTE.mat} roughness={1} />
            </mesh>
            <mesh position={[0.62, y, 0.01]}>
              <planeGeometry args={[0.14, 0.18]} />
              <meshStandardMaterial color={PALETTE.mat} roughness={1} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/** Disque vinyle : le versant "musique". */
function Record() {
  const group = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.18;
  });

  return (
    <group ref={group} position={[3.7, -0.18, 0.7]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[2.1, 2.1, 0.035, 72]} />
        <meshStandardMaterial color="#120d0a" roughness={0.55} metalness={0.1} />
      </mesh>

      {/* Sillons : quelques anneaux à peine plus clairs */}
      {[0.9, 1.25, 1.6, 1.9].map((r) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.019, 0]}>
          <ringGeometry args={[r, r + 0.012, 72]} />
          <meshStandardMaterial color="#2b211a" roughness={0.6} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* Étiquette centrale, terre cuite */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.021, 0]}>
        <circleGeometry args={[0.72, 48]} />
        <meshStandardMaterial color={PALETTE.terracotta} roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.023, 0]}>
        <circleGeometry args={[0.06, 24]} />
        <meshStandardMaterial color={PALETTE.woodDark} roughness={1} />
      </mesh>
    </group>
  );
}

/**
 * Caméra : descente cinématique au chargement, puis parallaxe souris.
 * `progress` (0 → 1) vient du scroll et écarte légèrement la vue.
 */
function CameraRig({
  intro,
  progress,
  onIntroDone,
}: {
  intro: boolean;
  progress: React.MutableRefObject<number>;
  onIntroDone: () => void;
}) {
  const { camera } = useThree();
  const elapsed = useRef(0);
  const done = useRef(false);
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((_, delta) => {
    elapsed.current += delta;

    // 2,4 s de descente, puis la caméra est libre.
    const t = intro ? Math.min(elapsed.current / 2.4, 1) : 1;
    const eased = 1 - Math.pow(1 - t, 4);

    if (intro && t >= 1 && !done.current) {
      done.current = true;
      onIntroDone();
    }

    const height = 16 - eased * 7.6;      // 16 → 8.4
    const back = 0.2 + eased * 2.2;       // la vue s'incline très légèrement
    const spread = progress.current * 1.8;

    // Parallaxe souris : quelques dixièmes d'unité, jamais plus.
    const px = pointer.current.x * 0.55;
    const py = pointer.current.y * 0.4;

    camera.position.x += (px + spread * 0.3 - camera.position.x) * 0.06;
    camera.position.y += (height - camera.position.y) * 0.08;
    camera.position.z += (back + py + spread - camera.position.z) * 0.06;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

type Props = {
  /** Joue la descente de caméra. */
  intro?: boolean;
  onIntroDone?: () => void;
  className?: string;
};

export default function FlatLayScene({ intro = true, onIntroDone, className = "" }: Props) {
  const progress = useRef(0);
  const spin = useRef(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // Le scroll de la page pilote l'écartement de la caméra et la bascule
  // de la médaille. On lit le scroll ici plutôt que via ScrollTrigger
  // pour éviter un aller-retour React à chaque frame.
  useEffect(() => {
    const onScroll = () => {
      const max = window.innerHeight * 1.6;
      const p = Math.min(window.scrollY / max, 1);
      progress.current = p;
      spin.current = p;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={`pointer-events-none ${className}`} aria-hidden="true">
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ position: [0, 16, 0.2], fov: 38 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
        onCreated={({ scene }) => {
          scene.fog = new THREE.Fog(0x16110d, 18, 34);
        }}
      >
        <color attach="background" args={["#16110d"]} />

        {/* Lumière d'atelier : une source chaude en biais, un remplissage froid */}
        <ambientLight intensity={0.35} />
        <directionalLight
          position={[4, 9, 3]}
          intensity={2.6}
          color="#ffd9a8"
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-12}
          shadow-camera-right={12}
          shadow-camera-top={12}
          shadow-camera-bottom={-12}
        />
        <directionalLight position={[-6, 5, -4]} intensity={0.5} color="#8fb0c9" />

        <Environment preset="apartment" environmentIntensity={0.45} />

        <Desk />
        <FilmStrip />
        <Record />
        <Medal spin={spin} />

        <ContactShadows
          position={[0, -0.21, 0]}
          opacity={0.55}
          scale={18}
          blur={2.6}
          far={4}
          resolution={512}
          color="#0d0906"
        />

        <CameraRig intro={intro && !reduced} progress={progress} onIntroDone={onIntroDone ?? (() => {})} />

        {!reduced && (
          <EffectComposer enableNormalPass={false}>
            <DepthOfField focusDistance={0.012} focalLength={0.045} bokehScale={2.4} height={480} />
            <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.42} />
            <Vignette eskil={false} offset={0.22} darkness={0.75} />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}
