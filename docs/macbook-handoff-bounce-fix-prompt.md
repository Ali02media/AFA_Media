# Task: Fix the "bounce" when the MacBook zoom hands off to the Services section

## Context
This is a Next.js (App Router) + React Three Fiber + GSAP site. On the homepage the hero (`100vh`) is followed by a MacBook showcase: as you scroll, a 3D MacBook lid opens and the camera zooms "into" the screen. The `ServicesSection` is displayed *inside* the 3D screen while zooming, then hands off to become a normal flat page section once the zoom completes.

The whole effect lives in two files:
- `components/sections/macbook-showcase.tsx` — layout, GSAP ScrollTrigger (scroll→progress), and the pinned↔flow handoff.
- `components/MacbookScene.tsx` — the R3F scene: lid open, camera zoom, and the drei `<Html>` overlay that hosts the section inside the screen.

Do NOT rewrite either file. Make a **surgical** change. Read both files fully before editing. Note `AGENTS.md`: this is a modified Next.js — read `node_modules/next/dist/docs/` before touching Next-specific APIs (you almost certainly won't need to for this fix).

## The bug (observed)
When you scroll deep into the MacBook zoom — almost "fully submerged" in the screen — and keep scrolling, the Services section that appears jumps/bounces vertically instead of sliding in smoothly. Scrolling slightly up and down near that point makes it bounce back and forth repeatedly.

## Root cause (already diagnosed — verify, don't re-investigate from scratch)
The handoff swap is driven by the **eased/smoothed zoom value**, but the destination flat section is positioned by **raw scroll**. These are desynchronized:

1. The zoom is intentionally lagged behind scroll for smoothness. In `components/MacbookScene.tsx` (~line 508), `displayedP` eases toward the scroll target every frame:
   ```js
   displayedP.current += (target - displayedP.current) * (1 - Math.pow(0.001, dt));
   ```
   So the eased zoom progress trails the true scroll position.

2. The pinned→flow handoff fires off that **eased** value, in `components/sections/macbook-showcase.tsx` `handleZoomProgress` (~lines 73–77):
   ```js
   if (pinnedRef.current) {
     if (rawZoom >= 0.99) { pinnedRef.current = false; setPinned(false); }
   } else {
     if (rawZoom <= 0.98) { pinnedRef.current = true; setPinned(true); }
   }
   ```

3. But the layout is calibrated so the flow-slot lands exactly at the viewport top at **scroll progress = 1** (scrollY = 500vh). See the big comment block at the top of `macbook-showcase.tsx` (~lines 13–36) and the layout: sticky stage (`h-screen`) + a `300vh` spacer + a `min-h-screen` flow slot; ScrollTrigger is `start:'top top'`, `end:'+=' + window.innerHeight*4`.

**The conflict:** because the eased `rawZoom` reaches 0.99 *after* scroll has already passed progress 1, by the time the swap fires the user's scroll has carried the real (flow) Services section *up past the viewport top*. At the swap instant the section snaps up to its true scroll position → the vertical jump. The hysteresis (un-pin at ≥0.99, re-pin at ≤0.98) means hovering at that seam and nudging the wheel flips pinned↔unpinned repeatedly, re-parenting the section DOM node each time → the repeated "bounce."

Secondary contributor: while pinned the section renders at fixed `width: 1280px` (`SCREEN_W`) inside the drei `<Html>`; on handoff it becomes full-viewport width (`macbook-showcase.tsx` ~line 216, the `pinned ? { width: SCREEN_W } : undefined` wrapper). Any reflow between those two widths adds to the visible shift at the worst moment.

## What the fix must achieve
The pinned→flow handoff must happen when the destination flat section is at the **same on-screen vertical position** as the 3D screen content — i.e. the swap must be positionally seamless regardless of the easing lag, and must not flip-flop when scrolling slowly across the seam.

## Suggested approach (pick the simplest that works; don't over-engineer)
The core fix is to **re-couple the swap to scroll position rather than to the lagged eased zoom**, OR to remove the positional gap the lag creates. Options, in rough order of preference:

- **Option A — drive the handoff off scroll progress, keep the zoom eased.** Trigger `setPinned(false)` when the ScrollTrigger progress crosses ~1.0 (i.e. when the flow slot's top actually reaches the viewport top), not when `rawZoom` hits 0.99. To avoid swapping while the 3D is still visibly mid-zoom, ensure the eased zoom has effectively caught up by then — e.g. tighten/complete the ease slightly before progress 1, or gate the swap on BOTH `progress >= 1` AND `rawZoom >= ~0.98`. The key is that the *position* the section lands at is scroll-derived, so there's no overrun gap. Keep a small hysteresis on the re-pin so it doesn't chatter, but base it on scroll too.

- **Option B — make the ease reach completion exactly at progress 1.** Give the zoom scroll headroom so `displayedP` reaches its target (rawZoom = 1) at or before scroll progress 1, then hold. Then handoff at progress 1 is both visually complete and positionally seamless. (This likely means mapping the eased zoom to finish within, say, progress 0.9–0.95 and dwelling, then swapping at 1.0.)

- Whatever you choose: **eliminate the flip-flop**. The re-parent of the section host node must not happen more than once per crossing. Widen hysteresis, debounce, or latch the state so slow scrubbing across the boundary doesn't repeatedly swap.

Also verify the fixed-`1280px` → full-width reflow isn't itself causing a residual shift once timing is fixed; if it is, make the two widths match at the seam (or confirm the existing `SCREEN_W`/`distanceFactor`/`ZOOM_END_PULLBACK` calibration already handles it and leave it alone).

## Hard constraints
- Keep the existing smoothness of the zoom itself — do NOT remove the `displayedP` easing in `MacbookScene.tsx`; the eased motion is what makes the zoom feel good. Only fix the *handoff timing/position*.
- Keep the single-`ServicesSection`-instance architecture (one host node re-parented via `appendChild`, see the comment at `macbook-showcase.tsx` ~lines 125–141). Do not remount the section.
- Keep it working on the reverse direction too (scrolling back UP must re-enter the screen cleanly — that's why hysteresis and `frameloop:'always'` while active exist).
- Preserve mobile behavior (`max-width:1023.98px` branch — no zoom, no handoff).
- Desktop breakpoint is `min-width:1024px`. Hero is exactly `100vh`. Section geometry: sticky `h-screen` stage, `300vh` spacer, `min-h-screen` flow slot; ScrollTrigger `end:'+=' window.innerHeight*4`. Don't break these calibrations unless the fix requires it, and if it does, explain why.

## Verification
Run the dev server and scroll slowly through the full MacBook sequence on a desktop viewport (≥1024px):
1. Lid opens, content fades in inside the screen, camera zooms in — should be smooth (unchanged).
2. At the end of the zoom, the Services section should appear seamlessly, with **no vertical jump**.
3. Slowly scrub up and down right at the handoff point — it must NOT bounce/flip-flop.
4. Scroll back up through the whole thing — re-entry into the screen must be clean.

Report exactly what you changed and why, referencing file:line.
