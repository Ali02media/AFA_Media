# Fix: residual 4px handoff offset + make the handoff independent of scroll-tick size

## Status — read first, it changes what you're chasing
Prior fixes landed and are working. Do **not** re-open them:
- The `÷0.97` dwell in `MacbookScene.tsx` — working.
- Removing the `pinnedRef.current ? 0 :` conditional from `applyFlowOffset` — this is what took `Δtop` from `-112` to `±4`. Keep it.
- The hysteresis band `0.99 / 0.999` — chatter is resolved.
- `position: sticky` on the flow slot — correctly abandoned; the transform-pin supersedes it.

Latest log:
```
[HANDOFF 3D→FLAT] Δw: -1 Δtop: -4
[HANDOFF FLAT→3D] Δw:  1 Δtop:  4
```

Two things remain. Part A is a small constant geometric offset. Part B is a robustness hole that makes the handoff behave differently depending on how coarsely the visitor's browser/OS delivers scroll events. Both need fixing; A is the visible 4px, B is why tuning has felt like whack-a-mole.

---

## Part A — the residual constant 4px offset

### Proof it's constant, not drift
`after` is always measured one rAF after `before`. If frame drift contributed, the two directions would sum to `2 × drift ≠ 0`. They sum to exactly `0`; differencing gives `FLAT − 3D = −4` consistently. So: **zero frame drift, and a constant 4px offset with the flat CTA sitting 4px above the 3D content.** `Δw ±1` proves horizontal scale is already correct — this is purely vertical.

### Already ruled out — don't spend time here
`Reveal` re-animating on re-parent. `components/reveal.tsx` returns a plain `<div>` (no `motion.div`, no transform, no IntersectionObserver) whenever `forceVisible` is set, which is how the CTA renders inside this section. Not a factor.

### Root cause
`components/MacbookScene.tsx`, zoom-endpoint calibration (~line 443):
```js
const screenHcss  = (SCREEN_W * (trueH / trueW)) / ZOOM_END_PULLBACK;
const worldPerPx  = (2 * dist * Math.tan(halfVFov)) / viewportHpx;
vNudgeWorld = (viewportHpx / 2 - screenHcss / 2 - 10) * worldPerPx;
```

The `- 10` is a hardcoded magic number with no derivation in the surrounding comment.

Working the projection: the drei `<Html center>` content is centred on the panel centroid, which the camera aims at, so by default its centre sits at `viewportHpx / 2`. Panning by `vNudgeWorld` moves it up on screen by exactly `(viewportHpx/2 − screenHcss/2 − 10)` px, putting the content's **box top at 10px** below the viewport top. The flat flow slot is transform-pinned to render at its `p = 1` position, i.e. **box top at 0**.

So the formula predicts `Δtop(3D→FLAT) = −10`; you measure `−4`. Same sign, same order of magnitude — that constant is the source. The 6px gap between predicted and measured indicates a second small inaccuracy in the same expression, most likely `screenHcss` not equalling the wrapper's true rendered height (it's derived from mesh aspect ratio ÷ `ZOOM_END_PULLBACK` rather than measured from the DOM).

### Do this diagnostic FIRST (costs a minute, settles it definitively)
The `[TRACE 3D]` / `[TRACE FLAT]` logs currently do `console.log(label, chain)` where `chain` is an array of objects. Browsers collapse that to `▶ (7) [{…}, …]`, which is why the data has been invisible in every screenshot so far. Emit a pre-formatted **string** instead:

```js
console.log(`[TRACE ${label}]\n` + chain.map(r => `  ${r.tag}  top=${r.top}  h=${r.h}`).join('\n'));
```

Capture one `3D` and one `FLAT` trace, diff row by row. The first row where `top` diverges names the exact element responsible. Also log, once after load, `screenHcss` alongside the **actual** `getBoundingClientRect().height` of the `<Html>` wrapper div in `ScreenFollower` (the one styled `width: SCREEN_W, height: screenH`) — if they differ, that difference is your 6px.

