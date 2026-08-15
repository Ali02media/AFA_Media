// Structured data (JSON-LD) for AFA Media.
//
// This is a LINKED entity graph, not a pile of disconnected blobs. The Organization/business
// node and the WebSite node each carry a stable `@id` (an absolute URL fragment), and every
// other node — Services, Offers, breadcrumbs, FAQ — references those ids instead of repeating
// the data. That's what lets Google (and AI answer engines like ChatGPT, Perplexity and Gemini)
// resolve "who provides this service", "who publishes this page" and "what does this business
// sell" into a single consistent entity rather than guessing. One source of truth, referenced
// everywhere. All content is pulled from lib/site.ts so the schema can never drift from the copy.

import { site, services, plans, oneOffProjects, type Plan } from "@/lib/site";

const ORG_ID = `${site.url}/#organization`;
const WEBSITE_ID = `${site.url}/#website`;

/** The business entity. `ProfessionalService` is a subtype of both `LocalBusiness` and
 *  `Organization`, so a single node earns local-pack eligibility AND acts as the publisher /
 *  service-provider for every other node. This is the anchor of the whole graph. */
export const organizationSchema = {
  "@type": ["Organization", "ProfessionalService"],
  "@id": ORG_ID,
  name: site.name,
  legalName: site.name,
  url: site.url,
  logo: {
    "@type": "ImageObject",
    url: `${site.url}/afa-logo.png`,
    caption: `${site.name} logo`,
  },
  image: `${site.url}/opengraph-image.png`,
  description: site.description,
  slogan: site.tagline,
  email: site.email,
  telephone: site.phone,
  priceRange: "££",
  currenciesAccepted: "GBP",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Brighton",
    addressRegion: "England",
    addressCountry: "GB",
  },
  areaServed: { "@type": "Country", name: "United Kingdom" },
  knowsAbout: [
    "Web design",
    "Conversion rate optimisation",
    "AI chatbots",
    "Google Ads",
    "Meta Ads",
    "Lead generation",
    "Local SEO",
  ],
  // The services this business offers, as a catalog. Each entry links back to the fuller Service
  // node emitted on /services via a shared name, and carries a price so the offer is machine-
  // readable (great for "how much does X cost" style AI answers).
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: `${site.name} services`,
    itemListElement: [
      ...plans.map((p: Plan) => ({
        "@type": "Offer",
        name: `${p.name} plan`,
        description: p.blurb,
        priceCurrency: "GBP",
        price: p.monthly,
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: p.monthly,
          priceCurrency: "GBP",
          unitText: "MONTH",
        },
        category: "Marketing retainer",
      })),
      ...oneOffProjects.map((o) => ({
        "@type": "Offer",
        name: o.name,
        description: o.blurb,
        priceCurrency: "GBP",
      })),
    ],
  },
  // sameAs: add verified social/profile URLs here once live (LinkedIn, Instagram, Google
  // Business Profile). Left out deliberately — a wrong or invented sameAs hurts entity trust.
} as const;

/** The website entity — publisher points back to the org so authorship resolves site-wide. */
export const websiteSchema = {
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  url: site.url,
  name: site.name,
  description: site.description,
  inLanguage: "en-GB",
  publisher: { "@id": ORG_ID },
} as const;

/** Global graph injected on every page (via the root layout). Establishes the business + site
 *  entity once; per-page nodes below reference these ids. */
export const globalGraph = {
  "@context": "https://schema.org",
  "@graph": [organizationSchema, websiteSchema],
};

/** BreadcrumbList for a sub-page. Pass the trail after Home, e.g.
 *  `breadcrumb([{ name: "Services", path: "/services" }])`. */
export function breadcrumb(trail: { name: string; path: string }[]) {
  const items = [{ name: "Home", path: "/" }, ...trail];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${site.url}${item.path === "/" ? "" : item.path}`,
    })),
  };
}

/** FAQPage — used on any page that renders the FAQ accordion (home, pricing). Google shows the
 *  visible questions; the text must match what's on the page, so it's built from the same data. */
export function faqSchema(faqs: readonly { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/** The three core services as an ItemList of Service nodes, each provided by the org. Emitted on
 *  /services. `serviceType` + `provider @id` is what lets an AI say "AFA Media offers X". */
export function servicesSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: services.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Service",
        name: s.name,
        serviceType: s.name,
        description: s.blurb,
        provider: { "@id": ORG_ID },
        areaServed: { "@type": "Country", name: "United Kingdom" },
        url: `${site.url}/services`,
      },
    })),
  };
}

/** The two plans as Product+Offer nodes, emitted on /pricing so prices are rich-result eligible.
 *  `price` uses the current (founding) setup + monthly; the struck-through full price is display
 *  copy, not the offer. */
export function pricingSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": plans.map((p: Plan) => ({
      "@type": "Product",
      name: `${site.name} — ${p.name} plan`,
      description: p.blurb,
      brand: { "@id": ORG_ID },
      offers: {
        "@type": "Offer",
        priceCurrency: "GBP",
        price: p.monthly,
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: p.monthly,
          priceCurrency: "GBP",
          unitText: "MONTH",
        },
        availability: "https://schema.org/InStock",
        seller: { "@id": ORG_ID },
      },
    })),
  };
}
