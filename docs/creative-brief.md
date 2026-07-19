# Creative Brief — AFA Media Website Rebrand

**Project:** Full website rebrand and rebuild
**Client:** AFA Media (Ali, Brighton)
**Date:** June 2026
**Status:** Approved for build

---

## 1. Snapshot

AFA Media is a full-service UK marketing agency offering web design, AI chatbots, email marketing, and paid ads — all under one roof. The current site is narrow ("AI booking systems + websites only"), outdated, slow, and attracting price-sensitive clients who don't fit the business. This rebrand replaces the entire site with a high-impact, 3D-led digital presence that positions AFA Media as the go-to growth partner for UK service businesses: the kind of site that makes a plumber, physio, or solicitor think "these people clearly know what they're doing." Launch target: 1–2 weeks.

---

## 2. Audience

**Primary: UK service business owners**

Who they are:
- Trades: plumbers, electricians, builders, roofers, HVAC engineers
- Health & wellness: dentists, physiotherapists, chiropractors, private clinics, gyms
- Professional services: accountants, solicitors, estate agents, mortgage brokers, IFAs

What they're trying to do: get more customers and bookings without doing marketing themselves.

What's blocking them today:
- Their current website is embarrassing or non-existent
- They've tried agencies and been let down (slow delivery, no results, confusing jargon)
- They're too busy on the tools to manage their own marketing
- They don't know who to trust with their money

Where we reach them: Google search ("marketing agency for [trade]"), referrals, Instagram/Facebook ads.

**Not our audience:** restaurants, beauty salons, e-commerce brands, enterprise companies.

**Key insight:** These are not marketing people. They don't care about "funnels" or "impressions." They care about the phone ringing. Speak in outcomes, not process.

---

## 3. Objectives

| Objective | Signal |
|---|---|
| Drive qualified discovery call bookings | 5%+ homepage-to-booking conversion within 30 days of launch |
| Filter out low-ticket enquiries | Zero sub-£500/mo enquiries within 60 days |
| Establish credibility as a full-service agency | Visitors identify AFA as offering web + ads + email + AI in one visit |
| Outperform current site on speed | Core Web Vitals: LCP < 2.5s, CLS < 0.1 |

---

## 4. Key Message

> AFA Media gives UK service businesses one trusted partner for everything digital — websites, ads, email, and AI — built to get the phone ringing.

If a visitor sees only the hero section and bounces, that is what they should remember.

---

## 5. Voice and Tone

| What we are | What we are NOT |
|---|---|
| Direct | Jargony |
| Confident | Arrogant or salesy |
| Results-obsessed | Vague ("we leverage synergies") |
| Approachable | Corporate or stiff |
| Energetic | Gimmicky |

**In practice:**
- Lead with outcomes, not process ("More bookings. Less admin." not "We deploy omnichannel digital strategies")
- Short sentences. Active voice. No filler words.
- Talk to the business owner, not a marketing director
- OK to be bold — this is a confident agency, not a tentative freelancer

**Brand voice reference:** Think Stripe's clarity, Linear's boldness, Basecamp's directness — applied to a trades-and-clinics audience.

---

## 6. Visual Direction

**Mood:** Premium dark-mode agency site. Technically impressive. Feels like the future without feeling alien to a local business owner.

