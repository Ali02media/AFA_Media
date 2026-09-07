# AFA Media — website

Marketing site for [AFA Media](https://www.afamedia.co.uk), a UK agency selling web design, AI chatbots and paid ads to service businesses (trades, clinics, professional services). The site's job is to get discovery calls booked, so almost every page funnels toward the Cal.com booking embed.

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 (via `@tailwindcss/postcss`) |
| Animation | Framer Motion (scroll reveals, FAQ), GSAP (nav menu), `next-view-transitions` (page transitions) |
| 3D / WebGL | three.js (`components/LaserFlow.jsx`), OGL (`components/Plasma.jsx`) — desktop only, gated behind a `min-width: 1024px` media query |
| Booking | Cal.com inline embed + modal |
| Analytics | Google Tag Manager (GA4 inside it) and Microsoft Clarity, both consent-gated |
| Hosting | Netlify |

> **Note for AI coding agents:** see `AGENTS.md`. This is a newer Next.js than most training data covers — read `node_modules/next/dist/docs/` before touching Next-specific APIs.

## Running locally

Requires **Node 20** (pinned in `.nvmrc`).

```bash
nvm use          # optional, if you use nvm
npm install
npm run dev      # http://localhost:3000
```

Scripts:

| Command | Does |
|---|---|
| `npm run dev` | Dev server on :3000 |
| `npm run build` | Production build |
| `npm run start` | Serve the production build locally |
| `npm run lint` | ESLint |

## Environment variables

Both are **optional**. There is no `.env` file in the repo and you don't need one to run the site — they're set in the Netlify dashboard for production.

| Variable | Purpose | If unset |
|---|---|---|
| `NEXT_PUBLIC_GTM_ID` | Google Tag Manager container ID, e.g. `GTM-XXXXXXX`. GA4 is delivered from inside the container. | Nothing is injected at all — no GTM script, no `<noscript>` iframe, no dataLayer pushes. |
| `NEXT_PUBLIC_CLARITY_ID` | Microsoft Clarity project ID, e.g. `yd7q5vyevl`. Session replays and heatmaps. | The component renders nothing. |

This is deliberate: local dev and deploy previews stay clean, and a half-configured container never ships.

**Consent.** Neither tool measures anything until the visitor accepts the cookie banner (`components/cookie-consent.tsx`):

- GTM loads with Consent Mode v2 and `analytics_storage` defaulted to `denied`. Accepting flips it to `granted`.
- Clarity's tag loads on every page (its install verifier needs that) but sets no cookies and records nothing until `clarity("consent")` is called on Accept.

## Project layout

```
app/          Routes: / services pricing philosophy contact privacy terms + 404
              Plus sitemap.ts, robots.ts, manifest.ts, OG/Twitter images, icons
components/
  sections/   Homepage sections (hero, problem, services, proof, pricing, cta, process, faq)
  layout/     nav-menu, footer
  ui/         section, shiny-button, page-header, spotlight-card,
              work-showcase, pricing-comparison
  *.tsx       cal, booking-calendar, analytics, clarity, cookie-consent,
              json-ld, reveal
lib/
  site.ts     All copy + config — services, pricing, FAQs, testimonials, contact
  schema.ts   JSON-LD structured data
  utils.ts    cn() classname helper
docs/         Creative brief, information architecture, historical fix prompts
  archive/    Superseded docs and retired components, kept for reference
public/       Logo, favicons, showcase images
```

**Editing copy:** change `lib/site.ts`, not the components. Services, plans, the pricing feature matrix, FAQs, testimonials, phone/email and the Cal.com link all live there.

## Deployment

Pushes to `main` deploy to Netlify. Config is in `netlify.toml`:

- Build: `npm run build`, publish `.next`
- `@netlify/plugin-nextjs` is declared explicitly so CI failures are loud and nobody accidentally ships a static export
- Node version comes from `.nvmrc`

### Headers and redirects are declared twice — keep them in sync

Security headers (CSP, HSTS, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Content-Type-Options`) and the `/about` → `/philosophy` and `/process` → `/philosophy` redirects exist in **both** `next.config.ts` and `netlify.toml`.

That's on purpose. When Netlify's Next runtime honours `next.config.ts` you get identical headers from both sources, which is harmless. When it doesn't, `netlify.toml` is the guarantee they still ship.

**If you change one, change the other.** A mismatched CSP is worse than a missing rule.

Note that the CSP allows `'unsafe-inline'` for scripts and styles — the site ships inline styles and Next's own bootstrap script, and a nonce-based policy would need middleware on every request. The reasoning is written up at the top of `next.config.ts`.
