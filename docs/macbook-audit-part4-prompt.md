# PART 4 — further bugs (paste after Parts 1-3)

Findings from `components/sections/hero.jsx`, `lib/site.ts`, the SEO surface, and viewport-unit usage.

## BUG 25 — the MacBook section's layout comment describes a page order that no longer exists

`macbook-showcase.tsx:28`:
```
// Layout (desktop; hero above is exactly 100vh so the section top sits at document y=100vh):
```
But `app/page.tsx` now renders `<MacbookShowcase />` **tenth**, after Hero, TrustBar, Problem, ServicesSection, Proof, PricingPreview, CTA, ProcessSection and a short FAQ. The section top is thousands of pixels down the page, nowhere near `y = 100vh`.

This does not break the maths — `start: 'top top'` is resolved relative to the trigger element, so it is position-independent. But it is another stale comment of exactly the kind that has already sent this debugging down wrong paths twice. Fix it to describe the real layout, and state explicitly that the trigger is position-independent so nobody "corrects" the page order to satisfy a comment.

**Related risk worth checking:** the section now sits below ~9 sections of dynamic content (images, fonts, `Reveal` animations). Any late layout shift above it moves the section, invalidating ScrollTrigger's cached start/end — and the only `refresh()` fires once on `document.fonts.ready` and is skipped if the trigger is active (Part 1 Bug 4). Moving the section down the page made that fragility much more likely to bite than when it sat directly under the hero.

## BUG 26 — the hero repaints a full-screen blended, masked layer on every single mousemove

`hero.jsx:29-46` writes CSS custom properties on every `mousemove`, unthrottled:
```jsx
onMouseMove={(e) => {
  ...
  el.style.setProperty('--mx', `${x}px`);
  el.style.setProperty('--my', `${y}px`);
}}
```
Those variables drive the mask on the full-viewport image at `hero.jsx:118-140`:
```jsx
width: '100%', height: '100%', objectFit: 'cover',
mixBlendMode: 'lighten',
WebkitMaskImage: 'radial-gradient(circle at var(--mx) var(--my), ...)',
```
So every mouse movement invalidates a **full-viewport masked layer that also has `mix-blend-mode: lighten`**. Blend modes force the compositor to read back the backdrop, and the mask change forces re-rasterisation — all of this on top of **two** WebGL canvases (LaserFlow + Plasma) already rendering every frame in the same hero.

Mousemove fires up to ~120×/second. This is very likely a primary cause of hero lag.

**Fix:** coalesce the writes into one per animation frame (store the latest x/y, write inside a `requestAnimationFrame`, skip if a frame is already pending). If it is still heavy, reimplement the reveal as a small `transform: translate3d(...)` on a compositor-promoted element rather than animating a mask position on a full-screen blended layer.

## BUG 27 — the production hero is unmodified vendor demo code

`hero.jsx` defines `function LaserFlowBoxExample()` and exports it as the site's hero:
```js
export { LaserFlowBoxExample as Hero };
```
with leftover vendor comments still in place:
```js
// NOTE: You can also adjust the variables in the shader for super detailed customization
// Image Example Interactive Reveal Effect
```
This is the LaserFlow library's example component shipped as the homepage hero. Not a functional fault on its own, but it explains the other hero issues in this list (inline styles, hardcoded colours, absolute positioning, no mobile gating) — the demo was never adapted into a real component. Rename it to `Hero`, remove the vendor comments, and bring it in line with the rest of the codebase's conventions.

## BUG 28 — LaserFlow runs on mobile with no gate, unlike Plasma

`hero.jsx:14-21` gates **Plasma** behind `matchMedia('(min-width: 1024px)')`:
```jsx
{showPlasma && (<div ...><Plasma ... /></div>)}
```
But `<LaserFlow>` immediately below (line 62) has **no such gate** — it renders a full WebGL shader on every phone that loads the site. Given Plasma was deliberately excluded from mobile for cost reasons, LaserFlow almost certainly should be too (or at least run at reduced `dpr`/quality). Apply the same gate, or a mobile-specific quality tier.

## BUG 29 — `100vh` everywhere, no `svh`/`dvh` — the hero resizes as the mobile URL bar hides/shows