### Fix
Preferred: replace the magic constant with a **measured** correction so it holds at any viewport. Use the measured wrapper height in place of the computed `screenHcss`, and set the constant term so the content's box top lands at **0** — the term should exist only to correct a real measured offset, not as a fudge. Name it (e.g. `TOP_ALIGN_PX`) with a comment stating what it corrects and how it was derived.

Acceptable quick version, given the residual is only 4px:
```js
vNudgeWorld = (viewportHpx / 2 - screenHcss / 2 - 6) * worldPerPx;
```
**Caveat:** this is tuned at one viewport height. Because the discrepancy stems from a height term rather than a pure pixel constant, verify at two clearly different viewport heights (e.g. 800px and 1100px). If `Δtop` drifts between them, do the measured version instead.

---

## Part B — make the handoff independent of scroll-tick size (do NOT solve this by changing any OS/browser setting)

### The problem
The tester has OS-level Reduced Motion enabled. That can disable smooth-scroll interpolation, so wheel events arrive as **fewer, much larger discrete deltas** instead of many small interpolated ticks. **This is not something to work around by changing settings — real visitors will have it too** (reduced motion is a common accessibility setting, and coarse tick delivery also happens with mouse-wheel-only input, certain trackpad drivers, and some browsers). The site must be correct for all of them.

Why it breaks the current design: correctness currently depends on *where in the band the swap fires*, and the band is only ~29px. With coarse ticks a single event can jump clean across it, or overshoot the region where both representations are position-matched.

### The specific failure mode to fix
The "aligned window" — the scroll range where BOTH representations sit at the same place — is `[dwell_complete_p, 1]`. With `÷0.97` the dwell completes at `p = 0.97`, so the window is `p ∈ [0.97, 1]` ≈ `12vh` ≈ 96px. Both thresholds sit inside it, which is correct.

But on a **large upward tick** the scroll can jump from `p > 1` to `p < 0.97` in one event. At that moment `applyHandoff` re-pins (`p ≤ 0.99`), so the 3D content must be shown — but `displayedP` now targets a value where `rawZoom = (dp−1)/0.97 < 1`, i.e. the zoom is **no longer parked at the endpoint**. The vNudge alignment only holds at the endpoint, so the 3D content appears at a different position than the flat CTA just occupied → visible jump, proportional to how far the tick overshot. Tick size therefore determines jump size, which is exactly why this has felt untunable.

### Fix B1 — measure the real tick sizes (instrument before tuning)
Temporarily log the per-tick delta in `onUpdate`:
```js
// TEMP: characterise scroll granularity
const dp = self.progress - (lastPRef.current ?? self.progress);
lastPRef.current = self.progress;
if (Math.abs(dp) > 0.002) console.log('[TICK] Δp', dp.toFixed(4), '≈', Math.round(Math.abs(dp) * window.innerHeight * 4), 'px');
```
Record the max observed `px` per tick while scrolling normally through the seam. That number is the margin the design must tolerate. Report it.

### Fix B2 — make the swap position-exact regardless of overshoot
Do not try to solve this by widening the dwell — the user has already rejected long dwells as visibly stalling the animation (`÷0.8` ≈ 80vh was far too long; `÷0.97` ≈ 12vh is near the acceptable limit). Instead, remove the dependency on where the tick lands:

On the **re-pin transition specifically** (the `FLAT→3D` direction), force the 3D to its endpoint for that frame so the handoff is position-exact no matter how far the tick overshot, then let it ease naturally as the user continues scrolling up. Concretely: expose a way for `macbook-showcase.tsx` to tell `MacbookScene` "snap `displayedP` to the parked-endpoint value now" at the moment `pinned` flips true, rather than letting it ease from wherever the tick left it.

This is safe visually: at the handoff `chassisFade` is ≈0.97 (canvas opacity ≈0.03), so the 3D chassis is almost fully faded out — snapping the camera at that instant is imperceptible, while the DOM overlay it positions lands exactly where the flat CTA was.

