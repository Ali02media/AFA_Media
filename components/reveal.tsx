"use client";

import { useRef, useEffect, useState, CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  direction?: "up" | "left" | "scale";
  /** Skip the whileInView reveal and render fully visible immediately — for content
   *  embedded inside a CSS 3D-transformed context, where IntersectionObserver-based
   *  viewport detection doesn't reliably fire. */
  forceVisible?: boolean;
}

const hiddenTransform: Record<NonNullable<RevealProps["direction"]>, string> = {
  up:    "translate3d(0, 28px, 0)",
  left:  "translate3d(-28px, 0, 0)",
  scale: "scale(0.94)",
};

/**
 * Scroll-in reveal. Was a framer-motion `motion.div` with `whileInView`; replaced with a
 * hand-rolled IntersectionObserver + CSS transition to pull framer-motion out of the
 * six homepage sections that use this component — the initial bundle shrinks and the
 * six client-boundaries hydrate substantially faster, which is what was dragging mobile
 * PSI's TBT into the 200–280 ms band. Visual behaviour is preserved: same 28px lift, same
 * 12% intersection threshold, same one-shot behaviour, same eased curve, same reduced-motion
 * bypass (Bug A path: reduced-motion visitors get the content already-visible, not stuck
 * at opacity:0 waiting for an observer that may never fire).
 */
export function Reveal({
  children,
  delay = 0,
  className,
  direction = "up",
  forceVisible = false,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  // `mounted` gates the reveal path so SSR and the first client render agree — the server
  // renders the content already visible, matches on the client, and only after mount do we
  // switch to the hidden-then-fade-in state. Without this, hydration would flip content to
  // opacity:0 mid-hydrate and cause a visible flash.
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);

    if (forceVisible) {
      setVisible(true);
      return;
    }

    const prefersReduced =
      typeof matchMedia !== "undefined" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      setVisible(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    // If the element is already inside the viewport at mount (above the fold), reveal on
    // the next frame — no observer flap needed and no initial `opacity:0` paint before the
    // transition kicks in.
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    if (rect.top < vh * 0.88 && rect.bottom > 0) {
      requestAnimationFrame(() => setVisible(true));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [forceVisible]);

  // On the server and the very first client render, output the element already visible so
  // hydration matches. The reveal path only engages after `mounted` flips true.
  const engaged = mounted && !forceVisible;
  const style: CSSProperties = engaged
    ? {
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : hiddenTransform[direction],
        transition:
          "opacity 620ms cubic-bezier(0.16, 1, 0.3, 1), transform 620ms cubic-bezier(0.16, 1, 0.3, 1)",
        transitionDelay: visible ? `${delay}s` : undefined,
        willChange: visible ? undefined : "opacity, transform",
      }
    : {};

  return (
    <div ref={ref} className={cn(className)} style={style}>
      {children}
    </div>
  );
}
