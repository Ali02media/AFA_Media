'use client';

import { Suspense, useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

// ─── BRAND ───────────────────────────────────────────────────────────────────
const B = {
  blue:   '#308CD9',
  teal:   '#1AB0A1',
  orange: '#D9722C',
  white:  '#FFFFFF',
  skyTop: '#E8F4FD',
  skyMid: '#C5E0F7',
  skyHrz: '#F5EDE4',
  skyBot: '#FAF7F4',
};

// ─── SCENE CONSTANTS ─────────────────────────────────────────────────────────
const TILE_SZ   = 1.0;
const TILE_H    = 0.4;
const GAP       = 0.1;
const STEP      = TILE_SZ + GAP;   // 1.1
const GRID_W    = 80;
const GRID_D    = 120;
const LOOP_D    = GRID_D * STEP;   // 132
const HALF_D    = LOOP_D / 2;      // 66
const FLOOR_CY  = -TILE_H / 2;    // -0.2 — tile centre; top face at y=0
const SPEED     = 1.4;
const FOG_DENS  = 0.01;

const CAM_POS  : [number,number,number] = [0, 2.0, 8];
const CAM_LOOK : [number,number,number] = [0, -0.3, -50];
const FOV = 50;

// Tile animation phase boundaries (normalised 0→1 over cycle)
const FLIGHT_END = 0.22;
const RIDE_END   = 0.72;

// ─── QUADRATIC BEZIER (no allocations) ───────────────────────────────────────
function qBez(t: number, p0: THREE.Vector3, p1: THREE.Vector3, p2: THREE.Vector3, out: THREE.Vector3) {
  const s = 1 - t;
  out.x = s * s * p0.x + 2 * s * t * p1.x + t * t * p2.x;
  out.y = s * s * p0.y + 2 * s * t * p1.y + t * t * p2.y;
  out.z = s * s * p0.z + 2 * s * t * p1.z + t * t * p2.z;
}

// ─── EASING ──────────────────────────────────────────────────────────────────
const easeOut3  = (x: number) => 1 - Math.pow(1 - x, 3);
const easeIO3   = (x: number) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

// ─── SKY DOME ────────────────────────────────────────────────────────────────
function SkyDome() {
  return (
    <mesh renderOrder={-1}>
      <sphereGeometry args={[200, 32, 32]} />
      <shaderMaterial
        side={THREE.BackSide}
        depthWrite={false}
        uniforms={{
          uTop: { value: new THREE.Color(B.skyTop) },
          uMid: { value: new THREE.Color(B.skyMid) },
          uHrz: { value: new THREE.Color(B.skyHrz) },
          uBot: { value: new THREE.Color(B.skyBot) },
        }}
        vertexShader={`
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 uTop, uMid, uHrz, uBot;
          varying vec3 vDir;
          void main() {
            float h = vDir.y;
            vec3 col;
            if (h > 0.35)       col = mix(uMid, uTop, (h - 0.35) / 0.65);
            else if (h > -0.05) col = mix(uHrz, uMid, (h + 0.05) / 0.4);
            else                col = mix(uBot, uHrz, (h + 1.0) / 0.95);
            gl_FragColor = vec4(col, 1.0);
          }
        `}
      />
    </mesh>
  );
}

// ─── ICONS ───────────────────────────────────────────────────────────────────
function AIIcon() {
  return (
    <group>
      <mesh position={[0, 0.17, 0]}>
        <boxGeometry args={[0.54, 0.40, 0.11]} />
        <meshStandardMaterial color={B.white} roughness={0.3} />
      </mesh>
      <mesh position={[-0.11, 0.21, 0.065]}>
        <cylinderGeometry args={[0.062, 0.062, 0.032, 16]} />
        <meshStandardMaterial color={B.blue} emissive={B.blue} emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[0.11, 0.21, 0.065]}>
        <cylinderGeometry args={[0.062, 0.062, 0.032, 16]} />
        <meshStandardMaterial color={B.blue} emissive={B.blue} emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[0, 0.40, 0]}>
        <cylinderGeometry args={[0.016, 0.016, 0.15, 8]} />
        <meshStandardMaterial color={B.white} />
      </mesh>
      <mesh position={[0, 0.49, 0]}>
        <sphereGeometry args={[0.042, 8, 8]} />
        <meshStandardMaterial color={B.blue} emissive={B.blue} emissiveIntensity={0.9} />
      </mesh>
      <mesh position={[0, 0.06, 0.065]}>
        <boxGeometry args={[0.17, 0.026, 0.016]} />
        <meshStandardMaterial color={B.blue} />
      </mesh>
    </group>
  );
}

