"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────────────────
// Fanned / staggered work showcase (the original "stagger" carousel, fixed).
//
// Two fixes vs the first version:
//  • TRANSITION: the original re-keyed every moved card with `Math.random()`, so a wrapping
//    card became a brand-new DOM node (unmount+mount) and TELEPORTED. Here nothing reorders —
//    each card keeps a STABLE key and its slot is computed from its offset to `index`, so the
//    CSS `transition` glides it between fan positions instead of popping.
//  • CLIPPING: the container is now tall enough for the fanned cards (height = card.h + 200)
//    with a modest centre lift, so cards sit fully in frame instead of being cropped.
//
// Cards beyond ±3 fade to opacity 0, so the card that wraps from one end to the other does so
// invisibly. Images only, no per-card titles (mix of demo + client work — see page copy).
// Reduced motion is handled globally: globals.css zeroes transition-duration, so those visitors
// get instant slot changes automatically.
// ─────────────────────────────────────────────────────────────────────────────────────────

interface Project {
  img: string;
  /** Short name — used only for the image `alt` and the keyboard aria-label (not shown). */
  label: string;
  /** object-position for the cover crop. Default centres horizontally ("center top"); set to
   *  "left top" for shots whose headline sits hard against the left edge, so the centre-crop
   *  doesn't slice it off. */
  pos?: string;
}

const projects: Project[] = [
  { img: "/showcase/afa-media.webp", label: "AFA Media", pos: "left top" },   // real
  { img: "/showcase/aurelia.webp", label: "Aurelia" },                         // demo
  { img: "/showcase/legentax.webp", label: "Legentax" },                       // real
  { img: "/showcase/digital-workers.webp", label: "Digital Workers" },         // demo
  { img: "/showcase/meadow-brighton.webp", label: "Meadow Brighton" },         // real
  { img: "/showcase/aethera.webp", label: "Aethera" },                         // demo
  { img: "/showcase/foundation.webp", label: "Foundation", pos: "left top" },  // demo
  { img: "/showcase/launchex.webp", label: "Launchex" },                       // demo
];

interface CardProps {
  position: number;
  project: Project;
  onSelect: () => void;
  card: { w: number; h: number };
}

const ProjectCard: React.FC<CardProps> = ({ position, project, onSelect, card }) => {
  const isCenter = position === 0;
  const abs = Math.abs(position);

  // Opacity falls off toward the edges so the wrapping card is invisible when it jumps ends.
  const opacity = isCenter ? 1 : abs === 1 ? 0.8 : abs === 2 ? 0.52 : abs === 3 ? 0.28 : 0;
  const scale = isCenter ? 1 : Math.max(0.84, 1 - abs * 0.05);

  const interactive = !isCenter && opacity > 0;

  return (
    <div
      onClick={() => { if (interactive) onSelect(); }}
      {...(interactive
        ? {
            role: "button",
            tabIndex: 0,
            "aria-label": `View ${project.label}`,
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); }
            },
          }
        : {})}
      className={cn(
        // Only transform + opacity transition (compositor-friendly) — animating box-shadow/
        // border here as well made the glide feel heavier.
        "absolute left-1/2 top-1/2 overflow-hidden rounded-2xl border bg-ink-3 transition-[transform,opacity] duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/60",
        isCenter ? "z-30 cursor-default border-brand-blue/30" : "z-10 cursor-pointer border-line",
        opacity === 0 && "pointer-events-none",
      )}
      style={{
        width: card.w,
        height: card.h,
        opacity,
        transform: `
          translate(-50%, -50%)
          translateX(${card.w * 0.6 * position}px)
          translateY(${isCenter ? -18 : position % 2 ? 14 : -14}px)
          rotate(${isCenter ? 0 : position % 2 ? 1.5 : -1.5}deg)
          scale(${scale})
        `,
        boxShadow: isCenter
          ? "0 30px 70px -28px rgba(10,13,22,0.5)"
          : "0 14px 36px -22px rgba(10,13,22,0.3)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={project.img}
        alt={`${project.label} — website design`}
        loading="lazy"
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: project.pos ?? "center top" }}
        onError={(e) => { e.currentTarget.style.display = "none"; }}
      />
      {/* Slight scrim on the side cards so the focal one reads as forward. */}
      {!isCenter && <div className="pointer-events-none absolute inset-0 bg-ink/20" />}
    </div>
  );
};

export function WorkShowcase() {
  const n = projects.length;
  const [index, setIndex] = useState(0);
  const [card, setCard] = useState({ w: 480, h: 300 });

  const step = (dir: number) => setIndex((i) => (i + dir + n) % n);

  // Nearest-wrap offset of card `i` from the centred index, so cards can move either way and
  // the far ones wrap invisibly.
  const offsetOf = (i: number) => {
    let off = i - index;
    if (off > n / 2) off -= n;
    if (off < -n / 2) off += n;
    return off;
  };

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w >= 1024) setCard({ w: 480, h: 300 });
      else if (w >= 640) setCard({ w: 380, h: 245 });
      else setCard({ w: 290, h: 190 });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div className="relative w-full overflow-hidden" style={{ height: card.h + 200 }}>
      {projects.map((project, i) => (
        <ProjectCard
          key={project.img}
          project={project}
          position={offsetOf(i)}
          card={card}
          onSelect={() => setIndex(i)}
        />
      ))}

      <div className="absolute bottom-4 left-1/2 z-40 flex -translate-x-1/2 gap-3">
        <button
          onClick={() => step(-1)}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-ink text-foreground shadow-sm transition-colors hover:border-brand-blue/40 hover:bg-ink-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/60"
          aria-label="Previous project"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => step(1)}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-ink text-foreground shadow-sm transition-colors hover:border-brand-blue/40 hover:bg-ink-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/60"
          aria-label="Next project"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
