"use client";

import { useRef, useMemo, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useReducedMotion } from "framer-motion";

// ─── Scene constants ──────────────────────────────────────────────────────────
const COLS    = 14;
const ROWS    = 28;
const STEP    = 1.1;
const TOTAL_Z = ROWS * STEP;
const SPEED   = 2.0;
const TILE_H  = 0.22;
const FLOOR_Y = 0;

// ─── Services ─────────────────────────────────────────────────────────────────
const SERVICES = [
  { label: "Web Design",      color: "#308CD9" },
  { label: "SEO",             color: "#D9722C" },
  { label: "Email Marketing", color: "#308CD9" },
  { label: "AI Chatbots",     color: "#1AB0A1" },
  { label: "Paid Ads",        color: "#D9722C" },
];

// ─── Icon textures (white line icons on transparent bg) ───────────────────────
function makeIcon(label: string): THREE.CanvasTexture {
  const S = 256;
  const c = document.createElement("canvas");
  c.width = S; c.height = S;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, S, S);
  ctx.strokeStyle = "rgba(255,255,255,0.92)";
  ctx.fillStyle   = "rgba(255,255,255,0.92)";
  ctx.lineWidth   = 14;
  ctx.lineCap     = "round";
  ctx.lineJoin    = "round";

  if (label === "Web Design") {
    ctx.strokeRect(44, 60, 168, 136);
    ctx.beginPath(); ctx.moveTo(44, 96); ctx.lineTo(212, 96); ctx.stroke();
    [68, 92, 116].forEach(x => {
      ctx.beginPath(); ctx.arc(x, 78, 7, 0, Math.PI * 2); ctx.fill();
    });
  } else if (label === "SEO") {
    ctx.beginPath(); ctx.arc(104, 104, 52, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 16;
    ctx.beginPath(); ctx.moveTo(144, 144); ctx.lineTo(196, 196); ctx.stroke();
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(104, 128); ctx.lineTo(104, 82);
    ctx.moveTo(84, 102); ctx.lineTo(104, 82); ctx.lineTo(124, 102);
    ctx.stroke();
  } else if (label === "Email Marketing") {
    ctx.strokeRect(44, 80, 168, 108);
    ctx.beginPath(); ctx.moveTo(44, 80); ctx.lineTo(128, 152); ctx.lineTo(212, 80); ctx.stroke();
  } else if (label === "AI Chatbots") {
    ctx.beginPath();
    ctx.moveTo(212, 92); ctx.arc(192, 92, 20, 0, Math.PI / 2);
    ctx.lineTo(148, 112); ctx.lineTo(80, 112);
    ctx.arc(64, 92, 16, Math.PI / 2, -Math.PI / 2);
    ctx.lineTo(192, 72); ctx.arc(192, 92, 20, -Math.PI / 2, 0);
    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(80, 148); ctx.lineTo(64, 174); ctx.lineTo(118, 148); ctx.stroke();
    [100, 128, 156].forEach(x => {
      ctx.beginPath(); ctx.arc(x, 92, 8, 0, Math.PI * 2); ctx.fill();
    });
  } else {
    // Paid Ads — megaphone
    ctx.beginPath();
    ctx.moveTo(72, 88); ctx.lineTo(72, 136); ctx.lineTo(108, 136);
    ctx.lineTo(172, 172); ctx.lineTo(172, 52); ctx.lineTo(108, 88);
    ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.arc(192, 112, 20, -Math.PI * 0.4, Math.PI * 0.4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(72, 136); ctx.lineTo(72, 168); ctx.lineTo(108, 168); ctx.lineTo(108, 136); ctx.stroke();
  }

  return new THREE.CanvasTexture(c);
}

// ─── Utility: positive modulo ─────────────────────────────────────────────────
function posMod(a: number, b: number) {
  return ((a % b) + b) % b;
}

// ─── Floor materials ──────────────────────────────────────────────────────────
// Two materials: top face (index 2) = bright white, sides = soft blue-grey
// BoxGeometry groups: 0=+X, 1=-X, 2=+Y(top), 3=-Y, 4=+Z, 5=-Z
const floorMaterials = [
  new THREE.MeshStandardMaterial({ color: "#D8E6F2", roughness: 0.35, metalness: 0.05 }), // +X
  new THREE.MeshStandardMaterial({ color: "#D8E6F2", roughness: 0.35, metalness: 0.05 }), // -X
  new THREE.MeshStandardMaterial({ color: "#FAFCFF", roughness: 0.10, metalness: 0.08 }), // +Y top
  new THREE.MeshStandardMaterial({ color: "#C8D8E8", roughness: 0.5,  metalness: 0.0  }), // -Y bottom
  new THREE.MeshStandardMaterial({ color: "#D8E6F2", roughness: 0.35, metalness: 0.05 }), // +Z
  new THREE.MeshStandardMaterial({ color: "#D8E6F2", roughness: 0.35, metalness: 0.05 }), // -Z
];

// ─── Floor ────────────────────────────────────────────────────────────────────
function Floor({ paused }: { paused: boolean }) {
  const ref    = useRef<THREE.InstancedMesh>(null!);
  const scroll = useRef(0);
  const dummy  = useMemo(() => new THREE.Object3D(), []);
  const count  = COLS * ROWS;

  useFrame((_, dt) => {
    if (!ref.current) return;
    if (!paused) scroll.current += dt * SPEED;

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const x = (col - (COLS - 1) / 2) * STEP;
        let   z = posMod(-row * STEP + scroll.current, TOTAL_Z);
        if (z > 0) z -= TOTAL_Z;

        dummy.position.set(x, FLOOR_Y, z);
        dummy.scale.setScalar(1);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        ref.current.setMatrixAt(row * COLS + col, dummy.matrix);
      }
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, floorMaterials, count]} receiveShadow>
      <boxGeometry args={[STEP * 0.91, TILE_H, STEP * 0.91]} />
    </instancedMesh>
  );
}

