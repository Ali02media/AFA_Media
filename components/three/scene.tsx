"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";

// R3F can't render on the server — load the canvas client-side only.
const HeroCanvas = dynamic(() => import("./hero-canvas"), {
  ssr: false,
  loading: () => <Fallback />,
});

function Fallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="h-64 w-64 rounded-full bg-gradient-brand opacity-30 blur-3xl" />
    </div>
  );
}

/**
 * Fixed, full-viewport, click-through 3D layer behind the page content.
 * Prominent in the hero, then fades to a subtle ambient presence on scroll
 * so it never competes with copy or hurts conversions.
 */
export function Scene() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const vh = window.innerHeight || 1;
      // 1 at top → ~0.22 once past the first screen.
      const t = Math.min(window.scrollY / vh, 1);
      el.style.opacity = String(1 - t * 0.78);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-150"
      aria-hidden="true"
    >
      <HeroCanvas />
    </div>
  );
}