function PenIcon() {
  return (
    <group rotation={[0, 0, -0.33]}>
      <mesh>
        <cylinderGeometry args={[0.046, 0.046, 0.62, 12]} />
        <meshStandardMaterial color={B.white} roughness={0.2} />
      </mesh>
      <mesh position={[0, -0.36, 0]}>
        <coneGeometry args={[0.046, 0.10, 12]} />
        <meshStandardMaterial color={B.orange} />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.075, 12]} />
        <meshStandardMaterial color={B.orange} />
      </mesh>
      <mesh position={[0.065, 0.18, 0]} rotation={[0, 0, 0.33]}>
        <boxGeometry args={[0.026, 0.21, 0.016]} />
        <meshStandardMaterial color={B.orange} />
      </mesh>
    </group>
  );
}

function ClockIcon() {
  return (
    <group>
      <mesh>
        <cylinderGeometry args={[0.29, 0.29, 0.042, 32]} />
        <meshStandardMaterial color={B.white} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.004, 0]}>
        <torusGeometry args={[0.29, 0.030, 8, 32]} />
        <meshStandardMaterial color={B.blue} />
      </mesh>
      <mesh position={[0, 0.085, 0.026]} rotation={[0, 0, 0.52]}>
        <boxGeometry args={[0.026, 0.16, 0.012]} />
        <meshStandardMaterial color={B.blue} />
      </mesh>
      <mesh position={[0.055, 0.03, 0.026]} rotation={[0, 0, -0.62]}>
        <boxGeometry args={[0.021, 0.21, 0.012]} />
        <meshStandardMaterial color={B.blue} />
      </mesh>
      <mesh position={[0, 0, 0.032]}>
        <sphereGeometry args={[0.030, 8, 8]} />
        <meshStandardMaterial color={B.blue} />
      </mesh>
    </group>
  );
}

function ChartIcon() {
  return (
    <group>
      <mesh position={[0, -0.165, 0]}>
        <boxGeometry args={[0.52, 0.020, 0.012]} />
        <meshStandardMaterial color={B.white} />
      </mesh>
      <mesh position={[-0.16, -0.065, 0]}>
        <boxGeometry args={[0.090, 0.19, 0.012]} />
        <meshStandardMaterial color={B.orange} transparent opacity={0.52} />
      </mesh>
      <mesh position={[-0.04, 0.018, 0]}>
        <boxGeometry args={[0.090, 0.36, 0.012]} />
        <meshStandardMaterial color={B.orange} transparent opacity={0.74} />
      </mesh>
      <mesh position={[0.11, 0.095, 0]}>
        <boxGeometry args={[0.090, 0.52, 0.012]} />
        <meshStandardMaterial color={B.orange} />
      </mesh>
      <mesh position={[0.04, 0.155, 0.017]} rotation={[0, 0, 0.50]}>
        <boxGeometry args={[0.36, 0.030, 0.012]} />
        <meshStandardMaterial color={B.white} />
      </mesh>
      <mesh position={[0.20, 0.262, 0.017]} rotation={[0, 0, -0.47]}>
        <coneGeometry args={[0.046, 0.10, 3]} />
        <meshStandardMaterial color={B.white} />
      </mesh>
    </group>
  );
}

