import { Hero } from "@/components/sections/hero";
import { Problem } from "@/components/sections/problem";
import { ServicesSection } from "@/components/sections/services-section";
import { Proof } from "@/components/sections/proof";
import { PricingPreview } from "@/components/sections/pricing-preview";
import { CTA } from "@/components/sections/cta";
import { ProcessSection } from "@/components/sections/process-section";
import { FAQ } from "@/components/sections/faq";
import { faqs } from "@/lib/site";
import { JsonLd } from "@/components/json-ld";
import { faqSchema } from "@/lib/schema";

// The Organization/business + WebSite entities are emitted globally in the root layout. The
// homepage adds only the FAQPage, since it renders the FAQ accordion (Google shows those Q&As
// as rich results; the text is built from the same `faqs` data that's on the page).
export default function Home() {
  return (
    <>
      <JsonLd data={faqSchema(faqs)} />

      {/* ── Homepage funnel order (restructured) ──────────────────────────────
          1. Hero               — hook
          2. Problem            — name the pain (problem → solution)
          3. Services           — "does this actually fix MY problem?" (flat, early)
          4. Proof              — persuasion / testimonials
          5. Pricing            — the offer
          6. CTA #1             — first booking ask (no animation), catches ready buyers
          7. Process            — how it works / our AI edge / timeline
          8. FAQ                — objections, for the thorough reader

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
      <FAQ />
    </>
  );
}
