'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const MODEL_URL   = '/models/tabletop_macbook_iphone.glb';
const CLOSED_QUAT = new THREE.Quaternion(0, 0, 0, 1);
const OPEN_QUAT   = new THREE.Quaternion(-0.7833269096274834, 0, 0, 0.6216099682706644);

// CSS px box size for the tracked screen container — ties directly into the
// distanceFactor math below. Matches the parent's real content width (no extra CSS
// `scale()` step) so there's only ONE geometric transform (this component's own,
// via drei's distanceFactor) between the DOM and the screen — stacking a second,
// inner CSS scale on top made text blurry (browsers rasterize a transformed layer
// at its own scale, then just resample that bitmap for outer transforms, instead of
// re-rendering crisp text at the final size).
export const SCREEN_W = 1280;

// Content is PRESENT on the screen almost from the start of the lid opening — it fades in
// while the lid is still at a shallow/oblique angle (screen barely lifted) and tracks the
// screen's fold the whole way up, so the section is already visible "inside" the screen at
// low angles rather than only appearing once the lid is near-open. Only hidden in the very
// first sliver of opening, where the screen still faces down against the keyboard.
const DP_REVEAL_START = 0.12;
const DP_REVEAL_END   = 0.3;

// Pull the zoom endpoint back so the 3D content lands at the SAME on-screen size as the flat
// ServicesSection it hands off to — when they match, the pin→flow swap has zero size change
// and is invisible (a smooth, effortless "through the screen" entry, no bounce). The pure
// 1:1 calibration (1.0) landed a touch too BIG (content shrank at the swap); 1.12 landed a
// touch too SMALL (content grew); 1.06 splits the difference so they match. >1 = further
// back / smaller. Purely an endpoint value (camera distance + the vertical-anchor math below
// derive from it) — it moves where the smooth zoom LANDS, not how it animates, so no jitter.
// If the content still visibly GROWS at the handoff, nudge DOWN (1.04); if it SHRINKS, nudge UP.
const ZOOM_END_PULLBACK = 0.991;

// Fully release a loaded model subtree: geometries, every material, and every texture the
// materials reference. Without this, each dev-mode Strict-Mode remount (mount→unmount→
// mount) leaves the previous GLTF — meshes, materials, textures and all — orphaned in the
// scene while a fresh copy loads on top, accumulating duplicate geometry (and leaking GPU
// memory / WebGL contexts) over a session.
function disposeObjectTree(root: THREE.Object3D) {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry?.dispose();
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of mats) {
      if (!mat) continue;
      for (const key in mat) {
        const val = (mat as unknown as Record<string, unknown>)[key];
        if (val && (val as THREE.Texture).isTexture) (val as THREE.Texture).dispose();
      }
      mat.dispose();
    }
  });
}

