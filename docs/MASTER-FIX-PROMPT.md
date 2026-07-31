# MASTER FIX PROMPT — AFA Media site: 33 bugs + all performance issues

## How to work through this

This is a full audit of the AFA Media Next.js site. It is ordered so that the highest-value, lowest-risk work happens first. **Work in phases and stop at the checkpoints.** Do not attempt all of it in one pass.

Ground rules:
- Read every file you touch **in full** before editing. This codebase has been through many rounds of fixes and is dense with load-bearing detail.
- Note `AGENTS.md`: this is a modified Next.js — read `node_modules/next/dist/docs/` before touching Next-specific APIs.
- Several claims below are marked with confidence levels. **Verify before acting** — do not trust this document over what the code actually says.
- After each phase, report what changed with `file:line` before continuing.

Key architectural context you need up front: `components/sections/macbook-showcase.tsx` was **rewritten** to a "dissolve-to-reveal" design — nothing lives inside the 3D screen any more; the MacBook chassis fades to opacity 0 to reveal a flat Cal.com booking calendar sitting behind it. **But `components/MacbookScene.tsx` was never updated to match**, and still contains the entire "render page content inside the 3D screen" subsystem from the old architecture. That mismatch is the source of most of the MacBook bugs.

---

# PHASE 0 — Zero-risk deletions and verification

Do these first. They are pure subtraction, nothing can regress, and they make the remaining work easier by removing noise from code search.

## 0.1 — Delete orphaned video files (~40.6 MB)
- `public/hero-atom-nobg.mp4` (29 MB)
- `public/hero-video.mp4` (8.1 MB)
- `public/hero-atom.webm` (3.5 MB)

Verified unreferenced: a full-repo grep for `.mp4`, `.webm`, `<video`, `hero-atom`, `hero-video` and `atom` across `app/`, `components/`, `lib/` and all CSS returns nothing. Re-verify yourself, then delete.

**Set expectations correctly:** these are NOT a visitor-facing performance problem. Unreferenced files in `public/` are never requested, so they cost visitors 0 bytes. Deleting them saves ~40 MB per git clone and per deploy, and speeds up CI — it will not make the site load faster. Do not report this as a page-speed win.

## 0.2 — Delete dead source files (~1,533 lines)
None of these are imported anywhere in `app/` or `components/`:
- `components/HeroScene.tsx`
- `components/hero-road-scene.tsx`
- `components/hero-canvas.tsx`
- `components/shader-bg.tsx`
- `components/three/hero-canvas.tsx`
- `components/three/scene.tsx`
- `components/sections/hero-motion.tsx`

Grep the whole repo (including dynamic imports) to confirm before deleting.

## 0.3 — Remove stale backups from the source tree
- `components/sections/macbook-showcase.BEFORE-NOHANDOFF.tsx.bak`
- `components/sections/macbook-showcase.BEFORE-OPTION-B.tsx.bak`
- `components/sections/macbook-showcase.BEFORE-STRUCTURAL-FIX.tsx.bak`

These are not compiled, but they **actively pollute code search** — grepping `SCREEN_W` currently returns three stale files alongside the real one, which has already misled debugging in this project. Delete, or move outside `components/`.

**Checkpoint:** confirm `npm run build` still succeeds and the site is visually unchanged.

---

# PHASE 1 — THE critical bug. Fix this alone, then STOP and re-test.

## BUG 1 — An orphaned opaque white panel floats over the calendar and moves every frame

This is almost certainly the entire visible problem (jitter, glitching, calendar disappearing). **Fix only this, then re-test before touching anything else.** If the symptoms vanish, that changes how you should judge everything below.

`MacbookScene.tsx:584-595` still renders `<ScreenFollower>` whenever `modelReady`. `ScreenFollower` (lines 64-152) renders a drei `<Html transform>` whose child div is:

```jsx
style={{
  width: SCREEN_W,        // 1280
  height: screenH,
  overflow: 'hidden',
  borderRadius: 3,
  background: '#ffffff',  // ← OPAQUE WHITE
  boxShadow: 'inset 0 0 16px rgba(0,0,0,0.12)',
}}
```

Nothing is rendered into it any more — `macbook-showcase.tsx:123` passes `onScreenContainerRef={() => {}}`. It is an **empty opaque white rectangle**.

Its opacity (lines 121-132): when `active`, `opacity = smoothstep(dp over [0.12, 0.30])` — i.e. **1.0 for every `dp ≥ 0.3`**, and it never returns to 0. `active` is now `desktop && inView`, and `inView` comes from an IntersectionObserver on the **entire 500vh section** with `rootMargin: '200px'`, so it is true throughout.

