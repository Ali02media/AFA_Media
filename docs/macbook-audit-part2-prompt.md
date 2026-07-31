# PART 2 — further bugs (paste after the Part 1 audit prompt)

Everything in the Part 1 audit stands. These are additional findings from reading the remainder of `MacbookScene.tsx` (lines 175-490) and sweeping the wider codebase.

## BUG 10 — the entire camera framing is computed ONCE at model load and never recomputed on resize

Inside the GLTF `loader.load(...)` callback:
```js
const viewportHpx = gl.domElement.clientHeight || window.innerHeight;
dist = (trueW * viewportHpx) / (2 * SCREEN_W * Math.tan(halfVFov)) * ZOOM_END_PULLBACK;
const worldPerPx = (2 * dist * Math.tan(halfVFov)) / viewportHpx;
vNudgeWorld = (viewportHpx / 2 - screenHcss / 2 - 10) * worldPerPx;
zoomCamPos.current.copy(lidCenter).addScaledVector(worldNormal, dist);
```
`reqDist`, `initialCamPos`, `initialLookAt`, `dist`, `vNudgeWorld`, `zoomCamPos` and `zoomLookAt` are **all** derived from `viewportHpx` captured at load time. The enclosing `useEffect` has deps `[gl, camera, scene]` — all stable references in R3F — so it **never re-runs**.

Meanwhile the scroll range IS live: `end: () => '+=' + window.innerHeight * 4` (function form, re-evaluated on every `ScrollTrigger.refresh()`).

So on any window resize, browser-zoom change, devtools open/close, or mobile URL-bar show/hide, the **scroll range updates but the camera endpoint does not**. The zoom then lands somewhere other than where the dissolve expects, and the reveal misaligns with the calendar. This is a permanent desync that persists for the rest of the session.

**Fix:** extract the viewport-dependent framing into a function that takes the current viewport height, and call it both after load and on a debounced `resize` (and on `ScrollTrigger.refresh`). Do not leave `viewportHpx` captured in a closure that outlives the viewport it describes.

## BUG 11 — every `<Canvas>` prop is a fresh object/array literal, which can reset the camera

```jsx
<Canvas
  gl={{ antialias: true, alpha: false }}
  camera={{ fov: 32, near: 0.1, far: 100, position: [0, 1.3, 3.4] }}
  style={{ width: '100%', height: '100%', display: 'block' }}
  dpr={[1.5, 2]}
  frameloop={active ? 'always' : 'demand'}
```
`gl`, `camera`, `style` and `dpr` are new literals on **every render**, and `MacbookScene` re-renders whenever `active` flips — which now tracks `inView` from an IntersectionObserver, so it flips during normal scrolling.

R3F re-applies changed camera props via `applyProps`. A new `camera` object identity can therefore reset `camera.position` back to the default `[0, 1.3, 3.4]`, discarding the framing computed at load. Under `frameloop="demand"` (out of view) there is no subsequent frame to correct it, so the camera can be left at the wrong position entirely.

**Fix:** hoist all four to module-level constants so their identity is stable across renders. (Confidence on the reset mechanism firing today: medium-high. Confidence that hoisting is correct regardless: certain — it removes a whole class of intermittent, hard-to-reproduce behaviour.)

## BUG 12 — silent failure paths in the loader produce a blank section with no diagnostic

```js
if (!macbook) return;                                    // line 227
const screenNode = macbook.getObjectByName('Bevels_2');
const displayMesh = screenNode?.getObjectByName('Object_7');
```
If any of the hardcoded GLB node names stop matching the model, the callback returns early or silently skips: `setModelReady(true)` is never reached, `zoomReady` stays `false`, the camera never animates, and **nothing is logged**. The loader's own `onError` will not fire for a model that loads successfully but is named differently.

**Fix:** `console.error` on each miss, naming the node that was not found.

## BUG 13 — initial framing ignores aspect ratio, so the laptop can be clipped on wide/short viewports