function ScreenFollower({
  displayMeshRef,
  dpRef,
  distanceFactor,
  screenH,
  normalCorrectionRef,
  centroidLocalRef,
  onContainerRef,
  active,
}: {
  displayMeshRef: RefObject<THREE.Mesh | null>;
  dpRef: RefObject<number>;
  /** Whether the 3D screen is the thing currently on-screen (i.e. still pinned). This
   *  component stays mounted permanently (see MacbookScene) to avoid reloading the GLTF
   *  every time the user scrolls back across the pin boundary — but its container is a
   *  full-bleed, opaque-white div, and its own reveal-opacity is driven purely by scroll
   *  progress (dp), which stays maxed out forever once you've scrolled past. Without this
   *  flag, that leftover container silently sat on top of the real page content once
   *  unpinned, since nothing ever told it to go away. */
  active: boolean;
  /** The mesh's local origin (what matrixWorld's translation gives you) is wherever the
   *  modeler placed it — not necessarily the screen panel's visual center. Track this
   *  precomputed local centroid instead, transformed through the live world matrix each
   *  frame, so the overlay is centered on the actual panel rather than an arbitrary point. */
  centroidLocalRef: RefObject<THREE.Vector3>;
  /** In `transform` mode, drei's Html sizes content by a constant `distanceFactor/400`
   *  world-units-per-CSS-pixel multiplier (see node_modules/@react-three/drei/web/Html.js).
   *  A plain `scale` prop is NOT recognized by Html — it silently spreads onto Html's own
   *  internal tracking group as an actual Three.js scale, compounding incorrectly. */
  distanceFactor: number;
  screenH: number;
  /** <Html transform> always lays its div flat in the tracked group's local XY plane
   *  (local Z = the div's outward "page normal"). This mesh's own geometric normal is
   *  its local Y axis, not Z — so without this correction the div ends up oriented
   *  edge-on to the camera no matter how the camera is aimed. */
  normalCorrectionRef: RefObject<THREE.Quaternion>;
  /** Fires with the tracked container div so the parent can portal real page content
   *  into it — MacbookScene only owns the 3D tracking, not what's displayed. */
  onContainerRef: (el: HTMLDivElement | null) => void;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const wrapRef  = useRef<HTMLDivElement>(null);
  const _pos   = useRef(new THREE.Vector3());
  const _quat  = useRef(new THREE.Quaternion());
  const _scale = useRef(new THREE.Vector3());

  useFrame(() => {
    const mesh  = displayMeshRef.current;
    const group = groupRef.current;
    if (mesh && group) {
      mesh.updateWorldMatrix(true, false);
      mesh.matrixWorld.decompose(_pos.current, _quat.current, _scale.current);
      group.position.copy(centroidLocalRef.current).applyMatrix4(mesh.matrixWorld);
      group.quaternion.copy(_quat.current).multiply(normalCorrectionRef.current);
      group.scale.set(1, 1, 1);
    }

    if (wrapRef.current) {
      if (!active) {
        wrapRef.current.style.opacity = '0';
        wrapRef.current.style.pointerEvents = 'none';
      } else {
        const dp = dpRef.current ?? 0;
        const reveal = THREE.MathUtils.clamp((dp - DP_REVEAL_START) / (DP_REVEAL_END - DP_REVEAL_START), 0, 1);
        const smooth = reveal * reveal * (3 - 2 * reveal);
        wrapRef.current.style.opacity = String(smooth);
        wrapRef.current.style.pointerEvents = '';
      }
    }
  });

  return (
    <group ref={groupRef}>
      <Html transform distanceFactor={distanceFactor} center zIndexRange={[1, 2]}>
        <div
          ref={(el) => { (wrapRef as React.MutableRefObject<HTMLDivElement | null>).current = el; onContainerRef(el); }}
          style={{
            width: SCREEN_W,
            height: screenH,
            overflow: 'hidden',
            borderRadius: 3,
            background: '#ffffff',
            boxShadow: 'inset 0 0 16px rgba(0,0,0,0.12)',
          }}
        />
      </Html>
    </group>
  );
}

function MacbookCore({
  progressRef,
  onZoomProgress,
  onScreenContainerRef,
  invalidateRef,
  active,
}: {
  progressRef: RefObject<number>;
  onZoomProgress?: (v: number) => void;
  onScreenContainerRef: (el: HTMLDivElement | null) => void;
  /** Exposes R3F's `invalidate` (frameloop="demand" means nothing renders unless
   *  something calls this) to the parent, so GSAP's onUpdate — which lives outside the
   *  R3F tree — can kick off a render whenever scroll actually changes. */
  invalidateRef: RefObject<(() => void) | null>;
  active: boolean;
}) {
  const { gl, camera, scene, invalidate } = useThree();

  useEffect(() => {
    invalidateRef.current = invalidate;
    return () => { invalidateRef.current = null; };
  }, [invalidate, invalidateRef]);

  const screenNodeRef  = useRef<THREE.Object3D | null>(null);
  const displayMeshRef = useRef<THREE.Mesh | null>(null);
  const normalCorrectionRef = useRef(new THREE.Quaternion());
  const centroidLocalRef = useRef(new THREE.Vector3());
  const initialCamPos  = useRef(new THREE.Vector3());
  const initialLookAt  = useRef(new THREE.Vector3());
  const zoomCamPos     = useRef(new THREE.Vector3());
  const zoomLookAt     = useRef(new THREE.Vector3());
  const zoomReady      = useRef(false);
  const displayedP     = useRef(0);
  const dpRef          = useRef(0);
  const [modelReady, setModelReady] = useState(false);
  const [distanceFactor, setDistanceFactor] = useState(10);
  const [screenH, setScreenH] = useState(300);

  useEffect(() => {
    let disposed = false;
    let loadedGroup: THREE.Group | null = null;

    const pmrem  = new THREE.PMREMGenerator(gl);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;

    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256; shadowCanvas.height = 256;
    const sCtx = shadowCanvas.getContext('2d')!;
    const grad  = sCtx.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, 'rgba(0,0,0,0.45)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 256, 256);
    const shadowTex  = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat  = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });
    const shadowMesh = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -0.01;
    scene.add(shadowMesh);

    const draco = new DRACOLoader();
    draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.5/');
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);

    loader.load(MODEL_URL, (gltf) => {
      if (disposed) return;

      const root    = gltf.scene;
      const macbook = root.getObjectByName('macbook');
      const iphone  = root.getObjectByName('iphone');
      if (iphone) iphone.removeFromParent();
      if (!macbook) return;

      const screenNode = macbook.getObjectByName('Bevels_2') as THREE.Object3D | null;
      if (screenNode) screenNodeRef.current = screenNode;

      const maxAniso = Math.min(4, gl.capabilities.getMaxAnisotropy());
      macbook.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (!mesh.isMesh) return;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const mat of mats) {
          const m = mat as THREE.MeshStandardMaterial;
          for (const k of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap'] as const) {
            const t = m[k]; if (t) t.anisotropy = maxAniso;
          }
        }
      });

      // Remove glare on lid assembly, and give the screen mesh a plain light surface —
      // the real content is provided by the live <Html> overlay, not this mesh's texture.
      if (screenNode) {
        screenNode.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (!mesh.isMesh) return;
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const mat of mats) {
            (mat as THREE.MeshStandardMaterial).envMapIntensity = 0;
          }
        });
      }

      const displayMesh = screenNode?.getObjectByName('Object_7') as THREE.Mesh | null;
      if (displayMesh) {
        displayMeshRef.current = displayMesh;
        const mats = Array.isArray(displayMesh.material) ? displayMesh.material : [displayMesh.material];
        for (const mat of mats) {
          const m = mat as THREE.MeshStandardMaterial;
          m.map = null;
          m.emissiveMap = null;
          m.color.set(0xf4f5f8);
          m.roughness = 0.35;
          m.metalness = 0;
          m.needsUpdate = true;
        }
      }

      root.updateMatrixWorld(true);
      const closedBox = new THREE.Box3().setFromObject(macbook);

      let unionBox = closedBox.clone();
      if (screenNode) {
        const origQ = screenNode.quaternion.clone();
        screenNode.quaternion.copy(OPEN_QUAT);
        root.updateMatrixWorld(true);
        unionBox = closedBox.clone().union(new THREE.Box3().setFromObject(macbook));
        screenNode.quaternion.copy(origQ);
        root.updateMatrixWorld(true);
      }

      const unionSize      = unionBox.getSize(new THREE.Vector3());
      const maxDim         = Math.max(unionSize.x, unionSize.y, unionSize.z) || 1;
      const normalizeScale = 3.1 / maxDim;
      const centerXZ       = closedBox.getCenter(new THREE.Vector3());
      root.position.set(-centerXZ.x, -closedBox.min.y, -centerXZ.z);

      const group = new THREE.Group();
      loadedGroup = group;
      group.add(root);
      group.scale.setScalar(normalizeScale);
      group.rotation.y = Math.PI;
      scene.add(group);
      scene.updateMatrixWorld(true);

      const pc        = camera as THREE.PerspectiveCamera;
      const topWorldY = (unionBox.max.y - closedBox.min.y) * normalizeScale;
      const midY      = topWorldY / 2;
      const halfVFov  = THREE.MathUtils.degToRad(pc.fov / 2);
      const reqDist   = (topWorldY / 2 / Math.tan(halfVFov)) * 1.25;
      camera.position.set(0, midY + topWorldY * 0.12, reqDist);
      pc.lookAt(0, midY, 0);
      pc.updateProjectionMatrix();
      initialCamPos.current.copy(camera.position);
      initialLookAt.current.set(0, midY, 0);

      if (screenNode) {
        screenNode.quaternion.copy(OPEN_QUAT);
        scene.updateMatrixWorld(true);
        const lidBox    = new THREE.Box3().setFromObject(screenNode);
        const lidCenter = lidBox.getCenter(new THREE.Vector3());
        // Fallback framing if the mesh basis (and thus trueW) can't be derived below; the
        // real value is recomputed from trueW so the zoom ends at 1:1 (see note near trueW).
        let dist        = (topWorldY * 0.30 / Math.tan(halfVFov)) * 1.2;
        // Vertical pan applied to the zoom endpoint so the (viewport-centred) 3D screen
        // content lands at the same height as the top-anchored flow content — set below.
        let vNudgeWorld = 0;

        // Derive the screen's tangent/bitangent/normal DIRECTLY from the mesh's own
        // UV mapping (the same data used to paint its original baked-in texture) instead
        // of guessing which local axis is "up" from bounding-box thinness. A UV-derived
        // basis is deterministic: U → local "right", V → local "down" (glTF convention).
        let worldNormal = new THREE.Vector3(0, 0, 1);
        if (displayMeshRef.current) {
          const mesh  = displayMeshRef.current;
          const geom  = mesh.geometry;
          // DRACO-decoded attributes are always plain (non-interleaved) BufferAttributes;
          // narrow the union so THREE's fromBufferAttribute (which rejects the interleaved
          // variant) type-checks.
          const posA  = geom.attributes.position as THREE.BufferAttribute;
          const uvA   = geom.attributes.uv as THREE.BufferAttribute;
          const idx   = geom.index;

          // Scan for a non-degenerate triangle (non-zero surface AND UV area) to build the
          // basis from, rather than blindly trusting index 0,1,2 — the first triangle can
          // sit on a seam with zero UV area, which makes `f` (1/det) blow up and the whole
          // tangent basis (orientation + size) unstable. Fall back to 0,1,2 if none found.
          const triCount = idx ? Math.floor(idx.count / 3) : Math.floor(posA.count / 3);
          let i0 = idx ? idx.getX(0) : 0;
          let i1 = idx ? idx.getX(1) : 1;
          let i2 = idx ? idx.getX(2) : 2;
          const _ta = new THREE.Vector3(), _tb = new THREE.Vector3(), _tc = new THREE.Vector3();
          const _tua = new THREE.Vector2(), _tub = new THREE.Vector2(), _tuc = new THREE.Vector2();
          for (let t = 0; t < triCount; t++) {
            const a = idx ? idx.getX(t * 3)     : t * 3;
            const b = idx ? idx.getX(t * 3 + 1) : t * 3 + 1;
            const c = idx ? idx.getX(t * 3 + 2) : t * 3 + 2;
            _ta.fromBufferAttribute(posA, a); _tb.fromBufferAttribute(posA, b); _tc.fromBufferAttribute(posA, c);
            _tua.fromBufferAttribute(uvA, a); _tub.fromBufferAttribute(uvA, b); _tuc.fromBufferAttribute(uvA, c);
            const posArea = _tb.clone().sub(_ta).cross(_tc.clone().sub(_ta)).length();
            const uvArea  = Math.abs((_tub.x - _tua.x) * (_tuc.y - _tua.y) - (_tuc.x - _tua.x) * (_tub.y - _tua.y));
            if (posArea > 1e-9 && uvArea > 1e-9) { i0 = a; i1 = b; i2 = c; break; }
          }

          const p0 = new THREE.Vector3().fromBufferAttribute(posA, i0);
          const p1 = new THREE.Vector3().fromBufferAttribute(posA, i1);
          const p2 = new THREE.Vector3().fromBufferAttribute(posA, i2);
          const uv0 = new THREE.Vector2().fromBufferAttribute(uvA, i0);
          const uv1 = new THREE.Vector2().fromBufferAttribute(uvA, i1);
          const uv2 = new THREE.Vector2().fromBufferAttribute(uvA, i2);

          const edge1 = p1.clone().sub(p0);
          const edge2 = p2.clone().sub(p0);
          const dUV1  = uv1.clone().sub(uv0);
          const dUV2  = uv2.clone().sub(uv0);
          const f     = 1 / (dUV1.x * dUV2.y - dUV2.x * dUV1.y);

          const tangent = edge1.clone().multiplyScalar(dUV2.y)
            .sub(edge2.clone().multiplyScalar(dUV1.y)).multiplyScalar(f).normalize();
          let bitangent = edge2.clone().multiplyScalar(dUV1.x)
            .sub(edge1.clone().multiplyScalar(dUV2.x)).multiplyScalar(f).normalize();

          const normalA = geom.attributes.normal as THREE.BufferAttribute | undefined;
          const localNormal = normalA
            ? new THREE.Vector3().fromBufferAttribute(normalA, i0).normalize()
            : new THREE.Vector3().crossVectors(edge1, edge2).normalize();

          // Re-orthogonalize bitangent against the true normal (guards against
          // non-perpendicular UV shear) while preserving its original direction.
          const orthoBitangent = new THREE.Vector3().crossVectors(localNormal, tangent).normalize();
          if (orthoBitangent.dot(bitangent) < 0) orthoBitangent.negate();
          bitangent = orthoBitangent;

          normalCorrectionRef.current.setFromRotationMatrix(
            new THREE.Matrix4().makeBasis(tangent, bitangent, localNormal)
          );

          const worldQuat = mesh.getWorldQuaternion(new THREE.Quaternion());
          worldNormal = localNormal.clone().applyQuaternion(worldQuat).normalize();
          if (worldNormal.z < 0) worldNormal.negate();

          // True screen width/height: project every vertex onto the tangent/bitangent
          // axes and take the full range — accurate regardless of how the mesh is
          // subdivided, unlike an axis-aligned bounding box on a tilted mesh.
          let minT = Infinity, maxT = -Infinity, minB = Infinity, maxB = -Infinity;
          const v = new THREE.Vector3();
          for (let i = 0; i < posA.count; i++) {
            v.fromBufferAttribute(posA, i).sub(p0);
            const t = v.dot(tangent);
            const b = v.dot(bitangent);
            if (t < minT) minT = t; if (t > maxT) maxT = t;
            if (b < minB) minB = b; if (b > maxB) maxB = b;
          }

          const worldScale = new THREE.Vector3();
          mesh.matrixWorld.decompose(new THREE.Vector3(), new THREE.Quaternion(), worldScale);
          const trueW = (maxT - minT) * worldScale.x;
          const trueH = (maxB - minB) * worldScale.y;
          setDistanceFactor(400 * trueW / SCREEN_W);
          setScreenH(Math.max(1, Math.round(SCREEN_W * (trueH / trueW))));

          // Frame the zoom endpoint so that at full zoom the screen content renders at 1:1
          // with its own CSS size (the SCREEN_W-wide content occupying exactly SCREEN_W
          // on-screen pixels) — i.e. pixel-identical to the SAME ServicesSection once it
          // sits in normal page flow after the pin releases. Previously the 3D screen
          // magnified the content ~1.4x at full zoom, so the pin→flow handoff snapped it
          // back down to natural size: a visible size jump / "zoom in and out" every time
          // the boundary was crossed. Because content fills trueW (via distanceFactor), the
          // screen itself must project to SCREEN_W px. Perspective projects a world span w
          // at distance d to  w * viewportHpx / (2 d tan(halfVFov))  on-screen pixels; solve
          // that for the d which maps trueW → SCREEN_W. Viewport-height based, so the match
          // holds at any window size (the flow heading is a fixed CSS width).
          const viewportHpx = gl.domElement.clientHeight || window.innerHeight;
          dist = (trueW * viewportHpx) / (2 * SCREEN_W * Math.tan(halfVFov)) * ZOOM_END_PULLBACK;

          // The 3D screen content is vertically CENTRED in the viewport (drei Html `center`
          // on the panel centroid, which the camera aims at), but the same section in normal
          // page flow is TOP-anchored. At the pin handoff those two heights differ, so the
          // content hops vertically even though its size now matches. Pan the zoom endpoint
          // down by the gap between "centre of a screenH-tall box in this viewport" and the
          // flow content's top position, so the centred content sits where the flow content
          // will. worldPerPx converts that on-screen gap into a world-space camera pan.
          // On-screen height of the content AFTER the pullback (the CSS height projects
          // smaller by exactly ZOOM_END_PULLBACK once the camera is further back). Use this,
          // not the raw CSS height, so the top-anchor pan stays correct and the handoff
          // doesn't hop vertically now that the endpoint size changed.
          const screenHcss  = (SCREEN_W * (trueH / trueW)) / ZOOM_END_PULLBACK;
          const worldPerPx  = (2 * dist * Math.tan(halfVFov)) / viewportHpx;
          vNudgeWorld = (viewportHpx / 2 - screenHcss / 2 - 10) * worldPerPx;

          // Panel's actual visual center (not the mesh's arbitrary local origin).
          centroidLocalRef.current.copy(p0)
            .addScaledVector(tangent, (minT + maxT) / 2)
            .addScaledVector(bitangent, (minB + maxB) / 2);
        }

        zoomCamPos.current.copy(lidCenter).addScaledVector(worldNormal, dist);
        zoomLookAt.current.copy(lidCenter);
        // Pan camera + aim together (no tilt) so the screen content shifts up on-screen to
        // meet the flow content's height. Panning the camera DOWN moves content UP on screen.
        zoomCamPos.current.y -= vNudgeWorld;
        zoomLookAt.current.y -= vNudgeWorld;

        screenNode.quaternion.copy(CLOSED_QUAT);
        scene.updateMatrixWorld(true);
        zoomReady.current = true;
      }

      // Seed the eased value at wherever scroll already is, so the first frame after the
      // model finishes loading doesn't ease up from a stale 0 (which, if the user has
      // already scrolled into the lid-open range while it was still decoding, snaps the
      // model open in one lurch — the one-time "bounce").
      displayedP.current = (progressRef.current ?? 0) * 2;
      setModelReady(true);
    }, undefined, (err) => console.error('[MacbookScene] load failed:', err));

    return () => {
      disposed = true;
      gl.domElement.style.opacity = '1';
      pmrem.dispose();
      envTex.dispose();
      shadowTex.dispose();
      shadowMat.dispose();
      shadowMesh.geometry.dispose();
      scene.remove(shadowMesh);
      // The loaded macbook model (added inside the async load callback) was never being
      // removed or disposed here — every Strict-Mode/Fast-Refresh remount left a full
      // duplicate model in the scene and loaded another on top. Tear it down explicitly.
      if (loadedGroup) {
        scene.remove(loadedGroup);
        disposeObjectTree(loadedGroup);
        loadedGroup = null;
      }
      draco.dispose();
      scene.environment = null;
    };
  }, [gl, camera, scene]);

  useFrame((_, delta) => {
    const raw = progressRef.current ?? 0;
    // Per-render-frame easing toward the scroll-driven target (0-1 lid open, 1-2 zoom).
    // This interpolates EVERY rendered frame, so the motion stays fluid even when scroll
    // events arrive coarsely — that's what makes it feel smooth rather than stepped.
    //
    // dt is clamped tightly (25ms ≈ 1.5 frames). A normal 60fps frame (16ms) is unaffected,
    // but a ONE-OFF long frame — e.g. GSAP building the pin-spacer at pin-engage, or the
    // canvas mount/model-decode settling on a slower machine — is prevented from advancing
    // the ease by a big chunk in a single step. Without this, a single 50-100ms hitch right
    // as the lid begins to open makes displayedP leap toward the target in one frame: the
    // whole model visibly "bounces" once, then resumes. Clamping caps that single-frame jump
    // so any hitch is absorbed smoothly across the following frames instead.
    const target = raw * 2;
    const dt     = Math.min(0.025, delta);
    displayedP.current += (target - displayedP.current) * (1 - Math.pow(0.000001, dt));
    const dp = displayedP.current;
    dpRef.current = dp;

    // Fade out just the 3D chassis (canvas) gradually over the second HALF of the zoom
    // phase (dp 1.4→2.0 — roughly 1080px of scroll, not a narrow last-7% window), so
    // nothing is still visibly changing right as the pin hands off. Driven by the
    // already-smoothed `dp` (not raw scroll position) so it inherits the same gentle
    // inertia as the lid/zoom motion instead of tracking the wheel 1:1. The tracked
    // ServicesSection content lives in a separate DOM overlay (drei's Html), not the
    // canvas raster, so it stays fully visible throughout regardless of this fade.
    const chassisFade = THREE.MathUtils.clamp((dp - 1.4) / 0.6, 0, 1);
    gl.domElement.style.opacity = String(1 - chassisFade);

    if (screenNodeRef.current) {
      screenNodeRef.current.quaternion.slerpQuaternions(
        CLOSED_QUAT, OPEN_QUAT,
        THREE.MathUtils.clamp(dp, 0, 1)
      );
    }

    // Zoom completes just BEFORE the scroll seam: ÷0.8 ⇒ rawZoom reaches 1 at dp 1.8 (≈ scroll
    // progress 0.9), so by the time the scroll-driven handoff fires at progress ≈1 the 3D is
    // already fully zoomed and size-matched (ZOOM_END_PULLBACK) to the flat section — the swap
    // is invisible. This is what lets the handoff be POSITION-driven without a teleport: the
    // pin→flow swap is triggered by raw scroll in macbook-showcase (so it lands exactly at the
    // calibrated seam), and this dwell guarantees the zoom is visually done at that scroll
    // point even though `displayedP` itself still eases (kept — it's what makes the zoom feel
    // smooth). The chassis keeps fading through this last stretch, so it reads as breaking
    // THROUGH the screen rather than stalling.
    const rawZoom = THREE.MathUtils.clamp(dp - 1, 0, 1);
    onZoomProgress?.(rawZoom);

    if (zoomReady.current) {
      const e = rawZoom < 0.5
        ? 2 * rawZoom * rawZoom
        : 1 - Math.pow(-2 * rawZoom + 2, 2) / 2;
      camera.position.lerpVectors(initialCamPos.current, zoomCamPos.current, e);
      (camera as THREE.PerspectiveCamera).lookAt(
        initialLookAt.current.x + (zoomLookAt.current.x - initialLookAt.current.x) * e,
        initialLookAt.current.y + (zoomLookAt.current.y - initialLookAt.current.y) * e,
        initialLookAt.current.z + (zoomLookAt.current.z - initialLookAt.current.z) * e,
      );
    }

    // While active the Canvas runs frameloop "always"; while inactive, keep rendering until
    // the eased value has caught up to the target, then idle at 0 GPU cost.
    if (Math.abs(target - displayedP.current) > 0.0005) {
      invalidate();
    }
  });

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 5, 2]} intensity={1.7} />
      <directionalLight position={[-3, 2, -2]} intensity={0.4} color={0x369aac} />
      <directionalLight position={[-2, 1.5, 3]} intensity={0.5} />
      {modelReady && (
        <ScreenFollower
          displayMeshRef={displayMeshRef}
          dpRef={dpRef}
          distanceFactor={distanceFactor}
          screenH={screenH}
          normalCorrectionRef={normalCorrectionRef}
          centroidLocalRef={centroidLocalRef}
          onContainerRef={onScreenContainerRef}
          active={active}
        />
      )}
    </>
  );
}