**The decisive detail:** drei's `<Html>` renders into a **DOM overlay, not the canvas raster**. The dissolve at line 532 —
```js
gl.domElement.style.opacity = String(1 - chassisFade);
```
— fades **only the `<canvas>` element**. The comment at lines 528-530 states this explicitly ("lives in a separate DOM overlay (drei's Html), not the canvas raster, so it stays fully visible throughout regardless of this fade"). That was correct and intended when real content lived in the screen. Now it means:

> As the MacBook chassis dissolves away, a 1280px-wide **opaque white rectangle stays at full opacity**, sitting on top of the booking calendar and hiding it.

And because `<Html transform>` rewrites its `matrix3d` **every frame** from the live camera, that rectangle **slides, scales and skews continuously as you scroll**, directly over the calendar. That is the jitter, the bounce, and the "calendar disappears" symptom — all three, from one cause.

### Fix
Delete `ScreenFollower` and everything that exists solely to serve it:
- the `ScreenFollower` component (lines 64-152) and its render site (lines 584-595)
- the `Html` import from `@react-three/drei` (line 5)
- `SCREEN_W` (line 22) — grep first; nothing in the live tree imports it once the `.bak` files are gone
- `DP_REVEAL_START` / `DP_REVEAL_END` (lines 29-30)
- `distanceFactor` / `setDistanceFactor`, `screenH` / `setScreenH` state
- `normalCorrectionRef`, `centroidLocalRef`
- the `onScreenContainerRef` prop on **both** `MacbookCore` and `MacbookScene`, and the `onScreenContainerRef={() => {}}` at the call site
- the entire UV-tangent-basis derivation block inside the GLTF `load` callback (the non-degenerate-triangle scan, the tangent/bitangent/normal construction, and the vertex-projection loop computing `minT/maxT/minB/maxB`) — it exists **only** to compute `distanceFactor`, `screenH`, `normalCorrection` and the panel centroid. Keep `trueW`/`trueH` only if the camera-distance calculation still needs them (see Bug 2).

**Do not** merely set its opacity to 0 or hide it. A hidden 1280px DOM node still being transformed every frame is exactly the class of thing causing these symptoms. Delete it.

**CHECKPOINT — STOP HERE.** Re-test the full scroll. Report explicitly whether Bug 1 alone resolved the visible jitter. Do not proceed until you have.

---

# PHASE 2 — MacBook correctness

## BUG 2 — Vestigial camera framing math
`MacbookScene.tsx` ~line 443:
```js
const screenHcss  = (SCREEN_W * (trueH / trueW)) / ZOOM_END_PULLBACK;
const worldPerPx  = (2 * dist * Math.tan(halfVFov)) / viewportHpx;
vNudgeWorld = (viewportHpx / 2 - screenHcss / 2 - 10) * worldPerPx;
```
This pan existed **only** to align DOM content inside the 3D screen with the top edge of a flat DOM copy during the old handoff. There is no flat copy and no handoff. It still pans the camera, so the laptop is framed off-centre to satisfy a deleted constraint — including a hardcoded, underived `- 10`.

Same for `ZOOM_END_PULLBACK` (line 40, currently `0.991`): its comment (lines 32-39) describes size-matching content across a "pin→flow swap" that no longer exists. Its only remaining effect is how close the camera stops.

**Fix:** re-derive both as deliberate framing choices for the dissolve — "where should the laptop sit, and how close should we push in before it fades" — and rewrite the comments to say that. No magic numbers whose stated justification is gone.

## BUG 10 — Camera framing computed once at load, never recomputed on resize
Inside the GLTF `loader.load(...)` callback:
```js
const viewportHpx = gl.domElement.clientHeight || window.innerHeight;
dist = (trueW * viewportHpx) / (2 * SCREEN_W * Math.tan(halfVFov)) * ZOOM_END_PULLBACK;
vNudgeWorld = (viewportHpx / 2 - screenHcss / 2 - 10) * worldPerPx;
zoomCamPos.current.copy(lidCenter).addScaledVector(worldNormal, dist);
```
`reqDist`, `initialCamPos`, `initialLookAt`, `dist`, `vNudgeWorld`, `zoomCamPos` and `zoomLookAt` are **all** derived from `viewportHpx` captured at load time. The enclosing `useEffect` has deps `[gl, camera, scene]` — all stable in R3F — so it **never re-runs**.

