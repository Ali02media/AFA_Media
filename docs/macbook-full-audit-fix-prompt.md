# Full audit + fix: MacBook dissolve-to-calendar is broken by leftover machinery from the old handoff architecture

## Context
`components/sections/macbook-showcase.tsx` was rewritten to a **dissolve-to-reveal** design: nothing lives inside the 3D screen any more; the MacBook chassis fades to opacity 0 to reveal a flat Cal.com booking calendar sitting behind it (`z-0` under a `z-10 pointer-events-none` sticky stage).

**But `components/MacbookScene.tsx` was never updated to match.** It still contains the entire "render page content inside the 3D screen" subsystem from the old architecture, and that subsystem is what is now producing the jitter, the glitching, and the calendar appearing/disappearing. Bug 1 below is almost certainly the whole visible problem; the rest are real but secondary.

Read both files fully before editing. Note `AGENTS.md`: modified Next.js — read `node_modules/next/dist/docs/` before touching Next APIs.

---

## BUG 1 — CRITICAL — an orphaned opaque **white panel** floats over the calendar and moves every frame

**This is the headline bug. Fix this first; re-test before touching anything else.**

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

Nothing is rendered into it any more — `macbook-showcase.tsx:123` passes `onScreenContainerRef={() => {}}`. So it is an **empty opaque white rectangle**.

Its opacity (lines 121-132): when `active`, `opacity = smoothstep(dp over [0.12, 0.30])`, i.e. **1.0 for every `dp ≥ 0.3`**, and it never returns to 0. `active` is now `desktop && inView` (`macbook-showcase.tsx:125`), and `inView` comes from an IntersectionObserver on the **entire 500vh section** with `rootMargin: '200px'` — so `active` is true for essentially the whole scroll through the section.

**The decisive detail:** drei's `<Html>` renders into a **DOM overlay, not the canvas raster**. The dissolve at line 532 —
```js
gl.domElement.style.opacity = String(1 - chassisFade);
```
— fades **only the `<canvas>` element**. The comment at lines 528-530 says so explicitly ("lives in a separate DOM overlay (drei's Html), not the canvas raster, so it stays fully visible throughout regardless of this fade"). That was *correct and intended* when real content lived in the screen. Now it means:

> As the MacBook chassis dissolves away, a 1280px-wide **opaque white rectangle stays at full opacity**, sitting on top of the booking calendar and hiding it.

And because `<Html transform>` rewrites its `matrix3d` **every frame** from the live camera, that white rectangle **slides, scales and skews continuously as you scroll**, directly over the calendar. That is the jitter, the bounce, and the "calendar disappears" symptom — all three.

### Fix
Delete `ScreenFollower` and everything that exists solely to serve it:
- the `ScreenFollower` component (lines 64-152) and its render site (lines 584-595)
- the `Html` import from `@react-three/drei` (line 5)
- `SCREEN_W` (line 22) — check for other importers first; `macbook-showcase.tsx` no longer imports it, but grep the repo
- `DP_REVEAL_START` / `DP_REVEAL_END` (lines 29-30)
- `distanceFactor` / `setDistanceFactor`, `screenH` / `setScreenH` state
- `normalCorrectionRef`, `centroidLocalRef`
- the `onScreenContainerRef` prop on **both** `MacbookCore` and `MacbookScene`, and the `onScreenContainerRef={() => {}}` at the call site
- the whole UV-tangent-basis derivation block inside the GLTF `load` callback (the loop scanning for a non-degenerate triangle, the tangent/bitangent/normal construction, and the vertex-projection loop computing `minT/maxT/minB/maxB`) — it exists **only** to compute `distanceFactor`, `screenH`, `normalCorrection` and the panel centroid. Keep `trueW` / `trueH` only if the camera-distance calculation still needs them (see Bug 2); if so, keep the minimum needed and delete the rest.

After this, verify the calendar is genuinely unobstructed: the dissolve should end with a fully transparent canvas and **no DOM element from the R3F tree** left painting over the page.

---

## BUG 2 — the camera framing math is now vestigial and frames the laptop for a reason that no longer exists

`MacbookScene.tsx` ~line 443:
```js
const screenHcss  = (SCREEN_W * (trueH / trueW)) / ZOOM_END_PULLBACK;
const worldPerPx  = (2 * dist * Math.tan(halfVFov)) / viewportHpx;
vNudgeWorld = (viewportHpx / 2 - screenHcss / 2 - 10) * worldPerPx;
```
This pan existed **only** to make DOM content inside the 3D screen line up with the top edge of a flat DOM copy during the old handoff. There is no flat copy and no handoff. It still pans the camera, so the laptop is now framed off-centre to satisfy a constraint that has been deleted — including a hardcoded, underived `- 10`.

