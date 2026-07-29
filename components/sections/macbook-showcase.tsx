'use client';

import { useRef, useState, useCallback, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import MacbookScene from "@/components/MacbookScene";
import { BookingCalendar } from "@/components/booking-calendar";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// ─────────────────────────────────────────────────────────────────────────────
// DISSOLVE-TO-REVEAL MACBOOK  →  live booking calendar
//
// Every previous version put content (services, then the CTA) INSIDE the 3D screen and had to
// hand it off to a flat copy — and that handoff was the entire source of the jitter: the 3D
// content is viewport-anchored (rock-stable) while a flat copy is document-anchored, so under
// coarse scroll ticks the two never lined up. A live calendar makes that impossible anyway: an
// iframe can't be clicked/scrolled reliably through a 3D transform.
//
// So nothing lives in the screen now. The Cal.com calendar is ORDINARY flat document flow,
// sitting BEHIND the sticky 3D stage. As you scroll, the MacBook zooms and its chassis fades to
// opacity 0 — dissolving away to reveal the calendar underneath, already at the viewport top and
// fully interactive. The calendar is never repositioned by JS, so there is nothing to bounce,
// and because it's a normal iframe (no transform over it — the stage is pointer-events-none) it
// clicks and scrolls perfectly.
//
// Layout (desktop; hero above is exactly 100vh so the section top sits at document y=100vh):
//   stage    : sticky top:0, h-screen — the 3D MacBook (zooms + chassis fades). Transparent and
//              pointer-events-none once faded, so it never blocks the calendar behind it.
//   spacer   : 300vh — maps ScrollTrigger progress 0→1 over the zoom, so the calendar's top
//              reaches the viewport top exactly as the chassis finishes dissolving (p=1).
//   calendar : flat flow, min-h-screen — the reveal target AND it keeps the section tall enough
//              that the sticky stage stays stuck through p=1 instead of releasing mid-zoom.
// ─────────────────────────────────────────────────────────────────────────────

export function MacbookShowcase() {
  const sectionRef  = useRef<HTMLElement>(null);
  const overlayRef  = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const triggerRef  = useRef<ScrollTrigger | null>(null);
  const invalidateRef = useRef<(() => void) | null>(null);

  // `desktop` = the animated path is in play (min-width:1024px). `null` until matchMedia resolves.
  const [desktop, setDesktop] = useState<boolean | null>(null);
  // `inView` gates the R3F frameloop: render while the section is on screen, idle otherwise.
  const [inView, setInView] = useState(false);

  const handleZoomProgress = useCallback((rawZoom: number) => {
    if (overlayRef.current) {
      overlayRef.current.style.opacity = String(Math.max(0, 1 - rawZoom / 0.7));
    }
  }, []);

  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add('(min-width: 1024px)', () => {
      setDesktop(true);
      const st = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: () => '+=' + window.innerHeight * 4,
        scrub: true,
        onUpdate: (self) => { progressRef.current = self.progress; invalidateRef.current?.(); },
      });
      triggerRef.current = st;
      return () => { st.kill(); triggerRef.current = null; };
    });

    mm.add('(max-width: 1023.98px)', () => {
      setDesktop(false);
      progressRef.current = 0.38;
    });

    return () => mm.revert();
  }, { scope: sectionRef });

  // Keep the frameloop alive only while the section is near/in the viewport.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: '200px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Refresh once fonts settle so start/end reflect final metrics — but never mid-scroll.
  useEffect(() => {
    document.fonts?.ready?.then(() => {
      const t = triggerRef.current;
      if (!t || t.isActive) return;
      t.refresh();
    }).catch(() => {});
  }, []);

  // MOBILE: no zoom stage — just show the flat calendar.
  if (desktop === false) {
    return (
      <section ref={sectionRef} className="relative">
        <div className="mx-auto w-full max-w-4xl px-4 py-16">
          <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-xl">
            <BookingCalendar style={{ height: 620 }} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="relative">
      {/* STAGE — sticky 3D MacBook that zooms and dissolves. pointer-events-none so the calendar
          revealed behind it stays fully clickable/scrollable. Rendered only on desktop. */}
      {desktop && (
        <div className="pointer-events-none sticky top-0 z-10 h-screen w-full overflow-hidden">
          <MacbookScene
            className="h-screen w-full"
            progressRef={progressRef}
            onZoomProgress={handleZoomProgress}
            onScreenContainerRef={() => {}}
            invalidateRef={invalidateRef}
            active={desktop === true && inView}
          />

          {/* Corner instrument-panel text — fades out as the zoom begins (handleZoomProgress). */}
          <div
            ref={overlayRef}
            className="pointer-events-none absolute inset-0 flex flex-col justify-between px-10 py-10 lg:px-14 lg:py-12"
          >
            <div className="flex justify-end">
              <span
                className="font-mono uppercase text-neutral-500 leading-none"
                style={{ fontSize: '13px', letterSpacing: '0.22em' }}
              >
                Where urgency
              </span>
            </div>

            <div className="flex flex-col items-start" style={{ gap: '10px' }}>
              <span
                className="font-mono uppercase text-neutral-500 leading-none"
                style={{ fontSize: '13px', letterSpacing: '0.22em' }}
              >
                Meets opportunity
              </span>
              <span
                className="font-mono uppercase text-neutral-400 leading-none"
                style={{ fontSize: '10px', letterSpacing: '0.18em' }}
              >
                scroll to book your call
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SCROLL TRACK — 300vh maps progress 0→1, so the calendar below reaches the viewport top
          exactly at p=1, right as the chassis finishes fading. Desktop only. */}
      {desktop && <div aria-hidden style={{ height: '300vh' }} />}

      {/* FLAT BOOKING CALENDAR — ordinary document flow, BEHIND the stage (z-0 < stage z-10), so
          the dissolving MacBook reveals it. min-h-screen keeps the section tall enough that the
          sticky stage holds through p=1. Centred; the card gives it a screen-like frame. */}
      <div className="relative z-0 flex min-h-screen w-full items-center justify-center px-4 pb-24">
        <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-line bg-white shadow-2xl">
          <BookingCalendar style={{ height: 680 }} />
        </div>
      </div>
    </section>
  );
}
