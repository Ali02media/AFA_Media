import { Container, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/reveal";
import { process } from "@/lib/site";

export function ProcessSection() {
  return (
    // id: anchor target for the hero's "See the Process" button (Bug E).
    <section id="process" className="relative border-y border-line bg-ink-2/20 py-28 sm:py-36">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="How it works"
            title={
              <>
                From first call to{" "}
                <span className="text-gradient">live in 14 days.</span>
              </>
            }
            lead="No drawn-out timelines or agency runaround. Three clear steps and your growth engine is switched on."
          />
        </Reveal>

        <div className="relative mt-20 grid gap-0 md:grid-cols-3">
          {/* Connector line — only visible md+ */}
          <div className="absolute left-[calc(50%/3+16.66%)] right-[calc(50%/3+16.66%)] top-[22px] hidden h-px md:block">
            <div className="h-full w-full bg-gradient-to-r from-brand-blue/30 via-brand-teal/30 to-brand-blue/30" />
          </div>

          {process.map((step, i) => (
            <Reveal key={step.step} delay={i * 0.1}>
              <div className="relative flex flex-col items-center px-6 pb-12 text-center md:pb-0">
                {/* Step number circle */}
                <div className="relative mb-8">
                  {/* Outer ring */}
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-ink-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-brand shadow-[0_0_20px_-4px_rgba(44,135,208,0.6)]">
                      <span className="font-display text-xs font-bold text-white">{i + 1}</span>
                    </div>
                  </div>
                </div>

                <div className="glass mx-auto max-w-[280px] rounded-2xl p-7">
                  <h3 className="font-display text-xl font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-[14px] leading-relaxed text-mist">
                    {step.blurb}
                  </p>
                </div>

                {/* Mobile connector — vertical line between steps */}
                {i < process.length - 1 && (
                  <div className="mt-4 h-8 w-px bg-gradient-to-b from-brand-teal/30 to-transparent md:hidden" />
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
