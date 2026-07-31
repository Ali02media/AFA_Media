"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";

// ─────────────────────────────────────────────────────────────────────────────────────────
// Route transition — a brand-gradient curtain that wipes UP off the screen to reveal each
// newly-navigated page. Driven by app/template.tsx, which (unlike layout.tsx) re-mounts this
// whole subtree on every navigation, so the curtain replays each time.
//
// Design decisions, all deliberate:
//  • REVEAL-ONLY (panels start covering the incoming page, then lift away). A cover→reveal
//    sequence would need to intercept the click BEFORE navigation — i.e. replace every <Link>
//    with a custom TransitionLink. This is the non-invasive version that touches nothing else.
//  • SKIPPED ON FIRST LOAD. `firstRender` is module-scoped, so it's `true` only for the very
//    first render after a hard load and `false` for every client navigation thereafter. That
//    keeps the curtain out of the SSR/first-paint path entirely — it never covers the hero
//    while the WebGL is initialising, and there's no hydration mismatch (server and the first
//    client render agree: no curtain).
//  • REDUCED MOTION → no curtain at all. Consistent with the rest of the site.
//  • PORTALLED TO <body>. The curtain must cover the fixed navbar (z-50) too. Rendered in place
//    it would be trapped inside <main class="relative z-10">'s stacking context, so its z-[100]
//    would still sit BELOW the navbar. Portalling to body makes it a sibling of the navbar, so
//    z-[100] wins globally. The portal is client-only, which is fine — the curtain only ever
//    renders on a client navigation, never during SSR.
// ─────────────────────────────────────────────────────────────────────────────────────────

// Module scope persists across client-side navigations but resets on a hard reload — exactly
// the "is this the first paint or a subsequent navigation?" signal we want, with no matchMedia
// and no state that could differ between server and client.
let firstRender = true;

const PANELS = 5;

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prefersReduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Read-and-flip during render. On the server and the first client render this is `true`
  // (they agree — no hydration mismatch); every navigation after is `false`.
  const [isFirst] = useState(() => {
    const first = firstRender;
    firstRender = false;
    return first;
  });

  const playCurtain = !isFirst && !prefersReduced;

  const curtain = playCurtain && mounted ? (
    // Fixed, above everything (navbar is z-50), never interactive. Keyed on pathname so the
    // curtain is a fresh element per navigation and its enter animation always runs.
    <div
      key={pathname}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[100] flex"
    >
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
          transition={{
            duration: 0.6,
            ease: [0.16, 1, 0.3, 1], // --ease-expo
            delay: i * 0.07,
          }}
        />
      ))}
    </div>
  ) : null;

  return (
    <>
      {curtain && createPortal(curtain, document.body)}

      {/* Content fades/rises in under the lifting curtain. On first load and under reduced
          motion it renders plainly, untouched. */}
      {playCurtain ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        >
          {children}
        </motion.div>
      ) : (
        children
      )}
    </>
  );
}
