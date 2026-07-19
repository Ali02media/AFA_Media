import { Hero } from "@/components/sections/hero";
import { MacbookShowcase } from "@/components/sections/macbook-showcase";
import { TrustBar } from "@/components/sections/trust-bar";
import { Problem } from "@/components/sections/problem";
import { ProcessSection } from "@/components/sections/process-section";
import { Proof } from "@/components/sections/proof";
import { PricingPreview } from "@/components/sections/pricing-preview";
import { FAQ } from "@/components/sections/faq";
import { CTA } from "@/components/sections/cta";
import { site, plans, faqs } from "@/lib/site";

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
      <Hero />
      <MacbookShowcase />
      <TrustBar />
      <Problem />
      <ProcessSection />
      <Proof />
      <PricingPreview />
      <FAQ />
      <CTA />
    </>
  );
}
