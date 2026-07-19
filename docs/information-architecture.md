# Information Architecture — AFA Media

**Project:** AFA Media website rebrand
**Stack:** Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + React Three Fiber + GSAP ScrollTrigger
**Booking:** Cal.com embed (event: `ali-ahmed-lwiikf/30-min-meeting`, namespace `30-min-meeting`)

---

## 1. Executive Summary

A 5-page marketing site built to convert UK service-business owners into discovery calls. The structure is deliberately flat — every key page is one click from home, and the homepage itself is a complete pitch that can close a visitor without them going anywhere else. 3D and scroll-driven motion are used as *credibility signals* (this agency is clearly skilled) and to guide the eye toward CTAs — never as decoration that slows the path to booking.

**Conversion spine:** Every page ends in the same action — book a discovery call via Cal.com. The CTA is persistent in the nav and repeated at natural decision points.

---

## 2. Audience Mental Model

UK service business owners don't think in "marketing services." They think in problems:

| They think… | We label it… |
|---|---|
| "My website looks rubbish / I don't have one" | Web Design |
| "I miss calls and lose the job" | AI Chatbots / Booking |
| "I want to be top of Google / run ads" | Paid Ads |
| "I want repeat customers" | Email Marketing |
| "Can I trust these people?" | Results / Testimonials / Guarantee |
| "What's it going to cost me?" | Pricing |

The IA mirrors this: **outcomes first, service names second.** Navigation uses plain words, not agency jargon.

---

## 3. Sitemap

Flat hub structure — homepage is the hub, four supporting pages are spokes.

```
/                         Home (full pitch — hero → problem → services → process → proof → pricing → FAQ → CTA)
├── /services             Services (deep-dive on all 4 offerings)
├── /pricing              Pricing (3 retainer tiers + one-off projects)
├── /about                About (founder story, guarantee, why AFA)
└── /contact              Contact / Book a Call (Cal.com embed + details)

Footer-only / utility:
├── /privacy              Privacy Policy (GDPR)
└── /terms                Terms (optional, phase 1 stub)
```

**Page types:**
- `/` — long-form landing (static)
- `/services`, `/about` — static content pages
- `/pricing` — static with pricing component
- `/contact` — static + embedded Cal.com booking

---

## 4. URL Structure

Simple, flat, lowercase. No nesting needed at this scale.

| Page | URL |
|---|---|
| Home | `/` |
| Services | `/services` |
| Pricing | `/pricing` |
| About | `/about` |
| Contact / Book | `/contact` |
| Privacy | `/privacy` |
| Terms | `/terms` |

Anchor links on homepage for in-page nav: `/#services`, `/#pricing`, `/#faq`.

---

## 5. Navigation Specification

### Primary nav (sticky, dark, glass-blur on scroll)
```
[AFA Logo]        Services   Pricing   About        [Book a Call →]
```
- 3 text links + 1 prominent CTA button (blue→teal gradient)
- Logo links home
- "Book a Call" is the only button — always visible, always the same action
- Mobile: hamburger → full-screen overlay menu with the 4 links + CTA

### Footer (comprehensive)
```
Column 1: AFA Media logo + one-line positioning + GDPR note
Column 2: NAVIGATION — Home, Services, Pricing, About, Contact
Column 3: CONTACT — phone (+44 7516 294378), email (ali@afamedia.co.uk),
          Brighton, United Kingdom
Column 4: Book a Call CTA + social links

Bottom bar: © 2025 AFA Media  ·  Privacy  ·  Terms
```

### Utility
- "Book a Call" CTA serves as the universal utility action — no login/search/account needed at this scale.

### Breadcrumbs
- Not needed (flat, 1-level site).

---

## 6. Homepage Section Blueprint (with 3D / scroll moments)

This is the spine of the build. Order is conversion-optimised: hook → pain → solution → proof → price → close.

| # | Section | Content | Motion / 3D |
|---|---|---|---|
| 1 | **Hero** | Headline: "One partner for everything that grows your business." Sub: web, ads, email & AI — built to get your phone ringing. CTA: Book a Call / See Services | **3D centrepiece:** animated AFA hexagon or abstract geometric form (R3F), slow rotation, particle field, mouse-parallax. Gradient glow. |
| 2 | **Trust bar** | "14-day delivery · No long contracts · UK-based · GDPR compliant" | Stagger fade-in on scroll |
| 3 | **The Problem** | Pain narrative: missed calls, outdated sites, leads going to competitors | Scroll-pinned section; numbers/stat cards animate in (GSAP ScrollTrigger). Optional 3D "leaky bucket" or broken-grid visual |
| 4 | **Services (4)** | Web Design · AI Chatbots · Email Marketing · Paid Ads — card each, outcome-led copy | **3D scroll:** horizontal-scroll or scroll-driven card reveal; cards tilt on hover (3D transform). Icons are subtle 3D shapes |
| 5 | **How it works (3 steps)** | Discovery Call → Custom Build → Launch & Grow (14 days) | Scroll-progress line that draws as you scroll; steps light up in sequence |
| 6 | **Proof** | 2 testimonials (Oya, Gökhan) + guarantee callout | Cards fade-up; subtle floating motion. "Zero risk" badge with shine |
| 7 | **Pricing** | 3 tiers (Foundation / Growth / Scale) — condensed, links to /pricing | Cards rise on scroll; "Growth" highlighted with gradient border glow |
| 8 | **FAQ** | 7–8 accordion questions (trust, timeline, contracts, AI, data) | Smooth accordion expand |
| 9 | **Final CTA** | "Ready to get the phone ringing?" + Book a Call | Big gradient section; 3D form re-appears; Cal.com trigger button |

