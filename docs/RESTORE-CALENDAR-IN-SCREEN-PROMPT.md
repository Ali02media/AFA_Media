# Re-architect: put the Cal.com calendar back INSIDE the MacBook screen — permanently, with no handoff

## The intended design (this is what the user actually wants)

The Cal.com booking calendar is **fixed inside the MacBook's screen**. As the user scrolls:
1. The MacBook lid opens, revealing the calendar already sitting on the screen
2. The camera zooms in toward the screen
3. The screen fills the viewport, the calendar now at readable, interactive size
4. No jitter, no bounce, no fade-up

The calendar **never leaves the screen**. There is no flat copy anywhere on the page.

## What the code currently does instead

`macbook-showcase.tsx:166`:
```jsx
<div className="relative z-0 flex min-h-screen w-full items-center justify-center px-4 pb-24">
  <div className="w-full max-w-4xl ..."><BookingCalendar style={{ height: 680 }} /></div>
</div>
```
The calendar is **ordinary document flow**, `z-0`, behind the sticky stage (`z-10`). It is not attached to the MacBook at all. As the page scrolls it scrolls upward like any normal section — that upward drift is the "fading up" the user is reporting — while the MacBook chassis independently fades to opacity 0 on top of it. The two are unrelated; the "reveal" is coincidental overlap, not a connection.

The MacBook screen is blank because nothing renders into it any more.

## Why the previous reasoning was half-right (read this before you re-litigate it)

The comment at `macbook-showcase.tsx:15-26` says:

> "Every previous version put content INSIDE the 3D screen and had to hand it off to a flat copy — and that handoff was the entire source of the jitter... A live calendar makes that impossible anyway: an iframe can't be clicked/scrolled reliably through a 3D transform."

**Claim 1 is correct.** The jitter genuinely came from the handoff: 3D-screen content is viewport-anchored, a flat copy is document-anchored, and those two only coincide at exactly one scroll position. Every fix attempt (hysteresis bands, dwells, transform-pinning, sticky slots) was trying to paper over that.

**But the conclusion is wrong.** The answer to "the handoff causes jitter" is *remove the handoff* — not *remove the content from the screen*.

The old architecture needed a handoff because the in-screen content (ServicesSection, then the CTA) had to become a normal page section afterwards. **A booking calendar does not.** It can live in the screen for the entire section: zoom in, book, scroll past. There is no "afterwards" that requires it to be flat.

**No handoff → nothing to desync → no jitter.** This is the whole fix.

**Claim 2 is overstated.** Modern browsers do render and hit-test iframes through CSS `matrix3d`. Clicks map correctly through the transform. There are real caveats (below) but "impossible" is not accurate. Do not use it as a reason to avoid this work.

---

## Target architecture

```
section (relative)
├── stage: sticky top-0, h-screen          ← the 3D MacBook canvas + drei <Html> screen content
│     └── <Html transform> → Cal.com iframe   ← lives here PERMANENTLY, never re-parented
└── spacer: ~300-400vh                     ← scroll length for lid-open + zoom
```

That is the entire structure. Note what is **gone**:
- No flat calendar in document flow
- No `z-0` / `z-10` layering between a stage and a reveal target
- No portal, no `appendChild`, no `pinned` state, no `applyHandoff`, no `applyFlowOffset`
- No hysteresis band, no thresholds

Scroll mapping (keep the existing `displayedP` easing, it is good):
- `dp 0 → 1`: lid opens from closed to open
- `dp 1 → 2`: camera zooms from the wide shot to the screen-fills-viewport endpoint
- Calendar fades in on the screen as the lid lifts (the old `DP_REVEAL_START/END` did exactly this)

---

## Implementation

### Step 1 — Restore `ScreenFollower` in `MacbookScene.tsx`

It was deleted in the previous round. The `.bak` files are gone and the working tree is not a git repo, so here is the component to restore verbatim (adjust types/imports to match the current file):

