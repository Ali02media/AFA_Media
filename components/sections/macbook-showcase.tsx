'use client';

import { useRef, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import MacbookScene, { SCREEN_W } from "@/components/MacbookScene";
import { ServicesSection } from "@/components/sections/services-section";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// ─────────────────────────────────────────────────────────────────────────────
// NATIVE-STICKY PINNING (replaces GSAP `pin`)
//
// The one-frame vertical jerk on first downward entry was GSAP's pin swapping the
// box position:relative→fixed at engage (and, with pinType:"transform", a per-scroll
// bounce instead). Native `position: sticky` has NEITHER a position swap NOR a JS
// transform — the browser keeps the element stuck at top:0 with no discrete state
// change — so neither artifact can occur.
//
// GSAP still drives PROGRESS (scrub) and the pinned↔unpinned state for the portal
// handoff, but no longer pins. The section provides its own scroll length via a CSS
// spacer instead of GSAP's pin-spacer.
//
// Layout (desktop, hero above is exactly 100vh so the section top sits at document y=100vh):
//   stage   : [100vh, 200vh]  position:sticky top:0 — canvas + overlay. In flow (slides
//                             up) during the approach, then sticks at the viewport top.
//   spacer  : [200vh, 500vh]  300vh of empty scroll track = the 4×100vh stick range.
//   flowSlot: [500vh,   …  ]  ServicesSection as normal page content AFTER the animation.
//
// ScrollTrigger start:'top top' (progress 0 at scrollY=100vh) end:'+=400vh' (progress 1
// at scrollY=500vh). At scrollY=500vh the flowSlot top is exactly at the viewport top —
// the same place the 1:1-projected 3D content sits — so switching the single
// ServicesSection instance from the 3D screen into the flowSlot there is seamless.
// ─────────────────────────────────────────────────────────────────────────────

export function MacbookShowcase() {
  const sectionRef  = useRef<HTMLElement>(null);
  const stageRef    = useRef<HTMLDivElement>(null);
  const flowRef     = useRef<HTMLDivElement>(null);
  const overlayRef  = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const triggerRef  = useRef<ScrollTrigger | null>(null);
  const invalidateRef = useRef<(() => void) | null>(null);

  const [screenEl, setScreenEl] = useState<HTMLDivElement | null>(null);
  // `desktop` = the animated/sticky path is in play (min-width:1024px). Drives LAYOUT
  // (sticky stage + spacer + flow slot). Stays true for the whole desktop session.
  const [desktop, setDesktop] = useState(false);
  // `pinned` = the 3D screen is the current home of the ServicesSection. Drives the PORTAL
  // target, the canvas `active` flag, and the overlay. The handoff is driven by the ZOOM's
  // own completion (see handleZoomProgress), not the scroll line.
  const [pinned, setPinned] = useState(true);

  // Mirror `pinned`/`desktop` in refs so the every-frame zoom callback can read + flip them
  // without going stale between renders.
  const pinnedRef  = useRef(true);
  const desktopRef = useRef(false);

  const handleZoomProgress = useCallback((rawZoom: number) => {
    if (overlayRef.current) {
      overlayRef.current.style.opacity = String(Math.max(0, 1 - rawZoom / 0.7));
    }
  }, []);

  // The pinned↔flow handoff, driven by RAW SCROLL PROGRESS. Called from ScrollTrigger.onUpdate
  // (fires on every scroll tick) — NOT from the canvas frame callback. While unpinned the
  // frameloop is "demand", so the frame callback runs sparsely and caught the re-pin threshold
  // late (scroll had already carried the content ~77px past the seam → the jump on the way UP).
  // onUpdate tracks scroll directly, so unpin (down) and re-pin (up) both fire right at the
  // seam. Tiny 0.0005 scroll band; can't drift-flip since it's a pure function of scroll.
  const applyHandoff = useCallback((p: number) => {
    if (pinnedRef.current) {
      if (p >= 0.998) { pinnedRef.current = false; setPinned(false); }
    } else {
      if (p <= 0.9975) { pinnedRef.current = true; setPinned(true); }
    }
  }, []);

  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add('(min-width: 1024px)', () => {
      setDesktop(true); desktopRef.current = true;
      setPinned(true);  pinnedRef.current  = true;
      const st = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: () => '+=' + window.innerHeight * 4,
        // NO `pin` and NO `pinType`. The stage is pinned by CSS `position: sticky`, which
        // has no relative→fixed swap (the one-frame jerk) and no per-scroll JS transform
        // (the bounce pinType:"transform" caused). GSAP is used here purely to map scroll
        // → progress. The pinned↔flow handoff is driven by the ZOOM's completion in
        // handleZoomProgress (NOT onLeave/onEnterBack), so it never swaps mid-zoom.
        scrub: true,
        // Instant scrub: progress tracks scroll directly; the visible glide comes from
        // MacbookScene's own per-frame `displayedP` smoothing. invalidate() keeps the
        // demand-loop drawing while scrolling so the zoom (and thus the handoff) advances.
        onUpdate: (self) => { progressRef.current = self.progress; invalidateRef.current?.(); applyHandoff(self.progress); },
      });
      triggerRef.current = st;
      return () => { st.kill(); triggerRef.current = null; };
    });

    mm.add('(max-width: 1023.98px)', () => {
      setDesktop(false); desktopRef.current = false;
      progressRef.current = 0.38;
      setPinned(false);  pinnedRef.current  = false;
    });

    return () => mm.revert();
  }, { scope: sectionRef });

  // Refresh once fonts settle so start/end reflect final metrics — but never while the
  // trigger is already active (mid-scroll), which would shift what the current scroll maps
  // to. The `?.` guards `.then` too, so a missing document.fonts can't throw.
  useEffect(() => {
    document.fonts?.ready?.then(() => {
      const t = triggerRef.current;
      if (!t || t.isActive) return;
      t.refresh();
    }).catch(() => {});
  }, []);

  // ONE ServicesSection instance in ONE stable host node. React renders into `host` and the
  // host NEVER changes, so the ServicesSection never unmounts/remounts. To move the content
  // between the 3D screen (while pinned) and the flow slot (after), we physically re-parent
  // the host DOM node with appendChild — a pure DOM move that React doesn't even see, so the
  // heavy card subtree isn't rebuilt. (createPortal with a CHANGING container instead remounts
  // its whole subtree; rebuilding all the cards in one frame dropped that frame — the handoff
  // "missing frames"/teleport. Moving one node costs nothing.)
  // Create the host AFTER mount (in an effect, not during render) so the first client render
  // matches the server (both render no portal) — creating it during render caused a hydration
  // mismatch. Held in state so its creation triggers the re-render that mounts the portal.
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  useEffect(() => { setHost(document.createElement('div')); }, []);

  useEffect(() => {
    const target = pinned ? screenEl : (desktop ? flowRef.current : stageRef.current);
    if (host && target && host.parentNode !== target) target.appendChild(host);
  }, [host, pinned, screenEl, desktop]);

  return (
    <section ref={sectionRef} className="relative">
      {/* STAGE — sticky on desktop (canvas + overlay), plain flow container on mobile. */}
      <div
        ref={stageRef}
        // pointer-events-none on desktop: after the handoff the (now invisible) stage still
        // overlaps the top of the flow ServicesSection for the tail of its stick range, so
        // let clicks/hover pass through to the real cards below. Mobile keeps events (the
        // section lives in the stage there and its cards are interactive).
        className={desktop ? "sticky top-0 h-screen w-full overflow-hidden pointer-events-none" : "relative w-full"}
      >
        <MacbookScene
          // Full-bleed inside the stage on desktop; absolute overlay on mobile (unchanged
          // from before). `h-screen` in both keeps the canvas a constant viewport height so
          // R3F's size never changes across the boundary (drei's <Html> scale stays correct).
          className={desktop ? "h-screen w-full" : "absolute top-0 left-0 h-screen w-full pointer-events-none"}
          progressRef={progressRef}
          onZoomProgress={handleZoomProgress}
          onScreenContainerRef={setScreenEl}
          invalidateRef={invalidateRef}
          active={desktop && pinned}
        />

        {desktop && pinned && (
          /* Corner instrument-panel text */
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
                scroll to find out what we do
              </span>
            </div>
          </div>
        )}
      </div>

      {/* SCROLL TRACK — 300vh of empty space that pushes the flow slot down so its top lands
          at the viewport top exactly when progress hits 1 (scrollY = 500vh). Desktop only. */}
      {desktop && <div aria-hidden style={{ height: '300vh' }} />}

      {/* FLOW SLOT — ServicesSection as ordinary page content once the animation is done.
          `min-h-screen` is LOAD-BEARING: while pinned the ServicesSection lives in the 3D
          screen, so this slot is EMPTY — without a reserved height the section would be only
          400vh and the sticky stage would release at ~75% of the zoom (and the 3D content
          would scroll away before the flow copy arrived → the "half-scroll" + "repeat" bugs).
          Reserving 100vh keeps the section 500vh so the stage stays stuck through the FULL
          zoom, then the single instance swaps in-place here at the viewport top — seamless.
          NOT positioned (no `relative`): a positioned slot would paint OVER the stuck stage
          and bleed white across the laptop late in the zoom; static paints safely behind it.
          Desktop only; on mobile the section lives in the stage above (see portalTarget). */}
      {desktop && <div ref={flowRef} className="w-full min-h-screen" />}

      {host && createPortal(
        <div style={pinned ? { width: SCREEN_W, pointerEvents: 'none' } : undefined}>
          {/* Glow ON even inside the 3D screen (cardsInteractive always). Blur only in the
              flat state — inside the 3D screen the transform animates during the zoom and a
              backdrop-blur would re-raster every frame and tank the framerate. */}
          <ServicesSection forceVisible cardsInteractive cardsBlur={!pinned} />
        </div>,
        host,
      )}
    </section>
  );
}