Meanwhile the scroll range IS live: `end: () => '+=' + window.innerHeight * 4` is re-evaluated on every `ScrollTrigger.refresh()`.

So on any window resize, browser-zoom change, devtools toggle, or mobile URL-bar movement, the **scroll range updates but the camera endpoint does not** — a permanent desync for the rest of the session.

**Fix:** extract the viewport-dependent framing into a function taking the current viewport height; call it after load and on a debounced `resize` (and on `ScrollTrigger.refresh`). Never leave `viewportHpx` captured in a closure that outlives the viewport it describes.

## BUG 11 — Every `<Canvas>` prop is a fresh literal, which can reset the camera
```jsx
<Canvas
  gl={{ antialias: true, alpha: false }}
  camera={{ fov: 32, near: 0.1, far: 100, position: [0, 1.3, 3.4] }}
  style={{ width: '100%', height: '100%', display: 'block' }}
  dpr={[1.5, 2]}
  frameloop={active ? 'always' : 'demand'}
```
`gl`, `camera`, `style` and `dpr` are new literals on **every render**, and `MacbookScene` re-renders whenever `active` flips — which now tracks `inView`, so it flips during normal scrolling. R3F re-applies changed camera props via `applyProps`, so a new `camera` identity can reset `camera.position` back to `[0, 1.3, 3.4]`, discarding the framing computed at load. Under `frameloop="demand"` there is no subsequent frame to correct it.

**Fix:** hoist all four to module-level constants. (Confidence the reset fires today: medium-high. Confidence hoisting is correct regardless: certain.)

## BUG 12 — Silent loader failures
```js
if (!macbook) return;                                    // line 227
const screenNode = macbook.getObjectByName('Bevels_2');
const displayMesh = screenNode?.getObjectByName('Object_7');
```
If any hardcoded GLB node name stops matching, the callback returns early or silently skips: `setModelReady(true)` is never reached, `zoomReady` stays `false`, the camera never animates, and **nothing is logged**. `onError` will not fire for a model that loads fine but is named differently.

**Fix:** `console.error` on each miss, naming the node not found.

## BUG 13 — Initial framing ignores aspect ratio
`const reqDist = (topWorldY / 2 / Math.tan(halfVFov)) * 1.25;` frames purely against the **vertical** FOV. On a wide-but-short window the model can overflow horizontally. Compute the distance needed to fit on **both** axes (using `halfVFov` with the camera aspect for the horizontal case) and take the larger.

## BUG 17 — Shadow plane is outside the model group
`shadowMesh` (a fixed 3×3 `PlaneGeometry` at `y = -0.01`) is added directly to `scene`, **not** to `loadedGroup`, so it is unaffected by the group's `normalizeScale` and `rotation.y = Math.PI`. It looks right by coincidence, not by construction. Verify it sits correctly beneath the laptop across viewport sizes and through the full zoom; consider parenting it to the group.

## BUG 14 — DESIGN DECISION: after Bug 1, the MacBook screen is a blank panel
Lines 245-246 and 258-271 deliberately destroy the screen mesh's texture:
```js
// the real content is provided by the live <Html> overlay, not this mesh's texture.
m.map = null;
m.emissiveMap = null;
m.color.set(0xf4f5f8);
```
Correct when DOM content was composited over the screen. Once `ScreenFollower` is gone, this leaves the laptop screen as a **flat, blank `#f4f5f8` panel** — the texture is destroyed to make room for content that no longer exists.

Three options — **ask the user, do not decide silently:**
1. **Leave blank.** The canvas clear colour is white and the screen is near-white, so the zoom becomes a natural whiteout dissolving into the calendar. Cleanest, zero work.
2. **Restore the GLB's baked texture** (stop nulling `map`/`emissiveMap`). Likely a generic wallpaper unrelated to the brand.
3. **Apply a static screenshot of the calendar as a Three.js texture.** Best storytelling — you fly into a preview that becomes the real thing. Must be a **texture, not DOM**, so it cannot reintroduce the Bug 1 class of problem.

---

# PHASE 3 — MacBook layout, scroll and robustness

## BUG 4 — Cal.com embed resizes the document async and desyncs ScrollTrigger
`components/booking-calendar.tsx` loads `https://app.cal.com/embed/embed.js` in a `useEffect`; Cal injects an **auto-resizing iframe** into `#afa-cal-inline` after first paint, and it can resize again (month navigation, slot view, breakpoints).

