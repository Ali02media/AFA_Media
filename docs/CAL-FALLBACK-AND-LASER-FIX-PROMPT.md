# Four bugs: Cal modal over the hero, invisible navbar, stray homepage calendar, white laser

All four diagnosed live against `http://localhost:3000` with DOM measurements. Read each diagnosis before changing anything — none of these are what they first appear to be.

---

## BUG A — The navbar is INVISIBLE but still interactive under reduced motion  ← fix this first

### Measured, on a clean reload
```
header  opacity:        0
        transform:      matrix(1, 0, 0, 1, 0, -64)   (shifted up 64px)
        pointer-events: auto                          (still live)
        reducedMotion:  true
```

### Cause
`components/layout/navbar.tsx:38-41` animates the header in with Framer Motion:
```jsx
initial={{ y: -64, opacity: 0 }}
animate={{ y: 0, opacity: 1 }}
transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.1 }}
```
When `prefers-reduced-motion: reduce` is set, that entrance animation does not run, so the header is stuck **permanently at its `initial` values** — fully transparent and translated off-screen. The site's entire navigation is invisible. This also matches the long-standing console warning: *"You have Reduced Motion enabled on your device. Animations may not appear as expected."*

Critically, `pointer-events` remains `auto`, so the header and its buttons stay in the hit-testing tree while invisible. In the currently measured state the button sits just above the viewport (`top: -52`, `bottom: -12`) so it cannot be clicked — but this is fragile. Any variation (different viewport height, a partially-applied animation, the scroll-triggered `glass-nav` restyle) can leave an **invisible but clickable "Book a Call" button at the top of the page**. Clicking it fires the full-screen Cal modal (Bug B) — which is very likely the "booking thing randomly appears over the hero" report.

### Fix
The entrance animation must degrade to its **final** state, not its initial state, when motion is reduced. Use `useReducedMotion()` (already imported in `components/reveal.tsx`, so the pattern exists in this codebase) and skip the `initial` offset entirely:
```jsx
const prefersReduced = useReducedMotion();
// ...
initial={prefersReduced ? false : { y: -64, opacity: 0 }}
animate={{ y: 0, opacity: 1 }}
```
Passing `initial={false}` tells Framer Motion to mount directly at the animate values.

Then audit **every** other `motion.*` component in the codebase for the same pattern — any `initial` that hides an element (`opacity: 0`, an offset, `scale`) will strand that element hidden for reduced-motion visitors. `components/reveal.tsx` already handles this correctly (it returns a plain `<div>` when `forceVisible`, and sets `duration: 0` when reduced); the navbar does not. Check the footer and any section-level animations too.

### Verify
With reduced motion emulated (DevTools → Rendering → Emulate CSS `prefers-reduced-motion: reduce`), the navbar must be **fully visible and correctly positioned immediately on load**, with no animation. Confirm `getComputedStyle(document.querySelector('header')).opacity === '1'`.

---

## BUG B — The Cal.com modal covers the entire viewport, including the hero

### Measured
Clicking any `[data-cal-link]` element injects `<cal-modal-box>` into `<body>`. Inside its shadow DOM:
```
.my-backdrop  position: fixed
              z-index:  2147483647      (maximum)
              rect:     1280 × 720 at top 0
              coversViewport: true
```

So the booking modal blankets the whole viewport at maximum z-index — over the hero and everything else.

### Is this a bug?
**The modal itself is Cal's intended popup behaviour, not a defect.** It becomes a problem only because of *how it gets triggered*. There are six triggers on the site: navbar "Book a Call" (desktop and mobile menu), footer "Book a Free Call", the CTA's "Book Your Free Call", and both pricing "Get started" buttons — all via `calAttrs` in `components/cal.tsx:77-84`.

Fix Bug A first. If the invisible-navbar issue was causing accidental activation, that resolves the "random" part and no change to Cal is needed.

If the owner reports the modal still appearing without a deliberate click after Bug A is fixed, investigate further — but **do not** pre-emptively rework the Cal popup. Confirm the trigger first.

---

## BUG C — A bare Cal.com calendar appears mid-homepage

### What is actually happening
The MacBook section has **not** been removed — `app/page.tsx:79` still renders `<MacbookShowcase />`.

`components/sections/macbook-showcase.tsx` has a reduced-motion / mobile fallback branch:
```jsx
if (desktop === false || (desktop !== null && reduceMotion)) {
  return (
    <section ref={sectionRef} className="relative flex w-full justify-center px-4 py-16">
      {calendar}
    </section>
  );
}
```

Verified live: `prefers-reduced-motion` is `true` on the test machine; the rendered section's className is exactly `"relative flex w-full justify-center px-4 py-16"` (the fallback branch); and the only two `<canvas>` elements on the page are the hero's `plasma-container` and `laser-flow-container` — there is **no MacBook canvas**. It is not a modal, not an autoscroll, and not a focus steal (`window.scrollY === 0`, `document.activeElement === BODY` after load).

