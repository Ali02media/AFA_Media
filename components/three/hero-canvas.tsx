"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Sparkles, Icosahedron } from "@react-three/drei";
import { useRef, useMemo, useEffect, useState } from "react";
import * as THREE from "three";

const BLUE = "#2c87d0";
const TEAL = "#19b0a1";

/** Scroll progress (0..1 across the whole page) kept in a ref to avoid re-renders. */
function useScrollProgress() {
  const ref = useRef(0);
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      ref.current = max > 0 ? window.scrollY / max : 0;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return ref;
}

/** Normalised pointer (-1..1) from the window, so the canvas itself stays click-through. */
function usePointer() {
  const ref = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      ref.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      ref.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
  return ref;
}

function Crystal({
  scroll,
  pointer,
  reduced,
  compact,
}: {
  scroll: React.RefObject<number>;
  pointer: React.RefObject<{ x: number; y: number }>;
  reduced: boolean;
  compact: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const shards = useRef<(THREE.Mesh | null)[]>([]);
  const baseScale = compact ? 0.62 : 1;

  // 4 shards — one per service.
  const shardData = useMemo(() => {
    const colors = [BLUE, TEAL, BLUE, TEAL];
    return [0, 1, 2, 3].map((i) => ({
      angle: (i / 4) * Math.PI * 2,
      color: colors[i],
      tilt: i * 0.7,
    }));
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const p = reduced ? 0 : scroll.current;
    // Bump curve: 0 at hero → 1 mid-page → 0 by the end (break apart, then reassemble).
    const explode = Math.sin(
      THREE.MathUtils.clamp((p - 0.08) / 0.78, 0, 1) * Math.PI
    );

    const g = group.current;
    if (g) {
      g.rotation.y = reduced ? 0.4 : t * 0.12 + p * Math.PI * 1.1;
      const px = pointer.current?.x ?? 0;
      const py = pointer.current?.y ?? 0;
      g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, -0.15 + py * 0.18, 0.04);
      g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, px * 0.12, 0.04);
      const breathe = 1 + Math.sin(t * 0.8) * 0.02;
      g.scale.setScalar(breathe * baseScale);
    }

    shards.current.forEach((m, i) => {
      if (!m) return;
      const d = shardData[i];
      const r = 1.7 + explode * 2.5;
      m.position.set(
        Math.cos(d.angle) * r,
        Math.sin(d.angle) * r * 0.62,
        Math.sin(d.angle * 1.3 + d.tilt) * r * 0.45
      );
      m.rotation.x += delta * (0.2 + explode * 1.3);
      m.rotation.y += delta * (0.15 + explode * 1.0);
      m.scale.setScalar(0.55 * (1 - explode * 0.12));
    });
  });

  return (
    <group ref={group}>
      {/* Solid core */}
      <Icosahedron args={[1.15, 0]}>
        <meshStandardMaterial
          color={BLUE}
          emissive={TEAL}
          emissiveIntensity={0.16}
          metalness={0.72}
          roughness={0.22}
          flatShading
        />
      </Icosahedron>
      {/* Wireframe shell */}
      <Icosahedron args={[1.24, 0]}>
        <meshBasicMaterial color={TEAL} wireframe transparent opacity={0.16} />
      </Icosahedron>
      {/* Orbiting shards (the 4 services) */}
      {shardData.map((d, i) => (
        <mesh
          key={i}
          ref={(el) => {
            shards.current[i] = el;
          }}
        >
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color={d.color}
            emissive={d.color}
            emissiveIntensity={0.28}
            metalness={0.6}
            roughness={0.25}
            flatShading
          />
        </mesh>
      ))}
    </group>
  );
}

export default function HeroCanvas() {
  const scroll = useScrollProgress();
  const pointer = usePointer();
  const [reduced, setReduced] = useState(false);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);

    const cq = window.matchMedia("(max-width: 767px)");
    const updateCompact = () => setCompact(cq.matches);
    updateCompact();
    cq.addEventListener("change", updateCompact);

    return () => {
      mq.removeEventListener("change", update);
      cq.removeEventListener("change", updateCompact);
    };
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 0, 6.5], fov: 45 }}
      dpr={[1, 1.8]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ pointerEvents: "none" }}
    >
      <ambientLight intensity={0.6} />
      <pointLight position={[5, 3, 5]} intensity={160} color={BLUE} distance={30} />
      <pointLight position={[-5, -2, 4]} intensity={160} color={TEAL} distance={30} />
      <pointLight position={[0, 5, -3]} intensity={70} color="#ffffff" distance={30} />
      <Crystal scroll={scroll} pointer={pointer} reduced={reduced} compact={compact} />
      <Sparkles
        count={reduced ? 30 : 80}
        scale={[14, 10, 8]}
        size={2.4}
        speed={reduced ? 0 : 0.3}
        opacity={0.5}
        color="#7fd4ff"
      />
    </Canvas>
  );
}