**Palette (exact hex sampled from logo):**
- Brand Blue: **#2C87D0** (rgb 44,135,208) — primary
- Brand Teal: **#19B0A1** (rgb 25,176,161) — secondary
- Background: Near-black (#0A0A0F) with deep navy sections (#0F1420)
- Text: White (#FFFFFF) and light grey (#B4B8C8)
- Accent gradient: #2C87D0 → #19B0A1 (blue→teal), used on CTAs and highlights

**Typography:**
- Display: Bold geometric sans (e.g. Space Grotesk, Syne, or Inter Display) — heavy weights, large scale
- Body: Clean readable sans (Inter or DM Sans)
- Style: Oversized headlines, tight tracking, strong hierarchy

**3D & motion:**
- Hero: 3D animated element — a floating/rotating version of the AFA hexagon logo, or abstract geometric form in brand colours with particle field behind it (Three.js or CSS 3D)
- Section transitions: Scroll-triggered fade-ups and reveals (GSAP ScrollTrigger)
- Subtle parallax on background elements
- NO excessive animation that kills performance or distracts from CTAs

**Imagery:**
- No generic stock photography of people at laptops
- Abstract 3D shapes, glowing gradients, data-grid patterns
- Any real photography = real clients / real results

**Reference sites (feel like):**
- linear.app — dark, technical, confident, fast
- framer.com — 3D, product-forward, modern
- vercel.com — clean hierarchy, developer-grade polish
- resend.com — crisp, conversion-focused dark-mode

**Reject:**
- Bright white agency sites with blue wave graphics
- Stock photo of a handshake or "team celebrating"
- Excessive gradients without restraint
- Cluttered layouts, too many elements per section

---

## 7. Scope and Deliverables

**Pages:**

1. **Homepage** — Hero (3D + headline + CTA), problem/pain section, services overview (4 services), how it works (3 steps), social proof (2 testimonials), pricing tiers (3 packages), FAQ (7–8 questions), final CTA
2. **Services page** — Expanded breakdown of Web Design, AI Chatbots, Email Marketing, Paid Ads — each with description, what's included, who it's for
3. **Pricing page** — 3-tier retainer table (Foundation £797/mo, Growth £1,497/mo, Scale £2,497/mo) + one-off project fees + onboarding fee callout
4. **About page** — Founder story (Ali), why AFA was built, the 14-day delivery guarantee, GDPR compliance note
5. **Contact / Book page** — Calendly embed or native booking form, email + phone, short qualifier questions

**Components:**
- Global nav (sticky, dark, with CTA button)
- Footer (nav links, contact, © 2025 AFA Media, GDPR notice)
- 3D hero scene (Three.js or CSS 3D)
- Testimonial cards (2 — Oya and Gökhan — text to be provided)
- Pricing cards with toggle (optional: monthly vs. one-off view)
- Animated stats bar (e.g. "14-day delivery", "No contracts", "UK-based")

**Out of scope:**
- Blog / content hub (add in phase 2)
- Client portal / login
- Case study pages (no case studies yet — add when ready)
- E-commerce / payment processing

---

## 8. Constraints

| Constraint | Detail |
|---|---|
| **Timeline** | 1–2 weeks to launch |
| **Stack** | Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui |
| **3D** | Three.js / React Three Fiber for hero element |
| **Animation** | GSAP ScrollTrigger for scroll reveals |
| **Logo** | Blue + teal hexagon — must be preserved as-is (transparent PNG provided) |
| **Brand colours** | Blue and teal from logo — exact hex to be confirmed from logo file |
| **Testimonials** | 2 available (Oya and Gökhan) — text to be provided by Ali |
| **Booking** | Calendly embed preferred for discovery call flow |
| **Hosting** | Vercel |
| **Performance** | Must beat current site (currently laggy) — Core Web Vitals green |
| **GDPR** | Cookie notice, privacy policy link required (UK) |
| **Accessibility** | WCAG 2.1 AA minimum |

---

## 9. Inspiration and Competitors

**Feel like:**
- **linear.app** — dark, precise, technically confident without being cold
- **framer.com** — 3D product hero, scroll-driven reveals, clear conversion path
- **vercel.com** — clean hierarchy, performance-first, trust signals throughout
- **resend.com** — minimal dark-mode with strong typographic rhythm

**Feel different from:**
- **Current afamedia.co.uk** — single-service positioning, no visual wow, low perceived value
- **Generic local agency sites** — bright white backgrounds, clipart icons, "We are a digital agency" headlines
- **Fiverr-era web design portfolios** — cheap, busy, no clear positioning

---

## 10. Approval

**Sign-off:** Ali (AFA Media founder)
**Approval artifact:** Staging URL on Vercel preview
**Process:** Ali reviews, requests changes via chat, one revision round before final deploy
**Testimonials confirmed:**
- **Oya** — *"I love it. It looks really professional. It's straight to the point, no fuss. Clean and clear, it's much better than the old one. That's really great work Ali, thank you so much."*
- **Gökhan Aydoğdu** — *"The site is great even on the phone it looks great. Thank you so much for your efforts brother."*

---

*Brief version 1.0 — ready for build phase*
