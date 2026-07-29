# Task: Fix site-wide lag/jank, then add smooth scroll — WITHOUT breaking the MacBook scroll sequence

## Context
This is a Next.js (App Router) + TypeScript site. Note `AGENTS.md`: this is a modified Next.js — read `node_modules/next/dist/docs/` before touching Next-specific APIs.

**Critical constraint before you touch anything:** `components/sections/macbook-showcase.tsx` (the 3D MacBook scroll sequence on the homepage) has been fixed multiple times already for scroll-sync bugs (jumps, bounces, flip-flopping), and its entire architecture is deliberately built around **raw native scroll** — see its own comments: "instant scrub," "progress tracks scroll directly," "a pure function of scroll position." Any change to how scrolling works globally (smooth scroll, scroll-linked libraries, etc.) can reopen those exact bugs if not integrated carefully. Do the performance work FIRST and verify the MacBook section still works exactly as before, THEN add smooth scroll, then re-verify the MacBook section again extremely carefully. Don't do both at once.

Read files fully before editing. Don't do drive-by rewrites — this is a mature, tuned codebase; make targeted fixes.

---

## Part 1: Kill the lag

### 1a. Remove dead 3D scene code (free win, do this first)
`components/HeroScene.tsx` and `components/hero-road-scene.tsx` are full React Three Fiber `<Canvas>` scenes that are **not imported anywhere in the app** (confirmed via grep — no references outside their own files). They're dead weight in the bundle. Also check `components/sections/hero-motion.tsx` — also appears unused (the active hero is `components/sections/hero.jsx`, imported in `app/page.tsx` as `Hero`).
- Confirm each is truly unused (grep the whole repo, not just `app/` and `components/`, in case something dynamic references them).
- If confirmed dead, delete them. If you're not fully certain one is dead, leave it and flag it instead of guessing.

### 1b. Pause the custom WebGL background effects when off-screen
`components/hero.jsx` renders `LaserFlow` (`components/LaserFlow.jsx`) and `Plasma` (`components/Plasma.jsx`) — both are raw WebGL (via the `ogl` library) effects that run their own `requestAnimationFrame` loop continuously (see `raf = requestAnimationFrame(...)` in both files). Since these are in the hero, they're rendering every frame from page load, including once the user has scrolled far past the hero into later sections — pure wasted GPU/CPU work fighting with everything else on the page (the MacBook 3D scene, GSAP ScrollTrigger, etc.).
- Add an `IntersectionObserver`-gated pause: stop the rAF loop (or otherwise skip rendering) when the hero is scrolled out of view, resume when it re-enters. `components/MacbookScene.tsx` already uses this exact pattern for lazy-loading (`IntersectionObserver` with `rootMargin: '400px'`, ~line 606-615) — follow that precedent for consistency rather than inventing a new approach.
- Do this for both `LaserFlow.jsx` and `Plasma.jsx`.

### 1c. Delete the orphaned "atom" video assets (do this first — it's the single biggest win and it's zero-risk)
`public/hero-atom-nobg.mp4` (**29MB**), `public/hero-atom.webm` (3.5MB), and `public/hero-video.mp4` (8.1MB) are leftovers from an earlier version of this site. **They are not referenced anywhere in the current source** — confirmed via a full-repo grep for `hero-atom-nobg`, `hero-atom.webm`, and `hero-video` across `.tsx`/`.ts`/`.jsx`/`.js`/`.css`, and a grep for the word `atom` anywhere in `app/`, `components/`, `lib/` — all came back empty. A previous Claude Code session that redesigned the hero apparently never cleaned up the old video assets it replaced.
- Before deleting, do your own independent grep pass to confirm this is still true in case anything changed since (`hero-atom`, `hero-video`, and just `.mp4`/`.webm` generally, across the whole repo excluding `node_modules`) — don't take this as gospel without checking, but expect it to confirm zero references.
- If confirmed unused, **delete all three files** from `public/`. This alone removes ~40MB of dead weight from the repo/deploy — no re-encoding needed since nothing renders them.
- Separately, check whether any OTHER video actually IS used on the site (grep for `<video` and `.mp4`/`.webm` src references across `app/`+`components/`) and confirm its file size is reasonable for how it's actually displayed on-screen. If a genuinely-used video turns out to be oversized, re-encode that one (H.264/H.265, target well under 5MB) and ensure its `<video>` tag has `preload="metadata"` (or `"none"`) rather than `"auto"`, `playsInline` + `muted` if autoplaying, and is paused when scrolled off-screen (same IntersectionObserver approach as 1b).

### 1d. Replace the raw `<img>` with `next/image`
`components/sections/hero.jsx` has a plain `<img>` tag (~line 118) instead of Next's `<Image>` component, which means no automatic responsive sizing/format optimization/lazy-loading for it. Convert it, providing explicit `width`/`height` (or `fill` with a sized container) to avoid layout shift.

