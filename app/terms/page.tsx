import type { Metadata } from "next";
import { Container } from "@/components/ui/section";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "AFA Media terms of service — the terms that govern your use of our website and services.",
  alternates: { canonical: "/terms" },
  robots: { index: false, follow: false },
};

export default function TermsPage() {
  return (
    <div className="relative min-h-[100svh] pb-24 pt-32 sm:pt-40">
      <Container className="max-w-3xl">
        <h1 className="font-display text-4xl font-semibold text-foreground sm:text-5xl">
          Terms of Service
        </h1>
        <p className="mt-4 text-sm text-mist-dim">Last updated: June 2025</p>

        <div className="mt-12 space-y-10 text-[15px] leading-relaxed text-mist">
          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">1. Agreement</h2>
            <p className="mt-3">
              By accessing the AFA Media website at{" "}
              <a href={site.url} className="text-brand-blue-light hover:text-brand-blue transition-colors">
                {site.url}
              </a>{" "}
              or engaging our services, you agree to these Terms. If you do not agree, please do not use
              the website or our services.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">2. Services</h2>
            <p className="mt-3">
              AFA Media provides digital marketing services including website design, AI chatbot setup
              and paid advertising management. The scope, deliverables and fees for each
              engagement are agreed in a separate service agreement or proposal before work begins.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">3. Payment</h2>
            <p className="mt-3">
              Monthly retainers are billed in advance. One-off project fees are billed as agreed. Late
              payments may incur a charge of 8% over the Bank of England base rate per the Late Payment of
              Commercial Debts Act 1998. We reserve the right to pause services for accounts more than
              14 days overdue.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">4. Cancellation</h2>
            <p className="mt-3">
              Monthly plans may be cancelled with 30 days&apos; written notice to{" "}
              <a href={`mailto:${site.email}`} className="text-brand-blue-light hover:text-brand-blue transition-colors">
                {site.email}
              </a>
              . One-off project deposits are non-refundable once work has commenced.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">5. Intellectual property</h2>
            <p className="mt-3">
              On receipt of full payment, you own all custom deliverables created specifically for you
              (website, copy, ad creatives). We retain the right to display the work in our portfolio unless
              you request otherwise in writing.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">6. Limitation of liability</h2>
            <p className="mt-3">
              We are not liable for indirect, incidental or consequential losses. Our total liability for
              any claim is limited to the fees paid by you in the 3 months preceding the claim. We make no
              guarantees of specific results from marketing services.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">7. Governing law</h2>
            <p className="mt-3">
              These Terms are governed by the laws of England and Wales. Any disputes shall be subject to
              the exclusive jurisdiction of the courts of England and Wales.
            </p>
          </section>

          <section className="rounded-2xl border border-line bg-ink-2 p-6">
            <p className="font-display font-semibold text-foreground">Questions about these terms?</p>
            <p className="mt-2">
              Contact us at{" "}
              <a href={`mailto:${site.email}`} className="text-brand-blue-light hover:text-brand-blue transition-colors">
                {site.email}
              </a>
              .
            </p>
          </section>
        </div>
      </Container>
    </div>
  );
}
