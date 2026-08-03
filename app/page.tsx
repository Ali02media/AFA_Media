import { Hero } from "@/components/sections/hero";
import { Problem } from "@/components/sections/problem";
import { ServicesSection } from "@/components/sections/services-section";
import { Proof } from "@/components/sections/proof";
import { PricingPreview } from "@/components/sections/pricing-preview";
import { CTA } from "@/components/sections/cta";
import { ProcessSection } from "@/components/sections/process-section";
import { FAQ } from "@/components/sections/faq";
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
          2. Problem            — name the pain (problem → solution)
          3. Services           — "does this actually fix MY problem?" (flat, early)
          4. Proof              — persuasion / testimonials
          5. Pricing            — the offer
          6. CTA #1             — first booking ask (no animation), catches ready buyers
          7. Process            — how it works / our AI edge / timeline
          8. FAQ (short)        — knock down the last few objections
          9. FAQ (full)         — everything else, for the thorough reader

          TrustBar (the auto-scrolling "14-Day Delivery • No Long Contracts..." marquee that
          used to sit here, right after the hero) was removed at the owner's request.

          The MacBook showcase used to sit between the short and full FAQ. Removed: under
          reduced motion (and on mobile) it fell back to a bare, unheaded Cal calendar
          dropped mid-page, and the booking ask is already covered by CTA #1 above.
      ──────────────────────────────────────────────────────────────────────── */}
      <Hero />
      <Problem />
      <ServicesSection />
      <Proof />
      <PricingPreview />
      <CTA />
      <ProcessSection />
      <FAQ
        limit={4}
        id="faq-quick"
        title={
          <>
            A few quick <span className="text-gradient">answers.</span>
          </>
        }
      />
      <FAQ />
    </>
  );
}