`hero.jsx:26` sets `height: '100vh'`, and the codebase uses `h-screen` / `min-h-screen` (also `100vh`) throughout. There is **no `svh` or `dvh` usage anywhere**.

On mobile browsers the URL bar collapses on scroll, changing `100vh` mid-scroll. The hero therefore resizes as the user scrolls, shifting every section below it — a layout shift on the LCP element, and a CLS penalty.

**Fix:** use `100svh` (or `100dvh` where the resize is intended) for full-height blocks, with a `100vh` fallback for older browsers. Audit each `h-screen` / `min-h-screen` individually — the MacBook stage is desktop-only so it is unaffected, but the hero, `not-found`, `contact`, `privacy` and `terms` pages all use it.

## BUG 30 — decorative image announced to screen readers

`hero.jsx:120` — `alt="Reveal effect"` on a purely decorative, `pointer-events: none` overlay. Screen readers will announce "Reveal effect", which is meaningless to a user. Use `alt=""` (and optionally `aria-hidden="true"`) for decorative imagery.

## BUG 31 — hero bypasses the design system entirely

`hero.jsx:82-115` uses inline styles with hardcoded values throughout: `color: '#ffffff'`, `color: '#c4c8d8'`, `backgroundColor: '#120F17'`, `fontSize: 'clamp(2.5rem, 5vw, 4rem)'`, `top: '22vh'`, `left: '8%'`, `maxWidth: '640px'`.

None of these colours exist in the `@theme` tokens in `app/globals.css` (`--color-ink`, `--color-mist`, `--color-line`, etc.), so the hero cannot be restyled from the token set and will drift from the rest of the site. The absolutely-positioned text block (`top: 22vh; left: 8%; maxWidth: 640px`) is also not responsive — verify it does not overflow or collide with the beam at narrow widths and short heights.

## BUG 32 — copy errors in the hero subhead (the LCP text)

`hero.jsx:111`:
> "AI chatbots that capture every lead, ads that only target buyers ready to book paired with a beautiful site, not a digital brochure. — if it isn't setup within less than 30 days, you don't pay."

- `". — if"` — a full stop immediately followed by an em dash
- `"setup"` should be `"set up"` (verb form)
- `"within less than 30 days"` is redundant — either "within 30 days" or "in less than 30 days"
- the sentence is a run-on and the "paired with a beautiful site" clause is missing punctuation

This is the most-read sentence on the site. Worth a rewrite pass — flag to the user rather than silently rewording marketing copy.

## BUG 33 — verify `site.url` against the actual deployment

`lib/site.ts:8` sets `url: "https://www.afamedia.co.uk"`, which feeds `metadataBase`, `alternates.canonical`, the JSON-LD `url`, `sitemap.ts` and `robots.ts`. The site is currently deployed at `https://claudev1afa.netlify.app/`.

If `afamedia.co.uk` is the intended production domain and is live, this is correct and needs no change. If it is **not** live yet, then on the deployed preview every canonical points at a non-existent domain, OG/Twitter image URLs resolve against it, and the sitemap advertises URLs that do not resolve — meaning social previews will be broken and the preview will not be indexed. Confirm with the user which is intended; do not change it unilaterally.

## Confirmed clean (do not spend time here)
- `app/sitemap.ts` and `app/robots.ts` are correct and complete — all seven routes present with sensible priorities, sitemap correctly referenced from robots.
- `app/manifest.ts`, `app/opengraph-image.tsx` and `app/favicon.ico` all exist.
- `metadataBase`, `openGraph` and `twitter` metadata are all configured in `app/layout.tsx`.
- No `app/icon.*` or `app/apple-icon.*` — Next will fall back to `favicon.ico`. Adding them is a nice-to-have, not a bug.

## Verification for Part 4
1. Record a DevTools Performance trace while moving the mouse across the hero. Confirm the long paint/composite tasks from the mask repaint are gone after the rAF fix (Bug 26).
2. Load the site on a real phone (or throttled mobile emulation) and confirm LaserFlow is either gated off or running at reduced quality (Bug 28).
3. Scroll on a mobile browser and confirm the hero no longer resizes as the URL bar collapses (Bug 29).
4. Run an accessibility checker over the hero and confirm the decorative image is no longer announced (Bug 30).
5. Check the hero at 360×640, 768×1024 and 1600×700 for text overflow or collision (Bug 31).
