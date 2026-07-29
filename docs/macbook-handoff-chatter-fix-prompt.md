# Fix: the MacBook→CTA handoff rapidly flip-flops (visible "bounce")

## Context
Same codebase, same feature as the last two rounds of fixes: `components/sections/macbook-showcase.tsx` drives a 3D MacBook that opens/zooms as you scroll, then hands off a portaled `CTA` component (`components/sections/cta.tsx`) from being displayed inside the 3D screen to being displayed as normal flat page content. Read `components/sections/macbook-showcase.tsx` in full before editing — it's dense and every line is load-bearing (see its own comments).

Note `AGENTS.md`: this is a modified Next.js — read `node_modules/next/dist/docs/` before touching Next-specific APIs (you won't need to for this fix).

## The bug (observed + proven via console log)
Near the end of the scroll sequence, the page visibly flickers/bounces between two slightly different layouts of the CTA card (different width, nav bar popping in/out) — not once, but repeatedly, several times in a row, at one scroll position.

A debug `console.log` already in the code (see below) proves this directly. Captured browser console output while scrolling through the handoff point:

```
[HANDOFF FLAT→3D] Δw: -2 Δtop: -4
[HANDOFF 3D→FLAT] Δw: -2 Δtop: -4
[HANDOFF FLAT→3D] Δw: 2 Δtop: -12
[HANDOFF 3D→FLAT] Δw: -2 Δtop: -4
[HANDOFF FLAT→3D] Δw: 2 Δtop: -12
[HANDOFF 3D→FLAT] Δw: -2 Δtop: -4
[HANDOFF FLAT→3D] Δw: 2 Δtop: -12
... (repeats many times)
```

The `pinned` state (and the DOM re-parent it triggers) is toggling back and forth rapidly at a single scroll position. Each toggle re-parents the CTA's host node between the 3D-screen container and the flat page slot, which is the visible "bounce."

## Root cause
`components/sections/macbook-showcase.tsx`, `applyHandoff` (~lines 76-82):

```js
const applyHandoff = useCallback((p: number) => {
  if (pinnedRef.current) {
    if (p >= 0.998) { pinnedRef.current = false; setPinned(false); }
  } else {
    if (p <= 0.9975) { pinnedRef.current = true; setPinned(true); }
  }
}, []);
```

This is hysteresis: unpin when scroll progress `p` crosses `0.998` going up, re-pin when it drops back below `0.9975` going down. The gap between those two thresholds — the "dead zone" that should absorb small back-and-forth scroll noise — is only **0.0005**. That's roughly two orders of magnitude smaller than it needs to be to do its job (an earlier version of this same mechanism used a gap of `0.013`, ~26x wider, and did not exhibit this bug).

Because the gap is so thin, ordinary scroll noise is enough to cross it in both directions repeatedly at the same scroll position:
- Trackpad momentum/rubber-band scrolling delivers many small `onUpdate` ticks even after the user's hand has stopped.
- The handoff itself is not perfectly zero-impact: the debug log shows `Δw`/`Δtop` are never exactly 0 (e.g. `Δw: 2`, `Δtop: -12`) — the pinned-vs-flat rendering of the CTA differs by a few pixels. Re-parenting a few-pixel size/position change can itself perturb document scroll height slightly, nudging `scrollY`, which is enough on its own to cross a 0.0005-wide band right back the other way — creating a self-sustaining feedback loop exactly like the one in the captured log.

Either factor alone could cause a stray double-flip; together, with a band this thin, they produce sustained rapid oscillation.

## The fix
Two parts — do both, they address different halves of the mechanism:

### 1. Widen the hysteresis band back to a real value
In `applyHandoff`, change the re-pin threshold so there's a meaningful gap between it and the unpin threshold — enough to absorb sub-pixel/momentum scroll jitter and the small layout delta from the swap itself, while still feeling tight/responsive to the user. Something in the range of `0.01`–`0.02` gap (matching the earlier working value of `0.985` for re-pin, or nearby) is a safe starting point:

```js
const applyHandoff = useCallback((p: number) => {
  if (pinnedRef.current) {
    if (p >= 0.998) { pinnedRef.current = false; setPinned(false); }
  } else {
    if (p <= 0.985) { pinnedRef.current = true; setPinned(true); }
  }
}, []);
```

Do not widen the unpin side (`0.998`) unless testing shows it's also needed — the unpin direction (scrolling down, first time through) is the one that must feel snappy/precise; it's the re-pin/oscillation side that needs the buffer.

### 2. Make the swap itself zero-impact (kills the feedback loop at its source)
The debug log shows `Δw`/`Δtop` are non-zero (`Δw: 2`, `Δtop: -12`, etc.) even though the code comment at ~line 148 says they "should both be ≈0." Investigate why they aren't exactly 0 at the specific viewport width you test at, and eliminate the discrepancy:
- Check for scrollbar-width differences between the two container contexts (one may account for a vertical scrollbar gutter, the other may not).
- Check subpixel/rounding differences between the pinned wrapper (`width: SCREEN_W` inline style, portaled into the 3D `<Html>` container) and the flat wrapper (same `width: SCREEN_W` inline style, portaled into `flowRef`) — confirm both ancestors truly produce an identical box (padding, border, margin, box-sizing) with nothing else (e.g. a parent flex/grid context) altering it.
- A `Δtop` of `-12`/`-4` suggests a vertical offset mismatch, not just width — check that the flat slot's top-alignment and the 3D screen's vertical centring (see `MacbookScene.tsx`'s `vNudgeWorld` calibration, if still present/relevant) still agree with the CTA's actual rendered height (the calibration in that file was originally tuned for `ServicesSection`'s height, and may be stale now that this section shows `CTA` instead — confirm/re-check, don't assume).

Getting `Δw`/`Δtop` to genuinely read `0` removes the layout-nudge feedback path entirely, which is defense-in-depth beyond widening the band.

### 3. (Optional, only if 1+2 don't fully settle it) Add a time-based debounce
If any residual double-flip remains after 1 and 2, add a minimal guard so a flip can't immediately reverse itself within the same scroll tick — e.g. track the timestamp of the last flip and ignore a reversal within ~50-100ms of it. Only add this if testing shows it's still needed; don't add speculative complexity if 1+2 already fix it.

## Cleanup
The `console.log` block (~lines 148-166, the `[HANDOFF ...]` debug logging) is explicitly marked `// TEMP DEBUG`. Once you've confirmed the fix (Δw/Δtop read 0 or near-0, and no repeated flips in the log while scrolling slowly across the seam), **remove that debug logging** — it was left in intentionally for this diagnosis but shouldn't ship.

## Hard constraints
- Don't touch `MacbookScene.tsx`'s easing/zoom-timing logic (`displayedP`, `rawZoom`) — that was already tuned in a prior fix and is not implicated here (the log shows a pure pin-state oscillation at a fixed scroll position, not a timing/zoom-completion issue).
- Keep the single-host-node re-parenting architecture (`appendChild`, not remounting/re-portaling to a changing target) — see the comment block at ~lines 129-140.
- Preserve mobile behavior (`max-width:1023.98px` branch).

## Verification
1. Run the dev server, open the browser console.
2. Scroll slowly through the full MacBook sequence on a desktop viewport (≥1024px), paying close attention near the very end (progress ≈0.98-1.0).
3. Confirm: each `[HANDOFF ...]` log line (before you remove it) shows `Δw: 0 Δtop: 0` (or very close), and appears **at most once per direction** per pass through the seam — no repeated alternating lines at a single scroll position.
4. Visually confirm no flicker/bounce at the handoff, in both scroll directions, including slowly scrubbing back and forth right at the boundary.
5. Remove the temp debug logging once confirmed, then re-verify visually once more (logging removal shouldn't change behavior, but confirm anyway).

Report exactly what you changed and why, referencing file:line, including the final hysteresis values you landed on and what you found for the Δw/Δtop discrepancy.