function MegaphoneIcon() {
  return (
    <group>
      <mesh rotation={[0, 0, 0.27]}>
        <coneGeometry args={[0.20, 0.40, 16, 1, true]} />
        <meshStandardMaterial color={B.white} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-0.18, -0.04, 0]} rotation={[0, 0, 0.27]}>
        <cylinderGeometry args={[0.090, 0.090, 0.10, 16]} />
        <meshStandardMaterial color={B.blue} />
      </mesh>
      <mesh position={[-0.10, -0.20, 0]} rotation={[0, 0, -0.46]}>
        <boxGeometry args={[0.036, 0.16, 0.036]} />
        <meshStandardMaterial color={B.blue} />
      </mesh>
      <mesh position={[0.27, 0.065, 0]}>
        <torusGeometry args={[0.105, 0.013, 8, 16, Math.PI]} />
        <meshStandardMaterial color={B.blue} transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.34, 0.10, 0]}>
        <torusGeometry args={[0.145, 0.012, 8, 16, Math.PI]} />
        <meshStandardMaterial color={B.blue} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function BrowserIcon() {
  return (
    <group>
      <mesh>
        <boxGeometry args={[0.56, 0.42, 0.042]} />
        <meshStandardMaterial color={B.white} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.168, 0.026]}>
        <boxGeometry args={[0.56, 0.080, 0.012]} />
        <meshStandardMaterial color={B.teal} />
      </mesh>
      {[-0.18, -0.108, -0.036].map((x, i) => (
        <mesh key={i} position={[x, 0.168, 0.036]}>
          <sphereGeometry args={[0.017, 8, 8]} />
          <meshStandardMaterial color={B.white} />
        </mesh>
      ))}
      <mesh position={[-0.075, 0.052, 0.026]}>
        <boxGeometry args={[0.22, 0.026, 0.008]} />
        <meshStandardMaterial color={B.teal} transparent opacity={0.4} />
      </mesh>
      <mesh position={[0.038, -0.033, 0.026]}>
        <boxGeometry args={[0.30, 0.024, 0.008]} />
        <meshStandardMaterial color={B.teal} transparent opacity={0.3} />
      </mesh>
      <mesh position={[-0.105, -0.115, 0.026]}>
        <boxGeometry args={[0.17, 0.024, 0.008]} />
        <meshStandardMaterial color={B.teal} transparent opacity={0.5} />
      </mesh>
      <mesh position={[0.163, -0.072, 0.036]} rotation={[0, 0, 0.73]}>
        <coneGeometry args={[0.030, 0.072, 3]} />
        <meshStandardMaterial color={B.blue} />
      </mesh>
    </group>
  );
}

const ICONS = [
  { name: 'AI Chatbots', color: B.blue,   Icon: AIIcon         },
  { name: 'Web Design',  color: B.teal,   Icon: BrowserIcon    },
  { name: 'Growth',      color: B.orange, Icon: ChartIcon      },
  { name: 'Paid Ads',    color: B.blue,   Icon: MegaphoneIcon  },
  { name: 'Copywriting', color: B.orange, Icon: PenIcon        },
  { name: 'Time Saved',  color: B.blue,   Icon: ClockIcon      },
];