Same for `ZOOM_END_PULLBACK` (line 40, currently `0.991`): its comment (lines 32-39) describes size-matching content across a "pin→flow swap" that no longer exists. Its only remaining effect is how close the camera stops.

**Fix:** re-derive both as deliberate framing choices for the dissolve — "where should the laptop sit and how close should we push in before it fades out" — and rewrite the comments to say that. Do not keep magic numbers whose stated justification is gone.

---

## BUG 3 — stale comments that actively mislead (these have already cost multiple wasted debugging rounds)

Every one of these describes a pin/portal/handoff system that no longer exists in the codebase. Purge or rewrite them:
- lines 32-39 — `ZOOM_END_PULLBACK`: "the flat ServicesSection it hands off to", "the pin→flow swap"
- lines 76-82 — `active` prop doc: "whether the 3D screen is the thing currently on-screen (i.e. still pinned)"
- lines 100-102 — `onScreenContainerRef` doc: "so the parent can portal real page content into it"
- lines 524-530 — `chassisFade`: "right as the pin hands off", and the "Html stays fully visible regardless of this fade" note (true, but now describes a bug rather than a feature)
- lines 541-555 — the `÷0.97` dwell: references "before the handoff fires", "the 0.995/0.999 thresholds", and "p=0.99 where the flow slot becomes viewport-anchored". **None of these exist.** There is no handoff, no thresholds, no flow slot.
- lines 616-624 — `invalidateRef` / `active` docs: "pinned instance", "portaled content"
- lines 660-666 — `frameloop`: "the re-pin boundary", "the portaled content snapped in"

Also reconsider whether the `÷0.97` dwell is still wanted at all. Its entire stated purpose was to park the camera before a handoff fired. Without a handoff it just means the zoom completes at `p ≈ 0.985` and holds — which may still be desirable (finish the push-in before the dissolve completes), but decide that on its merits and document the real reason.

---

## BUG 4 — the Cal.com embed resizes the document asynchronously and desyncs ScrollTrigger (likely the *intermittent* jitter)

`components/booking-calendar.tsx` loads `https://app.cal.com/embed/embed.js` in a `useEffect` and Cal injects an **auto-resizing iframe** into `#afa-cal-inline`. That happens after first paint, and can resize again later (month navigation, slot view, responsive breakpoints).

The embed sits **inside** the MacbookShowcase section (`macbook-showcase.tsx:167-171`). So whenever it loads or resizes:
- the section's height changes,
- ScrollTrigger's cached start/end (computed from element geometry) become stale,
- progress silently jumps → the MacBook animation jumps.

And the only refresh is inadequate (`macbook-showcase.tsx:92-98`):
```js
document.fonts?.ready?.then(() => {
  const t = triggerRef.current;
  if (!t || t.isActive) return;   // ← skipped entirely if you're already in the section
  t.refresh();
});
```
It fires **once**, on font-ready, and is **skipped if the trigger is active**. Cal's load almost certainly lands after that.

This is a strong candidate for jitter that appears "randomly" — it's async, so it fires at a different scroll position every reload.

### Fix
- Attach a `ResizeObserver` to `#afa-cal-inline` (and/or the injected iframe) and call `ScrollTrigger.refresh()` (debounced, e.g. 100-200ms) when its size settles.
- Reserve a **fixed height** for the embed so its load doesn't reflow at all. The wrapper sets `height: 680`, but Cal's injected iframe may override it — measure the container's actual rendered height before and after the embed loads and confirm they match. If they don't, pin it.
- Consider whether `t.isActive` should really skip the refresh, or whether it should refresh with `ScrollTrigger.refresh(true)` / re-pin progress instead of skipping.

---

## BUG 5 — a nested scroll container steals wheel events exactly at the reveal

`booking-calendar.tsx` renders:
```jsx
style={{ width: "100%", height: "100%", overflow: "auto", ...style }}
```
`overflow: auto` makes the embed its own scroll container. It sits inside an `overflow-hidden` card inside a `min-h-screen` flex box that fills the viewport at the moment of reveal — so **the cursor is over a scrollable child** precisely when the user is scrolling through the animation. Wheel events scroll the calendar first and only chain to the page once it hits its end.

That reads exactly as "scrolling sticks / stutters / jumps" right at the reveal, and it's independent of all the 3D math.

