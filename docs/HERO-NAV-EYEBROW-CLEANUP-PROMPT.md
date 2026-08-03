# Four site-wide changes: hero button styling/order, navbar "Home" link, remove all eyebrow badges, remove the trust bar

Four independent, low-risk changes. Read each section fully before editing — several touch a shared component used across many pages, so "find every usage" is not optional.

---

## 1 — Hero buttons: swap which is white, keep white one first

`components/sections/hero.jsx:137-144`, current code:
```jsx
<ShinyButton {...calAttrs}>Book a Call</ShinyButton>

<ShinyButton href="/process" variant="light">
  See Our Process
</ShinyButton>
```
`ShinyButton`'s `variant` prop (`components/ui/shiny-button.tsx:14`, default `"dark"`) controls the look: `"dark"` = black pill with blue shine, `"light"` = white surface with dark text. Right now "Book a Call" is dark (default, no variant passed) and "See Our Process" is `variant="light"` (white).

**Wanted:** "Book a Call" white, "See Our Process" dark, and the white one (Book a Call) first — it already renders first in the DOM, so only the variants need swapping, not the order:
```jsx
<ShinyButton variant="light" {...calAttrs}>Book a Call</ShinyButton>

<ShinyButton href="/process">
  See Our Process
</ShinyButton>
```
(`See Our Process` drops `variant="light"` entirely so it falls back to the default `"dark"`.)

Verify visually: white pill first, dark pill second, both still functional (Book a Call still opens the Cal modal via `calAttrs`, See Our Process still navigates to `/process` with the page transition).

---

## 2 — Add "Home" as the first navbar link

`lib/site.ts:19-24`:
```ts
export const nav = [
  { label: "Services", href: "/services" },
  { label: "Pricing", href: "/pricing" },
  { label: "Process", href: "/process" },
  { label: "Contact", href: "/contact" },
] as const;
```
There is currently no way to navigate back to the homepage from the nav menu at all. Add a "Home" entry pointing at `/`, **first in the array**, keeping the existing order after it:
```ts
export const nav = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Pricing", href: "/pricing" },
  { label: "Process", href: "/process" },
  { label: "Contact", href: "/contact" },
] as const;
```
Confirm `components/layout/navbar.tsx` renders this array generically (it should just map over `nav`, so no code change needed there) — check both the desktop nav and the mobile menu render the new "Home" link correctly, and that it doesn't collide with the logo (which already links to `/`).

---

## 3 — Remove ALL eyebrow badges site-wide (the small rounded-pill "• LABEL TEXT" tags above headings)

This is the small rounded-rectangle badge with a coloured dot and uppercase label — e.g. "THE SILENT KILLER", "WHAT WE DO", "Before you book" — that appears above section headings across the whole site.

### The shared component
`components/ui/section.tsx:17-24`:
```tsx
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line bg-ink-3/60 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-mist">
      <span className="h-1.5 w-1.5 rounded-full bg-gradient-brand" />
      {children}
    </span>
  );
}
```
This single component is rendered from exactly two call sites, both in the same file:
- `components/ui/section.tsx` inside `SectionHeading` (line 47: `{eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}`)
- `components/ui/page-header.tsx` inside `PageHeader` (line 18: `<Eyebrow>{eyebrow}</Eyebrow>`)

**`SectionHeading`** (with an `eyebrow` prop) is used by:
- `components/sections/faq.tsx`
- `components/sections/pricing-preview.tsx`
- `components/sections/problem.tsx`
- `components/sections/process-section.tsx`
- `components/sections/proof.tsx`
- `components/sections/services-section.tsx`

**`PageHeader`** (with an `eyebrow` prop, required) is used across `app/` on multiple top-level pages — grep for `<PageHeader` to get the current list (at minimum `services`, `pricing`, `process`, `contact`; check `about` and any others).

### The fix
Remove the eyebrow badge rendering from both shared components, and remove the now-unused `eyebrow` prop plumbing:

- In `SectionHeading`: delete the `{eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}` line. Make `eyebrow` prop optional-and-ignored, or remove it from the type and then remove the (now-unused) `eyebrow="..."` argument from every call site listed above. Prefer removing the prop entirely and cleaning up call sites — do not leave dead props around.
- In `PageHeader`: same treatment. `eyebrow` is currently a *required* string prop there, so removing it is a breaking change to the component's signature — update every `<PageHeader eyebrow="..." .../>` call site to drop the prop.
- Delete the `Eyebrow` component itself from `components/ui/section.tsx` once nothing references it, and remove its export.

### The one badge that does NOT go through this component
`components/sections/cta.tsx:34-40` has its **own** bespoke badge, not built from `Eyebrow`:
```jsx
<span className="inline-flex items-center gap-2.5 rounded-full border border-line bg-ink-3 px-4 py-1.5 text-xs font-medium text-mist backdrop-blur-sm">
  <span className="relative flex h-2 w-2">
    <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-brand-teal opacity-75" />
    <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-teal" />
  </span>
  Only a few onboarding spots left this month
</span>
```
This is visually the same family (rounded pill, dot, small uppercase-ish text) and the user's instruction is "remove ALL of these... across the whole site" — remove this one too. It is used in both CTA instances (the standalone `cta.tsx` component, rendered as both the homepage's CTA #1 and, if still present, anywhere else it's imported) — grep `<CTA` to confirm every render site and confirm the badge is gone from all of them.

### Verify
Grep the whole `app/` and `components/` tree afterward for `rounded-full` combined with a small dot span (`h-1.5 w-1.5`, `h-2 w-2`) to confirm none of this badge pattern remains anywhere. Visually check every page (home, services, pricing, process, contact, about, 404) — no small pill badge should appear above any heading anymore. Confirm headings still read correctly without the badge above them (spacing/margin may need a small adjustment now that the eyebrow's `gap` is gone from `SectionHeading`'s flex column — check there isn't now excess or missing top spacing).

---

## 4 — Remove the trust bar (the scrolling marquee strip under the hero)

`app/page.tsx:2` imports and `app/page.tsx:64` renders:
```jsx
<TrustBar />
```
This is the horizontally auto-scrolling strip reading "14-Day Delivery • No Long Contracts • UK-Based Team • GDPR Compliant..." directly beneath the hero.

**Fix:**
- Remove the `<TrustBar />` render from `app/page.tsx` and its import.
- Confirm `components/sections/trust-bar.tsx` is not used anywhere else (`grep -rn "TrustBar" app components`) — if it becomes fully unused, delete the file. Do not delete it if anything else still imports it.
- `trustPoints` in `lib/site.ts` is currently only consumed by `TrustBar` — if the component is deleted and `trustPoints` has no other importers, remove that export too; otherwise leave it (harmless if kept, but don't leave orphaned dead exports if nothing uses them).
- Update the page-order comment block in `app/page.tsx` (the numbered list describing "1. Hero, 2. TrustBar, 3. Problem, ...") to match the new order — this comment has gone stale before and misled debugging; keep it accurate this time.

### Verify
Load the homepage: hero should be immediately followed by the Problem section (or whatever is now next), with no marquee strip in between.

---

## Summary of files touched
- `components/sections/hero.jsx` (button variants)
- `lib/site.ts` (nav array; possibly `trustPoints` removal)
- `components/ui/section.tsx` (remove `Eyebrow`, strip from `SectionHeading`)
- `components/ui/page-header.tsx` (strip `eyebrow` prop)
- every `SectionHeading`/`PageHeader` call site across `components/sections/*` and `app/**/page.tsx` (remove the now-invalid `eyebrow` prop)
- `components/sections/cta.tsx` (remove its own bespoke badge)
- `app/page.tsx` (remove `<TrustBar />` + import + stale comment)
- `components/sections/trust-bar.tsx` (delete, if confirmed unused elsewhere)

Report back with `file:line` for each change, and confirm the eyebrow-badge grep came back clean.