export default function MacbookScene({
  className,
  style,
  progressRef,
  onZoomProgress,
  onScreenContainerRef,
  invalidateRef,
  active,
}: {
  className?: string;
  style?: React.CSSProperties;
  progressRef: RefObject<number>;
  onZoomProgress?: (progress: number) => void;
  /** Fires with the DOM node inside the 3D-tracked screen once mounted (and null on
   *  unmount) — the parent portals real page content into this node. */
  onScreenContainerRef: (el: HTMLDivElement | null) => void;
  /** With frameloop="demand", nothing renders unless invalidated. The parent's GSAP
   *  onUpdate lives outside the R3F tree, so it calls this (once populated) to kick off
   *  a render whenever scroll actually moves. */
  invalidateRef: RefObject<(() => void) | null>;
  /** Whether this is the pinned/active instance. The scene stays mounted permanently
   *  (never unmounts) to avoid reloading the GLTF on every scroll-back, so the tracked
   *  screen container must be explicitly hidden when inactive instead of relying on
   *  scroll-progress-based opacity, which stays maxed out once scrolled past. */
  active: boolean;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setShouldLoad(true); io.disconnect(); } },
      { rootMargin: '400px' }
    );
    io.observe(mount);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={mountRef} className={className} style={style}>
      {shouldLoad && (
        <Canvas
          gl={{ antialias: true, alpha: false }}
          camera={{ fov: 32, near: 0.1, far: 100, position: [0, 1.3, 3.4] }}
          style={{ width: '100%', height: '100%', display: 'block' }}
          // Render at device DPR (capped at 2). At DPR 1 on a HiDPI screen the chassis was
          // undersampled, so on SLOW scroll its crisp silver edges crawled/shimmered across
          // pixels — a rendering artifact, not motion (the animation values are perfectly
          // monotonic). Full device resolution + MSAA (antialias:true above) resolves those
          // edges so slow motion is clean. Affordable now that the real cost drivers are
          // Render at a MINIMUM of 1.5x, up to 2x. On a 1x display this is supersampling
          // (render hi-res, downscale) — the look-neutral cure for the shading/specular
          // aliasing that makes the metal chassis shimmer as it ROTATES. MSAA only smooths
          // geometry edges, not the per-pixel specular response of shiny metal under moving
          // light, so edge AA alone didn't stop it; supersampling averages that down. Capped
          // at 2 so a true Retina panel doesn't over-render. Affordable now the real cost
          // drivers (duplicate GLTF instances, missing disposal, backdrop-blur) are gone.
          dpr={[1.5, 2]}
          // Render every frame WHILE the macbook is the active/pinned element, and idle
          // (demand) once scrolled away. Pure "demand" left drei's <Html> transform frozen
          // on a stale camera matrix at the re-pin boundary (scrolling back UP), so the
          // portaled content snapped in from a wrong size/position across several frames.
          // Continuous rendering while active keeps that transform current every frame, so
          // the backward transition is as smooth as the forward one; going idle when
          // inactive preserves the framerate on the rest of the page.
          frameloop={active ? 'always' : 'demand'}
          onCreated={({ gl }) => {
            gl.outputColorSpace = THREE.SRGBColorSpace;
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.15;
            // The chassis fade-out is a CSS opacity fade on the canvas element itself
            // (see chassisFade in MacbookCore), not WebGL alpha blending — so alpha:true
            // was never actually needed for that effect. Opaque avoids the compositor
            // having to alpha-blend a large canvas every frame; match the white page
            // background explicitly so there's no visual change.
            gl.setClearColor(0xffffff, 1);
          }}
        >
          <MacbookCore
            progressRef={progressRef}
            onZoomProgress={onZoomProgress}
            onScreenContainerRef={onScreenContainerRef}
            invalidateRef={invalidateRef}
            active={active}
          />
        </Canvas>
      )}
    </div>
  );
}
