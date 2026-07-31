'use client';

import { useRef, useState, useCallback, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import MacbookScene from "@/components/MacbookScene";
import { BookingCalendar } from "@/components/booking-calendar";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// ─────────────────────────────────────────────────────────────────────────────────────────
// DISSOLVE-TO-REVEAL MACBOOK  →  live booking calendar
//
// Nothing lives inside the 3D screen. The Cal.com calendar is ORDINARY flat document flow
// sitting BEHIND the sticky 3D stage; the MacBook zooms in and its canvas fades to opacity 0,
// dissolving away to reveal the calendar underneath — already in place and fully interactive.
//
// This is deliberate, and it is why the section no longer jitters. Every earlier version put
// content INSIDE the 3D screen and had to hand it off to a flat copy at the end: 3D content is
// viewport-anchored while a flat copy is document-anchored, so under coarse scroll ticks
// (reduced-motion, mouse wheel) the two could never line up. Here the calendar is never
// repositioned by JS at all, so there is nothing that CAN drift. A live calendar also can't
// live in the screen anyway — an iframe can't be clicked or scrolled through a 3D transform.
//
// ── Geometry (desktop) ────────────────────────────────────────────────────────────────────
//   stage    : sticky top:0, h-screen — the 3D MacBook. pointer-events-none so the calendar
//              behind it is clickable even before the canvas has finished fading.
//   spacer    : SPACER_VH — pure scroll track.
//   calendar : the reveal target, at least REVEAL_MIN_VH tall.
//
// The stage stays stuck until (sectionHeight − 100vh) of scrolling, i.e. for SPACER_VH +
// (calendar height). The zoom needs ZOOM_VH. These MUST satisfy spacer + calendar ≥ zoom or
// the stage releases mid-zoom and the section visibly skips — so SPACER_VH is DERIVED from
// the other two rather than being a third independent number that has to happen to match
// (Bug 7). If the calendar box grows taller than its minimum on a short viewport, the sum only
// gets larger, which is safe: the stage simply holds a beat longer before releasing.
//
// NOTE: `start: 'top top'` is element-relative, so all of this is independent of where the
// section sits in the page (Bug 25). It is currently tenth, far below the hero — do not
// "correct" the page order on account of this comment.
// ─────────────────────────────────────────────────────────────────────────────────────────

/** Viewport-heights of scrolling that ScrollTrigger maps to zoom progress 0→1. */
const ZOOM_VH = 4;
/** Minimum height of the calendar box, in viewport heights. */
const REVEAL_MIN_VH = 1;
/** Scroll track between the stage and the calendar. Derived — see note above. */
const SPACER_VH = ZOOM_VH - REVEAL_MIN_VH;

/** Fixed navbar height (`h-16` in navbar.tsx). The calendar centres itself in the space BELOW
 *  it, and MacbookScene's zoom endpoint centres the laptop screen in that same box, so the
 *  dissolve lands on target at any viewport height (Bugs 6 + 18). Previously the calendar was
 *  centred in the FULL viewport with a pb-24, which put its top at (100vh − 96 − 680) / 2 —
 *  62px at a 900px-tall window, i.e. underneath the 64px navbar, and drifting 200px between
 *  short and tall screens while the camera framing stayed fixed. */
const NAV_H = 64;

/** Rendered height of the Cal embed. Reserved up-front so its async load doesn't reflow the
 *  page (see the ResizeObserver below for the case where Cal overrides it anyway). */
const CAL_H = 680;

export function MacbookShowcase() {
  const sectionRef  = useRef<HTMLElement>(null);
  const overlayRef  = useRef<HTMLDivElement>(null);
  const calBoxRef   = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const triggerRef  = useRef<ScrollTrigger | null>(null);
  const invalidateRef = useRef<(() => void) | null>(null);

  // `desktop` = the animated path is in play. `null` until matchMedia resolves, so the
  // first paint doesn't briefly commit to the wrong branch.
  const [desktop, setDesktop] = useState<boolean | null>(null);
  // Bug 19: the 3D zoom is JavaScript (GSAP + R3F), so the `prefers-reduced-motion` block in
  // globals.css — which only zeroes CSS animation/transition durations — never touched it. A
  // reduced-motion visitor got the single largest piece of motion on the site (a 400vh
  // scroll-driven 3D zoom) while every harmless CSS fade was disabled: backwards, and a
  // WCAG 2.3.3 problem. Checked reactively, not just on mount, so toggling the OS setting
  // takes effect without a reload.
  const [reduceMotion, setReduceMotion] = useState(false);
  // Drives the R3F frameloop. Perf 4.5: this used to track an IntersectionObserver on the
  // whole ~500vh section with a 200px rootMargin, so the canvas rendered every frame across
  // roughly 600vh of scrolling — including while the user sat still. ScrollTrigger's own
  // active range is exactly the window where the animation is actually moving.
  const [zooming, setZooming] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const handleZoomProgress = useCallback((rawZoom: number) => {
    if (overlayRef.current) {
      overlayRef.current.style.opacity = String(Math.max(0, 1 - rawZoom / 0.7));
    }
  }, []);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 1024px)', () => { setDesktop(true); });
    mm.add('(max-width: 1023.98px)', () => { setDesktop(false); progressRef.current = 0.38; });
    return () => mm.revert();
  }, { scope: sectionRef });

  // The ScrollTrigger itself only exists on the animated path.
  const animated = desktop === true && !reduceMotion;

  useGSAP(() => {
    if (!animated) return;
    const st = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top top',
      end: () => '+=' + window.innerHeight * ZOOM_VH,
      // Sticky CSS pins the stage — NOT GSAP's `pin`, which inserts a pin-spacer and issues a
      // scroll correction at first engage (the original one-frame jerk). GSAP only maps
      // scroll → progress; MacbookScene eases the zoom toward it every frame.
      scrub: true,
      onUpdate: (self) => { progressRef.current = self.progress; invalidateRef.current?.(); },
      onToggle: (self) => setZooming(self.isActive),
    });
    triggerRef.current = st;
    return () => { st.kill(); triggerRef.current = null; setZooming(false); };
  }, { scope: sectionRef, dependencies: [animated] });

  // Bug 4: the Cal.com embed injects an auto-resizing iframe AFTER first paint, and resizes
  // again on month navigation / slot view / breakpoint changes. Every one of those changes the
  // section's height, which invalidates ScrollTrigger's cached start/end and makes progress
  // jump — at a different scroll position on every reload, which is exactly the profile of a
  // "random" jitter. The previous handling was a single font-ready refresh that ALSO bailed
  // out via `if (t.isActive) return`, i.e. it was skipped precisely when the user was inside
  // the section. Watch the embed box directly instead and refresh whenever its size settles.
  useEffect(() => {
    const box = calBoxRef.current;
    if (!box) return;
    let t: ReturnType<typeof setTimeout>;
    let last = box.getBoundingClientRect().height;
    const ro = new ResizeObserver(([entry]) => {
      const h = entry.contentRect.height;
      if (Math.abs(h - last) < 1) return;
      last = h;
      clearTimeout(t);
      // Refresh even while the trigger is active — a stale range is worse than a refresh.
      t = setTimeout(() => ScrollTrigger.refresh(), 150);
    });
    ro.observe(box);
    return () => { clearTimeout(t); ro.disconnect(); };
  }, [animated]);

  // Refresh once fonts settle so start/end reflect final metrics.
  useEffect(() => {
    document.fonts?.ready?.then(() => ScrollTrigger.refresh()).catch(() => {});
  }, []);

  const calendar = (
    <div
      ref={calBoxRef}
      className="w-full max-w-4xl overflow-hidden rounded-2xl border border-line bg-white shadow-2xl"
    >
      <BookingCalendar style={{ height: CAL_H }} />
    </div>
  );

  // STATIC PATH — mobile, or any visitor who asked for reduced motion. Same calendar, no zoom.
  if (desktop === false || (desktop !== null && reduceMotion)) {
    return (
      <section ref={sectionRef} className="relative flex w-full justify-center px-4 py-16">
        {calendar}
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="relative">
      {/* STAGE — sticky 3D MacBook that zooms and dissolves. pointer-events-none so the
          calendar revealed behind it stays fully clickable and scrollable throughout. */}
      {desktop && (
        <div className="pointer-events-none sticky top-0 z-10 h-screen w-full overflow-hidden">
          <MacbookScene
            className="h-screen w-full"
            progressRef={progressRef}
            onZoomProgress={handleZoomProgress}
            invalidateRef={invalidateRef}
            active={zooming}
          />

          {/* Corner instrument-panel text — fades out as the zoom begins. */}
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

      {desktop && <div aria-hidden style={{ height: `${SPACER_VH * 100}vh` }} />}

      {/* FLAT BOOKING CALENDAR — ordinary document flow, BEHIND the stage (z-0 < z-10), so the
          dissolving MacBook reveals it. Centred in the space below the navbar, matching the
          zoom endpoint's framing (Bugs 6 + 18). */}
      <div
        className="relative z-0 flex w-full items-center justify-center px-4"
        style={{ minHeight: `${REVEAL_MIN_VH * 100}vh`, paddingTop: NAV_H }}
      >
        {calendar}
      </div>
    </section>
  );
}