// ─── INFINITE FLOOR ──────────────────────────────────────────────────────────
function InfiniteFloor() {
  const meshRef    = useRef<THREE.InstancedMesh>(null);
  const dummy      = useMemo(() => new THREE.Object3D(), []);
  const scroll     = useRef(0);
  const totalTiles = GRID_W * GRID_D;

  // Per-instance colour: subtle warm/cool variation for bevel illusion
  useEffect(() => {
    if (!meshRef.current) return;
    const col = new THREE.Color();
    for (let i = 0; i < totalTiles; i++) {
      const v    = 0.920 + Math.random() * 0.055;
      const warm = Math.random() > 0.5;
      col.setRGB(v * (warm ? 1.012 : 0.990), v, v * (warm ? 0.990 : 1.010));
      meshRef.current.setColorAt(i, col);
    }
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  }, [totalTiles]);

  useFrame((_, dt) => {
    if (!meshRef.current) return;
    scroll.current = (scroll.current + SPEED * dt) % LOOP_D;

    let idx = 0;
    for (let row = 0; row < GRID_D; row++) {
      for (let col = 0; col < GRID_W; col++) {
        const xPos = (col - GRID_W / 2) * STEP + STEP / 2;
        let   zPos = row * STEP - HALF_D + scroll.current;
        if (zPos > HALF_D) zPos -= LOOP_D;

        dummy.position.set(xPos, FLOOR_CY, zPos);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(idx++, dummy.matrix);
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, totalTiles]} receiveShadow>
      <boxGeometry args={[TILE_SZ, TILE_H, TILE_SZ]} />
      <meshStandardMaterial roughness={0.68} metalness={0.02} />
    </instancedMesh>
  );
}

// ─── GLASS SERVICE TILES ─────────────────────────────────────────────────────
type TileSide = 'far-left' | 'left' | 'center-l' | 'center-r' | 'right' | 'far-right';

function GlassTile({ iconData, delay, side }: { iconData: typeof ICONS[0]; delay: number; side: TileSide }) {
  const groupRef = useRef<THREE.Group>(null);
  const matRef   = useRef<THREE.MeshPhysicalMaterial>(null);

  // Stable randoms — useRef prevents re-randomising on re-renders
  const cycleDur    = useRef(22 + Math.random() * 8).current;
  const ridePhaseDur = (RIDE_END - FLIGHT_END) * cycleDur;

  // Pre-allocated vectors — no heap allocation in useFrame
  const bezPt    = useRef(new THREE.Vector3()).current;
  const exitFrom = useRef(new THREE.Vector3()).current;
  const exitTo   = useRef(new THREE.Vector3()).current;

  const spawn = useMemo((): {
    p0: THREE.Vector3; p1: THREE.Vector3; p2: THREE.Vector3;
  } => {
    const isLeft   = side === 'far-left'  || side === 'left'     || side === 'center-l';
    const isFar    = side === 'far-left'  || side === 'far-right';
    const isCenter = side === 'center-l'  || side === 'center-r';

    // Spawn x — sides of scene
    const xAbsBase = isCenter ? 8  : (isFar ? 27 : 18);
    const xSpawn   = (isLeft ? -1 : 1) * (xAbsBase + (Math.random() - 0.5) * 5);

    // Landing x — central corridor, slight offset toward spawn side
    const xLand = (isLeft ? -1 : 1) * (1.5 + Math.random() * 4);

    // Control point — high arc midway
    const xCtrl = (xSpawn + xLand) * 0.5;

    const zSpawn = -18 - Math.random() * 12;
    const zCtrl  = -11 - Math.random() * 5;
    const zLand  = -5  - Math.random() * 4;

    const p0 = new THREE.Vector3(xSpawn, 0.8 + Math.random() * 1.0, zSpawn);
    const p1 = new THREE.Vector3(xCtrl,  7.0 + Math.random() * 4.0, zCtrl);
    const p2 = new THREE.Vector3(xLand,  0.25,                      zLand);

    return { p0, p1, p2 };
  }, [side]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    const t  = ((clock.getElapsedTime() + delay) % cycleDur) / cycleDur;

    if (t < FLIGHT_END) {
      // ── FLIGHT: bezier arc from side ──────────────────────────────────────
      const ft = easeOut3(t / FLIGHT_END);
      qBez(ft, spawn.p0, spawn.p1, spawn.p2, bezPt);
      groupRef.current.position.copy(bezPt);
      groupRef.current.rotation.set(
        THREE.MathUtils.lerp(0.8, 0, ft),
        THREE.MathUtils.lerp(0.4, 0, ft),
        THREE.MathUtils.lerp(1.2, 0, ft),
      );
      groupRef.current.scale.setScalar(THREE.MathUtils.lerp(0.5, 1.0, ft));
      if (matRef.current) matRef.current.opacity = THREE.MathUtils.lerp(0.05, 0.5, ft);

    } else if (t < RIDE_END) {
      // ── RIDE: scroll with floor ────────────────────────────────────────────
      const rt = (t - FLIGHT_END) / (RIDE_END - FLIGHT_END);
      groupRef.current.position.set(
        spawn.p2.x,
        spawn.p2.y + Math.sin(rt * Math.PI * 3) * 0.07,
        spawn.p2.z + rt * ridePhaseDur * SPEED,
      );
      groupRef.current.rotation.set(
        Math.sin(rt * Math.PI * 2) * 0.02,
        Math.sin(rt * Math.PI * 1.5) * 0.04,
        0,
      );
      groupRef.current.scale.setScalar(1.0);
      if (matRef.current) matRef.current.opacity = 0.5;

    } else {
      // ── EXIT: scale up + fade ─────────────────────────────────────────────
      const et = easeIO3((t - RIDE_END) / (1 - RIDE_END));
      exitFrom.set(spawn.p2.x, spawn.p2.y, spawn.p2.z + ridePhaseDur * SPEED);
      exitTo.set(exitFrom.x * 0.6, exitFrom.y - 1.5, exitFrom.z + 9);
      groupRef.current.position.lerpVectors(exitFrom, exitTo, et);
      groupRef.current.scale.setScalar(THREE.MathUtils.lerp(1.0, 3.5, et));
      if (matRef.current) matRef.current.opacity = THREE.MathUtils.lerp(0.5, 0, et);
    }
  });

  const { Icon } = iconData;

  return (
    <group ref={groupRef} position={spawn.p0.toArray() as [number,number,number]}>
      {/* Glass body */}
      <RoundedBox args={[2.2, 0.5, 2.2]} radius={0.18} smoothness={4}>
        <meshPhysicalMaterial
          ref={matRef}
          color={iconData.color}
          transparent
          opacity={0.5}
          roughness={0.06}
          metalness={0.0}
          transmission={0.7}
          thickness={2.0}
          ior={1.45}
          clearcoat={1.0}
          clearcoatRoughness={0.04}
          side={THREE.FrontSide}
        />
      </RoundedBox>

      {/* Coloured bottom glow strip */}
      <mesh position={[0, -0.268, 0]}>
        <boxGeometry args={[2.12, 0.028, 2.12]} />
        <meshStandardMaterial
          color={iconData.color}
          emissive={iconData.color}
          emissiveIntensity={1.8}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Subtle inner glow plane */}
      <mesh position={[0, -0.04, 0]}>
        <boxGeometry args={[2.0, 0.075, 2.0]} />
        <meshStandardMaterial
          color={iconData.color}
          emissive={iconData.color}
          emissiveIntensity={0.4}
          transparent
          opacity={0.35}
        />
      </mesh>

      {/* 3D icon on top face */}
      <group position={[0, 0.3, 0]} scale={0.86}>
        <Icon />
      </group>
    </group>
  );
}

