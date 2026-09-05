import { Container, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/reveal";

const pains = [
  {
    stat: "27%",
    title: "Missed calls, lost jobs",
    body: "When you're on the tools, leads don't wait. They scroll to the next name on Google and book with them instead.",
    note: "of calls to trade businesses go unanswered during working hours",
  },
  {
    stat: "£1 in £3",
    title: "Money leaking to competitors",
    body: "You pay for marketing, but a slow site and no follow-up means you're pouring leads into a bucket with holes in it.",
    note: "of ad spend wasted on traffic that never gets a reply",
  },
  {
    stat: "11:40pm",
    title: "Working nights to keep up",
    body: "Answering emails at 11pm, chasing quotes on weekends. You've become the bottleneck in your own business. With us, you go to bed knowing your system will work for you as you sleep.",
    note: "average time the last quote of the day gets sent",
  },
];

export function Problem() {
  return (
    <section className="relative py-28 sm:py-36">
      <Container>
        <Reveal>
          {/* Label + rule — this section's own identity (a data/editorial register: a short
              teal rule and a monospace tag) rather than the site's earlier rounded-pill
              eyebrow badge, which was removed everywhere else on the site. Not reintroducing
              that component; this is a one-off treatment for this section only. */}
          <div className="mb-8 flex items-center gap-3">
            <span className="h-px w-6 bg-brand-teal" />
            <span className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-brand-teal">
              The gap
            </span>
          </div>

          <SectionHeading
            align="left"
            title={
              <>
                You&apos;re great at the job. The{" "}
                <span className="text-brand-teal">seven minutes</span> after
                an enquiry is where the money goes.
              </>
            }
            lead="Most service businesses don't lose work because they're bad at what they do. They lose it in the gap between a customer reaching out and anyone replying."
          />
        </Reveal>

        {/* The three pain rows and the bridge line used to each fade in on their own; that
            piled up as noise as the visitor scrolled. The section's opening Reveal above sets
            the moment — everything below just renders. */}
        <div className="mt-16 border-t border-line">
          {pains.map((pain) => (
            <div
              key={pain.title}
              className="grid grid-cols-1 gap-6 border-b border-line py-9 md:grid-cols-[200px_1fr_280px] md:gap-10"
            >
              <div className="font-mono text-4xl font-medium tracking-tight text-foreground sm:text-[44px]">
                {pain.stat}
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-foreground sm:text-2xl">
                  {pain.title}
                </h3>
                <p className="mt-2 max-w-[420px] text-[15px] leading-relaxed text-mist sm:text-base">
                  {pain.body}
                </p>
              </div>
              <div className="font-mono text-[13px] leading-relaxed text-mist-dim">
                {pain.note}
              </div>
            </div>
          ))}
        </div>

        {/* Forward-pointing bridge — turns the corner from pain to hope and hands straight to
            the Services section's "The fix" label below, so the reader never has to work out
            how the offers map to these gaps. */}
        <p className="mt-12 max-w-2xl text-lg leading-relaxed text-mist">
          None of this means you&apos;re bad at your job. It means nothing&apos;s there to
          catch the lead the moment it lands. That&apos;s a system problem —{" "}
          <span className="text-foreground">and a system is exactly what we build.</span>
        </p>
      </Container>
    </section>
  );
}
