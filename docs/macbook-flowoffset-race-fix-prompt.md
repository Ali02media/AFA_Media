# Fix: `applyFlowOffset` clears the compensating transform BEFORE the DOM re-parent happens (race)

## Read this first
The transform-pin approach (`applyFlowOffset`) is the right idea — a transform has no travel limit to exhaust, which is exactly how `position: sticky` failed here. Keep it. The bug is a synchronous/asynchronous ordering race in how it decides when to clear the transform. This is a code-ordering fact, verifiable by reading the two call sites — not a geometry estimate.

File: `components/sections/macbook-showcase.tsx`.

## Symptom
```
[HANDOFF 3D→FLAT] Δw: -1 Δtop: -4      ← scroll DOWN, fine
[HANDOFF FLAT→3D] Δw:  1 Δtop: -112    ← scroll UP, big jump
   ... alternating consistently
```
Down direction is clean (−4). Up direction is a large, consistent −112.

## The bug

`onUpdate` (line 137) runs these **synchronously, in this order**:
```js
onUpdate: (self) => {
  progressRef.current = self.progress;
  invalidateRef.current?.();
  applyHandoff(self.progress);      // mutates pinnedRef.current NOW, queues setPinned()
  applyFlowOffset(self.progress);   // reads pinnedRef.current NOW
}
```

`applyFlowOffset` (line 111-116):
```js
const gap = pinnedRef.current ? 0 : (1 - p) * window.innerHeight * 4;
el.style.transform = gap > 0.5 ? `translate3d(0, ${-gap}px, 0)` : '';
```

But the actual DOM re-parent — `target.appendChild(host)` at **line 204** — happens inside a **React `useEffect`**, which runs on a later tick, not synchronously with `onUpdate`.

So on every scroll-UP crossing of `p = 0.99`:

1. `applyHandoff` flips `pinnedRef.current` `false → true` **synchronously** and queues `setPinned(true)`.
2. `applyFlowOffset` immediately reads `pinnedRef.current === true` → `gap = 0` → **clears the transform**.
3. **The CTA content is still inside `flowRef`** — React hasn't re-parented it yet.
4. So the flat CTA instantly drops from its compensated (viewport-top) position to its true document position, and is **painted there for one or more frames**.
5. Only then does the effect run and move it into the 3D screen.

The transform whose entire job is to hold the flat CTA at the viewport top is removed while the flat CTA is still the thing on screen. That is the visible up-scroll bounce.

### Why this accounts for −112 specifically
`before` is measured at **line 203, inside the effect** — i.e. *after* step 2 already cleared the transform. So `before` captures the flat CTA at its raw document position, which is `(1 - p) × innerHeight × 4` px below the viewport top. Between the threshold crossing (step 1) and the effect actually running (step 5), trackpad momentum keeps scrolling — so by measurement time `p` has drifted below 0.99. At `p ≈ 0.965` with an 800px viewport that gap is `0.035 × 3200 ≈ 112px`. The band alone (0.009 ≈ 29px) does not explain 112; the band **plus** momentum drift during the async gap does. That drift is also why the number is larger than the band and yet stays consistent.

The down direction is clean because there the flip goes `true → false`, so `applyFlowOffset` *starts* applying the transform (rather than removing it) — the content arrives into an already-correct slot.

## The fix

Stop keying the offset off `pinnedRef.current`. It flips before the DOM moves, so it is the wrong signal. The offset should describe **where the flow slot needs to render**, which is purely a function of `p` — independent of which container currently holds the content.

```js
const applyFlowOffset = useCallback((p: number) => {
  const el = flowRef.current;
  if (!el) return;
  const gap = (1 - p) * window.innerHeight * 4;
  el.style.transform = gap > 0.5 ? `translate3d(0, ${-gap}px, 0)` : '';
}, []);
```

That is: **delete the `pinnedRef.current ? 0 :` conditional.**

Why this is safe:
- While pinned, the flow slot is **empty**, so translating it is visually a no-op (transform affects paint, not layout, so the `min-h-screen` scroll length is unchanged and nothing downstream moves).
- At `p = 1` the gap is 0 and the transform clears itself, so scrolling on past the section is normal flow — unchanged from now.
- Because the offset is now applied continuously and consistently, the flat slot renders at its `p = 1` position (= where the 3D content is parked, thanks to the ÷0.97 dwell) for **every** `p` in the band. So it no longer matters that the re-parent lands several frames after the threshold — whenever it lands, both positions agree.

### Alternative, if you prefer to be explicit rather than rely on "empty slot ⇒ harmless"
Gate on where the content **actually is** rather than on `pinnedRef`:
```js
const gap = flowRef.current?.contains(hostRef.current)
  ? (1 - p) * window.innerHeight * 4
  : 0;
```
This needs `host` mirrored into a ref (it's currently React state, so it isn't readable from the scroll callback without one). Functionally equivalent to the simple version but self-documenting. Either is fine — prefer the simple one unless the always-on transform causes a problem you can actually observe.

## Do not
- Do not change the band (`0.99` / `0.999`) as part of this. It is now wide enough (~29px) to sit outside momentum overshoot, and once the transform is applied consistently, band width no longer trades against position. Only revisit it if chatter is still present *after* this fix.
- Do not touch the `÷0.97` dwell in `MacbookScene.tsx:544`, `vNudgeWorld`, or `ZOOM_END_PULLBACK`. The down direction reading −4 shows that calibration is correct.
- Do not reinstate `position: sticky` on the flow slot. The transform supersedes it and does not have the travel-exhaustion failure mode.
- Do not add a time-based debounce.

## Verification
1. Scroll slowly through the seam in **both** directions. Target: `Δtop` within ±2-3px both ways, not `-4` / `-112`.
2. Confirm one `[HANDOFF]` line per crossing per direction — no alternating pattern.
3. Confirm visually: no bounce up or down.
4. **If a residual offset survives:** the `[TRACE 3D]` / `[TRACE FLAT]` arrays already logged at line 201 contain each ancestor's `top`/`height` from the CTA card up to the portal wrapper. Expand both arrays in the console and compare them row by row — the row where `top` diverges names the exact culprit element. Report that diff rather than guessing; it's what the trace was built for.
5. Once clean, remove the `[HANDOFF]` / `[TRACE]` temp debug block (lines ~182-215) and re-verify visually.

Report what you changed with file:line, and paste the final log showing Δtop in both directions.