// ─── AMBIENT DECORATIVE TILES ─────────────────────────────────────────────────
function AmbientTile({ delay, xPos }: { delay: number; xPos: number }) {
  const ref    = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const dur    = useRef(10 + Math.random() * 8).current;

  useFrame(({ clock }) => {
    if (!ref.current || !matRef.current) return;
    const t = ((clock.getElapsedTime() + delay) % dur) / dur;

    const LAND = 0.42;

    if (t < LAND) {
      // Descend from high and side toward floor
      const p = t / LAND;
      ref.current.position.set(
        xPos * (1 - p * 0.25),
        5 - p * 6.5,
        -28 + p * 22,
      );
    } else {
      // Ride with floor toward camera
      const p = (t - LAND) / (1 - LAND);
      ref.current.position.set(
        xPos * 0.75,
        FLOOR_CY + TILE_H / 2 + 0.1,
        -6 + p * 20,
      );
    }

    ref.current.rotation.x = t * 1.8;
    ref.current.rotation.z = xPos > 0 ? t * 0.75 : -t * 0.75;

    // Fade in, full, fade out
    matRef.current.opacity = Math.sin(t * Math.PI) * 0.28;
  });

  return (
    <mesh ref={ref} position={[xPos, 5, -28]}>
      <boxGeometry args={[0.82, 0.17, 0.82]} />
      <meshStandardMaterial
        ref={matRef}
        color="#D0E8F5"
        transparent
        opacity={0.28}
        roughness={0.3}
        metalness={0.05}
      />
    </mesh>
  );
}