The fallback *mechanism* is correct and required for accessibility. What was never designed is the fallback's **UX** — it renders a naked calendar with no heading, eyebrow or framing, dropped between the short FAQ and the full FAQ.

### Fix
The owner has decided to remove the MacBook from the homepage:
1. Remove the `MacbookShowcase` import (`app/page.tsx:10`) and usage (line 79).
2. The homepage already has `<CTA />` (line 67) with a "Book Your Free Call" button, so a second inline calendar is probably redundant. **Ask the owner** whether they want nothing there, or a properly designed inline booking section with heading and section styling.
3. Do **not** simply delete the reduced-motion branch — that branch is correct. The issue is that the section shouldn't be on the homepage at all.
4. If `MacbookShowcase` becomes unused, `components/MacbookScene.tsx`, `components/booking-calendar.tsx` and the 11.8 MB `public/models/tabletop_macbook_iphone.glb` may become dead too. **Do not delete them** — the owner is considering a simplified version for the About page. Just report what would become unused.

### Also fix while here
The console logs `"Inline embed already exists. Ignoring this call"` **four times** on load — `BookingCalendar`'s `useEffect` fires repeatedly (StrictMode double-mount plus re-renders), calling `Cal.ns[...]("inline", ...)` each time. Cal ignores the duplicates so nothing breaks, but it is noise masking real warnings. Guard it so it runs once per mounted element.

---

## BUG D — The hero laser renders white instead of light blue

### What is actually happening
The colour value is **already correct** — `components/sections/hero.jsx:90` passes `color="#42b5cf"`, and `LaserFlow.jsx:562-563` correctly converts it into the `uColor` uniform. There is no wrong hex to find.

The problem is **per-channel highlight clipping in the fragment shader**, at `LaserFlow.jsx:226`:
```glsl
vec3 col = tone * uColor + dith;
```
`tone` is `g(LF+w)`, where `g` (line 108) is an sRGB transfer function with **no upper clamp**:
```glsl
float g(float x){return x<=0.00031308?12.92*x:1.055*pow(x,1.0/2.4)-0.055;}
```
In the bright core of the beam, `LF+w` far exceeds 1, so `tone` reaches several multiples of 1.0.

`#42b5cf` normalises to `rgb(0.259, 0.710, 0.812)`. Once `tone` exceeds `1 / 0.259 ≈ 3.86`, **all three channels clip to 1.0 independently and the result is pure white.** The blue survives only in the dimmer outer falloff — exactly matching the observed white core with a faint blue fringe.

### Fix
Preserve hue by scaling the overflow down proportionally instead of letting channels clip independently. Replace line 226:
```glsl
// before
vec3 col = tone * uColor + dith;

// after — hue-preserving highlight rolloff
vec3 col = tone * uColor;
float m = max(col.r, max(col.g, col.b));
if (m > 1.0) col /= m;   // scale the whole colour down, keeping channel ratios
col += dith;
```
This renders the beam core as saturated `#42b5cf` instead of blowing out to white, leaving falloff, fog and wisps untouched.

**Tuning notes**
- If it now looks too flat and loses the "hot laser core" feel, add a *narrow* white core back by mixing toward white only at the very top of the range — `col = mix(col, vec3(1.0), smoothstep(3.0, 6.0, tone))` applied **after** the normalisation. Tune both thresholds by eye.
- Do **not** fix this by lowering `fogIntensity` / `wispIntensity` / `flowStrength` in `hero.jsx`. That dims the whole effect to dodge the clip rather than fixing it, and the beam will look weak.
- Verify at more than one window size — peak intensity varies with resolution-dependent terms.
- `hero.jsx:71` (`color="#298e99"` on `Plasma`) is a separate component with its own colour path — leave it alone.

---

## BUG E — The hero's only CTA does nothing

`components/ui/shiny-button.tsx` accepts an optional `onClick` prop, but `components/sections/hero.jsx:137` renders:
```jsx
<ShinyButton>See the Process</ShinyButton>
```
with no handler. Clicking the hero's primary call-to-action has **no effect at all**.

Decide with the owner what it should do — most likely scroll to the `ProcessSection` ("From first call to live in 14 days"), or open the Cal popup like the other CTAs. Note the site has no `scroll-padding-top` despite a fixed 64px navbar, so if it becomes an anchor scroll, add `scroll-padding-top: 4rem` to `html` in `globals.css` or the heading will land underneath the navbar.

---

## Suggested order
1. **Bug A** (invisible navbar) — highest impact, and may resolve Bug B's "randomness" entirely.
2. Re-test Bug B before touching Cal.
3. **Bug C** — remove `MacbookShowcase` from the homepage (confirm the replacement with the owner first).
4. **Bug D** — one-line shader change.
5. **Bug E** — confirm intended behaviour with the owner.

Report each with `file:line`, and state explicitly whether fixing Bug A stopped the modal appearing unexpectedly.
