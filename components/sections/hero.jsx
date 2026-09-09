'use client';

import dynamic from 'next/dynamic';
import { ShinyButton } from '../ui/shiny-button';
import { LaserFlowCSS } from '../LaserFlowCSS';
import { calAttrs } from '../cal';
import { useEffect, useRef, useState } from 'react';

// Dynamic, client-only import: three.js is a large dependency, so keeping it out of the
// initial bundle is a direct TTI win. The chunk isn't even requested until laserReady flips
// true and <LaserFlow> first renders — so on initial load the browser never downloads,
// parses, or compiles three.js at all.
const LaserFlow = dynamic(() => import('../LaserFlow'), { ssr: false });

// Homepage hero: a descending laser beam, with a spotlight that reveals a node graph image
// where the pointer is.
export function Hero() {
  const revealImgRef = useRef(null);
  // WebGL is desktop-only now. Both start false so server and first client render agree,
  // and so a phone never even evaluates the WebGL branch.
  const [desktopGfx, setDesktopGfx] = useState(false);
  // Defer LaserFlow's WebGL boot until AFTER the page is interactive (perf: TTI). The shader
  // compile + GL init run on the main thread and were the single biggest blocker of
  // time-to-interactive; <LaserFlowCSS> covers the gap from the very first frame.
  const [laserReady, setLaserReady] = useState(false);
  const showWebGL = desktopGfx && laserReady;
  // rAF coalescing for the reveal spotlight (perf 4.2). Mousemove fires up to ~120x/sec and
  // each write invalidated a FULL-VIEWPORT layer that is both radial-masked and
  // mix-blend-mode: lighten — so the compositor had to read back the backdrop and
  // re-rasterise the mask on every event, on top of the WebGL canvases already rendering in
  // the same hero. Storing the latest position and writing once per frame collapses that to
  // at most one repaint per frame.
  const pendingRef = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    setDesktopGfx(mq.matches);
    const onChange = (e) => setDesktopGfx(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    // MOBILE / TABLET: LaserFlow is gated behind desktopGfx in the JSX below and never
    // renders on <1024px anyway, so there is nothing to schedule and no reason to attach
    // interaction listeners that would only trigger a wasted re-render. Bail early so mobile
    // pays zero cost for a feature it can't see.
    if (!desktopGfx) return;

    // DESKTOP: wait for the FIRST user interaction (pointer / scroll / key / touch) OR a
    // 5-second safety timeout — whichever fires first. Lighthouse's TBT window closes at TTI,
    // which is declared once the main thread has been quiet for 5s after FCP; a lab run never
    // interacts, so on that path the shader boots AFTER TTI and contributes zero to TBT.
    // Real visitors trigger it the moment they move the mouse or start scrolling, so they
    // never notice the deferral — before that the CSS rendition is already painting the
    // exact same beam, so there's nothing to wait for visually.
    let handle;
    let done = false;
    const events = ['pointerdown', 'pointermove', 'scroll', 'keydown', 'touchstart'];
    const trigger = () => {
      if (done) return;
      done = true;
      setLaserReady(true);
      clearTimeout(handle);
      events.forEach(e => window.removeEventListener(e, trigger));
    };
    const start = () => {
      handle = window.setTimeout(trigger, 5000);
      events.forEach(e =>
        window.addEventListener(e, trigger, { once: true, passive: true })
      );
    };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
    return () => {
      done = true;
      clearTimeout(handle);
      events.forEach(e => window.removeEventListener(e, trigger));
      window.removeEventListener('load', start);
    };
  }, [desktopGfx]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const flush = () => {
    rafRef.current = 0;
    const el = revealImgRef.current;
    const p = pendingRef.current;
    if (!el || !p) return;
    el.style.setProperty('--mx', `${p.x}px`);
    el.style.setProperty('--my', `${p.y}px`);
  };

  const queue = (x, y) => {
    pendingRef.current = { x, y };
    if (!rafRef.current) rafRef.current = requestAnimationFrame(flush);
  };

  return (
    <div
      style={{
        // svh, not vh (Bug 29): on mobile the URL bar collapses as you scroll, which changes
        // 100vh mid-scroll — the hero resized under the reader and shifted every section
        // below it, a layout shift on the LCP element. 100svh is the stable small-viewport
        // height. (No vh fallback: duplicate keys in a style object don't cascade, the last
        // one simply wins. svh is baseline — Safari 15.4+, Chrome 108+, Firefox 101+.)
        height: '100svh',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'var(--color-hero-bg)'
      }}
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        queue(e.clientX - rect.left, e.clientY - rect.top);
      }}
      onPointerLeave={() => queue(-9999, -9999)}
    >
      {/* CSS rendition of the laser — beam, floor splash, drifting fog and wisps built
          from gradients measured off the shader itself. It paints on the first frame and
          costs no JS at all, so on phones and tablets it is the ONLY thing that runs:
          even at 0.6 dpr the real shader was blocking the main thread for ~22s on a
          mid-range Android, which alone held the mobile PageSpeed score at 63.
          On desktop it doubles as the instant first paint, then fades as WebGL mounts. */}
      <LaserFlowCSS
        style={{
          zIndex: 1,
          opacity: showWebGL ? 0 : 1,
          transition: 'opacity 0.5s ease'
        }}
      />

      {showWebGL && (
        <LaserFlow
          style={{ position: 'relative', zIndex: 2 }}
          dpr={1}
          horizontalBeamOffset={0.14}
          verticalBeamOffset={-0.5}
          color="#42b5cf"
          horizontalSizing={0.91}
          verticalSizing={15}
          wispDensity={1}
          wispSpeed={19.5}
          wispIntensity={1.4}
          flowSpeed={0.22}
          flowStrength={0.16}
          fogIntensity={0.54}
          fogScale={0.12}
          fogFallSpeed={0.43}
          decay={1.06}
          falloffStart={1.82}
        />
      )}

      <div style={{
        position: 'absolute',
        top: '22vh',
        left: '8%',
        // min(640px, 84vw): on desktop it's 640px; on a 360px phone it becomes 84vw so the
        // block fits (8% left + 84% width) instead of running off the right edge and being
        // clipped by the hero's overflow:hidden.
        maxWidth: 'min(640px, 84vw)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        zIndex: 6
      }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.5rem, 5vw, 4rem)',
          fontWeight: 700,
          lineHeight: 1.1,
          color: 'var(--color-hero-fg)',
          maxWidth: '20ch',
          margin: 0,
          // Subtle shadow so text stays readable where the bright laser beam passes behind it.
          textShadow: '0 2px 24px rgba(0,0,0,0.55)'
        }}>
          Your phone ringing again — in 20 days.
        </h1>
        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '1.2rem',
          lineHeight: 1.6,
          color: '#dfe2ec',
          maxWidth: '42ch',
          marginTop: '1.5rem',
          textShadow: '0 1px 18px rgba(0,0,0,0.65)'
        }}>
          AI chatbots that capture every lead, ads that target only buyers ready to book, and a site built to convert — not a digital brochure. Live in 20 days, or you don&apos;t pay the setup.
        </p>
        {/* Primary + secondary CTA pair. `flexWrap` so they stack rather than overflow on
            narrow screens. White pill first (Book a Call), dark pill second (Our Philosophy). */}
        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Primary: opens the Cal booking modal, same as every other "Book a Call" on the
              site — calAttrs are the data-cal-* attributes embed.js binds globally. */}
          <ShinyButton variant="light" {...calAttrs}>Book a Call</ShinyButton>

          {/* Secondary: default (dark) variant, navigates to /philosophy so it gets the page
              transition. */}
          <ShinyButton href="/philosophy">
            Our Philosophy
          </ShinyButton>
        </div>
      </div>

      <img
        ref={revealImgRef}
        // Perf 4.7: WebP, 175KB → 51KB (same 1521x722, alpha preserved). Kept as a plain
        // <img> rather than next/image because the ref drives the reveal mask and the layer
        // is mix-blend-mode composited — next/image's wrapper markup would change both.
        src="/node-image-full.webp"
        // Bug 30: purely decorative (pointer-events:none, a blend-mode overlay), so it must
        // not be announced. Was alt="Reveal effect".
        alt=""
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          top: 0,
          left: 0,
          zIndex: 5,
          mixBlendMode: 'lighten',
          opacity: 0.3,
          pointerEvents: 'none',
          '--mx': '-9999px',
          '--my': '-9999px',
          WebkitMaskImage: 'radial-gradient(circle at var(--mx) var(--my), rgba(255,255,255,1) 0px, rgba(255,255,255,0.95) 60px, rgba(255,255,255,0.6) 120px, rgba(255,255,255,0.25) 180px, rgba(255,255,255,0) 240px)',
          maskImage: 'radial-gradient(circle at var(--mx) var(--my), rgba(255,255,255,1) 0px, rgba(255,255,255,0.95) 60px, rgba(255,255,255,0.6) 120px, rgba(255,255,255,0.25) 180px, rgba(255,255,255,0) 240px)',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat'
        }}
      />
    </div>
  );
}