// ─── SCENE ────────────────────────────────────────────────────────────────────
function Scene() {
  const { scene, camera } = useThree();

  useEffect(() => {
    scene.fog        = new THREE.FogExp2(B.skyTop, FOG_DENS);
    scene.background = new THREE.Color(B.skyTop);
    camera.lookAt(...CAM_LOOK);
    return () => { scene.fog = null; };
  }, [scene, camera]);

  const tilePool = useMemo(() => {
    const sides: TileSide[] = [
      'far-left','left','center-l','center-r','right','far-right',
      'left','center-r','right','far-left',
      'center-l','left','right','center-r','far-right',
    ];
    return Array.from({ length: 15 }, (_, i) => ({
      icon:  ICONS[i % ICONS.length],
      delay: i * 2.2 + Math.random() * 4,
      side:  sides[i % sides.length],
      key:   i,
    }));
  }, []);

  // Pre-compute stable xPos values — Math.random() must not run in JSX
  const ambXs = useMemo(() =>
    Array.from({ length: 40 }, (_, i) =>
      i % 2 === 0 ? -(25 + Math.random() * 15) : (25 + Math.random() * 15),
    ), []);

  return (
    <>
      {/* Hemisphere — sky blue top, warm ground */}
      <hemisphereLight args={['#F0F8FF', '#E8DDD0', 0.5]} />

      {/* Key: upper-front-left, warm white, casts shadows */}
      <directionalLight
        position={[-10, 15, 10]}
        intensity={1.0}
        color="#FFF5E0"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={120}
        shadow-camera-left={-55}
        shadow-camera-right={55}
        shadow-camera-top={55}
        shadow-camera-bottom={-55}
        shadow-bias={-0.0003}
      />

      {/* Fill: cool from upper-right-rear */}
      <directionalLight position={[8, 8, -8]}  intensity={0.4} color="#C5E0F7" />

      {/* Rim: warm from straight behind (horizon glow) */}
      <directionalLight position={[0, 5, -30]} intensity={0.5} color="#FFE8D0" />

      <SkyDome />
      <InfiniteFloor />

      {tilePool.map(tile => (
        <GlassTile key={tile.key} iconData={tile.icon} delay={tile.delay} side={tile.side} />
      ))}

      {ambXs.map((x, i) => (
        <AmbientTile key={`amb-${i}`} delay={i * 0.38} xPos={x} />
      ))}
    </>
  );
}

// ─── MOUSE GLOW ──────────────────────────────────────────────────────────────
function MouseGlow() {
  const [pos, setPos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const h = (e: MouseEvent) =>
      setPos({ x: (e.clientX / window.innerWidth) * 100, y: (e.clientY / window.innerHeight) * 100 });
    window.addEventListener('mousemove', h);
    return () => window.removeEventListener('mousemove', h);
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-10"
      style={{
        background: `radial-gradient(900px circle at ${pos.x}% ${pos.y}%, rgba(255,255,255,0.14), transparent 50%)`,
        mixBlendMode: 'screen',
      }}
    />
  );
}

// ─── EXPORT ───────────────────────────────────────────────────────────────────
export default function HeroScene() {
  const [isMobile, setIsMobile] = useState(false);
  const [hasError,  setHasError] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 820);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (isMobile || hasError) {
    return (
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(180deg, ${B.skyTop} 0%, ${B.skyMid} 35%, ${B.skyHrz} 70%, ${B.skyBot} 100%)` }}
      />
    );
  }

  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas
        shadows={{ type: THREE.PCFSoftShadowMap }}
        camera={{ position: CAM_POS, fov: FOV, near: 0.3, far: 300 }}
        gl={{
          antialias: true,
          alpha: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
        dpr={[1, 1.5]}
        onError={() => setHasError(true)}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
      <MouseGlow />
    </div>
  );
}