The embed sits **inside** the MacbookShowcase section (`macbook-showcase.tsx:167-171`). Whenever it loads or resizes, the section's height changes, ScrollTrigger's cached start/end go stale, and progress silently jumps.

The only refresh is inadequate (`macbook-showcase.tsx:92-98`):
```js
document.fonts?.ready?.then(() => {
  const t = triggerRef.current;
  if (!t || t.isActive) return;   // ← skipped entirely if you're already in the section
  t.refresh();
});
```
It fires **once**, on font-ready, and is **skipped if the trigger is active**. Cal's load almost certainly lands after that. This is a strong candidate for jitter that appears "randomly" — it fires at a different scroll position every reload.

**Fix:** attach a `ResizeObserver` to `#afa-cal-inline` (and/or the injected iframe) and call `ScrollTrigger.refresh()` debounced (~100-200ms) when its size settles. Reserve a fixed height so the load does not reflow at all — the wrapper sets `height: 680`, but Cal's iframe may override it; measure actual rendered height before and after load and pin it if they differ. Reconsider whether `t.isActive` should skip the refresh at all.

## BUG 25 — Stale layout comment, and the real risk behind it
`macbook-showcase.tsx:28` says:
```
// Layout (desktop; hero above is exactly 100vh so the section top sits at document y=100vh):
```
But `app/page.tsx` renders `<MacbookShowcase />` **tenth**, after Hero, TrustBar, Problem, ServicesSection, Proof, PricingPreview, CTA, ProcessSection and a short FAQ. The section top is thousands of pixels down the page.

The maths still works (`start: 'top top'` is element-relative, so position-independent) — but fix the comment, and state that the trigger is position-independent so nobody "corrects" the page order to satisfy it.

**The real risk:** the section now sits below ~9 sections of images, fonts and `Reveal` animations. Any late layout shift above it invalidates ScrollTrigger's cached geometry — and per Bug 4 the only `refresh()` fires once and is skipped when active. **Moving the MacBook down the page made Bug 4 far more likely to bite than when it sat under the hero.** Fix Bug 4 properly and this largely resolves.

## BUG 5 — Nested scroll container steals wheel events at the reveal
`booking-calendar.tsx` renders `style={{ width: "100%", height: "100%", overflow: "auto", ...style }}`. `overflow: auto` makes the embed its own scroll container, inside an `overflow-hidden` card, inside a `min-h-screen` box that fills the viewport at the reveal — so **the cursor is over a scrollable child** exactly when the user is scrolling through the animation. Wheel events scroll the calendar first and only chain to the page once it hits its end. Reads as "scrolling sticks / stutters", independent of all the 3D math.

**Fix:** size the container to its content so it never needs its own scrollbar (drop `overflow: 'auto'`, or use `'hidden'`). If internal scrolling is genuinely required, set `overscroll-behavior: contain` deliberately.

## BUG 6 + BUG 18 — The reveal target is mispositioned, and the navbar covers it
Solve these together; both are about where the calendar actually sits.

`macbook-showcase.tsx:167`:
```jsx
<div className="relative z-0 flex min-h-screen w-full items-center justify-center px-4 pb-24">
  <div className="w-full max-w-4xl ..."><BookingCalendar style={{ height: 680 }} /></div>
```
`items-center` centres the 680px card in a `100vh` box that also has `pb-24` (96px), so the card's top offset is `(100vh − 96 − 680) / 2`. Meanwhile `navbar.tsx:35` is `fixed inset-x-0 top-0 z-50` with an `h-16` (**64px**) bar:

| viewport height | card top | hidden behind navbar |
|---|---|---|
| 768px | 0px (overflows) | **64px** |
| 800px | 12px | **52px** |
| 900px | 62px | 2px |
| 1000px | 112px | clears by 48px |
| 1200px | 212px | clears by 148px |

So on any viewport **shorter than ~900px** — most laptops — the calendar's header sits underneath the navbar, and the reveal target drifts by 200px between short and tall screens while the camera framing stays fixed.

**Fix:** anchor the calendar to the top rather than centring it, with top padding at least the navbar height (`pt-16`+). Then make the camera framing from Bug 2 / Bug 10 agree with wherever it lands, across viewport heights.

## BUG 7 — Section height and ScrollTrigger range agree only by coincidence
Section = stage `h-screen` (100vh) + spacer (300vh) + calendar `min-h-screen` (100vh) = 500vh. ScrollTrigger `end` is a fixed `'+=' + window.innerHeight * 4` (400vh). The sticky stage releases at `sectionBottom − 100vh`. These coincide **only while the calendar box is exactly 100vh** — but its content is `680 + 96 = 776px`, so on any viewport shorter than 776px the box grows and the section exceeds 500vh. Derive one from the other rather than leaving two independent constants that must happen to match.