**3D scroll concept (the "cool" factor you asked for):**
- Hero 3D object **persists and transforms** as you scroll — e.g. the hexagon breaks apart into the 4 service shapes at the services section, then reassembles by the final CTA. One continuous WebGL canvas tied to scroll progress (R3F + `useScroll` / GSAP ScrollTrigger). This is the signature "wow" moment.
- Fallback: if performance dips on mobile, the persistent canvas degrades to a static gradient hero + CSS-only reveals. **Performance is non-negotiable — 3D must not break Core Web Vitals.**

---

## 7. Services Page Blueprint

Deep-dive for visitors who want detail before booking.

| Section | Content |
|---|---|
| Hero | "Everything you need to grow — under one roof." |
| Web Design | What's included, who it's for, outcome (3D mini-visual) |
| AI Chatbots & Booking | 24/7 lead capture, Cal.com/WhatsApp integration, your-voice training |
| Email Marketing | Campaigns + automation, "WarmShield" framework, win-back flows |
| Paid Ads | Google + Meta setup & management, lead-gen focus |
| Bundled value | "Most clients combine all four — that's why we built packages." → /pricing |
| CTA | Book a Call |

Each service block: outcome headline → 3-bullet "what you get" → who it's for.

---

## 8. Pricing Page Blueprint

| Section | Content |
|---|---|
| Hero | "Simple, honest pricing. No surprises." |
| 3 Retainer tiers | **Foundation £797/mo** (+£297 onboarding) · **Growth £1,497/mo** (+£497, *recommended*) · **Scale £2,497/mo** (+£797) — feature lists, gradient highlight on Growth |
| One-off projects | Website build £1,500–£3,500 · AI chatbot £750 +£80/mo · Ad setup from £500 |
| Guarantee | 14-day delivery or you don't pay setup |
| FAQ (pricing-specific) | Contracts, what's included, cancellation |
| CTA | Book a Call |

*Note: this is the recommended new model from the brief, replacing the old Founder's pricing (£450/£795/£1,350).*

---

## 9. About Page Blueprint

| Section | Content |
|---|---|
| Hero | "Built to give UK service businesses an unfair advantage." |
| Founder story | Ali — why AFA exists, the problem he saw, the AI + human approach |
| Our difference | One roof · AI-powered · fast · UK-based |
| The guarantee | 14-day delivery promise |
| Proof | Testimonials repeated |
| CTA | Book a Call |

---

## 10. Contact / Book Page Blueprint

| Section | Content |
|---|---|
| Hero | "Let's get your phone ringing. Book a free 30-min discovery call." |
| **Cal.com embed** | Inline month-view booking (`30-min-meeting`). Also wire any "Book a Call" button site-wide to the Cal element-click trigger |
| Direct contact | Phone, email, location for those who prefer it |
| Reassurance | "No hard sell. We'll tell you straight if we can help." |

**Cal.com implementation note:** Load the embed script once (in layout or via `next/script`). Buttons across the site use the element-click attributes:
```
data-cal-link="ali-ahmed-lwiikf/30-min-meeting"
data-cal-namespace="30-min-meeting"
data-cal-config='{"layout":"month_view","useSlotsViewOnSmallScreen":"true"}'
```

---

## 11. Taxonomy & Labels

No blog/tags in phase 1, so taxonomy is minimal.

**Validated nav labels (audience language):**
- "Services" not "Solutions" or "What We Offer"
- "Pricing" not "Plans" or "Investment"
- "Book a Call" not "Contact" or "Get Started" (specific action = higher intent)
- "About" not "Our Story"

**Content types (phase 1):** Page only. (Blog/Case Studies added phase 2.)

---

## 12. Implementation Notes

- **One persistent R3F `<Canvas>`** for the scroll-driven 3D, mounted in homepage layout, tied to scroll progress. Lazy-load; SSR-disabled (`dynamic(() => ..., { ssr: false })`).
- **GSAP ScrollTrigger** for all scroll reveals and the 3D timeline scrubbing.
- **shadcn/ui** for accordion (FAQ), buttons, cards.
- **Cal.com** script loaded globally; all CTAs share one booking action.
- **Performance budget:** LCP < 2.5s, CLS < 0.1. 3D canvas must lazy-load and degrade gracefully on mobile. Test on a mid-range phone.
- **Accessibility:** WCAG 2.1 AA — respect `prefers-reduced-motion` (disable scroll 3D animation, show static hero).
- **SEO:** unique title/meta per page, BreadcrumbList not needed, Organization + LocalBusiness schema on home.

---

## Phase 2 (post-launch, not in current scope)
- Blog / content hub (`/blog/[slug]`) for SEO
- Case study pages once results data exists
- Client portal

---

*IA version 1.0 — ready for build*