```tsx
function ScreenFollower({
  displayMeshRef, dpRef, distanceFactor, screenH,
  normalCorrectionRef, centroidLocalRef, onContainerRef, active,
}: {
  displayMeshRef: RefObject<THREE.Mesh | null>;
  dpRef: RefObject<number>;
  active: boolean;
  centroidLocalRef: RefObject<THREE.Vector3>;
  distanceFactor: number;
  screenH: number;
  normalCorrectionRef: RefObject<THREE.Quaternion>;
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
      const dp = dpRef.current ?? 0;
      const reveal = THREE.MathUtils.clamp(
        (dp - DP_REVEAL_START) / (DP_REVEAL_END - DP_REVEAL_START), 0, 1);
      const smooth = reveal * reveal * (3 - 2 * reveal);
      wrapRef.current.style.opacity = String(active ? smooth : 0);
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
          }}
        />
      </Html>
    </group>
  );
}
```

Also restore, all of which were deleted alongside it:
- the `Html` import from `@react-three/drei`
- `SCREEN_W = 1280`
- `DP_REVEAL_START = 0.12` / `DP_REVEAL_END = 0.3`
- `distanceFactor` / `setDistanceFactor` and `screenH` / `setScreenH` state
- `normalCorrectionRef`, `centroidLocalRef`
- the UV-tangent-basis derivation block in the GLTF load callback (computes `distanceFactor`, `screenH`, `normalCorrection`, `centroidLocal` — the `setDistanceFactor(400 * trueW / SCREEN_W)` and `setScreenH(...)` calls)
- the `onScreenContainerRef` prop plumbed through `MacbookCore` and `MacbookScene`
- rendering `<ScreenFollower>` when `modelReady`

