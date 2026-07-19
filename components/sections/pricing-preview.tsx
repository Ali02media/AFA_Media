import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/reveal";
import { PricingCards } from "@/components/pricing-cards";

export function PricingPreview() {
  return (
    <section id="pricing" className="relative py-28 sm:py-36">
      <div className="absolute left-0 top-1/4 -z-10 h-[500px] w-[500px] rounded-full bg-brand-blue/10 blur-[120px]" />
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="Pricing"
            title={
              <>
                Simple, honest pricing.{" "}
                <span className="text-gradient">No surprises.</span>
              </>
            }
            lead="Rolling monthly plans you can cancel any time. Pick the level that matches where your business is headed."
          />
        </Reveal>

        <div className="mt-16">
          <Reveal>
            <PricingCards />
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div className="mt-12 flex justify-center">
            <Link
              href="/pricing"
              className="group inline-flex items-center gap-2 text-sm font-medium text-mist transition-colors hover:text-foreground"
            >
              See full pricing & one-off projects
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