// ─── Service tile ─────────────────────────────────────────────────────────────
const Z_SPAWN = -20;
const Z_LAND  = -10;
const Z_EXIT  =  0.8;
const Z_GONE  =  2.8;

function ServiceTile({
  service,
  initZ,
  spawnX,
  paused,
}: {
  service: typeof SERVICES[number];
  initZ: number;
  spawnX: number;
  paused: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const tileZ    = useRef(initZ);
  const bodyMat  = useRef<THREE.MeshStandardMaterial>(null!);
  const iconMat  = useRef<THREE.MeshStandardMaterial>(null!);
  const texture  = useMemo(() => makeIcon(service.label), [service.label]);

  useFrame((_, dt) => {
    if (!groupRef.current) return;
    if (!paused) tileZ.current += dt * SPEED;
    if (tileZ.current > Z_GONE) tileZ.current -= TOTAL_Z;

    const z      = tileZ.current;
    const onFloor = FLOOR_Y + TILE_H / 2 + 0.18;

    let y = onFloor, scale = 1, opacity = 1, rotY = 0;

    if (z < Z_LAND) {
      const p    = Math.max(0, Math.min(1, (z - Z_SPAWN) / (Z_LAND - Z_SPAWN)));
      const ease = p * p;
      y       = THREE.MathUtils.lerp(14, onFloor, ease);
      scale   = THREE.MathUtils.lerp(0.25, 1, p);
      opacity = p;
      rotY    = (1 - p) * 0.2;
    } else if (z > Z_EXIT) {
      const p = Math.min(1, (z - Z_EXIT) / (Z_GONE - Z_EXIT));
      scale   = THREE.MathUtils.lerp(1, 2.6, p);
      opacity = 1 - p;
    }

    groupRef.current.position.set(spawnX, y, z);
    groupRef.current.scale.setScalar(scale);
    groupRef.current.rotation.y = rotY;

    [bodyMat, iconMat].forEach(m => {
      if (!m.current) return;
      m.current.opacity     = opacity;
      m.current.transparent = opacity < 0.99;
    });
  });

  return (
    <group ref={groupRef}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.3, 0.28, 1.3]} />
        <meshStandardMaterial
          ref={bodyMat}
          color={service.color}
          roughness={0.14}
          metalness={0.22}
        />
      </mesh>
      <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.9, 0.9]} />
        <meshStandardMaterial
          ref={iconMat}
          map={texture}
          transparent
          roughness={0.55}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ─── Lighting (bright, airy) ──────────────────────────────────────────────────
function Lighting() {
  return (
    <>
      {/* Soft blue-sky ambient */}
      <ambientLight intensity={0.9} color="#C8E0F5" />
      {/* Key light: upper-front-left, warm white */}
      <directionalLight
        position={[-6, 14, 6]}
        intensity={2.4}
        color="#FFF8F0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={12}
        shadow-camera-bottom={-8}
        shadow-bias={-0.001}
      />
      {/* Soft hemisphere: sky blue top, warm peach ground */}
      <hemisphereLight args={["#B8D9F7", "#FDF0E0", 0.7] as [string, string, number]} />
      {/* Subtle warm fill from horizon */}
      <pointLight position={[1, 0, -18]} color="#F2A565" intensity={3} distance={26} />
    </>
  );
}

// ─── Full scene ───────────────────────────────────────────────────────────────
function Scene({ paused }: { paused: boolean }) {
  const configs = useMemo(() =>
    SERVICES.map((s, i) => ({
      service: s,
      initZ:   Z_SPAWN - (i / SERVICES.length) * TOTAL_Z,
      spawnX:  0.6 + (i % 3) * 1.6 + Math.sin(i * 2.1) * 0.8,
    })), []);

  return (
    <>
      <Lighting />
      {/* Light fog dissolves tiles into the sky gradient */}
      <fog attach="fog" args={["#D8EDF9", 14, 30] as [string, number, number]} />
      <Floor paused={paused} />
      {configs.map(cfg => (
        <ServiceTile key={cfg.service.label} {...cfg} paused={paused} />
      ))}
    </>
  );
}

// ─── WebGL detection ──────────────────────────────────────────────────────────
function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext("webgl") || c.getContext("experimental-webgl"))
    );
  } catch { return false; }
}

// ─── Export ───────────────────────────────────────────────────────────────────
export function HeroRoadScene() {
  const reduced = useReducedMotion();
  if (typeof window === "undefined" || !hasWebGL()) return null;

  return (
    <Canvas
      camera={{ position: [0, 3.6, 8.2], fov: 48, near: 0.1, far: 60 }}
      shadows={{ type: THREE.PCFSoftShadowMap }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 1.5]}
      style={{ width: "100%", height: "100%" }}
    >
      <Suspense fallback={null}>
        <Scene paused={!!reduced} />
      </Suspense>
    </Canvas>
  );
}