**Important — the single-transform rule is load-bearing.** `SCREEN_W` exists so there is exactly ONE geometric transform (drei's `distanceFactor`) between the DOM and the screen. Do not add an inner CSS `scale()` — stacking a second transform makes the content blurry, because browsers rasterize a transformed layer at its own scale then resample for outer transforms.

**But `SCREEN_W` must no longer be the fixed `1280` — see Step 4.** With an edge-to-edge endpoint the screen projects to the full viewport width, so a fixed 1280px content width would be scaled up (e.g. 1.5× on a 1920px viewport) and the calendar would render blurry. `SCREEN_W` becomes viewport-derived.

**One change from the original:** the original also nulled the screen mesh's texture (`m.map = null; m.emissiveMap = null; m.color.set(0xf4f5f8)`) so the DOM overlay sat on a plain surface. Keep that — it is correct for this design.

### Step 2 — Render the calendar into the screen container

In `macbook-showcase.tsx`, portal `<BookingCalendar />` into the node reported by `onScreenContainerRef`, using a **single stable host node** that is created once and never re-parented:

```tsx
const [screenEl, setScreenEl] = useState<HTMLDivElement | null>(null);
// ...
<MacbookScene ... onScreenContainerRef={setScreenEl} />
// ...
{screenEl && createPortal(
  <div style={{ width: SCREEN_W, height: screenH }}>
    <BookingCalendar style={{ width: '100%', height: '100%' }} />
  </div>,
  screenEl,
)}
```
The portal target **never changes**, so React never remounts the subtree and the Cal iframe never reloads. This is the critical difference from every previous version.

**Delete entirely:**
- the flat calendar block at lines 163-171
- the `z-0` / `z-10` layering (nothing to layer any more)
- any remaining `pinned` state, `applyHandoff`, `applyFlowOffset`, hysteresis thresholds

### Step 3 — Pointer events: off during the animation, on at the end

This matters and is easy to get wrong. While the user is scrolling, the iframe must not capture wheel events, or scrolling will stall whenever the cursor is over it.

- Keep the stage `pointer-events-none` and the `<Html>` wrapper `pointerEvents: 'none'` for `dp < ~1.9`
- Enable pointer events only once the zoom is essentially complete (`rawZoom >= ~0.98`)
- Confirm `overflow` on the `BookingCalendar` container does not create a nested scroll container that steals the wheel — the current `overflow: 'auto'` in `booking-calendar.tsx` should become `'hidden'`, with the container sized to the content

### Step 4 — Zoom endpoint: the screen fills the viewport EDGE TO EDGE

**This is a decided requirement, not a taste call.** At full zoom the MacBook screen panel fills the entire viewport — no bezel visible, no letterboxing, no margin. The user has specified this explicitly.

With no flat copy to match, `ZOOM_END_PULLBACK` and `vNudgeWorld` stop being alignment constraints and become the mechanism for hitting this endpoint.

#### 4a. Solve the camera distance for a COVER fit

The screen panel and the viewport have different aspect ratios, so "edge to edge" means a **cover** fit — scale until both axes are filled, letting the longer axis overflow off-screen.

Screen aspect is `trueW / trueH` (a MacBook panel is ~1.6). A typical desktop viewport is ~1.78, i.e. relatively wider. So matching **width** already overflows height — meaning width-fit is the cover fit in the common case. Do not assume it: compute both and take the one that covers.

Perspective projects a world span `w` at distance `d` to `w * viewportHpx / (2 * d * tan(halfVFov))` on-screen pixels. Solve for the `d` that makes:
- `trueW` project to `viewportWpx`, **and**
- `trueH` project to `viewportHpx`

then take the **smaller** `d` of the two (closer camera = larger projection = the one that covers). Set `ZOOM_END_PULLBACK` to `1.0` — any value above 1 pulls the camera back and reintroduces a visible edge, which is exactly what we are eliminating. Keep the constant only if you want a deliberate slight overshoot (e.g. `0.98` to guarantee full bleed against rounding); document whichever you choose.

#### 4b. `SCREEN_W` must become viewport-derived, or the calendar will be blurry

Currently `distanceFactor = 400 * trueW / SCREEN_W`, which maps `SCREEN_W` CSS pixels onto `trueW` world units. If `SCREEN_W` stays at a fixed `1280` while the screen now projects to the full viewport width (say 1920px), the content is being scaled **up by 1.5×** — and a transformed layer rasterizes at its authored size then resamples, so the calendar renders visibly soft.

Set `SCREEN_W` to the **projected width at the endpoint**, i.e. the viewport width, so the endpoint scale factor is exactly `1.0` and text is pixel-crisp where the user actually reads and clicks it. `screenH` follows as `SCREEN_W * (trueH / trueW)`.

Because this now depends on viewport dimensions, it **must be recomputed on resize** — which is the same fix as the "camera framing computed once at load" bug listed below. Do them together: one function that takes the live viewport size and returns `{ SCREEN_W, screenH, distanceFactor, dist, vNudge }`, called after load and on a debounced `resize`.

#### 4c. Handle the navbar overlapping the calendar

With the screen edge-to-edge, the fixed navbar (`navbar.tsx:35` — `fixed top-0 z-50`, `h-16` = 64px) sits directly over the top of the calendar. Do **not** solve this by shrinking the screen — that breaks the edge-to-edge requirement.

Preferred fix: inset the calendar **content** inside the screen container by the navbar height (e.g. `paddingTop: 64` on the wrapper inside the `<Html>` div), so the screen still bleeds edge to edge while the calendar's own header clears the navbar.

Alternative, if the user prefers a more immersive result: fade the navbar out as the zoom completes and back in when scrolling away. Flag this to the user rather than choosing it unilaterally — it changes site-wide navigation behaviour.

#### 4d. Clean up the stale constants
Delete the hardcoded `- 10` in the `vNudgeWorld` expression and replace it with a named, commented constant stating what it frames against. Rewrite the `ZOOM_END_PULLBACK` comment — it currently describes size-matching a flat copy across a "pin→flow swap" that no longer exists.

### Step 5 — Section height

The section needs enough scroll length for lid-open + zoom, and the sticky stage must stay stuck for all of it. Structure:
```jsx
<section ref={sectionRef} className="relative">
  <div className="sticky top-0 h-screen w-full overflow-hidden"> {/* stage */} </div>
  <div aria-hidden style={{ height: '300vh' }} />
</section>
```
Total 400vh, and `end: '+=' + window.innerHeight * 4` maps progress 0→1 across it. Since there is no longer a flat reveal target that must arrive at the viewport top at `p = 1`, this is now a free tuning choice — pick a length where the lid-open and zoom both feel unhurried. Add a comment saying so, so nobody later "fixes" it to satisfy a constraint that no longer exists.

---

## Known trade-offs — handle these explicitly, do not pretend they do not exist

1. **Blur mid-zoom.** A CSS-3D-transformed layer rasterizes at its own scale and resamples. At the **end** of the zoom the transform is near-identity, so the calendar will be crisp exactly where the user reads and clicks it. Mid-zoom (lid rotating, camera moving) some softness is expected and acceptable — it is in motion. If the endpoint itself is soft, that means the transform is not landing at 1:1: check `distanceFactor = 400 * trueW / SCREEN_W` and the endpoint camera distance.

2. **Iframe compositing cost.** Compositing a heavy third-party iframe through a per-frame 3D transform is expensive. Mitigations, in order of preference:
   - Keep `frameloop` tight (see below)
   - If it is genuinely too slow, render a **static image of the calendar** in the `<Html>` during the zoom and swap to the live iframe once the zoom completes. This is a same-position, same-size, image→iframe crossfade — **not** the old 3D↔document-flow handoff, so it cannot reintroduce the anchoring jitter. Only do this if measurement shows it is needed.

3. **Cal.com inside a transform.** Verify month navigation and slot selection work at the zoomed-in endpoint. If Cal's own popovers/dropdowns misbehave inside the transform, that is the signal to consider the static-image-then-swap approach from (2).

4. **Reduced motion / mobile.** Both should skip the 3D entirely and render the calendar as a plain flat section — the existing mobile branch (`macbook-showcase.tsx:101-111`) already does this. Route `prefers-reduced-motion: reduce` users down the same path.

---

## Carry these fixes forward (already diagnosed, still apply)

- **Cal.com is initialised twice** on the same namespace with conflicting config — `CalProvider` (in `layout.tsx`, brand `#2c87d0`, `theme: "dark"`) and `BookingCalendar` (hardcoded namespace, brand `#00ccbd`). Consolidate to one init. This also causes the embed to re-style and re-measure after load, which is exactly the kind of thing that destabilises a scroll-driven section.
- **`theme: "dark"` on a white site** (`--color-ink: #ffffff`). Verify and switch to light.
- **`ScrollTrigger.refresh()` fires once and is skipped when active** — attach a `ResizeObserver` to the Cal element and refresh (debounced) when it settles.
- **Camera framing computed once at load, never on resize** — extract to a function and call it on debounced `resize`.
- **`<Canvas>` props are fresh literals every render** (`gl`, `camera`, `style`, `dpr`) — hoist to module constants so R3F cannot reset the camera.
- **`frameloop: 'always'` across ~600vh** — gate to while the stage is actually stuck.
- **The 11.8 MB GLB** (94% textures, still contains the discarded iPhone) — compress to under 2 MB.

---

## Verification

1. Scroll in: lid opens, **calendar is visible on the screen as it opens** (fading in as the lid lifts), camera zooms toward it.
2. At full zoom: the screen fills the viewport **edge to edge — no bezel, no letterboxing, no margin on any side**. Verify at 16:9, 16:10 and an ultrawide window; the cover fit must hold at every aspect ratio.
3. At full zoom the calendar is **pixel-crisp, not soft** — this is the test that `SCREEN_W` is correctly viewport-derived (4b). If text looks slightly blurry, the endpoint scale is not 1.0.
4. The calendar's own header/month controls are clear of the fixed navbar (4c).
3. **No jitter, no bounce, no jump anywhere** — there is no handoff left to produce one.
4. The calendar does **not** scroll up the page independently of the MacBook. It is locked to the screen at all times.
5. Click a date and a time slot at full zoom — both work.
6. Scroll with the cursor over the calendar *during* the animation — the page scrolls normally, the iframe does not capture the wheel.
7. Scroll back up and down repeatedly — completely stable, and the Cal iframe does **not** reload (confirm in the Network panel: no repeated Cal requests).
8. Resize the window mid-section — framing still correct.
9. Reduced motion emulated → static flat calendar, no 3D.
10. Mobile → static flat calendar.

**Report:** confirm explicitly that there is no longer any handoff, portal re-parenting, or flat copy of the calendar anywhere in the section.
