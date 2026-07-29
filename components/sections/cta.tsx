import { ArrowUpRight, Phone } from "lucide-react";
import { Container } from "@/components/ui/section";
import { Reveal } from "@/components/reveal";
import { CalButton } from "@/components/cal";
import { site } from "@/lib/site";

export function CTA({
  forceVisible = false,
  decorations = true,
}: {
  forceVisible?: boolean;
  /** Ambient orbs + grid overlay. Set false when this renders INSIDE the 3D MacBook screen:
   *  the orbs are 80px-blurred AND animated, so under a per-frame-animating transform the
   *  browser re-rasterizes both blur filters every single frame, which tanks the framerate. */
  decorations?: boolean;
}) {
  return (
    <section className="relative overflow-hidden py-28 sm:py-36">
      {decorations && (
        <>
          {/* Ambient orbs */}
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="orb orb-blue absolute left-1/3 top-1/4 h-[500px] w-[500px] opacity-35" />
            <div className="orb orb-teal absolute right-1/4 bottom-0 h-[400px] w-[400px] opacity-25" />
          </div>
          <div className="absolute inset-0 -z-10 bg-grid bg-grid-fade opacity-40" />
        </>
      )}

      <Container>
        <Reveal direction="scale" forceVisible={forceVisible}>
          <div className="border-gradient mx-auto flex max-w-4xl flex-col items-center gap-7 overflow-hidden rounded-[2rem] bg-ink-2 px-6 py-16 text-center backdrop-blur-sm shadow-[0_0_80px_-24px_rgba(44,135,208,0.3)] sm:px-16">
            {/* Urgency badge */}
            <span className="inline-flex items-center gap-2.5 rounded-full border border-line bg-ink-3 px-4 py-1.5 text-xs font-medium text-mist backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-brand-teal opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-teal" />
              </span>
              Only a few onboarding spots left this month
            </span>

            <h2 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Ready to get your{" "}
              <span className="text-gradient">phone ringing?</span>
            </h2>

            <p className="max-w-xl text-lg leading-relaxed text-mist">
              Book a free 30-minute discovery call. We&apos;ll show you exactly
              where you&apos;re losing leads — and how we&apos;d fix it. No hard
              sell, just a plan.
            </p>

            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <CalButton className="bg-gradient-brand group inline-flex h-14 items-center justify-center gap-2 rounded-full px-8 text-base font-semibold text-white shadow-[0_8px_30px_-8px_rgba(44,135,208,0.6)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_-8px_rgba(25,176,161,0.7)]">
                Book Your Free Call
                <ArrowUpRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </CalButton>

              <a
                href={site.phoneHref}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-line bg-ink-3 px-8 text-base font-medium text-foreground backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-blue/40 hover:bg-ink-4"
              >
                <Phone className="h-5 w-5 text-brand-teal" />
                {site.phone}
              </a>
            </div>

            <p className="text-xs text-mist-dim">
              Free 30-minute call · No obligation · Results-focused
            </p>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
