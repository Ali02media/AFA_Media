"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { Link } from "next-view-transitions";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { nav, site } from "@/lib/site";
import { calAttrs } from "@/components/cal";

gsap.registerPlugin(useGSAP);

// ─────────────────────────────────────────────────────────────────────────────────────────
// Full-width drop-down navigation, ported from the supplied GSAP demo.
//
// Behaviour: click the centred toggle → the panel's height animates 0 → auto while a dark
// backdrop grows to cover the page, the burger morphs to an X, "Menu"/"Close" cross-fade, and
// the big links reveal character-by-character on a stagger. Hovering a link blurs the others.
//
// Ported rather than copied verbatim, because the demo was a standalone page:
//   • One paused GSAP timeline built in useGSAP, so it's scoped and auto-reverted on unmount
//     (the demo built its timeline against module-level DOM queries at script load).
//   • Character spans are produced by React from the label string, not by mutating
//     textContent on mount — mutating the DOM under React would be clobbered on re-render.
//   • Links are next-view-transitions Links, so the site's page transition still runs, and
//     the menu closes itself on navigation.
//   • The demo's Shop/Cart block is replaced by the "Book a Call" CTA.
//   • The hover preview image is omitted — it needs a per-page thumbnail we don't have. The
//     hover blur effect is kept.
// ─────────────────────────────────────────────────────────────────────────────────────────

/** Matches the demo's cubic-bezier(0.76, 0, 0.24, 1) — the same curve as the page transition. */
const EASE = "power3.inOut";

