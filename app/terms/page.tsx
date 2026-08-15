import type { Metadata } from "next";
import { Container } from "@/components/ui/section";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "AFA Media terms of service — payment terms, our delivery and ads guarantees, and the terms that govern our work together.",
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
        <p className="mt-4 text-sm text-mist-dim">Last updated: August 2026</p>

        <div className="mt-12 space-y-10 text-[15px] leading-relaxed text-mist">
          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">1. Agreement</h2>
            <p className="mt-3">
              These Terms govern our work together. By engaging AFA Media (&quot;we&quot;,
              &quot;us&quot;) you agree to them. Where we issue a written proposal or service
              agreement, that document and these Terms are read together; if they conflict, the
              proposal takes precedence.
            </p>
            <p className="mt-3">
              These Terms are for business customers. Nothing here affects rights that cannot be
              excluded by law.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">2. Services</h2>
            <p className="mt-3">
              We provide website design and build, AI chatbot setup, and paid advertising
              management. The exact scope, deliverables, timeline and fees for your project are
              agreed in writing before work begins.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">3. Fees and payment</h2>
            <p className="mt-3">
              <strong className="text-foreground">Setup and project fees are split 50/50.</strong>{" "}
              50% is payable before we begin, and the remaining 50% on completion, before the site
              or system goes live. We start work once the deposit clears.
            </p>
            <p className="mt-3">
              <strong className="text-foreground">Monthly management fees</strong> are billed
              monthly in advance, starting from the month your system goes live.
            </p>
            <p className="mt-3">
              Final payment is due on completion. Where you have approved the work but final
              payment has not been received, we may delay go-live until it is.
            </p>
            <p className="mt-3">
              All fees are exclusive of VAT where applicable. Late payments may incur statutory
              interest at 8% above the Bank of England base rate, plus fixed compensation, under
              the Late Payment of Commercial Debts (Interest) Act 1998. We may pause services on
              accounts more than 14 days overdue.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">4. Advertising spend</h2>
            <p className="mt-3">
              <strong className="text-foreground">Ad spend is separate from our fees and is paid
              by you directly to the platform</strong> (Google, Meta), normally on your own
              billing account. It is not part of our management fee, we do not mark it up, and
              because it is paid to a third party it is not refundable by us.
            </p>
            <p className="mt-3">
              You set and control your budget. We will recommend a minimum viable budget — below
              it, campaigns cannot gather enough data to perform, and the guarantee in clause 5.2
              does not apply.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">5. Our guarantees</h2>
            <p className="mt-3">
              We offer two specific, limited guarantees. They are the only performance guarantees
              we give, and each applies only if you have met your responsibilities in clause 6.
            </p>

            <p className="mt-5 font-display font-semibold text-foreground">
              5.1 Delivery guarantee
            </p>
            <p className="mt-2">
              If your system is not live within the timeline agreed in writing — 20 days on
              Growth, 25 on Mastery —{" "}
              <strong className="text-foreground">you do not pay the setup fee</strong>, and any
              setup fee already paid is refunded.
            </p>
            <p className="mt-2">
              The clock starts when we have received your deposit and all content, assets and
              access we have asked for. It pauses while we are waiting on you — for materials,
              feedback or approvals — and resumes when we receive them. Delays caused by changes
              to the agreed scope extend the timeline by agreement.
            </p>

            <p className="mt-5 font-display font-semibold text-foreground">
              5.2 Google Ads performance guarantee
            </p>
            <p className="mt-2">
              If, in the first 30 days of your campaigns running, our Google Ads do not deliver
              qualified traffic and genuine lead opportunities,{" "}
              <strong className="text-foreground">you pay zero management fees for that
              period</strong>, and any management fee already paid for it is refunded.
            </p>
            <p className="mt-2">
              For clarity, this guarantee covers{" "}
              <strong className="text-foreground">our management fee only</strong>. It does not
              cover ad spend paid to Google (see clause 4), setup fees, or fees for other
              services.
            </p>
            <p className="mt-2">
              &quot;Qualified traffic and genuine lead opportunities&quot; means clicks from
              users matching the agreed targeting, and enquiries — calls, form submissions,
              chatbot conversations or messages — from businesses or individuals plausibly
              seeking the services you offer. It is a measure of enquiries generated, not of
              sales closed or revenue earned: whether an enquiry becomes a paying customer
              depends on your pricing, availability, response time and sales process, which we do
              not control.
            </p>
            <p className="mt-2">
              The guarantee applies once per client, to the first 30 days of campaign activity.
            </p>

            <p className="mt-5 font-display font-semibold text-foreground">
              5.3 Founding partner terms
            </p>
            <p className="mt-2">
              Founding partners receive 50% off the setup fee. In exchange, you agree that on
              reaching agreed results you will provide a written testimonial and take part in a
              short recorded case study, and that we may use both in our marketing. The offer is
              capped at 10 clients, after which pricing returns to the standard rate.
            </p>

            <p className="mt-5">
              Other than the guarantees in this clause 5, we do not guarantee specific rankings,
              traffic volumes, lead numbers, conversion rates or revenue. Advertising and search
              results depend on factors outside our control, including platform algorithms,
              competitor activity and market conditions.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">6. What we need from you</h2>
            <p className="mt-3">
              Our guarantees depend on being able to do the work. You agree to:
            </p>
            <ul className="mt-3 space-y-2 pl-4">
              {[
                "Provide content, images, brand assets and account access promptly when requested",
                "Give feedback and approvals within 5 working days of us asking",
                "Maintain the agreed minimum ad budget for the full guarantee period",
                "Not pause, edit or restructure campaigns without agreeing it with us first",
                "Respond to enquiries and leads in a reasonable time",
                "Ensure everything you supply is accurate, lawful and yours to use",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-teal" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4">
              If these are not met, the affected guarantee in clause 5 does not apply.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">7. Revisions and scope</h2>
            <p className="mt-3">
              Your build includes two rounds of revisions at the design stage. Further changes, or
              work beyond the agreed scope, are quoted separately and agreed in writing before we
              start.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">8. Cancellation</h2>
            <p className="mt-3">
              Monthly plans are rolling and may be cancelled with 30 days&apos; written notice to{" "}
              <a href={`mailto:${site.email}`} className="text-brand-blue-light hover:text-brand-blue transition-colors">
                {site.email}
              </a>
              . Fees already paid for the current period are not refunded, except under clause 5.
            </p>
            <p className="mt-3">
              Deposits on project work are non-refundable once work has commenced, reflecting time
              already committed. If you cancel mid-project, we invoice for work completed to that
              point.
            </p>
            <p className="mt-3">
              We may end an engagement with 30 days&apos; notice, or immediately for non-payment or
              misuse. On cancellation we will hand over the work you have paid for.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">9. Intellectual property</h2>
            <p className="mt-3">
              On receipt of full payment, you own the custom deliverables we create for you —
              your website design, copy and ad creative. Until then they remain ours.
            </p>
            <p className="mt-3">
              We retain ownership of our underlying tools, component libraries, code frameworks
              and methods, which we license to you for use in your project. Third-party assets
              (fonts, stock imagery, plugins) remain subject to their own licences.
            </p>
            <p className="mt-3">
              We may display the work in our portfolio unless you ask us in writing not to.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">10. Confidentiality and data</h2>
            <p className="mt-3">
              Each of us agrees to keep the other&apos;s confidential information private. Where we
              process personal data on your behalf we do so as your processor, in line with UK
              GDPR and our{" "}
              <a href="/privacy" className="text-brand-blue-light hover:text-brand-blue transition-colors">
                Privacy Policy
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">11. Limitation of liability</h2>
            <p className="mt-3">
              We do not exclude liability for death or personal injury caused by negligence, for
              fraud, or for anything else that cannot lawfully be excluded.
            </p>
            <p className="mt-3">
              Subject to that, we are not liable for indirect or consequential loss, loss of
              profit, loss of business or loss of data, and our total liability for any claim is
              limited to the fees you paid us in the 3 months before the claim arose.
            </p>
            <p className="mt-3">
              We are not liable for third-party platform failures, outages, policy changes or
              account suspensions (including Google, Meta, hosting and domain providers).
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">12. Changes to these terms</h2>
            <p className="mt-3">
              We may update these Terms from time to time. The version in force is the one
              published when your engagement begins; material changes to an active engagement will
              be agreed with you.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">13. Governing law</h2>
            <p className="mt-3">
              These Terms are governed by the laws of England and Wales, and the courts of England
              and Wales have exclusive jurisdiction.
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
