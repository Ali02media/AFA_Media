# PART 3 — further bugs (paste after Parts 1 and 2)

Findings from reading `app/layout.tsx`, `components/layout/navbar.tsx`, `app/globals.css`, `components/cal.tsx`, `components/booking-calendar.tsx` and `lib/site.ts`.

## BUG 18 — the fixed navbar covers the top of the revealed calendar on most laptop viewports

`components/layout/navbar.tsx:35` renders `fixed inset-x-0 top-0 z-50`, and its `<nav>` is `h-16` — a **64px fixed bar pinned to the viewport top**, with a `glass-nav` background once scrolled.

`macbook-showcase.tsx:167` places the calendar:
```jsx
<div className="relative z-0 flex min-h-screen w-full items-center justify-center px-4 pb-24">
  <div className="w-full max-w-4xl ..."><BookingCalendar style={{ height: 680 }} /></div>
```
`items-center` centres the 680px card inside a `100vh` box that also has `pb-24` (96px). So the card's top offset from the container top is `(100vh − 96 − 680) / 2`:

| viewport height | card top | hidden behind 64px navbar |
|---|---|---|
| 768px | 0px (overflows) | **64px** |
| 800px | 12px | **52px** |
| 900px | 62px | **2px** |
| 1000px | 112px | clears by 48px |
| 1200px | 212px | clears by 148px |

At `p = 1` the container top is at the viewport top, so on any viewport **shorter than ~900px** the top of the calendar — its header/month controls — sits **underneath the fixed navbar**. Most laptop viewports are 800-900px, so this hits the majority of desktop visitors. It also means the reveal "lands" on a partially obscured target.

**Fix:** offset the reveal target below the navbar. Either give the calendar container `pt-16` (or `scroll-margin`/top padding equal to the navbar height), or anchor the card to the top rather than centring it, and then make the camera framing (Part 1 Bug 2 / Part 2 Bug 10) agree with wherever it lands. Note this interacts with Part 1 Bug 6 — solve them together, since both are about where the reveal target actually sits.

## BUG 19 — the MacBook animation completely ignores `prefers-reduced-motion` (accessibility)

`app/globals.css:70-73`:
```css
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  * { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
}
```
This kills **CSS** animations and transitions only. The MacBook sequence is driven by GSAP ScrollTrigger and React Three Fiber in **JavaScript**, so a visitor with reduced motion enabled still gets the full 400vh scroll-hijacked 3D zoom — the single largest piece of motion on the site — while every small, harmless CSS transition is disabled. That's backwards, and it's a WCAG 2.3.3 (Animation from Interactions) concern.

The tester for this project has reduced motion enabled, so this is not hypothetical.

**Fix:** honour the preference in the MacBook section — e.g. when `matchMedia('(prefers-reduced-motion: reduce)').matches`, skip the scroll-driven zoom entirely and render the calendar as a normal static section (the mobile branch at `macbook-showcase.tsx:101-111` already does exactly this, so it is mostly a matter of routing reduced-motion users down the existing path). Check the preference reactively, not just on mount.

## BUG 20 — `app/globals.css` comments describe a GSAP `pin` mechanism the code no longer uses

Lines 41-49 and 60-66 justify "no `scroll-behavior: smooth`" and "`overflow-x: clip` not `hidden`" entirely in terms of **GSAP ScrollTrigger's pin** — "at first downward engage GSAP inserts the pin-spacer", "GSAP ScrollTrigger pins with position:fixed", "the pinned MacBook's fixed coords".

The current code uses **no GSAP pin at all** — `ScrollTrigger.create` has no `pin` property; the stage is CSS `position: sticky`, and since the rewrite nothing is pinned or portaled at all.

Both CSS rules are still worth keeping on their own merits (`clip` avoids creating a body scroll container; no CSS smooth-scroll avoids fighting JS scroll control). But the stated reasoning is obsolete and will mislead the next person, exactly as the `MacbookScene.tsx` comments did. Rewrite the justifications to match reality.

## BUG 21 — Cal.com is initialised TWICE on the same namespace with conflicting configuration

This is the significant one in this batch.

`lib/site.ts:13-15`:
```ts
cal: { link: "ali-ahmed-lwiikf/30-min-meeting", namespace: "30-min-meeting" }
```

**Init #1** — `CalProvider`, mounted in `app/layout.tsx` on **every page**:
```js
Cal("init", site.cal.namespace, { origin: "https://app.cal.com" });   // → "30-min-meeting"
Cal.ns[site.cal.namespace]("ui", {
  cssVarsPerTheme: { light: { "cal-brand": "#2c87d0" }, dark: { "cal-brand": "#2c87d0" } },
  theme: "dark",
});
```

