import type { Metadata } from "next";
import { Container } from "@/components/ui/section";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "AFA Media privacy policy — how we collect, use, and protect your data in compliance with GDPR.",
  alternates: { canonical: "/privacy" },
  robots: { index: false, follow: false },
};

export default function PrivacyPage() {
  return (
    <div className="relative min-h-[100svh] pb-24 pt-32 sm:pt-40">
      <Container className="max-w-3xl">
        <h1 className="font-display text-4xl font-semibold text-foreground sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm text-mist-dim">Last updated: June 2025</p>

        <div className="prose-afa mt-12 space-y-10 text-[15px] leading-relaxed text-mist">
          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">Who we are</h2>
            <p className="mt-3">
              AFA Media (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is a digital
              marketing agency based in Brighton, UK. We operate the website at{" "}
              <a href={site.url} className="text-brand-blue-light hover:text-brand-blue transition-colors">
                {site.url}
              </a>
              . Our contact email is{" "}
              <a href={`mailto:${site.email}`} className="text-brand-blue-light hover:text-brand-blue transition-colors">
                {site.email}
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">What data we collect</h2>
            <p className="mt-3">We may collect the following personal data when you interact with our website or book a call:</p>
            <ul className="mt-3 space-y-2 pl-4">
              {[
                "Name and email address (when booking a discovery call via Cal.com)",
                "Phone number (if you call or text us directly)",
                "Business name and website URL (shared during onboarding conversations)",
                "Technical data: IP address, browser type, pages visited (via analytics)",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-teal" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">How we use your data</h2>
            <p className="mt-3">We use your data to:</p>
            <ul className="mt-3 space-y-2 pl-4">
              {[
                "Schedule and conduct discovery calls",
                "Deliver services you have engaged us to provide",
                "Send you relevant communications about our services (you can opt out at any time)",
                "Improve our website and marketing",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-teal" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4">
              Our lawful basis for processing is <strong className="text-foreground">legitimate interests</strong> and,
              where applicable, <strong className="text-foreground">consent</strong> or{" "}
              <strong className="text-foreground">contract performance</strong>.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">Third-party services</h2>
            <p className="mt-3">
              We use Cal.com to manage bookings. By booking a call you are also subject to{" "}
              <a href="https://cal.com/privacy" className="text-brand-blue-light hover:text-brand-blue transition-colors" target="_blank" rel="noopener noreferrer">
                Cal.com&apos;s Privacy Policy
              </a>
              . We may also use email tools (e.g. Gmail) and analytics tools; these are GDPR-compliant processors
              under appropriate data-processing agreements.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">Data retention</h2>
            <p className="mt-3">
              We retain your personal data only as long as necessary for the purposes above — typically no longer than
              3 years after our last interaction, unless legal obligations require otherwise.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">Your rights (GDPR)</h2>
            <p className="mt-3">Under UK GDPR you have the right to:</p>
            <ul className="mt-3 space-y-2 pl-4">
              {[
                "Access the personal data we hold about you",
                "Correct inaccurate data",
                "Erase your data ('right to be forgotten')",
                "Restrict or object to processing",
                "Data portability",
                "Withdraw consent at any time",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-teal" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4">
              To exercise any of these rights, email us at{" "}
              <a href={`mailto:${site.email}`} className="text-brand-blue-light hover:text-brand-blue transition-colors">
                {site.email}
              </a>
              . You also have the right to lodge a complaint with the{" "}
              <a href="https://ico.org.uk" className="text-brand-blue-light hover:text-brand-blue transition-colors" target="_blank" rel="noopener noreferrer">
                Information Commissioner&apos;s Office (ICO)
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">Cookies</h2>
            <p className="mt-3">
              Our website may use essential cookies only (session state). We do not use third-party
              advertising cookies. If we add any in future we will update this policy and seek consent
              where required.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">Changes to this policy</h2>
            <p className="mt-3">
              We may update this policy from time to time. The date at the top of this page shows when it
              was last revised. Continued use of our site after changes constitutes acceptance of the
              updated policy.
            </p>
          </section>

          <section className="rounded-2xl border border-line bg-ink-2 p-6">
            <p className="font-display font-semibold text-foreground">Questions?</p>
            <p className="mt-2">
              Email{" "}
              <a href={`mailto:${site.email}`} className="text-brand-blue-light hover:text-brand-blue transition-colors">
                {site.email}
              </a>{" "}
              and we&apos;ll respond within 2 business days.
            </p>
          </section>
        </div>
      </Container>
    </div>
  );
}
