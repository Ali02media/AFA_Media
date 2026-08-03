import type { Metadata } from "next";
import { Layers, Bot, Zap, MapPin } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Container } from "@/components/ui/section";
import { Reveal } from "@/components/reveal";
import { Proof } from "@/components/sections/proof";
import { CTA } from "@/components/sections/cta";
import { ProcessSection } from "@/components/sections/process-section";

export const metadata: Metadata = {
  title: "The Process",
  description:
    "How AFA Media works: three clear steps from first call to live in 14 days — plus who we are and why UK service businesses choose us.",
  alternates: { canonical: "/process" },
};

const differences = [
  {
    icon: Layers,
    title: "Everything under one roof",
    body: "Website, ads, email and AI — one team that actually talks to each other, instead of three agencies blaming each other.",
  },
  {
    icon: Bot,
    title: "AI-powered, human-led",
    body: "We use AI to do the heavy lifting — capturing leads, answering questions, automating follow-up — guided by real strategy, not gimmicks.",
  },
  {
    icon: Zap,
    title: "We move fast",
    body: "No three-month timelines or endless meetings. Most builds go live in 14 days. We respect that your time is money.",
  },
  {
    icon: MapPin,
    title: "Built for UK service businesses",
    body: "We're not a generalist agency chasing every client. We understand the businesses that run on enquiries and bookings.",
  },
];

export default function ProcessPage() {
  return (
    <>
      <PageHeader
        title={
          <>
            From first call to live in{" "}
            <span className="text-gradient">14 days.</span>
          </>
        }
      />

      {/* The three steps — this is what the page is named for. Same component the homepage
          uses, so the steps stay in one place and can't drift between the two. */}
      <ProcessSection />

      {/* Founder story */}
      <section className="pb-20">
        <Container className="max-w-3xl">
          <Reveal>
            <div className="space-y-5 text-lg leading-relaxed text-mist">
              <p>
                AFA Media started with a simple, frustrating observation: brilliant
                local businesses — the plumbers, clinics, accountants and trades
                that keep the country running — were losing work they should have
                won. Not because they weren&apos;t good enough, but because their
                websites were slow, their enquiries went unanswered, and their
                marketing was a patchwork of half-finished ideas.
              </p>
              <p>
                Meanwhile, the tools to fix all of that — fast modern websites, AI
                assistants that never sleep, automated follow-up, targeted ads —
                had never been more powerful. The problem wasn&apos;t the
                technology. It was that no one was putting it together properly for
                businesses like these.
              </p>
              <p>
                So we did. AFA Media brings web design, AI chatbots, email and paid
                ads together into one growth engine — built fast, priced honestly,
                and focused on the only metric that matters to you:{" "}
                <span className="font-medium text-foreground">
                  more customers through the door.
                </span>
              </p>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* What makes us different */}
      <section className="border-y border-line bg-ink-2/30 py-24">
        <Container>
          <Reveal>
            <h2 className="max-w-2xl font-display text-4xl font-semibold leading-tight tracking-tight text-foreground">
              What makes us <span className="text-gradient">different.</span>
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-5 md:grid-cols-2">
            {differences.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.06}>
                <div className="group flex h-full gap-5 rounded-2xl border border-line bg-ink-2 p-8 transition-all duration-300 hover:-translate-y-1 hover:border-brand-blue/25 hover:bg-ink-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-line bg-brand-teal/10 text-brand-teal transition-transform duration-300 group-hover:scale-110">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-semibold text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-mist">
                      {item.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <Proof />
      <CTA />
    </>
  );
}
