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
// Vercel Analytics + Speed Insights (see components/analytics.tsx for why they're wrapped).
import { SiteAnalytics } from "@/components/analytics";

// Nunito, self-hosted by next/font (NOT the <link> embed from Google Fonts): Next downloads
// the file at build time and serves it from our own origin, so there's no third-party
// request, no extra DNS/TLS round-trip before text can render, and no layout shift — it also
// generates the @font-face and a matched size-adjust fallback automatically.
//
// Variable font: one file covers the whole 200–1000 weight range, so no `weight` is declared
// (that would pin it to static instances and lose the range). Italic is included because
// services/page.tsx uses it.
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

// Montserrat carries the headings, the hero headline and the CTAs — a geometric sans with
// much more structure than Nunito's rounded body face, so the two give real typographic
// contrast without going back to a serif. Variable (100–900), same self-hosting rationale.
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
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
        <body className="flex min-h-full flex-col bg-ink text-foreground">
          {/* Global entity graph (Organization/ProfessionalService + WebSite) on every page. */}
          <JsonLd data={globalGraph} />
          <CalProvider />
          <NavMenu />
          <main className="relative z-10 flex-1">{children}</main>
          <div className="relative z-10">
            <Footer />
          </div>
          <SiteAnalytics />
        </body>
      </html>
    </ViewTransitions>
  );
}
