'use client';

import './LaserFlowCSS.css';

// Baked fbm noise for the fog. feTurbulence runs once when the browser decodes this
// data-URI and never again — from then on it's an ordinary image used as a mask, so the
// drift animation is pure compositor work. `stitchTiles` makes it tile seamlessly.
//
// Went from 620/0.012/4-octave to 900/0.006/6-octave because the mobile viewers reported
// the fog reading "pixelated". At the old baseFrequency of 0.012 on a 620px tile the
// low-octave features rasterised at ~13px chunks — visibly blocky on a phone screen where
// the tile fills most of the viewport. 0.006 spreads those chunks to ~26px so each block
// is now bigger than the eye can pick out at arm's length, and two extra octaves stack finer
// grain on top so the surface reads as continuous smoke rather than tiles. Rendering into
// 900x900 keeps the higher-frequency detail sub-pixel on 2x/3x DPR phones. Decode cost is
// still one-shot at ~5ms and pure GPU thereafter, so no impact on runtime performance.
const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='900' height='900'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.006' numOctaves='6' seed='7' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0.42 0.42 0.42 0 -0.06'/%3E%3C/filter%3E%3Crect width='900' height='900' filter='url(%23n)'/%3E%3C/svg%3E\")";

// Grain used to dither out gradient banding — the visible "stepping" the CSS beam showed
// at its widening bottom, where several stacked low-alpha radial gradients cross. Cheap
// dither: fine SVG monochrome noise, tiled, overlaid at ~4% opacity. The eye stops seeing
// alpha steps because the grain moves them around by a pixel or two of noise, but the grain
// itself is under the visibility threshold on its own. One-shot decode, no animation.
const DITHER =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='d'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2.4' numOctaves='1' seed='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23d)'/%3E%3C/svg%3E\")";

/**
 * Pure-CSS stand-in for <LaserFlow>. Same beam, splash, wisps and drifting fog, but with
 * no WebGL context, no three.js and no per-frame JS — the WebGL version cost ~22s of
 * Total Blocking Time on a mid-range phone. Every animation here runs on `transform` or
 * `opacity` only, so it stays on the compositor.
 *
 * @param {string} [beamX='63.8%'] Horizontal position of the beam. The shader's
 *   horizontalBeamOffset of 0.14 offsets by 2*0.14 of the half-width, i.e. 14% of the
 *   full width right of centre — measured at 63.8%, not the 57% the old placeholder used.
 */
export function LaserFlowCSS({ className, style, beamX = '63.8%' }) {
  return (
    <div
      aria-hidden="true"
      className={`lfc ${className || ''}`}
      style={{ '--lfc-x': beamX, '--lfc-noise': NOISE, '--lfc-dither': DITHER, ...style }}
    >
      <div className="lfc-fog">
        <div className="lfc-fog-inner" />
      </div>
      <div className="lfc-halo" />
      <div className="lfc-shaft lfc-pulse" />
      <div className="lfc-flow">
        <div className="lfc-flow-inner" />
      </div>
      <div className="lfc-flare" />
      <div className="lfc-hot" />
      <div className="lfc-pool" />
      <div className="lfc-floor" />
      <div className="lfc-wisps">
        <div className="lfc-wisps-inner" />
      </div>
    </div>
  );
}

export default LaserFlowCSS;
