"use client";

import React, { useEffect, useRef, ReactNode } from "react";

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: "blue" | "purple" | "green" | "red" | "orange";
  size?: "sm" | "md" | "lg";
  width?: string | number;
  height?: string | number;
  customSize?: boolean; // When true, ignores size prop and uses width/height or className
  /** Set false to render a plain static border instead of the mouse-tracking spotlight
   *  (e.g. inside a non-interactive preview context). Default true. */
  interactive?: boolean;
  /** backdrop-blur on the card. Defaults to `interactive`. Decoupled so the glow can be on
   *  while the blur (an expensive per-frame re-raster under the animating 3D transform) is off. */
  blur?: boolean;
}

const glowColorMap = {
  blue: { base: 220, spread: 200 },
  purple: { base: 280, spread: 300 },
  green: { base: 120, spread: 200 },
  red: { base: 0, spread: 200 },
  orange: { base: 30, spread: 200 },
};

const sizeMap = {
  sm: "w-48 h-64",
  md: "w-64 h-80",
  lg: "w-80 h-96",
};

// Static (all values come from CSS custom properties set per-card), so it's identical for
// every card — inject it into <head> exactly once instead of emitting a duplicate <style>
// block per GlowCard.
const GLOW_STYLES = `
    [data-glow]::before,
    [data-glow]::after {
      pointer-events: none;
      content: "";
      position: absolute;
      inset: calc(var(--border-size) * -1);
      border: var(--border-size) solid transparent;
      border-radius: calc(var(--radius) * 1px);
      background-size: calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)));
      background-repeat: no-repeat;
      background-position: 50% 50%;
      /* Border-ring mask: two identical opaque layers, one clipped to the smaller
         padding-box and one to the larger border-box, XORed together so only the
         ring between them stays visible. */
      mask: linear-gradient(white, white), linear-gradient(white, white);
      mask-clip: padding-box, border-box;
      mask-composite: exclude;
      -webkit-mask-composite: xor;
    }

    [data-glow]::before {
      background-image: radial-gradient(
        calc(var(--spotlight-size) * 0.75) calc(var(--spotlight-size) * 0.75) at
        calc(var(--x, 0) * 1px)
        calc(var(--y, 0) * 1px),
        hsl(var(--hue, 210) calc(var(--saturation, 100) * 1%) calc(var(--lightness, 50) * 1%) / var(--border-spot-opacity, 1)), transparent 100%
      );
      filter: brightness(2);
    }

    [data-glow]::after {
      background-image: radial-gradient(
        calc(var(--spotlight-size) * 0.5) calc(var(--spotlight-size) * 0.5) at
        calc(var(--x, 0) * 1px)
        calc(var(--y, 0) * 1px),
        hsl(0 100% 100% / var(--border-light-opacity, 1)), transparent 100%
      );
    }

    [data-glow] [data-glow] {
      position: absolute;
      inset: 0;
      will-change: filter;
      opacity: var(--outer, 1);
      border-radius: calc(var(--radius) * 1px);
      border-width: calc(var(--border-size) * 20);
      filter: blur(calc(var(--border-size) * 10));
      background: none;
      pointer-events: none;
      border: none;
    }

    [data-glow] > [data-glow]::before {
      inset: -10px;
      border-width: 10px;
    }
  `;

let glowStylesInjected = false;

