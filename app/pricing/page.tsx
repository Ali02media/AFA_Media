import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Container } from "@/components/ui/section";
import { Reveal } from "@/components/reveal";
import { PricingComparison } from "@/components/ui/pricing-comparison";
import { FAQ } from "@/components/sections/faq";
import { CTA } from "@/components/sections/cta";
import { oneOffProjects } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, honest pricing for UK service businesses. Rolling monthly plans you can cancel any time, plus one-off project options.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Pricing"
        title={
          <>
            Simple, honest pricing.{" "}
            <span className="text-gradient">No surprises.</span>
          </>
        }
        lead="Rolling monthly plans you can cancel any time with 30 days' notice. Pick the level that matches where your business is headed — upgrade whenever you're ready."
      />

      <section className="pb-20">
        <Container>
          <Reveal>
            <PricingComparison />
          </Reveal>
        </Container>
      </section>

      {/* One-off projects */}
      <section className="py-16">
        <Container>
          <Reveal>
            <div className="flex flex-col gap-3">
              <h2 className="font-display text-3xl font-semibold text-foreground">
                Not ready for a retainer?
              </h2>
              <p className="max-w-2xl text-mist">
                Start with a one-off project and scale into a plan when the
                results speak for themselves.
              </p>
            </div>
          </Reveal>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {oneOffProjects.map((project, i) => (
              <Reveal key={project.name} delay={i * 0.06}>
                <div className="group h-full rounded-2xl border border-line bg-ink-2 p-8 transition-all duration-300 hover:-translate-y-1 hover:border-brand-blue/25 hover:bg-ink-3">
                  <h3 className="font-display text-xl font-semibold text-foreground">
                    {project.name}
                  </h3>
                  <p className="mt-3 font-display text-2xl font-bold text-gradient">
                    {project.price}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-mist">
                    {project.blurb}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1}>
            <div className="border-gradient mt-8 flex flex-col items-center gap-4 rounded-3xl bg-ink-2/40 px-8 py-8 text-center sm:flex-row sm:text-left">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-brand">
                <ShieldCheck className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="font-display text-xl font-semibold text-foreground">
                  14 & 20-day delivery, guaranteed.
                </p>
                <p className="mt-1 text-mist">
                  Growth is live in 14 days, Mastery in 20 — if we&apos;re
                  late, you don&apos;t pay for the setup. Simple as that.
                </p>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      <FAQ />
      <CTA />
    </>
  );
}