export function NavMenu() {
  const root = useRef<HTMLElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const [open, setOpen] = useState(false);

  useGSAP(
    () => {
      const chars = gsap.utils.toArray<HTMLElement>(".js-char");
      const footerItems = gsap.utils.toArray<HTMLElement>(".js-footer-item");

      gsap.set(chars, { yPercent: 100, opacity: 0 });
      gsap.set(footerItems, { yPercent: 100, opacity: 0 });

      tl.current = gsap
        .timeline({ paused: true })
        // height:auto — GSAP measures the natural height, so the panel fits whatever's inside.
        .to(".js-panel", { height: "auto", duration: 1, ease: EASE }, 0)
        .to(".js-backdrop", { height: "100vh", duration: 1, ease: EASE }, 0)
        .to(".js-label-menu", { opacity: 0, duration: 0.35 }, 0)
        .to(".js-label-close", { opacity: 1, duration: 0.35 }, 0)
        .to(".js-cta", { opacity: 0, duration: 0.35 }, 0)
        .to(chars, { yPercent: 0, opacity: 1, duration: 1, ease: EASE, stagger: 0.02 }, 0.2)
        .to(footerItems, { yPercent: 0, opacity: 1, duration: 1, ease: EASE, stagger: 0.05 }, 0.4);
    },
    { scope: root },
  );

  // Drive the timeline from React state rather than toggling inside the click handler, so the
  // animation can't drift out of sync with what the rest of the component thinks is happening.
  useEffect(() => {
    const t = tl.current;
    if (!t) return;
    if (open) t.play();
    else t.reverse();
  }, [open]);

  // Close on Escape. (Closing on navigation is done in each link's onClick rather than by
  // reacting to a pathname change — setState directly in an effect triggers a cascading
  // re-render, and the click is the actual event we care about anyway.)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Lock the page behind the menu while it's open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const hoverBlur = (hoveredHref: string | null) => {
    // One handler on the list, not per-link: moving between links would otherwise fire
    // leave+enter and stack two conflicting tweens on the same targets (visible flicker).
    // `overwrite` kills any in-flight tween on the same target.
    const links = gsap.utils.toArray<HTMLElement>(".js-link", root.current);
    links.forEach((el) => {
      const isHovered = el.dataset.href === hoveredHref;
      gsap.to(el, {
        filter: hoveredHref && !isHovered ? "blur(4px)" : "blur(0px)",
        opacity: hoveredHref && !isHovered ? 0.5 : 1,
        duration: 0.3,
        overwrite: true,
      });
    });
  };

  return (
    <header
      ref={root}
      className={`fixed inset-x-0 top-0 z-50 glass-nav ${open ? "glass-nav--open" : ""}`}
    >
      <div className="relative flex items-center justify-center px-5 py-4 sm:px-8">
        {/* Logo — left */}
        <Link href="/" className="absolute left-5 flex items-center sm:left-8" aria-label={`${site.name} home`}>
          <Image src="/afa-logo.png" alt={site.name} width={132} height={105} className="h-9 w-auto" priority />
        </Link>

        {/* Toggle — centred */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="nav-panel"
          aria-label={open ? "Close menu" : "Open menu"}
          className="cta-type flex cursor-pointer items-center gap-2 text-xs uppercase tracking-wide text-foreground sm:text-sm"
        >
          {/* Burger → X. Two lines built from pseudo-elements, rotated when open. */}
          <span className="relative block w-[22.5px]" aria-hidden="true">
            <span
              className={`block h-px w-full bg-foreground transition-all duration-[1000ms] [transition-timing-function:cubic-bezier(0.76,0,0.24,1)] ${
                open ? "translate-y-[1px] rotate-45" : "-translate-y-[4px]"
              }`}
            />
            <span
              className={`block h-px w-full bg-foreground transition-all duration-[1000ms] [transition-timing-function:cubic-bezier(0.76,0,0.24,1)] ${
                open ? "-translate-y-[0px] -rotate-45" : "translate-y-[4px]"
              }`}
            />
          </span>
          {/* Both labels occupy the same spot; GSAP cross-fades them. */}
          <span className="relative flex items-center">
            <span className="js-label-menu">Menu</span>
            <span className="js-label-close absolute left-0 opacity-0">Close</span>
          </span>
        </button>

        {/* CTA — right. Fades out while the menu is open. */}
        <div className="js-cta absolute right-5 sm:right-8">
          <button
            type="button"
            {...calAttrs}
            className="cta-type bg-gradient-brand inline-flex h-10 items-center gap-1.5 rounded-full px-5 text-sm font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5"
          >
            Book a Call
          </button>
        </div>
      </div>

      {/* PANEL — height animates 0 → auto */}
      <div id="nav-panel" className="js-panel h-0 overflow-hidden">
        <div className="flex flex-col gap-10 px-5 pb-16 sm:px-8 lg:flex-row lg:justify-between">
          <div className="flex flex-1 flex-col justify-between">
            {/* Big links */}
            <nav
              className="mt-8 flex flex-wrap lg:mt-16"
              onMouseLeave={() => hoverBlur(null)}
            >
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  data-href={item.href}
                  onMouseEnter={() => hoverBlur(item.href)}
                  onClick={() => setOpen(false)}
                  className="js-link flex overflow-hidden pr-8 pt-2.5 font-display text-[32px] font-light uppercase leading-none text-foreground lg:pr-[2vw] lg:text-[5vw]"
                >
                  {/* One span per character so they can stagger independently. Spaces become
                      non-breaking or they collapse once the spans are inline-block. */}
                  {item.label.split("").map((ch, i) => (
                    <span key={i} className="js-char inline-block will-change-[transform,opacity]">
                      {ch === " " ? " " : ch}
                    </span>
                  ))}
                </Link>
              ))}
            </nav>

            {/* Footer lines */}
            <div className="mt-10 flex flex-wrap justify-between gap-y-2 text-xs uppercase text-mist lg:mt-16">
              {[
                ["Email", site.email],
                ["Phone", site.phone],
                ["Location", site.location],
              ].map(([label, value]) => (
                <ul key={label} className="w-1/2 overflow-hidden lg:w-auto">
                  <li className="js-footer-item will-change-[transform,opacity]">
                    <span className="text-mist-dim">{label}: </span>
                    {value}
                  </li>
                </ul>
              ))}
              <ul className="w-1/2 overflow-hidden lg:w-auto">
                <li className="js-footer-item flex gap-4 will-change-[transform,opacity]">
                  <Link href="/privacy" onClick={() => setOpen(false)} className="hover:text-foreground">Privacy</Link>
                  <Link href="/terms" onClick={() => setOpen(false)} className="hover:text-foreground">Terms</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Dark backdrop below the bar — grows to cover the page while the menu is open. */}
      <div className="js-backdrop pointer-events-none absolute left-0 top-full h-0 w-full bg-black/50" />
    </header>
  );
}
