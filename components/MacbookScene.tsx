'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// Perf 4.1: 11.80 MB → 1.49 MB (−87%). The original was 94% textures (36 images, 34 of them
// PNG, the largest a single 2.99 MB PNG) and shipped an iPhone model that the loader threw
// away at runtime. Rebuilt with gltf-transform: iPhone subtree removed at the source, vendor
// WEBGI_* extensions dropped, textures capped at 1024px and converted to WebP
// (EXT_texture_webp, natively supported by three's GLTFLoader). Draco geometry compression is
// preserved. Renamed since it no longer contains an iPhone.
const MODEL_URL   = '/models/macbook.glb';
const CLOSED_QUAT = new THREE.Quaternion(0, 0, 0, 1);
const OPEN_QUAT   = new THREE.Quaternion(-0.7833269096274834, 0, 0, 0.6216099682706644);

// ── Framing constants ───────────────────────────────────────────────────────────────────
// These are deliberate composition choices for the dissolve, NOT calibration against any
// other element. (They replace a pixel-matching system that existed to line the 3D screen up
// with a flat DOM copy during the old pin→flow handoff. There is no handoff and no flat copy:
// the MacBook simply zooms in and fades out to reveal the calendar behind it, so the only
// question these answer is "where should the laptop sit, and how close do we push in".)

/** Height of the fixed site navbar, in CSS px (`h-16` in navbar.tsx). The zoom endpoint
 *  centres the laptop screen in the space BELOW it — the same box the revealed calendar
 *  centres itself in — so the two agree by construction at any viewport height. */
const NAV_H = 64;

/** At full zoom the screen panel spans this fraction of the viewport width… */
const ZOOM_FILL_W = 0.92;
/** …and at most this fraction of the usable height (viewport minus navbar). The endpoint
 *  takes whichever constraint is tighter, so the panel stays fully in frame on wide-and-short
 *  windows instead of overflowing (it is framed on the vertical FOV alone otherwise). */
const ZOOM_FILL_H = 0.92;

// ── Canvas props, hoisted to module scope (Bug 11) ──────────────────────────────────────
// These were inline object/array literals, so every render of MacbookScene created fresh
// identities. MacbookScene re-renders whenever `active` flips — which now tracks an
// IntersectionObserver, so it flips during ordinary scrolling. R3F re-applies changed camera
// props via applyProps, and a new `camera` identity can reset camera.position back to this
// default, discarding the framing computed at load; under frameloop="demand" there may be no
// subsequent frame to correct it. Stable identities mean R3F sees nothing to re-apply.
const CANVAS_GL     = { antialias: true, alpha: false };
const CANVAS_CAMERA = { fov: 32, near: 0.1, far: 100, position: [0, 1.3, 3.4] as [number, number, number] };
const CANVAS_STYLE  = { width: '100%', height: '100%', display: 'block' } as const;
// Perf 4.4: was [1.5, 2] — a 1.5x MINIMUM meant 2.25x the pixels on a standard display, on
// top of MSAA (antialias above). That is belt-and-braces: MSAA already resolves the geometry
// edges, and the supersampling was added for specular shimmer on the rotating metal chassis.
// [1, 2] renders 1:1 on standard displays and still gives Retina panels their native detail.
const CANVAS_DPR    = [1, 2] as [number, number];

function onCanvasCreated({ gl }: { gl: THREE.WebGLRenderer }) {
  gl.outputColorSpace = THREE.SRGBColorSpace;
  gl.toneMapping = THREE.ACESFilmicToneMapping;
  gl.toneMappingExposure = 1.15;
  // The dissolve is a CSS opacity fade on the canvas element itself (see chassisFade in
  // MacbookCore), not WebGL alpha blending — so alpha:true was never needed for it. Opaque
  // avoids the compositor alpha-blending a large canvas every frame; the clear colour matches
  // the page background (--color-ink is #ffffff) so there is no visual seam.
  gl.setClearColor(0xffffff, 1);
}

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

