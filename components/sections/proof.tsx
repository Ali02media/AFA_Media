import { Quote, ShieldCheck } from "lucide-react";
import { Container, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/reveal";
import { testimonials } from "@/lib/site";

export function Proof() {
  return (
    <section className="relative py-28 sm:py-36">
      <Container>
        <Reveal>
          <SectionHeading
            title={
              <>
                Don&apos;t take our word for it.{" "}
                <span className="text-gradient">Take theirs.</span>
              </>
            }
          />
        </Reveal>

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {testimonials.map((t) => (
            <figure key={t.name} className="group relative h-full overflow-hidden rounded-3xl border border-line bg-ink-2 p-8 transition-all duration-300 hover:-translate-y-1 hover:border-brand-blue/25 hover:bg-ink-3 sm:p-10">
              <Quote className="h-8 w-8 text-brand-blue/40" />
                <blockquote className="mt-5 font-display text-xl leading-relaxed text-foreground sm:text-2xl">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-8 flex items-center gap-3 border-t border-line pt-6">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-brand font-display text-sm font-bold text-white">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-mist-dim">{t.role}</p>
                  </div>
                  <div
                    className="ml-auto flex gap-0.5 text-brand-teal"
                    role="img"
                    aria-label="Rated 5 out of 5"
                  >
                    {"★★★★★".split("").map((s, j) => (
                      <span key={j} aria-hidden="true" className="text-sm">{s}</span>
                    ))}
                  </div>
                </figcaption>
              </figure>
          ))}
        </div>

        <div className="border-gradient mt-8 flex flex-col items-center gap-5 overflow-hidden rounded-3xl bg-ink-2 px-8 py-10 text-center sm:flex-row sm:text-left">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-brand">
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="font-display text-xl font-semibold text-foreground">
                Our Founder&apos;s Guarantee
              </p>
              <p className="mt-1 text-mist">
                If your system isn&apos;t live on the timeline we agree — 20 days on
                Growth, 25 on Mastery — you don&apos;t pay for the setup. The risk is
                ours, not yours.
              </p>
            </div>
        </div>
      </Container>
    </section>
  );
}
