# Follow-up: the MacBook→Services handoff still snaps at one fixed point

## Context
This is a follow-up to a previous fix in this same codebase. The previous fix correctly moved the pinned→flow handoff trigger in `components/sections/macbook-showcase.tsx` (`handleZoomProgress`, ~lines 61-86) from the eased zoom value to raw scroll progress, to stop it drifting/flip-flopping. That part works.

But it left a bug: the comment at `components/MacbookScene.tsx` ~lines 529-538 describes an intended dwell —

```js
// Zoom completes just BEFORE the scroll seam: ÷0.8 ⇒ rawZoom reaches 1 at dp 1.8 (≈ scroll
// progress 0.9), so by the time the scroll-driven handoff fires at progress ≈1 the 3D is
// already fully zoomed and size-matched (ZOOM_END_PULLBACK) to the flat section — the swap
// is invisible. ...
const rawZoom = THREE.MathUtils.clamp(dp - 1, 0, 1);
```

— but the code was never actually changed to implement it. `rawZoom` still equals `dp - 1` with no division, so it only reaches 1 (fully zoomed) at exactly the same scroll point (progress ≈1) that the handoff in `macbook-showcase.tsx` now fires at (`p >= 0.998`).

## The bug (observed)
Scrolling through the MacBook zoom now snaps/jump-cuts at one consistent, repeatable point near the end (not drifting or flip-flopping anymore — that's fixed). At that point the 3D scene is still visibly mid-zoom/mid-fade when it's replaced by the flat Services section, so it reads as a hard cut rather than a smooth "emerging from the screen" transition.

## Root cause
`rawZoom` (which drives the camera zoom lerp and the chassis opacity fade, both in `components/MacbookScene.tsx`, `useFrame` in `MacbookCore`, ~lines 493-557) reaches its completed state (`1`) at the exact same scroll position that the handoff fires. There's no dwell/head-start, so the 3D animation and the handoff finish at the same instant instead of the 3D finishing slightly *before* the handoff.

## The fix
In `components/MacbookScene.tsx`, change line ~538 from:

```js
const rawZoom = THREE.MathUtils.clamp(dp - 1, 0, 1);
```

to:

```js
const rawZoom = THREE.MathUtils.clamp((dp - 1) / 0.8, 0, 1);
```

This makes `rawZoom` reach `1` at `dp = 1.8` (≈ scroll progress 0.9) instead of `dp = 2` (progress 1.0) — giving the camera zoom lerp and the chassis fade-out a real head start to finish *before* `macbook-showcase.tsx`'s scroll-driven handoff fires at `progress ≈ 0.998`. By the time the swap happens, the 3D scene should already be fully settled and visually matched to the flat section, so the swap is invisible.

This is a **one-line change**. Do not touch anything else — the positional/hysteresis fix in `macbook-showcase.tsx` is already correct and should be left as-is.

## Verify
1. Re-check the comment block right above the line (~529-537) — it already describes this exact intended behavior; after the fix the code should match the comment.
2. Run the dev server, scroll slowly through the full MacBook sequence on a desktop viewport (≥1024px). Confirm:
   - The 3D zoom/chassis fade visibly completes shortly before the flat section appears (not simultaneously with it).
   - No jump/snap at the handoff point.
   - Slowly scrubbing up/down across the handoff point is still smooth and doesn't flip-flop (this was already fixed — just confirm it's still fine).
   - Scrolling back up re-enters the 3D screen cleanly.
3. If `0.8` still leaves a visible residual snap, it can be nudged (e.g. `0.75` or `0.85`) — but start with `0.8` since it's what the existing comment already calibrates for.

Report exactly what you changed, referencing file:line.
