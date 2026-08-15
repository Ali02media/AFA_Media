import { Phone } from "lucide-react";
import { Container } from "@/components/ui/section";
import { Reveal } from "@/components/reveal";
import { BookingCalendar } from "@/components/booking-calendar";
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
        <Reveal direction="up" forceVisible={forceVisible}>
          <div className="border-gradient mx-auto flex max-w-6xl flex-col items-center gap-7 overflow-hidden rounded-[2rem] bg-ink-2 px-4 py-16 text-center backdrop-blur-sm shadow-[0_0_80px_-24px_rgba(44,135,208,0.3)] sm:px-10">
            <h2 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Ready to get your{" "}
              <span className="text-gradient">phone ringing?</span>
            </h2>

            <p className="max-w-xl text-lg leading-relaxed text-mist">
              Pick a time below for your free 30-minute discovery call. We&apos;ll
              show you exactly where you&apos;re losing leads — and how we&apos;d
              fix it. No hard sell, just a plan.
            </p>

            {/* Inline booking calendar — customers book straight from the page, no click-through
                to a popup. Reuses BookingCalendar (the site's single Cal.com inline embed, wired
                through the one shared bootstrap in components/cal.tsx) rather than a second raw
                embed script, so there's only ever one Cal init on the page. White framed card so
                the (light-themed) calendar reads as a distinct surface on the bg-ink-2 panel. */}
            {/* Full width (not max-w-3xl): Cal's month_view only lays out as the WIDE 3-column
                form — profile | month grid | time slots side by side — above ~900px. Narrower,
                it collapses to the tall stacked layout. The card is now max-w-6xl so the embed
                gets the width it needs to render wide-and-short instead of narrow-and-long. */}
            <div className="w-full overflow-hidden rounded-2xl border border-line bg-white shadow-xl">
              {/* height auto, not a fixed px: Cal auto-resizes its iframe to content (and grows
                  again when a day is picked and the slot panel opens). A fixed height with the
                  embed's overflow:hidden clipped the bottom of the calendar. minHeight just
                  reserves space so there's no layout jump before the iframe reports its size. */}
              <BookingCalendar style={{ height: "auto", minHeight: 560 }} />
            </div>

            <a
              href={site.phoneHref}
              className="-my-1.5 inline-flex items-center gap-2 py-1.5 text-sm font-medium text-mist transition-colors hover:text-foreground"
            >
              <Phone className="h-4 w-4 text-brand-teal" />
              Prefer to talk? {site.phone}
            </a>

            <p className="text-xs text-mist-dim">
              Free 30-minute call · No obligation · Results-focused
            </p>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