## BUG 19 — The MacBook animation ignores `prefers-reduced-motion` entirely
`app/globals.css:70-73`:
```css
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  * { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
}
```
This kills **CSS** animation only. The MacBook sequence is GSAP + R3F in **JavaScript**, so a reduced-motion visitor still gets the full 400vh scroll-hijacked 3D zoom — the largest piece of motion on the site — while every harmless CSS transition is disabled. Backwards, and a WCAG 2.3.3 concern. The project's own tester has reduced motion enabled, so this is not hypothetical.

**Fix:** honour the preference — when `matchMedia('(prefers-reduced-motion: reduce)').matches`, skip the scroll-driven zoom and render the calendar as a static section. The mobile branch at `macbook-showcase.tsx:101-111` already does exactly this, so it is mostly a matter of routing reduced-motion users down the existing path. Check reactively, not only on mount.

**Do not** use this as a way to dodge the other fixes — the animation must be correct for visitors who do not have it enabled.

---

# PHASE 4 — Performance

Ordered by real visitor impact. **Item 4.1 is by far the biggest win on the site.**

## 4.1 — The MacBook model is 11.8 MB, and 94% of it is textures
`public/models/tabletop_macbook_iphone.glb` — verified by parsing the file:
- **11.06 MB of 11.80 MB (94%) is textures** — 36 images, 34 of them PNG
- Largest single texture: **2.99 MB PNG**; then 1.11, 1.05, 0.98, 0.93, 0.54, 0.49, 0.48 MB
- Geometry is **already Draco-compressed** (`KHR_draco_mesh_compression` present) — geometry is not the problem
- 154 nodes, 109 meshes
- Also carries unused `WEBGI_*` extensions (exported from a webgi viewer); three.js ignores them

And the code downloads then discards a large share of it:
- `if (iphone) iphone.removeFromParent();` — **the iPhone is still inside the GLB**, downloaded and parsed, then thrown away at runtime
- `m.map = null; m.emissiveMap = null;` — the screen texture is downloaded, then nulled
- `envMapIntensity = 0` on the lid

**Fixes, in impact order:**
1. **Delete the iPhone from the GLB itself** (Blender or `gltf-transform`), not at runtime.
2. **Convert textures to KTX2/Basis** (`gltf-transform etc1s` or `uastc`) — typically 5-10× smaller *and* GPU-native, so lower VRAM and faster upload. Requires `KHR_texture_basisu` plus a `KTX2Loader` wired into the loader.
3. Failing that: resize oversized textures (that 2.99 MB PNG is almost certainly far larger than its rendered size) and convert non-alpha PNGs to WebP/JPEG.
4. Drop textures the code discards anyway.

**Target: 11.8 MB → under 2 MB.**

Mitigation to be aware of: it is lazy-loaded via IntersectionObserver (`rootMargin: '400px'`), so it does not block first paint. But the section now sits near the bottom of the page, so anyone scrolling that far triggers it — and 12 MB on mobile data is severe.

## 4.2 — The hero repaints a full-screen blended, masked layer on every mousemove
This is the worst *runtime* (as opposed to load) cost on the site.

`hero.jsx:29-46` writes CSS custom properties on every `mousemove`, unthrottled:
```jsx
el.style.setProperty('--mx', `${x}px`);
el.style.setProperty('--my', `${y}px`);
```
Those drive the mask on a full-viewport image at `hero.jsx:118-140`:
```jsx
width: '100%', height: '100%', objectFit: 'cover',
mixBlendMode: 'lighten',
WebkitMaskImage: 'radial-gradient(circle at var(--mx) var(--my), ...)',
```
Every mouse movement invalidates a **full-viewport masked layer that also has `mix-blend-mode: lighten`**. Blend modes force the compositor to read back the backdrop; the mask change forces re-rasterisation. All on top of **two** WebGL canvases already rendering every frame in the same hero. Mousemove fires up to ~120×/second.

**Fix:** coalesce into one write per animation frame (store latest x/y, write inside `requestAnimationFrame`, skip if a frame is pending). If still heavy, reimplement as a `transform: translate3d(...)` on a small compositor-promoted element rather than animating a mask position on a full-screen blended layer.