If you find a cleaner way to achieve "3D is always at endpoint geometry at the instant of handoff," that's equally acceptable — the requirement is the outcome, not this specific mechanism.

### Fix B3 — the band's only job is preventing double-flips
Once B2 is in, band width must no longer affect *position* correctness at all (the transform-pin already guarantees the flat side; B2 guarantees the 3D side). Keep `0.99 / 0.999`. Do not widen it further to compensate for tick size — that reintroduces the trade-off we just eliminated.

### Fix B4 — reproducible test WITHOUT changing any setting
Coarse-tick behaviour must be verifiable on any machine. Drive it synthetically from the console:
```js
// Land inside the band, then overshoot upward in ONE large jump
const H = window.innerHeight;
window.scrollTo(0, H * 5 - 20);            // just under p=1
setTimeout(() => window.scrollBy(0, -180), 300);  // one coarse upward tick
```
Repeat with `-60`, `-180`, `-400` to simulate a range of tick sizes. Also test one large **downward** jump across the seam. Watch `Δtop` in each case: it must stay ≈0 regardless of jump size. This replaces "turn reduced motion on/off" as the test, so it's reproducible for anyone and covers visitors you can't configure.

---

## Hard constraints
- Do NOT reintroduce the `pinnedRef.current ? 0 :` conditional in `applyFlowOffset`.
- Do NOT change `ZOOM_END_PULLBACK` — `Δw ±1` proves horizontal scale is correct; don't break it chasing a vertical problem.
- Do NOT lengthen the dwell beyond `÷0.97`; it is already at the limit of what reads as smooth.
- Do NOT reinstate `position: sticky` on the flow slot.
- Do NOT add a time-based debounce (tried; delayed flips landed at wrong scroll positions).
- Do NOT gate any behaviour on `prefers-reduced-motion` as a way of dodging Part B. The handoff must be correct for visitors who have it enabled — that's the whole point of B.
- Keep the single-host-node `appendChild` re-parenting architecture; don't remount the CTA.
- Preserve mobile (`max-width: 1023.98px`).
- `overflow-x: clip` in `globals.css:66` is deliberate (the comment explains `hidden` would force `overflow-y: auto`). Leave it.

## Also — two console messages you can safely ignore, and one already-correct thing
- The `THREE.WebGLProgram ... warning X4122: sum of ... cannot be represented accurately in double precision` messages are HLSL shader-compiler warnings from ANGLE's GLSL→HLSL translation on Windows. The line refs point into generated HLSL, not project source. They're informational, fire once at shader compile, and cannot affect DOM layout or scroll math. Do not chase them.
- `THREE.Clock: This module has been deprecated` (`LaserFlow.jsx:365`) is cosmetic; migrating to `THREE.Timer` is optional cleanup, unrelated to this bug.
- `LaserFlow.jsx` and `Plasma.jsx` **already** have `IntersectionObserver` + `visibilitychange` gating and bail out when offscreen (`LaserFlow.jsx:486`, `Plasma.jsx:182`). They are not competing for frames at the MacBook section. Do not "add" pausing to them.

## Verification
1. Convert the `[TRACE]` output to string form, capture `3D` + `FLAT`, and state which row's `top` diverges.
2. Report the max observed per-tick px delta from B1.
3. Apply Part A. Target `Δtop` within ±1px both directions at two different viewport heights.
4. Apply Part B. Run the B4 synthetic jumps at `-60`, `-180`, `-400` and one large downward jump. `Δtop` must stay ≈0 for all of them — this is the acceptance criterion that proves it's tick-size independent.
5. Confirm one `[HANDOFF]` line per crossing per direction — no alternating pattern.
6. Confirm visually: no perceptible shift either direction, and the dwell is still imperceptible (if the zoom visibly stalls, the divisor is too aggressive).
7. Remove all temp debug (`[HANDOFF]`, `[TRACE]`, `[TICK]`) and re-verify visually.

Report what changed with file:line, the trace diff, the max tick delta, and the final `Δtop` readings for every B4 jump size.
