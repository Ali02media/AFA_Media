"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";

// ─────────────────────────────────────────────────────────────────────────────────────────
// Route transition — a brand-gradient curtain that wipes UP off the screen to reveal each
// newly-navigated page. Driven by app/template.tsx, which (unlike layout.tsx) re-mounts this
// whole subtree on every navigation, so the transition replays each time.
//
// THREE variants exist in this file; which one a given visitor gets is decided below:
//   • 'curtain' — the full 5-column brand-gradient sweep (the default for everyone right now).
//   • 'fade'    — a motion-SAFE cross-fade: opacity only, no movement. This is the accessible
//                 alternative for `prefers-reduced-motion` visitors. Built and ready; not the
//                 active reduced-motion choice yet (see REDUCED_MOTION_MODE) — flip one line to
//                 switch to it.
//   • 'none'    — instant swap, no transition.
//
// ── HOW REDUCED-MOTION VISITORS ARE TREATED ────────────────────────────────────────────────
// `prefers-reduced-motion: reduce` exists because large sweeping motion can cause real motion
// sickness / migraines for some people, so the honest default would be to NOT force the curtain
// on them. Per the site owner's explicit choice, they currently DO get the full curtain (mode
// 'full' below). To switch them to the motion-safe cross-fade later, change ONE line:
//     const REDUCED_MOTION_MODE = 'minimal';   // 'full' | 'minimal' | 'none'
const REDUCED_MOTION_MODE: "full" | "minimal" | "none" = "full";

// ── PREVIEW / OVERRIDE ─────────────────────────────────────────────────────────────────────
// A URL param lets you force any variant regardless of your OS setting — handy for previewing
// and for client demos. It's remembered for the browsing session (sessionStorage), so it
// survives clicking around; open a fresh tab (or use ?motion=auto) to clear it.
//     ?motion=on    → force the full curtain
//     ?motion=min   → force the motion-safe cross-fade
//     ?motion=off   → force instant / no transition
//     ?motion=auto  → clear the override, go back to the normal rules above
// ─────────────────────────────────────────────────────────────────────────────────────────

// Module scope persists across client navigations but resets on a hard reload — exactly the
// "is this the first paint or a subsequent navigation?" signal we want, with no matchMedia and
// no state that could differ between server and client.
let firstRender = true;

const PANELS = 5;
const EASE_EXPO = [0.16, 1, 0.3, 1] as const; // --ease-expo

type Override = "on" | "min" | "off" | null;

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prefersReduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  // Read the override SYNCHRONOUSLY at mount, not in an effect. If it were async, each
  // navigation's first render would compute the wrong `mode` (the default curtain, with its
  // y:12 content offset) for one frame before the effect corrected it — and in fade mode that
  // stray 12px transform stuck. Reading it here means `mode` is right from the first frame.
  // Safe for SSR/hydration: `override` only ever affects output when `isFirst` is false, i.e.
  // on client navigations that never run on the server — so server and first client render
  // (both isFirst=true) produce identical markup regardless of what this returns.
  const [override] = useState<Override>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = sessionStorage.getItem("afa-motion");
      return stored === "on" || stored === "min" || stored === "off" ? stored : null;
    } catch {
      return null;
    }
  });

  // Effect only WRITES the ?motion= param through to sessionStorage (and flips `mounted` so the
  // portal can use document.body). A param set on the current load takes effect from the NEXT
  // navigation, which is exactly right — the first paint after a hard load never transitions.
  useEffect(() => {
    try {
      const param = new URLSearchParams(window.location.search).get("motion");
      if (param === "auto") sessionStorage.removeItem("afa-motion");
      else if (param === "on" || param === "min" || param === "off")
        sessionStorage.setItem("afa-motion", param);
    } catch {
      /* sessionStorage/URL unavailable — fall through to the normal rules */
    }
    setMounted(true);
  }, []);

  // Read-and-flip during render. On the server and the first client render this is `true`
  // (they agree — no hydration mismatch); every navigation after is `false`.
  const [isFirst] = useState(() => {
    const first = firstRender;
    firstRender = false;
    return first;
  });

  // Decide this visitor's variant. Override wins; otherwise non-reduced visitors get the
  // curtain and reduced-motion visitors get whatever REDUCED_MOTION_MODE says.
  let mode: "curtain" | "fade" | "none";
  if (override === "on") mode = "curtain";
  else if (override === "min") mode = "fade";
  else if (override === "off") mode = "none";
  else if (!prefersReduced) mode = "curtain";
  else mode = REDUCED_MOTION_MODE === "full" ? "curtain"
    : REDUCED_MOTION_MODE === "minimal" ? "fade" : "none";

  // Never transition on the first paint after a hard load (keeps the curtain/fade out of SSR
  // and off the hero while its WebGL initialises).
  const effectiveMode = isFirst ? "none" : mode;

  const curtain =
    effectiveMode === "curtain" && mounted ? (
      // Fixed, above everything (navbar is z-50), never interactive. Keyed on pathname so the
      // curtain is a fresh element per navigation and its enter animation always runs. Portalled
      // to <body> so it isn't trapped inside <main class="relative z-10">'s stacking context
      // (which would leave it below the navbar); as a body sibling its z-[100] covers the navbar.
      <div key={pathname} aria-hidden className="pointer-events-none fixed inset-0 z-[100] flex">
        {Array.from({ length: PANELS }).map((_, i) => (
          <motion.div
            key={i}
            className="h-full flex-1"
            style={{
              // Each panel shows the same slice of ONE viewport-wide gradient, so the columns
              // read as a single continuous brand sweep rather than 5 repeated gradients.
              backgroundImage:
                "linear-gradient(105deg, var(--color-brand-blue) 0%, var(--color-brand-teal) 100%)",
              backgroundSize: `${PANELS * 100}% 100%`,
              backgroundPositionX: `${(i / (PANELS - 1)) * 100}%`,
            }}
            initial={{ y: 0 }}
            animate={{ y: "-100%" }}
            transition={{ duration: 0.6, ease: EASE_EXPO, delay: i * 0.07 }}
          />
        ))}
      </div>
    ) : null;

  return (
    <>
      {curtain && createPortal(curtain, document.body)}

      {effectiveMode === "curtain" ? (
        // Content rises in under the lifting curtain.
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_EXPO, delay: 0.2 }}
        >
          {children}
        </motion.div>
      ) : effectiveMode === "fade" ? (
        // Motion-SAFE variant: opacity only, no movement — nothing that triggers the vestibular
        // issues `prefers-reduced-motion` guards against.
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      ) : (
        children
      )}
    </>
  );
}
