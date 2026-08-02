"use client"

import type React from "react"
import { useTransitionRouter } from "next-view-transitions"

interface ShinyButtonProps {
  children: React.ReactNode
  onClick?: () => void
  /** Render as a link to an internal route instead of a button, so navigating gets the site's
   *  page transition. */
  href?: string
  /** "dark" (default) is the black pill with the blue shine. "light" is the inverted pair —
   *  white surface, dark text — for a secondary CTA sitting beside the primary one. */
  variant?: "dark" | "light"
  className?: string
  /** Passed through to the rendered element — used to spread Cal's data-cal-* attributes so
   *  a ShinyButton can open the booking modal. */
  [key: `data-${string}`]: unknown
}

export function ShinyButton({
  children,
  onClick,
  href,
  variant = "dark",
  className = "",
  ...rest
}: ShinyButtonProps) {
  // A PLAIN <a>, not next-view-transitions' <Link>, deliberately. styled-jsx scopes the rules
  // below by appending a generated `jsx-<hash>` class to the elements it can see — and it only
  // does that for real DOM elements, never for custom components. Rendering <Link> here made
  // every style below silently dead (measured: borderRadius 0, padding 0, no background,
  // display:inline — it came out as bare link text). A real anchor also keeps right-click,
  // middle-click, "open in new tab" and keyboard activation working.
  //
  // useTransitionRouter is next-view-transitions' router: push() runs through
  // document.startViewTransition(), which is what <Link> would have done internally.
  const router = useTransitionRouter()
  return (
    <>
      <style jsx>{`
        /* (Removed a vendor @import that pulled Inter straight from Google Fonts. It was a
           render-blocking third-party request for a font the site no longer uses — everything
           is Nunito now, self-hosted via next/font in app/layout.tsx.) */

        @property --gradient-angle {
          syntax: "<angle>";
          initial-value: 0deg;
          inherits: false;
        }

        @property --gradient-angle-offset {
          syntax: "<angle>";
          initial-value: 0deg;
          inherits: false;
        }

        @property --gradient-percent {
          syntax: "<percentage>";
          initial-value: 5%;
          inherits: false;
        }

        @property --gradient-shine {
          syntax: "<color>";
          initial-value: white;
          inherits: false;
        }

        .shiny-cta {
          --shiny-cta-bg: #000000;
          --shiny-cta-bg-subtle: #1a1818;
          --shiny-cta-fg: #ffffff;
          --shiny-cta-highlight: blue;
          --shiny-cta-highlight-subtle: #8484ff;
          --animation: gradient-angle linear infinite;
          --duration: 3s;
          --shadow-size: 2px;
          --transition: 800ms cubic-bezier(0.25, 1, 0.5, 1);

          /* Explicit: a <button> defaults to inline-block but an <a> defaults to inline,
             which would drop the vertical padding out of layout. Set it so the button and
             link renderings are identical. */
          display: inline-block;
          isolation: isolate;
          position: relative;
          overflow: hidden;
          cursor: pointer;
          outline-offset: 4px;
          padding: 1.25rem 2.5rem;
          font-family: var(--font-display);
          font-size: 1.125rem;
          line-height: 1.2;
          font-weight: 500;
          border: 1px solid transparent;
          border-radius: 360px;
          color: var(--shiny-cta-fg);
          background: linear-gradient(var(--shiny-cta-bg), var(--shiny-cta-bg)) padding-box,
            conic-gradient(
              from calc(var(--gradient-angle) - var(--gradient-angle-offset)),
              transparent,
              var(--shiny-cta-highlight) var(--gradient-percent),
              var(--gradient-shine) calc(var(--gradient-percent) * 2),
              var(--shiny-cta-highlight) calc(var(--gradient-percent) * 3),
              transparent calc(var(--gradient-percent) * 4)
            ) border-box;
          box-shadow: inset 0 0 0 1px var(--shiny-cta-bg-subtle);
          transition: var(--transition);
          transition-property: --gradient-angle-offset, --gradient-percent, --gradient-shine;
        }

        /* Declared AFTER the base .shiny-cta rule on purpose: same specificity, so source order
           decides. Placed before it, the base values would win and the variant would do nothing.
           The light variant only overrides the four colour custom properties — every derived
           layer (dot pattern, shimmer, inner glow, border gradient) reads from these, so the
           whole button recolours without duplicating any of the effect CSS. */
        .shiny-cta--light {
          --shiny-cta-bg: #ffffff;
          --shiny-cta-bg-subtle: #e8ecf3;
          --shiny-cta-fg: #0a0d16;
          --shiny-cta-highlight: #2c87d0;
          --shiny-cta-highlight-subtle: #19b0a1;
        }

        /* The dot pattern is white-on-black by default; invert it on the light surface or it
           disappears against the white fill. */
        .shiny-cta--light::before {
          background: radial-gradient(
            circle at var(--position) var(--position),
            rgba(10, 13, 22, 0.55) calc(var(--position) / 4),
            transparent 0
          ) padding-box;
          background-size: var(--space) var(--space);
          background-repeat: space;
        }

        .shiny-cta::before,
        .shiny-cta::after,
        .shiny-cta span::before {
          content: "";
          pointer-events: none;
          position: absolute;
          inset-inline-start: 50%;
          inset-block-start: 50%;
          translate: -50% -50%;
          z-index: -1;
        }

        .shiny-cta:active {
          translate: 0 1px;
        }

        /* Dots pattern */
        .shiny-cta::before {
          --size: calc(100% - var(--shadow-size) * 3);
          --position: 2px;
          --space: calc(var(--position) * 2);
          width: var(--size);
          height: var(--size);
          background: radial-gradient(
            circle at var(--position) var(--position),
            white calc(var(--position) / 4),
            transparent 0
          ) padding-box;
          background-size: var(--space) var(--space);
          background-repeat: space;
          mask-image: conic-gradient(
            from calc(var(--gradient-angle) + 45deg),
            black,
            transparent 10% 90%,
            black
          );
          border-radius: inherit;
          opacity: 0.4;
          z-index: -1;
        }

        /* Inner shimmer */
        .shiny-cta::after {
          --animation: shimmer linear infinite;
          width: 100%;
          aspect-ratio: 1;
          background: linear-gradient(
            -50deg,
            transparent,
            var(--shiny-cta-highlight),
            transparent
          );
          mask-image: radial-gradient(circle at bottom, transparent 40%, black);
          opacity: 0.6;
        }

        .shiny-cta span {
          z-index: 1;
        }

        .shiny-cta span::before {
          --size: calc(100% + 1rem);
          width: var(--size);
          height: var(--size);
          box-shadow: inset 0 -1ex 2rem 4px var(--shiny-cta-highlight);
          opacity: 0;
          transition: opacity var(--transition);
          animation: calc(var(--duration) * 1.5) breathe linear infinite;
        }

        /* Animate */
        .shiny-cta,
        .shiny-cta::before,
        .shiny-cta::after {
          animation: var(--animation) var(--duration),
            var(--animation) calc(var(--duration) / 0.4) reverse paused;
          animation-composition: add;
        }

        .shiny-cta:is(:hover, :focus-visible) {
          --gradient-percent: 20%;
          --gradient-angle-offset: 95deg;
          --gradient-shine: var(--shiny-cta-highlight-subtle);
        }

        .shiny-cta:is(:hover, :focus-visible),
        .shiny-cta:is(:hover, :focus-visible)::before,
        .shiny-cta:is(:hover, :focus-visible)::after {
          animation-play-state: running;
        }

        .shiny-cta:is(:hover, :focus-visible) span::before {
          opacity: 1;
        }

        @keyframes gradient-angle {
          to {
            --gradient-angle: 360deg;
          }
        }

        @keyframes shimmer {
          to {
            rotate: 360deg;
          }
        }

        @keyframes breathe {
          from, to {
            scale: 1;
          }
          50% {
            scale: 1.2;
          }
        }
      `}</style>

      {href ? (
        <a
          href={href}
          className={`shiny-cta ${variant === "light" ? "shiny-cta--light" : ""} ${className}`}
          onClick={(e) => {
            // Let modified clicks fall through to the browser so "open in new tab/window"
            // still works; only intercept a plain left click.
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
            e.preventDefault()
            onClick?.()
            router.push(href)
          }}
          {...rest}
        >
          <span>{children}</span>
        </a>
      ) : (
        <button
          className={`shiny-cta ${variant === "light" ? "shiny-cta--light" : ""} ${className}`}
          onClick={onClick}
          {...rest}
        >
          <span>{children}</span>
        </button>
      )}
    </>
  )
}
