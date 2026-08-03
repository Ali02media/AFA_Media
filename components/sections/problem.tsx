import { PhoneMissed, TrendingDown, Clock } from "lucide-react";
import { Container, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/reveal";

const pains = [
  {
    icon: PhoneMissed,
    title: "Missed calls, lost jobs",
    body: "When you're on the tools, leads don't wait. They scroll to the next name on Google and book with them instead.",
    iconClass: "text-brand-teal",
    bgClass: "bg-brand-teal/10",
  },
  {
    icon: TrendingDown,
    title: "Money leaking to competitors",
    body: "You pay for marketing, but a slow site and no follow-up means you're pouring leads into a bucket with holes in it.",
    iconClass: "text-brand-blue-light",
    bgClass: "bg-brand-blue/10",
  },
  {
    icon: Clock,
    title: "Working nights to keep up",
    body: "Answering emails at 11pm, chasing quotes on weekends. You've become the bottleneck in your own business.",
    iconClass: "text-brand-teal",
    bgClass: "bg-brand-teal/10",
  },
];

export function Problem() {
  return (
    <section className="relative py-28 sm:py-36">
      <div className="pointer-events-none absolute left-0 top-1/2 -z-10 -translate-y-1/2 overflow-hidden">
        <div className="orb orb-blue h-[400px] w-[400px] opacity-20" />
      </div>
      <Container>
        <Reveal>
          <SectionHeading
            title={
              <>
                You&apos;re great at the job. Your{" "}
                <span className="text-gradient">digital presence</span> is
                costing you customers.
              </>
            }
            lead="Most service businesses don't lose work because they're bad at what they do. They lose it in the gap between a customer reaching out and anyone replying."
          />
        </Reveal>

        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {pains.map((pain, i) => (
            <Reveal key={pain.title} delay={i * 0.08}>
              <div className="group relative h-full overflow-hidden rounded-2xl border border-line bg-ink-2 p-8 transition-all duration-300 hover:-translate-y-1 hover:border-brand-blue/30 hover:bg-ink-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl border border-line ${pain.bgClass} ${pain.iconClass} transition-transform duration-300 group-hover:scale-110`}>
                  <pain.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-6 font-display text-xl font-semibold text-foreground">
                  {pain.title}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-mist">
                  {pain.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.12}>
          <div className="border-gradient mt-10 flex flex-col items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-blue/10 to-brand-teal/10 px-8 py-8 text-center">
            <p className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
              The average missed enquiry is worth{" "}
              <span className="text-gradient">£2,450.</span>
            </p>
            <p className="text-mist">How many did you miss last month?</p>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
