# Make the navbar translucent / frosted glass

## Reference
The user wants the top navbar to read as **frosted/translucent glass** — like the reference image: soft rounded glass panels, a translucent tint (not opaque), a subtle bright highlight along the top edge, and page content visibly blurred behind them.

**Important — the reference image is on a dark background; this site is light-themed** (`--color-ink: #ffffff` in `app/globals.css:13`). Take the *technique* from the reference (translucency + blur + soft edge highlight), not its literal dark-navy colour. Do not invert the site to dark to match the picture.

## Current state
The navbar lives in `components/layout/nav-menu.tsx` (recently rewritten into a full GSAP dropdown menu — a different component than any earlier navbar version, so ignore any older navbar code you may recall from previous work on this project).

`nav-menu.tsx:103`:
```jsx
<header ref={root} className="fixed inset-x-0 top-0 z-50 bg-ink">
```
`bg-ink` resolves to solid opaque white. There is no blur, no translucency, no border — flat and opaque at all times, whether the menu is open or closed.

**There is already an unused glass recipe sitting in the codebase**, `app/globals.css:135-140`:
```css
.glass-nav {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px) saturate(1.6);
  -webkit-backdrop-filter: blur(20px) saturate(1.6);
  border-bottom: 1px solid rgba(10, 13, 22, 0.06);
}
```
Confirmed via grep: **`.glass-nav` is defined but referenced nowhere** — it was clearly built for a previous navbar (which used to toggle it on scroll) and was orphaned when the navbar was rewritten. This is the starting point — reuse and tune it rather than inventing new CSS from scratch, since it's already colour-matched to the site's tokens.

## The fix

1. Replace `bg-ink` on the `<header>` with the translucent glass treatment. Simplest correct approach: apply the `.glass-nav` class (or inline the same three properties with Tailwind arbitrary values) so the header becomes:
   - a translucent white tint (`rgba(255,255,255,0.8)` or similar — tune opacity so text/logo/buttons stay fully legible over busy scrolled content, don't go so transparent that contrast suffers)
   - `backdrop-filter: blur(...) saturate(...)` so whatever scrolls behind it is visibly soft-blurred, not just tinted
   - a hairline bottom border (already in the recipe) so the bar reads as a distinct surface, not just fading into the page
   - **do not forget the `-webkit-backdrop-filter` fallback line** — it's already in `.glass-nav`, keep it

2. **Add the top-edge highlight from the reference image.** The glass shapes in the reference have a subtle bright line/glow along their top edge — this is what sells the "glass" read rather than just "translucent." Add a thin, soft light gradient at the header's top edge, e.g. an inset box-shadow or a `::before` pseudo-element:
   ```css
   box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
   ```
   or a subtle radial highlight fading in from the top. Tune by eye against the reference — it should be subtle, not a hard white line.

3. **Handle the open (expanded) state deliberately, don't assume it's fine by default.** When the menu opens, `.js-panel` expands from `h-0` to its natural height (`nav-menu.tsx:51-52`, animated by the existing GSAP timeline) and sits *inside* this same `<header>`, so it inherits whatever background you set in step 1. The large uppercase nav links (`text-[5vw]`) need to stay clearly legible against whatever is blurred behind them.
   - Test with the menu open, scrolled to a busy section of the page (e.g. over the hero's laser effect) behind it.
   - If legibility suffers when open, don't compromise the closed-state translucency to fix it — instead bump the opacity/blur specifically while `open` is true. The component already tracks `open` in React state (`nav-menu.tsx:38`), so conditionally add a stronger-opacity class only when the panel is expanded, e.g.:
     ```jsx
     className={`fixed inset-x-0 top-0 z-50 ${open ? 'bg-ink/95' : 'glass-nav'} ...`}
     ```
     (Or keep glass-nav in both states if legibility already holds — verify before adding this branch; don't add complexity that isn't needed.)

4. **Do not touch:** the GSAP timeline, the burger/X animation, the character-stagger reveal, the `.js-backdrop` dark overlay beneath the panel, or the mobile/desktop link markup. This is a background/surface-styling change only.

## Verify
1. Scroll the homepage with the menu closed — confirm the header is visibly translucent (page content blurred behind it, not just tinted) and the top-edge highlight reads correctly, matching the reference's glass aesthetic (adapted to light theme).
2. Open the menu over a busy section of the page — confirm the big nav links, logo, and "Book a Call" button all remain fully legible.
3. Confirm the hairline bottom border is present and doesn't look like a harsh line.
4. Check in a browser without `backdrop-filter` support (or emulate it) — confirm the `-webkit-backdrop-filter` fallback and the semi-opaque background alone still look acceptable (no fully-transparent unreadable header).
5. Confirm the `.glass-nav` class in `globals.css` is now actually referenced from `nav-menu.tsx` (i.e. it's no longer dead code) — or if you inlined the properties instead, either delete `.glass-nav` as now-truly-unused, or keep it only if something still uses it. Don't leave both a live inline duplicate and an orphaned class around.

Report what you changed with `file:line`, and confirm both the closed and open states were checked for legibility.
