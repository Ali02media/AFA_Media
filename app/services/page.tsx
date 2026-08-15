import type { Metadata } from "next";
import { Globe, Bot, Target, Check, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Container } from "@/components/ui/section";
import { Reveal } from "@/components/reveal";
import { GlowCard } from "@/components/ui/spotlight-card";
import { CTA } from "@/components/sections/cta";
import { services } from "@/lib/site";
import { JsonLd } from "@/components/json-ld";
import { servicesSchema, breadcrumb } from "@/lib/schema";
import { Link } from "next-view-transitions";

export const metadata: Metadata = {
  title: "Web Design, AI Chatbots & Paid Ads",
  description:
    "Web design, AI chatbots and paid ads for UK service businesses — everything you need to grow, under one roof. Live in 20 days, or you don't pay the setup.",
  alternates: { canonical: "/services" },
};

const icons = {
  "web-design": Globe,
  "ai-chatbots": Bot,
  "paid-ads": Target,
} as const;

const detail: Record<string, { who: string; longer: string }> = {
  "web-design": {
    longer:
      "Your website is your hardest-working salesperson — it should never sleep, never fumble a question and never look slow. We build fast, mobile-first sites designed around one job: turning a click into a booked enquiry.",
    who: "Perfect for businesses with no site, or one that's dated, slow or simply not bringing in work.",
  },
  "ai-chatbots": {
    longer:
      "Most leads are lost in the gap between someone reaching out and someone replying. Your AI assistant closes that gap — answering questions, qualifying the lead and booking the job straight into your calendar, day or night.",
    who: "Ideal if you miss calls while on the job, or want every enquiry captured without hiring more staff.",
  },
  "paid-ads": {
    longer:
      "When you need leads now, ads deliver. We build and manage Google and Meta campaigns focused on one metric that matters — qualified enquiries at a cost that pays you back — with clear, honest reporting.",
    who: "Built for businesses ready to invest in predictable, on-demand lead flow rather than waiting on word of mouth.",
  },
};

export default function ServicesPage() {
  return (
    <>
      <JsonLd data={servicesSchema()} />
      <JsonLd data={breadcrumb([{ name: "Services", path: "/services" }])} />
      <PageHeader
        title={
          <>
            Everything you need to grow,{" "}
            <span className="text-gradient">under one roof.</span>
          </>
        }
        lead="Three services, one team, one plan. No juggling agencies, no finger-pointing — just a growth engine built around your business."
      />

      <section className="pb-28 sm:pb-36">
        <Container>
          <div className="flex flex-col gap-6">
            {services.map((service, i) => {
              const Icon = icons[service.id as keyof typeof icons];
              const isTeal = service.accent === "teal";
              const d = detail[service.id];
              return (
                <Reveal key={service.id} delay={i * 0.04}>
                  <GlowCard
                    customSize
                    glowColor={isTeal ? "green" : "blue"}
                    className="grid w-full !p-8 sm:!p-12 md:grid-cols-[auto_1fr]"
                  >
                    <div
                      className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-line ${
                        isTeal ? "bg-brand-teal/10 text-brand-teal" : "bg-brand-blue/10 text-brand-blue-light"
                      }`}
                    >
                      <Icon className="h-8 w-8" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="font-display text-3xl font-semibold text-foreground">
                          {service.name}
                        </h2>
                        <span className="rounded-full border border-line bg-ink-3 px-3 py-1 text-xs font-medium uppercase tracking-widest text-mist-dim">
                          {service.tag}
                        </span>
                      </div>
                      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-mist">
                        {d.longer}
                      </p>
                      <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                        {service.points.map((point) => (
                          <li
                            key={point}
                            className="flex items-center gap-3 text-sm text-mist"
                          >
                            <Check
                              className={`h-4 w-4 shrink-0 ${
                                isTeal ? "text-brand-teal" : "text-brand-blue-light"
                              }`}
                            />
                            {point}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-6 border-l-2 border-brand-blue/40 pl-4 text-sm italic text-mist-dim">
                        {d.who}
                      </p>
                    </div>
                  </GlowCard>
                </Reveal>
              );
            })}
          </div>

          <Reveal delay={0.1}>
            <div className="mt-10 flex flex-col items-center gap-3 rounded-3xl border border-line bg-gradient-to-r from-brand-blue/10 to-brand-teal/10 px-8 py-10 text-center">
              <p className="font-display text-2xl font-semibold text-foreground">
                Most clients combine all three — that&apos;s why we built packages.
              </p>
              {/* Link, not <a>: a raw anchor to an internal route does a FULL PAGE RELOAD,
                  which bypasses the view transition entirely (and throws away the client
                  cache). This was the only internal navigation still doing that. */}
              <Link
                href="/pricing"
                className="cta-type group -my-1.5 inline-flex items-center gap-2 py-1.5 text-sm font-medium text-brand-blue-light transition-colors hover:text-brand-blue"
              >
                See pricing
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </Reveal>
        </Container>
      </section>

      <CTA />
    </>
  );
}
