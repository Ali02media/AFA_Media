import { Link } from "next-view-transitions";
import { Globe, Bot, Target, ArrowUpRight, Check } from "lucide-react";
import { Container, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/reveal";
import { GlowCard } from "@/components/ui/spotlight-card";
import { services } from "@/lib/site";

const icons = {
  "web-design":  Globe,
  "ai-chatbots": Bot,
  "paid-ads":    Target,
} as const;

export function ServicesSection({
  forceVisible = false,
  cardsInteractive = true,
  cardsBlur = true,
}: {
  forceVisible?: boolean;
  cardsInteractive?: boolean;
  cardsBlur?: boolean;
}) {
  return (
    <section id={forceVisible ? undefined : "services"} className="relative py-28 sm:py-36">
      <div className="pointer-events-none absolute right-0 top-1/3 -z-10 overflow-hidden">
        <div className="orb orb-teal h-[500px] w-[500px] opacity-25" />
      </div>

      <Container>
        <Reveal forceVisible={forceVisible}>
          {/* "The fix" — deliberately mirrors the Problem section's "The gap" label (same teal
              rule + monospace tag, same left alignment) so the two sections read as a pair:
              gap → fix. This is the bridge that stops the reader having to map offers to pains. */}
          <div className="mb-8 flex items-center gap-3">
            <span className="h-px w-6 bg-brand-teal" />
            <span className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-brand-teal">
              The fix
            </span>
          </div>

          <SectionHeading
            align="left"
            title={
              <>
                One system that catches every lead,{" "}
                <span className="text-gradient">so you don&apos;t have to.</span>
              </>
            }
            lead="No hiring, no midnight admin. A fast site that turns clicks into booked jobs, an AI that replies the second an enquiry lands, and ads that only bring you people ready to buy — run by one team, as one plan."
          />
        </Reveal>

        {/* Three cards → one row of three on desktop (lg), stacked below. Was md:grid-cols-2
            for four cards (a 2×2); with three, a 2-col grid orphaned the last card. */}
        <div className="mt-16 grid gap-5 lg:grid-cols-3">
          {services.map((service, i) => {
            const Icon = icons[service.id as keyof typeof icons];
            const isTeal = service.accent === "teal";
            const accentText = isTeal ? "text-brand-teal" : "text-brand-blue-light";
            const accentBg   = isTeal ? "bg-brand-teal/10" : "bg-brand-blue/10";

            return (
              <Reveal key={service.id} delay={i * 0.07} forceVisible={forceVisible}>
                <GlowCard
                  customSize
                  glowColor={isTeal ? "green" : "blue"}
                  interactive={cardsInteractive}
                  blur={cardsBlur}
                  className="group relative h-full w-full !p-8 sm:!p-10"
                >
                  <div className="relative">
                    {/* Top row: icon + tag */}
                    <div className="flex items-start justify-between gap-4">
                      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-line ${accentBg} ${accentText} transition-transform duration-300 group-hover:scale-110`}>
                        <Icon className="h-7 w-7" />
                      </div>
                      <span className="mt-1 rounded-full border border-line bg-ink-3 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-mist-dim">
                        {service.tag}
                      </span>
                    </div>

                    <h3 className="mt-7 font-display text-2xl font-semibold text-foreground">
                      {service.name}
                    </h3>
                    {/* Names the exact pain this service kills (mono/teal, echoing the Problem
                        section) so the offer→pain mapping is instant, not something to work out. */}
                    <p className="mt-2 font-mono text-xs uppercase tracking-[0.12em] text-brand-teal">
                      {service.fixes}
                    </p>
                    <p className="mt-3 text-[15px] leading-relaxed text-mist">
                      {service.blurb}
                    </p>

                    <ul className="mt-7 space-y-2.5">
                      {service.points.map((point) => (
                        <li key={point} className="flex items-center gap-3 text-sm text-mist">
                          <Check className={`h-4 w-4 shrink-0 ${accentText}`} />
                          {point}
                        </li>
                      ))}
                    </ul>

                    {/* Bottom line accent */}
                    <div className={`absolute -bottom-2 left-0 right-0 h-px origin-center scale-x-0 bg-gradient-to-r from-transparent ${isTeal ? "via-brand-teal" : "via-brand-blue"} to-transparent transition-transform duration-500 group-hover:scale-x-100`} />
                  </div>
                </GlowCard>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={0.12} forceVisible={forceVisible}>
          <div className="mt-12 flex justify-center">
            <Link
              href="/services"
              className="group -my-1.5 inline-flex items-center gap-2 py-1.5 text-sm font-medium text-mist transition-colors duration-200 hover:text-foreground"
            >
              Explore all services in detail
              <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