### 1e. Reduce animated-blur repaint cost
Several sections layer `backdrop-blur-*` and/or large animated `.orb` elements (blurred, some with `animate-ping-slow`) — found in `components/layout/navbar.tsx`, `components/sections/cta.tsx`, `components/sections/hero-motion.tsx` (if kept), `components/sections/problem.tsx`, `components/sections/services-section.tsx`. Each blurred+animated element forces the browser to re-rasterize a expensive filter every frame it's visible and animating.
- Check `app/globals.css` (or wherever `.orb` / `bg-grid` are defined) for the actual blur radius used.
- Where an orb is large (400-500px) AND blurred AND has zero interactivity/subtlety value beyond ambiance, consider: reducing blur radius, promoting the element to its own compositor layer with `will-change: transform` (if it's only ever transformed, not filtered, per-frame), or confirming these are `opacity`-only static decorations (not actually animating) and the cost is a one-time paint, not continuous — measure with the browser Performance panel before changing anything here; don't blur-radius-tune blind. This item is lower priority than 1a-1d; only pursue it if the Performance panel shows it's actually contributing measurable frame cost.

### Verify Part 1
1. Run the dev server, open Chrome DevTools → Performance panel, record a scroll through the entire homepage top to bottom.
2. Confirm dropped frames / long tasks are reduced compared to before (note a rough before/after if possible).
3. Confirm the MacBook scroll sequence (`components/sections/macbook-showcase.tsx`) still behaves exactly as before these changes — lid opens, zoom, handoff to the CTA, no new jumps/bounces. This is the regression-risk area; check it carefully even though Part 1 shouldn't touch its files directly (removing dead scenes or pausing unrelated effects could still shift overall frame timing).
4. Check Network panel: total page weight should be meaningfully smaller (video re-encoding is the big one).

---

## Part 2: Add smooth scroll — carefully

### Why this is risky here specifically
`components/sections/macbook-showcase.tsx` uses GSAP `ScrollTrigger` with `scrub: true` (not a numeric lag value — literally `true`, meaning **instant**, tracking native `scrollY` 1:1) and native CSS `position: sticky` (not GSAP's `pin`) for the stage. Its own comments explain this was deliberate: any lag/easing on scroll position itself (as opposed to the deliberate per-frame easing already happening inside `MacbookScene.tsx`'s `displayedP`) previously caused desync bugs between the 3D zoom and the flat section handoff. A naive smooth-scroll library that virtualizes scroll (e.g. transforms a wrapper instead of using real `window.scrollY`, or that GSAP's `ScrollTrigger` isn't told about) will break `position: sticky` behavior and/or desync the MacBook's progress tracking from what's visually on screen.

### Recommended approach: Lenis, wired to GSAP ScrollTrigger via the official integration
Use [Lenis](https://lenis.darkroom.engineering/) (`npm install lenis`) — it's the de facto standard smooth-scroll library for GSAP-based sites specifically because it can be wired to *drive* `ScrollTrigger` rather than fight it, and (in its default configuration) it still updates real `window.scrollY`/native scroll rather than pure transform-virtualization, which is what keeps `position: sticky` working.

Steps:
1. Install `lenis`.
2. Create the Lenis instance once, at the top of the app (a small client component mounted in `app/layout.tsx`, or a dedicated provider) — not per-page, not per-section.
3. Wire it to GSAP's ticker and `ScrollTrigger`, following Lenis's official GSAP recipe:
   ```js
   const lenis = new Lenis();
   lenis.on('scroll', ScrollTrigger.update);
   gsap.ticker.add((time) => { lenis.raf(time * 1000); });
   gsap.ticker.lagSmoothing(0);
   ```
   (Confirm exact API against the installed `lenis` version's current docs/types — don't assume this snippet is 100% correct for whatever version gets installed; check `node_modules/lenis` for the actual current API surface.)
4. Do **not** enable any Lenis option that virtualizes/transforms the scroll container (e.g. avoid wrapping the whole page in a Lenis-controlled transformed div if that's an available mode) — you need real `scrollY` to keep advancing for `position: sticky` and for `macbook-showcase.tsx`'s `ScrollTrigger.create({ trigger, start, end, scrub: true, onUpdate })` to keep receiving accurate native progress.
5. Leave `macbook-showcase.tsx` and `MacbookScene.tsx` completely untouched in this step. If Lenis integration alone doesn't break the MacBook section, you're done. If it does, the fix belongs in how Lenis is configured/wired (e.g. `lenis.on('scroll', ScrollTrigger.update)` must actually be firing), not in re-tuning the MacBook's own thresholds again — don't touch its hysteresis/easing values as a way to paper over a scroll-sync problem introduced by Lenis.

### Verify Part 2
1. Confirm the whole page now scrolls with smooth/eased momentum (mouse wheel and trackpad).
2. Re-run the full MacBook sequence verification from the prior fix rounds:
   - Lid opens, zoom, handoff to CTA — smooth, no jump, no bounce, no flip-flopping.
   - Scroll back up — clean re-entry.
   - Scrub slowly back and forth right at the handoff seam — stays stable.
3. Confirm `position: sticky` elements (the MacBook stage, and the sticky navbar if it uses `sticky`/`fixed`) still stick correctly with Lenis active.
4. Confirm anchor-link / in-page navigation (e.g. navbar links to `#services` if any exist — check `components/layout/navbar.tsx`) still scrolls to the right place; Lenis sometimes needs `lenis.scrollTo()` wired in for anchor links to work correctly instead of the browser's native jump.
5. Test on a reduced-motion preference (`prefers-reduced-motion: reduce`) — smooth scroll libraries should generally respect it (Lenis can be disabled or configured based on it); check what's appropriate here and whether the codebase already has other reduced-motion handling to be consistent with (there's a console warning already visible in dev: "You have Reduced Motion enabled on your device" — find where that's emitted and make sure the new smooth scroll respects the same signal).

## Hard constraints
- Do not modify `macbook-showcase.tsx`'s hysteresis thresholds, `MacbookScene.tsx`'s easing constants, or any of the scroll-math calibration from prior fixes, as a way to compensate for smooth-scroll integration issues. If Lenis breaks that section, the bug is in the integration, not in re-tuning already-hard-won values.
- Don't install additional animation/scroll libraries beyond Lenis for this task — no need for a second competing solution.
- Keep changes surgical: don't refactor unrelated code while you're in these files.

Report exactly what you changed in each part, referencing file:line, including final video file sizes before/after re-encoding, confirmation the MacBook section was re-tested after Part 2, and the reduced-motion handling you found/used.