`const reqDist = (topWorldY / 2 / Math.tan(halfVFov)) * 1.25;` frames purely against the **vertical** FOV. On a wide-but-short window the model can overflow horizontally. Compute the distance required to fit on **both** axes (using `halfVFov` together with the camera aspect for the horizontal case) and take the larger.

## BUG 14 — after fixing Bug 1, the MacBook screen becomes a blank grey panel — decide if that is intended

Lines 245-246 and 258-271 deliberately destroy the screen mesh's own texture:
```js
// the real content is provided by the live <Html> overlay, not this mesh's texture.
m.map = null;
m.emissiveMap = null;
m.color.set(0xf4f5f8);
```
That was correct when DOM content was composited over the screen. Once `ScreenFollower` is deleted (Bug 1), this leaves the laptop screen as a **flat, blank `#f4f5f8` panel** — the texture is being destroyed to make room for content that no longer exists.

**Decide explicitly:** either restore the GLB's original baked screen texture (stop nulling `map`/`emissiveMap`), or keep it blank if a clean panel is the intended look for something that dissolves away. Do not leave it as an accident. This is a visual/design call — if unsure, show the user both and ask.

## BUG 15 — dead files still in the source tree (~1,533 lines)

None of these are imported anywhere in `app/` or `components/`:
- `components/HeroScene.tsx`
- `components/hero-road-scene.tsx`
- `components/hero-canvas.tsx`
- `components/shader-bg.tsx`
- `components/three/hero-canvas.tsx`
- `components/three/scene.tsx`
- `components/sections/hero-motion.tsx`

Plus three stale backups **inside the source tree**:
- `components/sections/macbook-showcase.BEFORE-NOHANDOFF.tsx.bak`
- `components/sections/macbook-showcase.BEFORE-OPTION-B.tsx.bak`
- `components/sections/macbook-showcase.BEFORE-STRUCTURAL-FIX.tsx.bak`

The `.bak` files are not compiled, but they **actively pollute code search** — grepping for `SCREEN_W` currently returns three stale files alongside the real one, which has already caused confusion during this debugging. Verify each is genuinely unused (grep the whole repo, including dynamic imports), then delete. If the backups are worth keeping, move them outside `components/`.

## BUG 16 — the hero's decorative overlay is an unoptimized 176KB PNG

`components/sections/hero.jsx:118` renders a raw `<img src="/node-image-full.png">` — full-bleed, `position: absolute`, `mixBlendMode: 'lighten'`, with a `ref` driving a reveal effect. It is 176KB, unoptimized (no `next/image`, no responsive sizing, no modern format), and sits in the hero where it affects LCP. The `ref` plus blend mode make conversion non-trivial, so proceed carefully — but at minimum serve a compressed/WebP version.

## BUG 17 — the shadow plane is outside the model group

`shadowMesh` (a fixed 3×3 `PlaneGeometry` at `y = -0.01`) is added directly to `scene`, **not** to `loadedGroup`. It is therefore unaffected by the group's `normalizeScale` and `rotation.y = Math.PI`. It happens to look right at the default framing, but the relationship is coincidental rather than enforced. Verify it still sits correctly beneath the laptop across viewport sizes and through the full zoom, and consider parenting it to the group.

## Verification for Part 2
1. Resize the window mid-section (narrower/wider AND shorter/taller) and confirm the zoom endpoint still lands correctly on the calendar (Bug 10).
2. Confirm the camera never snaps to a default position when scrolling in and out of the section (Bug 11).
3. Temporarily rename one GLB node lookup to confirm an error is now logged rather than silently blank (Bug 12), then revert.
4. Check the laptop is fully in frame at a wide/short viewport, e.g. 1600×700 (Bug 13).
5. Screenshot the MacBook screen after Bug 1 is fixed and confirm the blank-panel look is intended (Bug 14).
6. Confirm the build still succeeds and the site is visually unchanged after deleting the dead files (Bug 15).