## 4.3 — LaserFlow runs on mobile with no gate
`hero.jsx:14-21` gates **Plasma** behind `matchMedia('(min-width: 1024px)')`, but `<LaserFlow>` at line 62 has **no such gate** — a full WebGL shader on every phone. Given Plasma was deliberately excluded from mobile for cost, LaserFlow should be too, or run at a reduced quality tier.

**Note — do NOT "add" IntersectionObserver pausing to these.** Both `LaserFlow.jsx` and `Plasma.jsx` **already** have `IntersectionObserver` + `visibilitychange` gating and bail out when offscreen (`LaserFlow.jsx:486`, `Plasma.jsx:182`). They are not competing for frames at the MacBook section. This is already correct.

## 4.4 — MacBook canvas is over-rendering
`dpr={[1.5, 2]}` sets a **minimum** of 1.5× supersampling — 2.25× the pixels on a standard display — plus `antialias: true` (MSAA) on top. Combined with `frameloop='always'` across ~600vh of scroll (see 4.5). Re-evaluate: MSAA plus 1.5× minimum supersampling is belt-and-braces. Try `dpr={[1, 2]}` and measure whether the chassis shimmer the comment describes actually returns.

## 4.5 — `frameloop: 'always'` across ~600vh
`active = desktop && inView`, where `inView` observes the **entire 500vh section** with `rootMargin: '200px'`. So the canvas renders **every frame** across roughly 600vh of scroll, including while the user sits still. Gate tighter — only while the stage is actually stuck (`0 ≤ progress ≤ 1`), or drop to `'demand'` after scroll has been idle briefly. `invalidate()` is already called from `onUpdate`, so demand mode still animates correctly while scrolling.

## 4.6 — DRACO decoder loaded from a third-party CDN
`MacbookScene.tsx:216` — `draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.5/')`. An extra third-party round-trip before decoding can start, and a hard dependency: if gstatic is slow or blocked, the model never appears at all. Self-host the decoder in `public/`.

## 4.7 — Unoptimized hero image
`hero.jsx:118` — raw `<img src="/node-image-full.png">`, **176 KB**, full-bleed with `mixBlendMode: 'lighten'` and a `ref` driving the reveal. No `next/image`, no responsive sizing, no modern format, and it sits in the LCP path. The `ref` + blend mode make conversion non-trivial — at minimum serve a compressed WebP.

## 4.8 — Three WebGL contexts on one page
LaserFlow + Plasma (hero) + MacBook. Within browser limits, but each costs memory. Worth confirming all three release their contexts on unmount, especially across client-side navigations.

**Fonts are already correct — do not change them.** Both `Slabo_27px` and `Inter` use `subsets: ["latin"]` and `display: "swap"`, with Slabo pinned to `weight: "400"`.

---

# PHASE 5 — Cal.com integration

## BUG 21 — Cal is initialised TWICE on the same namespace with conflicting config
`lib/site.ts:13-15` — `cal: { link: "ali-ahmed-lwiikf/30-min-meeting", namespace: "30-min-meeting" }`

**Init #1** — `CalProvider`, in `app/layout.tsx`, on **every page**:
```js
Cal("init", site.cal.namespace, { origin: "https://app.cal.com" });
Cal.ns[site.cal.namespace]("ui", {
  cssVarsPerTheme: { light: { "cal-brand": "#2c87d0" }, dark: { "cal-brand": "#2c87d0" } },
  theme: "dark",
});
```
**Init #2** — `BookingCalendar`, inside the MacBook section:
```js
Cal("init", "30-min-meeting", { origin: "https://app.cal.com" });   // same namespace, hardcoded
Cal.ns["30-min-meeting"]("inline", { ... calLink: "ali-ahmed-lwiikf/30-min-meeting" });
Cal.ns["30-min-meeting"]("ui", {
  cssVarsPerTheme: { light: { "cal-brand": "#00ccbd" } },            // different brand colour
  hideEventTypeDetails: false, layout: "month_view",
});
```
Same namespace, initialised twice, configured twice with conflicting values: brand `#2c87d0` vs `#00ccbd` (last write wins, order-dependent), and `theme: "dark"` set by #1 and never reset by #2.

Consequences: a dark calendar on a white page; a non-deterministic brand colour; and two `ui` applications that can make the embed re-style and **re-measure after load**, feeding directly into Bug 4's ScrollTrigger desync.

**Fix:** initialise Cal exactly once. Keep `CalProvider` as the sole bootstrap + `ui` owner; have `BookingCalendar` only call the `inline` method for its element. Use `site.cal.namespace` / `site.cal.link` instead of hardcoded strings.