function MacbookCore({
  progressRef,
  onZoomProgress,
  invalidateRef,
}: {
  progressRef: RefObject<number>;
  onZoomProgress?: (v: number) => void;
  /** Exposes R3F's `invalidate` (frameloop="demand" means nothing renders unless
   *  something calls this) to the parent, so GSAP's onUpdate — which lives outside the
   *  R3F tree — can kick off a render whenever scroll actually changes. */
  invalidateRef: RefObject<(() => void) | null>;
}) {
  const { gl, camera, scene, invalidate } = useThree();

  useEffect(() => {
    invalidateRef.current = invalidate;
    return () => { invalidateRef.current = null; };
  }, [invalidate, invalidateRef]);

  const screenNodeRef  = useRef<THREE.Object3D | null>(null);
  const displayMeshRef = useRef<THREE.Mesh | null>(null);
  const initialCamPos  = useRef(new THREE.Vector3());
  const initialLookAt  = useRef(new THREE.Vector3());
  const zoomCamPos     = useRef(new THREE.Vector3());
  const zoomLookAt     = useRef(new THREE.Vector3());
  const zoomReady      = useRef(false);
  const displayedP     = useRef(0);

  /** Everything about the loaded model that camera framing depends on. Captured once at load;
   *  the framing itself is derived from it on every viewport change (see applyFraming). */
  const geomRef = useRef<{
    topWorldY: number; midY: number; halfW: number;
    lidCenter: THREE.Vector3; worldNormal: THREE.Vector3;
    trueW: number; trueH: number;
  } | null>(null);

  /** Derive BOTH camera endpoints from the CURRENT viewport.
   *
   *  Bug 10: these used to be computed once inside the GLTF callback from a `viewportHpx`
   *  captured at load time, in an effect keyed on [gl, camera, scene] (all stable in R3F) —
   *  so it never re-ran. Meanwhile the scroll range IS live (`end: () => innerHeight * 4`,
   *  re-evaluated on every ScrollTrigger.refresh), so any resize, browser-zoom change or
   *  mobile URL-bar movement left the camera endpoint permanently desynced from the scroll
   *  range for the rest of the session. Now nothing viewport-derived outlives its viewport. */
  const applyFraming = useCallback(() => {
    const g = geomRef.current;
    if (!g) return;
    const pc   = camera as THREE.PerspectiveCamera;
    const vw   = gl.domElement.clientWidth  || window.innerWidth;
    const vh   = gl.domElement.clientHeight || window.innerHeight;
    const tanV = Math.tan(THREE.MathUtils.degToRad(pc.fov / 2));
    const tanH = tanV * (vw / vh);

    // ── Zoom START: the whole laptop in frame, sitting slightly above centre.
    // Bug 13: this framed purely against the vertical FOV, so on a wide-but-short window the
    // model could overflow horizontally. Fit both axes and take whichever needs more room.
    const reqDist = Math.max((g.topWorldY / 2) / tanV, g.halfW / tanH) * 1.25;
    initialCamPos.current.set(0, g.midY + g.topWorldY * 0.12, reqDist);
    initialLookAt.current.set(0, g.midY, 0);

    // ── Zoom END: the screen panel filling the frame, just before it dissolves.
    // Perspective projects a world span `w` at distance `d` to  w * vh / (2·d·tanV)  px.
    // Solve that for the `d` hitting each fill target and take the further one, so whichever
    // axis is the tighter constraint is the one that ends up satisfied.
    const dist = Math.max(
      (g.trueW * vh) / (2 * (ZOOM_FILL_W * vw) * tanV),
      (g.trueH * vh) / (2 * (ZOOM_FILL_H * Math.max(1, vh - NAV_H)) * tanV),
    );

    // Centre the panel in the space BELOW the navbar rather than in the raw viewport — the
    // same box the revealed calendar centres itself in, so the two agree at any height with
    // no magic constant. Raising camera and aim together moves the subject DOWN on screen.
    const vNudgeWorld = (NAV_H / 2) * ((2 * dist * tanV) / vh);

    zoomCamPos.current.copy(g.lidCenter).addScaledVector(g.worldNormal, dist);
    zoomLookAt.current.copy(g.lidCenter);
    zoomCamPos.current.y += vNudgeWorld;
    zoomLookAt.current.y += vNudgeWorld;

    pc.updateProjectionMatrix();
    invalidate();
  }, [camera, gl, invalidate]);

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
    // Bug 17: added to the SCENE, deliberately — not to the model group. The group carries a
    // model-dependent `normalizeScale` and a 180° Y rotation; parenting the shadow to it would
    // scale this fixed 3×3 plane by an arbitrary factor. The model is normalised to ~3.1 world
    // units and centred on the origin with its base at y=0, so a 3×3 plane at y=-0.01 in scene
    // space sits correctly beneath it by construction, independent of viewport size.
    scene.add(shadowMesh);

    const draco = new DRACOLoader();
    // Perf 4.6: self-hosted (copied from three/examples/jsm/libs/draco/gltf at install time)
    // rather than fetched from gstatic. The CDN added a third-party round-trip before decoding
    // could even start, and made the model a hard dependency on a host we don't control — if
    // gstatic is slow or blocked, the MacBook never appears at all. Same origin = no extra
    // DNS/TLS, cacheable with the rest of the site, and version-locked to our three build.
    draco.setDecoderPath('/draco/');
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);

    loader.load(MODEL_URL, (gltf) => {
      if (disposed) return;

      const root    = gltf.scene;
      const macbook = root.getObjectByName('macbook');
      // (The runtime `iphone.removeFromParent()` that used to sit here is gone — the iPhone is
      // no longer IN the GLB, so it is no longer downloaded and decoded just to be discarded.)
      // Bug 12: these node names are hardcoded against the GLB's authoring. If the model is
      // ever re-exported with different names the callback silently bailed — no model, no
      // camera animation, and nothing logged (onError only fires for transport failures, not
      // for a file that loads fine but is named differently). Say so instead.
      if (!macbook) {
        console.error('[MacbookScene] node "macbook" not found in', MODEL_URL,
          '— available:', root.children.map((c) => c.name));
        return;
      }

      const screenNode = macbook.getObjectByName('Bevels_2') as THREE.Object3D | null;
      if (screenNode) screenNodeRef.current = screenNode;
      else console.error('[MacbookScene] screen node "Bevels_2" not found — lid will not open.');

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

      // Remove glare on the lid assembly.
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

      // The screen panel is deliberately left as a plain near-white surface (Bug 14).
      // It used to be blanked to make room for DOM content composited over it; that content
      // is gone, and blank is still the right answer here — the canvas clear colour is white
      // and the page behind is white, so zooming into a near-white panel that then fades out
      // reads as a clean WHITEOUT dissolving straight into the booking calendar. Restoring
      // the GLB's baked texture would put a generic off-brand wallpaper in the middle of the
      // shot; a calendar screenshot would have to be a Three.js texture (never DOM) to avoid
      // reintroducing the overlay bug that caused all the jitter.
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
      } else if (screenNode) {
        console.error('[MacbookScene] display mesh "Object_7" not found — zoom framing will ' +
          'fall back to an approximate panel size.');
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

      const topWorldY = (unionBox.max.y - closedBox.min.y) * normalizeScale;
      const midY      = topWorldY / 2;
      const halfW     = (unionSize.x * normalizeScale) / 2;

      if (screenNode) {
        screenNode.quaternion.copy(OPEN_QUAT);
        scene.updateMatrixWorld(true);
        const lidBox    = new THREE.Box3().setFromObject(screenNode);
        const lidCenter = lidBox.getCenter(new THREE.Vector3());
        // Fallbacks if the mesh basis can't be derived below (screen mesh missing or
        // untextured): a rough panel size, so the zoom still lands somewhere sensible.
        let trueW = topWorldY * 0.6;
        let trueH = topWorldY * 0.4;

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
          trueW = (maxT - minT) * worldScale.x;
          trueH = (maxB - minB) * worldScale.y;
        }

        // Hand the model-derived geometry to applyFraming, which turns it into camera
        // endpoints against whatever the viewport happens to be — now and after any resize.
        geomRef.current = { topWorldY, midY, halfW, lidCenter, worldNormal, trueW, trueH };
        applyFraming();

        screenNode.quaternion.copy(CLOSED_QUAT);
        scene.updateMatrixWorld(true);
        zoomReady.current = true;
      }

      // Seed the eased value at wherever scroll already is, so the first frame after the
      // model finishes loading doesn't ease up from a stale 0 (which, if the user has
      // already scrolled into the lid-open range while it was still decoding, snaps the
      // model open in one lurch — the one-time "bounce").
      displayedP.current = (progressRef.current ?? 0) * 2;
      // Under frameloop="demand" nothing renders unless something asks. Request a frame so
      // the just-loaded model appears immediately rather than waiting for the next scroll.
      invalidate();
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
      geomRef.current = null;
    };
  }, [gl, camera, scene, applyFraming]);

  // Bug 10: re-derive the framing whenever the viewport changes. Debounced so a drag-resize
  // recomputes once it settles rather than on every intermediate pixel.
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const onResize = () => { clearTimeout(t); t = setTimeout(applyFraming, 150); };
    window.addEventListener('resize', onResize);
    return () => { clearTimeout(t); window.removeEventListener('resize', onResize); };
  }, [applyFraming]);

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

    // THE DISSOLVE. Fade the whole canvas out over the second half of the zoom (dp 1.4→2.0,
    // roughly 1080px of scroll) to reveal the flat booking calendar sitting behind it.
    // Driven by the already-smoothed `dp` rather than raw scroll, so it inherits the same
    // gentle inertia as the lid/zoom motion instead of tracking the wheel 1:1.
    // Nothing else renders over the canvas, so this fade is the complete reveal.
    const chassisFade = THREE.MathUtils.clamp((dp - 1.4) / 0.6, 0, 1);
    gl.domElement.style.opacity = String(1 - chassisFade);

    if (screenNodeRef.current) {
      screenNodeRef.current.quaternion.slerpQuaternions(
        CLOSED_QUAT, OPEN_QUAT,
        THREE.MathUtils.clamp(dp, 0, 1)
      );
    }

    // KEEP-AS-IS, for a NEW reason. This dwell originally existed to park the camera before
    // the old pin→flow handoff fired. There is no handoff now — but ÷0.97 still earns its
    // place: it makes the zoom reach its endpoint at dp≈1.97 (progress ≈0.985) and HOLD for
    // the last ~48px, so the final stretch of the dissolve happens with the camera already
    // still. A moving camera under a fading canvas reads as a smear; a settled one reads as a
    // clean cross-fade into the calendar. Small enough (~48px) never to feel like a stall —
    // unlike the ÷0.8 (~320px) that was correctly rejected earlier as a visible stop.
    //
    // (Historical note: this block used to justify itself via the old handoff thresholds —
    // 0.995/0.999, and a flow slot becoming viewport-anchored at p=0.99. None of those exist.)
    const rawZoom = THREE.MathUtils.clamp((dp - 1) / 0.97, 0, 1);
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
    </>
  );
}

