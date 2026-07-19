'use client';

import LaserFlow from '../LaserFlow';
import Plasma from '../Plasma';
import { ShinyButton } from '../ui/shiny-button';
import { useEffect, useRef, useState } from 'react';

// NOTE: You can also adjust the variables in the shader for super detailed customization

// Image Example Interactive Reveal Effect
function LaserFlowBoxExample() {
  const revealImgRef = useRef(null);
  const [showPlasma, setShowPlasma] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    setShowPlasma(mq.matches);
    const onChange = (e) => setShowPlasma(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return (
    <div
      style={{
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#120F17'
      }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const el = revealImgRef.current;
        if (el) {
          el.style.setProperty('--mx', `${x}px`);
          el.style.setProperty('--my', `${y}px`);
        }
      }}
      onMouseLeave={() => {
        const el = revealImgRef.current;
        if (el) {
          el.style.setProperty('--mx', '-9999px');
          el.style.setProperty('--my', '-9999px');
        }
      }}
    >
      {showPlasma && (
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
          color: '#ffffff',
          maxWidth: '20ch',
          margin: 0
        }}>
          Your phone ringing again — in 30 days.
        </h1>
        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '1.125rem',
          lineHeight: 1.6,
          color: '#c4c8d8',
          maxWidth: '42ch',
          marginTop: '1.5rem'
        }}>
          AI chatbots that capture every lead, ads that only target buyers ready to book paired with a beautiful site, not a digital brochure. — if it isn&apos;t setup within less than 30 days, you don&apos;t pay.
        </p>
        <div style={{ marginTop: '2rem' }}>
          <ShinyButton>See the Process</ShinyButton>
        </div>
      </div>

      <img
        ref={revealImgRef}
        src="/node-image-full.png"
        alt="Reveal effect"
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

export { LaserFlowBoxExample as Hero };