## BUG 23 — Duplicated Cal bootstrap code
`booking-calendar.tsx:21-50` is a verbatim re-implementation of `bootstrapCal()` in `cal.tsx:9-40`. Two copies of a third-party bootstrap that must run exactly once — this is what allowed Bug 21. Consolidate to one exported helper.

## BUG 22 — Cal theme is `"dark"` but the site is white
`cal.tsx:54` sets `theme: "dark"` in `CalProvider`; `CalInline` (contact page, line 92) sets it twice more. But `globals.css:13` defines `--color-ink: #ffffff; /* base surface — page white */`. The naming (`ink`, `mist`) and the dark Cal theme both look like leftovers from an earlier dark design. Result: a dark calendar inside a white card on a white page — homepage **and** contact page. Verify visually; if unintended, switch to `"light"` (or drive from the site's actual theme) in all three places.

---

# PHASE 6 — Accessibility, layout and content

## BUG 29 — `100vh` everywhere, no `svh`/`dvh`
`hero.jsx:26` sets `height: '100vh'`, and `h-screen` / `min-h-screen` (also `100vh`) are used throughout. There is **no `svh` or `dvh` usage anywhere**. On mobile the URL bar collapses on scroll, changing `100vh` mid-scroll — the hero resizes as the user scrolls, shifting every section below it. A layout shift on the LCP element and a CLS penalty.

**Fix:** use `100svh` (or `100dvh` where the resize is intended) with a `100vh` fallback. Audit each usage individually — the MacBook stage is desktop-only and unaffected, but the hero, `not-found`, `contact`, `privacy` and `terms` all use it.

## BUG 30 — Decorative image announced to screen readers
`hero.jsx:120` — `alt="Reveal effect"` on a purely decorative, `pointer-events: none` overlay. Use `alt=""` (optionally `aria-hidden="true"`).

## BUG 24 — No `scroll-padding-top` despite a 64px fixed navbar
`globals.css` has no `scroll-padding-top` / `scroll-margin-top`, so in-page anchors scroll targets to `y = 0`, under the navbar. Low impact today (`lib/site.ts:19-23` uses route links, not hashes) but `#pricing` exists on `pricing-preview.tsx:9` and `#faq-quick` is passed to the FAQ. Add `scroll-padding-top: 4rem` to `html`.

## BUG 27 — The production hero is unmodified vendor demo code
`hero.jsx` defines `function LaserFlowBoxExample()` and exports it as `Hero`, with vendor comments still in place ("NOTE: You can also adjust the variables in the shader…", "Image Example Interactive Reveal Effect"). This is the LaserFlow library's example component shipped as the homepage hero — which explains the other hero issues. Rename to `Hero`, remove vendor comments, bring in line with codebase conventions.

## BUG 31 — Hero bypasses the design system
`hero.jsx:82-115` uses inline styles with hardcoded values: `color: '#ffffff'`, `'#c4c8d8'`, `backgroundColor: '#120F17'`, `fontSize: 'clamp(2.5rem, 5vw, 4rem)'`, `top: '22vh'`, `left: '8%'`, `maxWidth: '640px'`. None of these colours exist in the `@theme` tokens, so the hero cannot be restyled from the token set. The absolutely-positioned text block is also not responsive — verify no overflow or collision at narrow widths and short heights.

## BUG 32 — Copy errors in the hero subhead (the LCP text)
`hero.jsx:111`:
> "AI chatbots that capture every lead, ads that only target buyers ready to book paired with a beautiful site, not a digital brochure. — if it isn't setup within less than 30 days, you don't pay."

- `". — if"` — full stop immediately followed by an em dash
- `"setup"` should be `"set up"` (verb)
- `"within less than 30 days"` is redundant
- run-on sentence; the "paired with a beautiful site" clause lacks punctuation

**Flag to the user — do not silently rewrite marketing copy.**

## BUG 33 — Verify `site.url` against the actual deployment
`lib/site.ts:8` sets `url: "https://www.afamedia.co.uk"`, feeding `metadataBase`, `alternates.canonical`, JSON-LD, `sitemap.ts` and `robots.ts`. The site is currently deployed at `https://claudev1afa.netlify.app/`. If the real domain is live, this is correct. If not, every canonical points at a non-existent domain, OG image URLs resolve against it, and the sitemap advertises non-resolving URLs. **Confirm with the user; do not change unilaterally.**

---

# PHASE 7 — Stale comments (do last, but do not skip)

These describe systems that no longer exist and have repeatedly misled debugging in this project.

**`MacbookScene.tsx`:**
- lines 32-39 — `ZOOM_END_PULLBACK`: "the flat ServicesSection it hands off to", "the pin→flow swap"
- lines 76-82 — `active` prop: "whether the 3D screen is the thing currently on-screen (i.e. still pinned)"
- lines 100-102 — `onScreenContainerRef`: "so the parent can portal real page content into it"
- lines 524-530 — `chassisFade`: "right as the pin hands off", plus the "Html stays fully visible regardless of this fade" note (true, but now describes a bug)
- lines 541-555 — the `÷0.97` dwell: references "before the handoff fires", "the 0.995/0.999 thresholds", "p=0.99 where the flow slot becomes viewport-anchored". **None exist.**
- lines 616-624 — `invalidateRef` / `active`: "pinned instance", "portaled content"
- lines 660-666 — `frameloop`: "the re-pin boundary", "the portaled content snapped in"

Also reconsider whether the `÷0.97` dwell is still wanted. Its stated purpose was to park the camera before a handoff fired. Without a handoff it just means the zoom completes at `p ≈ 0.985` and holds — possibly still desirable, but decide on merits and document the real reason.

**`app/globals.css`:** lines 41-49 and 60-66 justify "no `scroll-behavior: smooth`" and "`overflow-x: clip` not `hidden`" entirely via **GSAP ScrollTrigger's pin** ("GSAP inserts the pin-spacer", "pins with position:fixed", "the pinned MacBook's fixed coords"). The code uses **no GSAP pin at all**. Both rules are still worth keeping on their own merits — rewrite the justifications to match reality.

---

# Confirmed clean — do not spend time here
- `app/sitemap.ts` and `app/robots.ts` are correct and complete (all 7 routes, sensible priorities, correctly cross-referenced).
- `app/manifest.ts`, `app/opengraph-image.tsx`, `app/favicon.ico`, `metadataBase`, `openGraph` and `twitter` metadata all present and correct. (No `app/icon.*` / `apple-icon.*` — Next falls back to `favicon.ico`; a nice-to-have, not a bug.)
- Only **one** `ScrollTrigger` instance exists in the whole codebase (`macbook-showcase.tsx`). `spotlight-card.tsx` mentions it only in a comment. Nothing is competing with the MacBook.
- `LaserFlow.jsx` and `Plasma.jsx` already have `IntersectionObserver` + `visibilitychange` gating (`LaserFlow.jsx:486`, `Plasma.jsx:182`).
- Fonts are correctly configured (`subsets`, `display: "swap"`).
- `--color-ink` is `#ffffff`, so the canvas `setClearColor(0xffffff)` correctly matches the page.
- No stray `console.log`; no `target="_blank"` missing `rel="noopener"`.
- `key={i}` appears only in dead files and `trust-bar.tsx` (a static, never-reordered list).

---

# Final verification checklist

**MacBook**
1. No white rectangle over the calendar at any scroll position; no leftover drei `<Html>` container in the DOM after the dissolve.
2. Calendar fully visible and interactive the moment the chassis finishes dissolving.
3. Scroll up and down repeatedly through the reveal — no jump, no flicker.
4. Test at 800px and 1200px viewport heights — the dissolve lands on the calendar in both, with the header clear of the navbar.
5. Resize the window mid-section (narrower/wider AND shorter/taller) — zoom endpoint still lands correctly.
6. Camera never snaps to a default position when scrolling in and out of the section.
7. Hard-reload on throttled network (Slow 3G) so Cal loads late — no scroll jump when it appears.
8. Scroll with the cursor directly over the calendar — the page scrolls, the calendar does not capture the wheel.
9. Emulate `prefers-reduced-motion: reduce` — the section degrades to a static calendar.
10. Wide/short viewport (1600×700) — laptop fully in frame.

**Performance**
11. GLB is under 2 MB; the model still renders correctly.
12. Performance trace while moving the mouse across the hero — the full-screen mask repaint long tasks are gone.
13. LaserFlow gated or reduced on mobile.
14. Total page weight and Core Web Vitals measured before/after; report both.

**General**
15. `npm run build` succeeds; no TypeScript errors.
16. Cal brand colour is deterministic across reloads; theme matches the white site on homepage and contact page.
17. Mobile: hero no longer resizes as the URL bar collapses.
18. Accessibility check — decorative hero image no longer announced.

---

**Report format:** for each phase, list what changed with `file:line`, what you verified, and anything you chose not to do and why. Explicitly answer: **did Phase 1 alone resolve the visible jitter?**
