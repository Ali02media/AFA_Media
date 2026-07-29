import { Hero } from "@/components/sections/hero";
import { TrustBar } from "@/components/sections/trust-bar";
import { Problem } from "@/components/sections/problem";
import { ServicesSection } from "@/components/sections/services-section";
import { Proof } from "@/components/sections/proof";
import { PricingPreview } from "@/components/sections/pricing-preview";
import { CTA } from "@/components/sections/cta";
import { ProcessSection } from "@/components/sections/process-section";
import { FAQ } from "@/components/sections/faq";
import { MacbookShowcase } from "@/components/sections/macbook-showcase";
import { site, faqs } from "@/lib/site";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: site.name,
      url: site.url,
      email: site.email,
      telephone: site.phone,
      description: site.description,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Brighton",
        addressCountry: "GB",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Homepage funnel order (restructured) ──────────────────────────────
          1. Hero               — hook
          2. TrustBar           — benefits / guarantees under the hero
          3. Problem            — name the pain (problem → solution)
          4. Services           — "does this actually fix MY problem?" (flat, early)
          5. Proof              — persuasion / testimonials
          6. Pricing            — the offer
          7. CTA #1             — first booking ask (no animation), catches ready buyers
          8. Process            — how it works / our AI edge / timeline
          9. FAQ (short)        — knock down the last few objections
         10. MacBook + CTA #2   — cinematic zoom that lands on the booking ask
         11. FAQ (full)         — everything else, for the thorough reader
      ──────────────────────────────────────────────────────────────────────── */}
      <Hero />
      <TrustBar />
      <Problem />
      <ServicesSection />
      <Proof />
      <PricingPreview />
      <CTA />
      <ProcessSection />
      <FAQ
        limit={4}
        id="faq-quick"
        eyebrow="Before you book"
        title={
          <>
            A few quick <span className="text-gradient">answers.</span>
          </>
        }
      />
      <MacbookShowcase />
      <FAQ />
    </>
  );
}