**Fix:** don't create a nested scroller inside a full-viewport scroll-driven section. Size the container to its content so it never needs its own scrollbar (drop `overflow: 'auto'`, or set `overflow: 'hidden'`), or if internal scrolling is genuinely required, set `overscroll-behavior: contain` and verify the chaining behaviour deliberately.

---

## BUG 6 — the reveal target moves with viewport height, so the dissolve doesn't land on it

`macbook-showcase.tsx:167`:
```jsx
<div className="relative z-0 flex min-h-screen w-full items-center justify-center px-4 pb-24">
```
`items-center` vertically **centres** the 680px card inside a `100vh` box that also has `pb-24` (96px). The card's top offset from the section top is therefore `(100vh − 96 − 680) / 2`:
- 800px viewport → ~12px
- 1000px viewport → ~112px
- 1200px viewport → ~212px

The camera framing is fixed but the reveal target slides down as the viewport grows, so on taller screens the MacBook dissolves to reveal… empty space above the calendar. Pick one anchoring (top-anchored is simplest and matches the "calendar reaches the viewport top at p=1" comment on lines 31-34) and make the camera framing from Bug 2 agree with it across viewport heights.

---

## BUG 7 — the section height and the ScrollTrigger range only agree by coincidence

Section = stage `h-screen` (100vh) + spacer (300vh) + calendar `min-h-screen` (100vh) = 500vh.
ScrollTrigger `end` is `'+=' + window.innerHeight * 4` — a fixed 400vh.
The sticky stage releases at `sectionBottom − 100vh`.

These coincide **only while the calendar box is exactly 100vh**. Its content is `680 + 96 (pb-24) = 776px`, so on any viewport shorter than 776px the box grows past `min-h-screen`, the section exceeds 500vh, and the stage stays stuck past `p = 1`. (Harmless-looking because the canvas is transparent by then, but the geometry assumptions have drifted, and combined with Bug 4 it compounds.) Make the relationship explicit — derive one from the other rather than having two independent constants that must happen to match.

---

## BUG 8 — `frameloop: 'always'` runs across ~600vh of scrolling

`active = desktop === true && inView`, where `inView` observes the **entire 500vh section** with `rootMargin: '200px'` (`macbook-showcase.tsx:80-89`). So `frameloop={active ? 'always' : 'demand'}` (line 667) renders **every frame** across roughly 600vh of scroll — at `dpr={[1.5, 2]}` with MSAA — including while the user sits still.

Gate it tighter: only while the stage is actually stuck / `0 ≤ progress ≤ 1`, or drop back to `'demand'` when scroll has been idle for a beat. (`invalidate()` is already called from `onUpdate`, so demand-mode still animates correctly while scrolling.)

---

## BUG 9 — minor: DRACO decoder loaded from a third-party CDN at runtime
`MacbookScene.tsx` sets `draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.5/')`. The model cannot decode at all if gstatic is slow, blocked, or offline. Self-host the decoder in `public/` for reliability. Not related to the jitter.

---

## Hard constraints
- Do NOT reintroduce any portal / `pinned` state / DOM re-parenting. The dissolve architecture is correct; the bug is leftovers from the old one.
- Do NOT keep `ScreenFollower` "just in case" or merely set its opacity to 0 — delete it. A hidden 1280px DOM node still being transformed every frame is exactly the kind of thing that has been causing these symptoms.
- Preserve mobile (`desktop === false` branch, `macbook-showcase.tsx:101-111`).
- Fix Bug 1 **first**, then re-test before doing 2-9. It may resolve the visible symptoms entirely, which changes how you judge the rest.

## Verification
1. After Bug 1: scroll through the section and confirm **no white rectangle** is visible over the calendar at any point, and the calendar is fully visible and interactive the moment the chassis finishes dissolving.
2. Inspect the DOM at the end of the dissolve: confirm no leftover drei `<Html>` container exists in the R3F tree painting over the page.
3. Confirm the calendar is clickable and its month navigation works.
4. Scroll up and back down repeatedly through the seam — no jump, no flicker.
5. Test at two clearly different viewport heights (e.g. 800px and 1200px) and confirm the dissolve lands on the calendar in both (Bug 6).
6. Hard-reload with a throttled network (DevTools → Slow 3G) so the Cal embed loads late, and confirm no scroll jump when it appears (Bug 4).
7. Scroll with the cursor directly over the calendar and confirm the page scrolls normally rather than the calendar capturing the wheel (Bug 5).

Report what you changed with file:line, and state explicitly whether Bug 1 alone resolved the visible jitter.
