'use client';

import LaserFlow from '../LaserFlow';
import Plasma from '../Plasma';
import { ShinyButton } from '../ui/shiny-button';
import { useEffect, useRef, useState } from 'react';

// Homepage hero: a LaserFlow beam over an optional Plasma backdrop, with a spotlight that
// reveals a node graph image where the cursor is.
export function Hero() {
  const revealImgRef = useRef(null);
  // Desktop-only WebGL. Perf 4.3: LaserFlow had NO gate at all, so every phone ran a full
  // shader — while Plasma right beside it was deliberately excluded from mobile for exactly
  // that cost. Both are now behind the same check.
  const [desktopGfx, setDesktopGfx] = useState(false);
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
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        queue(e.clientX - rect.left, e.clientY - rect.top);
      }}
      onMouseLeave={() => queue(-9999, -9999)}
    >
      {desktopGfx && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
          <Plasma
            color="#298e99"
            speed={1.4}
            direction="reverse"
            scale={1.2}
            opacity={1}
            mouseInteractive={false}
          />
        </div>
      )}

      <LaserFlow
        style={{ position: 'relative', zIndex: 2 }}
        // Perf 4.3: LaserFlow IS the hero's identity, so it stays on mobile rather than being
        // cut like Plasma — but at a reduced tier. This is a full-viewport fragment shader, so
        // cost scales directly with pixel count; 0.6 dpr is ~36% of the fragments. Change to
        // `{desktopGfx && <LaserFlow …>}` if you'd rather drop it entirely on phones.
        dpr={desktopGfx ? 1 : 0.6}
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

      <div style={{
        position: 'absolute',
        top: '22vh',
        left: '8%',
        maxWidth: '640px',
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
          margin: 0
        }}>
          Your phone ringing again — in 30 days.
        </h1>
        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '1.125rem',
          lineHeight: 1.6,
          color: 'var(--color-hero-muted)',
          maxWidth: '42ch',
          marginTop: '1.5rem'
        }}>
          AI chatbots that capture every lead, ads that only target buyers ready to book paired with a beautiful site, not a digital brochure. — if it isn&apos;t setup within less than 30 days, you don&apos;t pay.
        </p>
        <div style={{ marginTop: '2rem' }}>
          {/* Bug E: this rendered with no onClick, so the hero's only CTA did nothing.
              Scrolls to the "From first call to live in 14 days" section, matching the label.
              `scroll-padding-top: 4rem` in globals.css keeps the heading clear of the fixed
              64px navbar; `behavior` respects the visitor's motion preference. */}
          <ShinyButton
            onClick={() => {
              const el = document.getElementById('process');
              if (!el) return;
              const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
              el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
            }}
          >
            See the Process
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

