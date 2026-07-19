"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
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

const hidden = {
  up:    { opacity: 0, y: 28 },
  left:  { opacity: 0, x: -28 },
  scale: { opacity: 0, scale: 0.94 },
};

const visible = {
  opacity: 1,
  y: 0,
  x: 0,
  scale: 1,
};

export function Reveal({
  children,
  delay = 0,
  className,
  direction = "up",
  forceVisible = false,
}: RevealProps) {
  const prefersReduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  /* Render static on server + first paint to avoid hydration mismatch */
  if (!mounted || forceVisible) {
    return <div className={cn(className)}>{children}</div>;
  }

  return (
    <motion.div
      className={cn(className)}
      initial={hidden[direction]}
      whileInView={visible}
      viewport={{ once: true, amount: 0.12 }}
      transition={
        prefersReduced
          ? { duration: 0 }
          : { type: "spring", stiffness: 80, damping: 20, delay }
      }
    >
      {children}
    </motion.div>
  );
}