**Init #2** — `BookingCalendar` (`components/booking-calendar.tsx`), mounted inside the MacBook section on the homepage:
```js
Cal("init", "30-min-meeting", { origin: "https://app.cal.com" });     // ← same namespace, hardcoded
Cal.ns["30-min-meeting"]("inline", { ... calLink: "ali-ahmed-lwiikf/30-min-meeting" });  // ← hardcoded
Cal.ns["30-min-meeting"]("ui", {
  cssVarsPerTheme: { light: { "cal-brand": "#00ccbd" } },              // ← different brand colour
  hideEventTypeDetails: false,
  layout: "month_view",
});
```

So on the homepage the **same namespace** is initialised twice and configured twice with conflicting values:
- brand colour `#2c87d0` (blue) vs `#00ccbd` (teal) — last write wins, and which one that is depends on React effect ordering
- `theme: "dark"` is set by #1 and **not reset** by #2, so the inline calendar inherits it

Consequences:
1. **A dark-themed calendar rendered on a white page**, inside a `bg-white` card. See Bug 22.
2. Non-deterministic brand colour.
3. Two `ui` config applications can make the embed re-style and **re-measure after load — changing its height**, which feeds directly into Part 1 Bug 4 (async height change desyncing ScrollTrigger). This may well be a contributor to the intermittent jitter.

**Fix:** initialise Cal exactly once. Keep `CalProvider` as the single bootstrap+`ui` owner, and have `BookingCalendar` only call the `inline` method for its element. Remove the duplicated bootstrap IIFE from `booking-calendar.tsx` (it is a verbatim copy of `bootstrapCal()` in `cal.tsx`) and import the shared one. Use `site.cal.namespace` / `site.cal.link` instead of the hardcoded strings so there is one source of truth.

## BUG 22 — Cal is configured with `theme: "dark"` but the site is white

`components/cal.tsx:54` sets `theme: "dark"` in `CalProvider`, and `CalInline` (contact page, line 92) sets `config: { layout: "month_view", theme: "dark" }` plus `theme: "dark"` again in its `ui` call.

But `app/globals.css:13` defines `--color-ink: #ffffff; /* base surface — page white */` and `--background: #ffffff`. The site is light. The naming (`ink`, `mist`) and the `dark` Cal theme both look like leftovers from an earlier dark design that was converted to light without updating the embed config.

Result: a dark calendar widget sitting inside a white card (`bg-white`, `border-line`, `shadow-2xl`) on a white page — on the homepage **and** the contact page. Verify visually; if the dark theme is unintended, switch to `"light"` (or drive it from the site's actual theme) in all three places.

## BUG 23 — duplicated Cal bootstrap code

`components/booking-calendar.tsx:21-50` contains a verbatim re-implementation of the `bootstrapCal()` IIFE already exported logic in `components/cal.tsx:9-40`. Two copies of a third-party bootstrap that must run exactly once is a maintenance hazard and is what allowed Bug 21 to happen. Consolidate to one exported helper.

## BUG 24 — no `scroll-padding-top` despite a 64px fixed navbar

`app/globals.css` has no `scroll-padding-top` / `scroll-margin-top`. Any in-page anchor navigation scrolls the target to `y = 0`, i.e. underneath the fixed 64px navbar. Currently low impact because `lib/site.ts:19-23` uses route links (`/services`, `/pricing`, …) rather than hashes — but `#pricing` exists on `pricing-preview.tsx:9` and `#faq-quick` is passed to the FAQ, so any link to those lands clipped. Add `scroll-padding-top: 4rem` to `html`.

## Confirmed clean (do not spend time here)
- No `console.log` left in `app/` or `components/` (the temp handoff logging is gone with the rewrite).
- No `target="_blank"` missing `rel="noopener"`.
- Only **one** `ScrollTrigger` instance exists in the whole codebase (`macbook-showcase.tsx`); `spotlight-card.tsx` mentions ScrollTrigger only in a comment. So no competing trigger is interfering with the MacBook.
- Only one `.refresh()` call exists — which is exactly the problem described in Part 1 Bug 4, not a conflict.
- `--color-ink` is `#ffffff`, so the canvas's white `setClearColor` correctly matches the page background.
- `key={i}` appears only in dead files and `trust-bar.tsx` (a static, never-reordered list) — acceptable.

## Verification for Part 3
1. At an 800px-tall viewport, scroll to the reveal and confirm the calendar's header/month controls are fully visible below the navbar (Bug 18).
2. Enable `prefers-reduced-motion` (DevTools → Rendering → Emulate CSS prefers-reduced-motion) and confirm the MacBook section degrades to a static calendar rather than running the 400vh 3D zoom (Bug 19).
3. In the console, confirm `window.Cal.ns` contains the namespace initialised once and that the rendered calendar's brand colour is deterministic across reloads (Bug 21).
4. Screenshot the homepage calendar and the contact-page calendar; confirm the theme matches the white site (Bug 22).
5. With the Cal embed throttled (Slow 3G), confirm no scroll jump when it finishes loading — this is the Bug 21 ↔ Part 1 Bug 4 interaction.