export default function MacbookScene({
  className,
  style,
  progressRef,
  onZoomProgress,
  invalidateRef,
  active,
}: {
  className?: string;
  style?: React.CSSProperties;
  progressRef: RefObject<number>;
  onZoomProgress?: (progress: number) => void;
  /** With frameloop="demand", nothing renders unless invalidated. The parent's GSAP
   *  onUpdate lives outside the R3F tree, so it calls this (once populated) to kick off
   *  a render whenever scroll actually moves. */
  invalidateRef: RefObject<(() => void) | null>;
  /** Whether the section is on screen. Drives frameloop only: render every frame while
   *  the user is scrolling through the section, idle at zero GPU cost once past it. */
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
          gl={CANVAS_GL}
          camera={CANVAS_CAMERA}
          style={CANVAS_STYLE}
          dpr={CANVAS_DPR}
          // Render every frame while the section is on screen; idle (demand) once scrolled
          // away, so the 3D costs nothing on the rest of the page. `invalidate()` is called
          // from the parent's scroll handler and from the ease loop, so demand mode still
          // catches up correctly.
          frameloop={active ? 'always' : 'demand'}
          onCreated={onCanvasCreated}
        >
          <MacbookCore
            progressRef={progressRef}
            onZoomProgress={onZoomProgress}
            invalidateRef={invalidateRef}
          />
        </Canvas>
      )}
    </div>
  );
}
