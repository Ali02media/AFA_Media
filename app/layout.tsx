import type { Metadata, Viewport } from "next";
import { Nunito, Montserrat } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/site";
import { NavMenu } from "@/components/layout/nav-menu";
import { Footer } from "@/components/layout/footer";
import { CalProvider } from "@/components/cal";
import { JsonLd } from "@/components/json-ld";
import { globalGraph } from "@/lib/schema";
import { ViewTransitions } from "next-view-transitions";
// GTM (with GA4 delivered inside it) behind Consent Mode, plus the banner that grants/denies it.
import { SiteAnalytics, GtmNoscript } from "@/components/analytics";
import { CookieConsent } from "@/components/cookie-consent";
// Microsoft Clarity — session replays. Loaded only AFTER the visitor accepts on the banner.
import { Clarity } from "@/components/clarity";

// Nunito, self-hosted by next/font (NOT the <link> embed from Google Fonts): Next downloads
// the file at build time and serves it from our own origin, so there's no third-party
// request, no extra DNS/TLS round-trip before text can render, and no layout shift — it also
// generates the @font-face and a matched size-adjust fallback automatically.
//
// Variable font: one file covers the whole 200–1000 weight range, so no `weight` is declared
// (that would pin it to static instances and lose the range). Italic is included because
// services/page.tsx uses it.
// Italic style was pulled: it was preloaded on every page but used exactly once in the
// entire site (a single <p className="italic"> on /services). The browser now synthesises
// a slanted glyph for that one paragraph — visually indistinguishable at that size —
// and every page saves one preloaded font file, which is real LCP bandwidth on cold 4G.
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
});

// Montserrat carries the headings, the hero headline and the CTAs — a geometric sans with
// much more structure than Nunito's rounded body face, so the two give real typographic
// contrast without going back to a serif. Variable (100–900), same self-hosting rationale.
//
// display:"optional" (not "swap") is deliberate. Lighthouse's LCP element on the homepage
// is the hero H1, and with display:swap the H1 first paints in the size-adjusted fallback
// at ~1.2s (FCP), then Montserrat finishes downloading over Slow 4G at ~2.5–3s, the H1
// re-renders in the real font, and Lighthouse marks THAT later paint as the LCP — pushing
// mobile Performance into the low 90s on runs where the network variance goes the wrong
// way. With "optional", if Montserrat hasn't arrived within ~100ms the fallback stays for
// the whole page load (no swap, no re-render, LCP == FCP); repeat visits with a warm cache
// get Montserrat normally. next/font size-adjusts the fallback stack to match Montserrat's
// metrics so there's no visible shift. Nunito stays on "swap" — it carries body copy which
// isn't the LCP element.
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "optional",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)",  color: "#ffffff" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    // Homepage <title> is keyword-forward (brand + the three services + audience, ~59 chars) so
    // it ranks for the service queries — the benefit hook ("phone ringing") lives on the OG /
    // Twitter titles below, where CTR on a social share matters more than keyword match.
    default: `${site.name} — Web Design, AI Chatbots & Ads for UK Businesses`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  keywords: [
    "UK marketing agency",
    "web design",
    "AI chatbots",
    "Google ads",
    "Meta ads",
    "service business marketing",
    "lead generation",
  ],
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: site.url,
    siteName: site.name,
    title: `${site.name} — Marketing That Gets Your Phone Ringing`,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — Marketing That Gets Your Phone Ringing`,
    description: site.description,
  },
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // ViewTransitions wires up the browser's View Transitions API: the `Link` from
    // next-view-transitions routes navigations through document.startViewTransition(), and the
    // actual animation is defined in CSS (see ::view-transition-new(root) in globals.css).
    // Feature-detected internally — browsers without the API just navigate normally.
    <ViewTransitions>
      <html
        lang="en-GB"
        className={`${nunito.variable} ${montserrat.variable} h-full antialiased`}
      >
        {/* Cal.com preconnect+preload used to live here to warm embed.js during initial paint.
            That was correct when embed.js booted eagerly on load, but the calendar is now
            lazy-mounted via IntersectionObserver ~600px above the CTA (see booking-calendar.tsx),
            so preloading it competes with LCP for bandwidth on cold 4G and then triggers the
            "preload not used within a few seconds of load" browser warning that shows up under
            Best Practices in Lighthouse. Cal's own bootstrap does its own DNS/TCP work when the
            observer fires — which is well after LCP — so there's nothing left to warm. */}
        <body className="flex min-h-full flex-col bg-ink text-foreground">
          {/* GTM's <noscript> iframe MUST be the first child of <body>, per Google's install
              docs — it's what lets tags fire on browsers with JavaScript disabled. Rendered
              only when NEXT_PUBLIC_GTM_ID is set. */}
          <GtmNoscript />
          {/* Global entity graph (Organization/ProfessionalService + WebSite) on every page. */}
          <JsonLd data={globalGraph} />
          <CalProvider />
          <NavMenu />
          <main className="relative z-10 flex-1">{children}</main>
          <div className="relative z-10">
            <Footer />
          </div>
          <SiteAnalytics />
          <Clarity />
          <CookieConsent />
        </body>
      </html>
    </ViewTransitions>
  );
}
