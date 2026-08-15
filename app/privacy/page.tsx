import type { Metadata } from "next";
import { Container } from "@/components/ui/section";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "AFA Media privacy policy — what data we collect, why, how long we keep it, and your rights under UK GDPR.",
  alternates: { canonical: "/privacy" },
  robots: { index: false, follow: false },
};

/** Small helper so the data table stays readable in source. */
const dataUses = [
  {
    what: "Name, email, phone number",
    why: "To schedule and hold discovery calls, and to reply to your enquiry",
    basis: "Legitimate interests / steps prior to a contract",
    kept: "3 years after our last contact",
  },
  {
    what: "Business name, website URL, and what you tell us about your business",
    why: "To prepare a proposal and deliver services you engage us for",
    basis: "Contract performance",
    kept: "6 years after the engagement ends (tax and accounting records)",
  },
  {
    what: "Chatbot conversation content",
    why: "To answer your questions and pass enquiries to us",
    basis: "Legitimate interests",
    kept: "12 months",
  },
  {
    what: "Analytics data — pages viewed, approximate location, device and browser",
    why: "To understand how the site is used and improve it",
    basis: "Consent",
    kept: "14 months",
  },
];

export default function PrivacyPage() {
  return (
    <div className="relative min-h-[100svh] pb-24 pt-32 sm:pt-40">
      <Container className="max-w-3xl">
        <h1 className="font-display text-4xl font-semibold text-foreground sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm text-mist-dim">Last updated: August 2026</p>

        <div className="prose-afa mt-12 space-y-10 text-[15px] leading-relaxed text-mist">
          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">Who we are</h2>
            <p className="mt-3">
              AFA Media (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is a digital marketing
              agency based in Brighton, United Kingdom. We operate{" "}
              <a href={site.url} className="text-brand-blue-light hover:text-brand-blue transition-colors">
                {site.url}
              </a>
              .
            </p>
            <p className="mt-3">
              We are the <strong className="text-foreground">data controller</strong> for the
              personal data described here. For questions or to exercise any of your rights,
              contact{" "}
              <a href={`mailto:${site.email}`} className="text-brand-blue-light hover:text-brand-blue transition-colors">
                {site.email}
              </a>
              .
            </p>
            <p className="mt-3">
              Where we handle personal data belonging to a client&apos;s own customers — for
              example leads captured through a website or chatbot we built — we act as a{" "}
              <strong className="text-foreground">processor</strong> on that client&apos;s
              instructions, and their privacy policy applies to that data.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">
              What we collect, why, and how long we keep it
            </h2>
            <p className="mt-3">
              We only collect what we need. We do not buy personal data, and we do not sell or
              rent yours to anyone.
            </p>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-line">
                    <th className="py-3 pr-4 font-display font-semibold text-foreground">Data</th>
                    <th className="py-3 pr-4 font-display font-semibold text-foreground">Why</th>
                    <th className="py-3 pr-4 font-display font-semibold text-foreground">Lawful basis</th>
                    <th className="py-3 font-display font-semibold text-foreground">Retention</th>
                  </tr>
                </thead>
                <tbody>
                  {dataUses.map((row) => (
                    <tr key={row.what} className="border-b border-line/60 align-top">
                      <td className="py-3 pr-4">{row.what}</td>
                      <td className="py-3 pr-4">{row.why}</td>
                      <td className="py-3 pr-4">{row.basis}</td>
                      <td className="py-3">{row.kept}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-4">
              Where our lawful basis is{" "}
              <strong className="text-foreground">legitimate interests</strong>, those interests
              are responding to enquiries, running and growing our business, and keeping our
              website secure and working. We have considered your rights and do not believe this
              processing overrides them.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">Who we share it with</h2>
            <p className="mt-3">
              We share personal data only with service providers who help us operate, each bound
              by a data-processing agreement:
            </p>
            <ul className="mt-3 space-y-2 pl-4">
              {[
                "Cal.com — booking and scheduling for discovery calls",
                "Google (Workspace and Analytics) — email, documents, and website analytics",
                "Netlify — website hosting and delivery",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-teal" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4">
              We may also disclose data where required by law, or to professional advisers such as
              our accountant.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">
              Transfers outside the UK
            </h2>
            <p className="mt-3">
              Some of these providers process data outside the UK, including in the United States.
              Where that happens, transfers are protected by the UK International Data Transfer
              Addendum or standard contractual clauses, or by an adequacy decision.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">Cookies</h2>
            <p className="mt-3">
              We use essential cookies (session state) which are required for the site to work,
              and — only with your consent — analytics cookies from Google Analytics 4.
            </p>
            <p className="mt-4">
              Analytics cookies (<code className="text-mist-dim">_ga</code>,{" "}
              <code className="text-mist-dim">_ga_*</code>) tell us which pages people visit and
              how they found us. They are{" "}
              <strong className="text-foreground">off by default</strong>. Nothing is stored on
              your device unless you press &quot;Accept&quot; on the cookie banner, and declining
              takes one click.
            </p>
            <p className="mt-4">
              IP addresses are anonymised. We use no advertising, remarketing or cross-site
              tracking cookies.
            </p>
            <p className="mt-4">
              To change your mind, clear this site&apos;s data in your browser and the banner will
              reappear. You can also opt out of Google Analytics everywhere using Google&apos;s{" "}
              <a
                href="https://tools.google.com/dlpage/gaoptout"
                className="text-brand-blue-light hover:text-brand-blue transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                browser add-on
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">Your rights</h2>
            <p className="mt-3">Under UK GDPR you have the right to:</p>
            <ul className="mt-3 space-y-2 pl-4">
              {[
                "Be informed about how we use your data — that's this page",
                "Access a copy of the personal data we hold about you",
                "Have inaccurate data corrected",
                "Have your data erased (the 'right to be forgotten')",
                "Restrict or object to how we process it",
                "Receive your data in a portable format",
                "Withdraw consent at any time, where consent is the basis we rely on",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-teal" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4">
              To exercise any of these, email{" "}
              <a href={`mailto:${site.email}`} className="text-brand-blue-light hover:text-brand-blue transition-colors">
                {site.email}
              </a>
              . We respond within one month, and it is free.
            </p>
            <p className="mt-4">
              Providing your data is not a statutory requirement, but we cannot arrange a call or
              deliver services without the basics such as your name and contact details.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">
              Automated decision-making
            </h2>
            <p className="mt-3">
              We do not make decisions with legal or similarly significant effects about you using
              automated processing or profiling. Our AI chatbot answers questions and passes
              enquiries to a human — it does not decide anything about you on its own.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">Security</h2>
            <p className="mt-3">
              We use encryption in transit, access controls and multi-factor authentication on the
              accounts holding personal data, and keep access limited to those who need it.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">Complaints</h2>
            <p className="mt-3">
              If you are unhappy with how we have handled your data, please tell us first so we can
              put it right. You also have the right to complain to the{" "}
              <a
                href="https://ico.org.uk/make-a-complaint/"
                className="text-brand-blue-light hover:text-brand-blue transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Information Commissioner&apos;s Office (ICO)
              </a>
              , the UK supervisory authority, at any time.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">Changes</h2>
            <p className="mt-3">
              We review this policy regularly and will update the date at the top when it changes.
              If we start using your data in a materially new way, we will tell you before we do.
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