const GlowCard: React.FC<GlowCardProps> = ({
  children,
  className = "",
  glowColor = "blue",
  size = "md",
  width,
  height,
  customSize = false,
  interactive = true,
  blur,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  // backdrop-blur is a per-frame re-raster while an ancestor transform animates (the 3D screen
  // zoom), so it's decoupled from `interactive`: the mouse-tracking glow can stay ON inside the
  // 3D screen while the blur stays OFF there to protect the zoom's framerate. Defaults to
  // `interactive` so existing callers are unchanged.
  const showBlur = blur ?? interactive;

  useEffect(() => {
    if (!interactive) return;

    // Card-relative coordinates (not raw viewport clientX/Y + background-attachment:
    // fixed) so the spotlight works regardless of ancestor transforms — fixed-attachment
    // positioning breaks any time an ancestor has a CSS transform (redefines the
    // containing block), which happened both inside the 3D <Html> overlay and, later,
    // from a stray transform GSAP's ScrollTrigger leaves on a pinned element even after
    // release. Local coordinates sidestep that whole class of bug.
    const syncPointer = (e: PointerEvent) => {
      const card = cardRef.current;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      // Position the spotlight from the pointer's FRACTION across the card × the card's
      // UNSCALED layout size (offsetWidth/Height) — NOT the raw on-screen pixel offset.
      // getBoundingClientRect() returns the on-screen box, which is scaled down while an
      // ancestor is transformed (the 3D-screen zoom), so raw px put the light in the wrong
      // place until the zoom reached 1:1. The fraction is scale-invariant and offsetWidth is
      // the local space the gradient is drawn in, so it tracks correctly at any zoom scale.
      const fx = rect.width  ? (e.clientX - rect.left) / rect.width  : 0;
      const fy = rect.height ? (e.clientY - rect.top)  / rect.height : 0;
      card.style.setProperty("--x", (fx * card.offsetWidth).toFixed(2));
      card.style.setProperty("--xp", fx.toFixed(2));
      card.style.setProperty("--y", (fy * card.offsetHeight).toFixed(2));
      card.style.setProperty("--yp", fy.toFixed(2));
    };

    document.addEventListener("pointermove", syncPointer);
    return () => document.removeEventListener("pointermove", syncPointer);
  }, [interactive]);

  useEffect(() => {
    if (!interactive || glowStylesInjected || typeof document === "undefined") return;
    if (document.getElementById("glow-card-styles")) { glowStylesInjected = true; return; }
    const styleEl = document.createElement("style");
    styleEl.id = "glow-card-styles";
    styleEl.textContent = GLOW_STYLES;
    document.head.appendChild(styleEl);
    glowStylesInjected = true;
  }, [interactive]);

  const { base, spread } = glowColorMap[glowColor];

  // Determine sizing
  const getSizeClasses = () => {
    if (customSize) {
      return ""; // Let className or inline styles handle sizing
    }
    return sizeMap[size];
  };

  const getInlineStyles = (): React.CSSProperties => {
    const baseStyles: Record<string, string | number> = interactive ? {
      "--base": base,
      "--spread": spread,
      "--radius": "14",
      "--border": "3",
      "--backdrop": "hsl(0 0% 60% / 0.12)",
      "--backup-border": "var(--backdrop)",
      "--size": "200",
      "--outer": "1",
      "--border-size": "calc(var(--border, 2) * 1px)",
      "--spotlight-size": "calc(var(--size, 150) * 1px)",
      "--hue": "calc(var(--base) + (var(--xp, 0) * var(--spread, 0)))",
      backgroundImage: `radial-gradient(
        var(--spotlight-size) var(--spotlight-size) at
        calc(var(--x, 0) * 1px)
        calc(var(--y, 0) * 1px),
        hsl(var(--hue, 210) calc(var(--saturation, 100) * 1%) calc(var(--lightness, 70) * 1%) / var(--bg-spot-opacity, 0.1)), transparent
      )`,
      backgroundColor: "var(--backdrop, transparent)",
      backgroundSize: "calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)))",
      backgroundPosition: "50% 50%",
      border: "var(--border-size) solid var(--backup-border)",
      position: "relative",
      // `pan-y` (was `none`): mobile users were getting the spotlight to react to their thumb
      // but couldn't scroll the page through the card — they had to reach for the edge. With
      // pan-y the browser reserves vertical panning for scroll, so a downward swipe scrolls
      // the page normally. The reactive border still updates from any horizontal thumb
      // movement, or when the finger holds still, so the interaction survives — just no
      // longer at the cost of scroll.
      touchAction: "pan-y",
    } : {
      "--border-size": "3px",
      backgroundColor: "hsl(0 0% 60% / 0.12)",
      border: "var(--border-size) solid hsl(0 0% 60% / 0.12)",
      position: "relative",
    };

    if (width !== undefined) {
      baseStyles.width = typeof width === "number" ? `${width}px` : width;
    }
    if (height !== undefined) {
      baseStyles.height = typeof height === "number" ? `${height}px` : height;
    }

    return baseStyles as React.CSSProperties;
  };

  return (
    <>
      <div
        ref={cardRef}
        data-glow={interactive || undefined}
        style={getInlineStyles()}
        className={`
          ${getSizeClasses()}
          ${!customSize ? "aspect-[3/4]" : ""}
          rounded-2xl
          relative
          grid
          grid-rows-[1fr_auto]
          shadow-[0_1rem_2rem_-1rem_black]
          p-4
          gap-4
          ${showBlur ? "backdrop-blur-[5px]" : ""}
          ${className}
        `}
      >
        {interactive && <div ref={innerRef} data-glow></div>}
        {children}
      </div>
    </>
  );
};

export { GlowCard };
