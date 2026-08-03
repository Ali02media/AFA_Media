"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Container, SectionHeading } from "@/components/ui/section";
import { faqs } from "@/lib/site";
import { cn } from "@/lib/utils";

export function FAQ({
  limit,
  id = "faq",
  title,
}: {
  /** Show only the first N questions (e.g. a short pre-CTA teaser). Omit for all. */
  limit?: number;
  id?: string;
  title?: React.ReactNode;
} = {}) {
  const [open, setOpen] = useState<number | null>(0);
  // Bug A audit: an accordion panel whose `initial` is `height: 0, opacity: 0`
  // strands closed if the animation never runs. Instant, but still correct.
  const prefersReduced = useReducedMotion();
  const items = limit ? faqs.slice(0, limit) : faqs;

  return (
    <section id={id} className="relative py-28 sm:py-36">
      <Container className="max-w-3xl">
        <SectionHeading
          title={
            title ?? (
              <>
                Everything you might be{" "}
                <span className="text-gradient">wondering.</span>
              </>
            )
          }
        />

        <div className="mt-14 divide-y divide-line">
          {items.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div key={faq.q}>
                <button
                  className="flex w-full items-center justify-between gap-4 py-6 text-left"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                >
                  <span className={cn(
                    "font-display text-lg font-medium transition-colors duration-200",
                    isOpen ? "text-foreground" : "text-mist"
                  )}>
                    {faq.q}
                  </span>
                  <motion.span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
                      isOpen
                        ? "border-brand-blue/50 bg-brand-blue/10 text-brand-teal"
                        : "border-line bg-ink-3 text-mist-dim"
                    )}
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={prefersReduced ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 24 }}
                  >
                    <Plus className="h-4 w-4" />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={prefersReduced ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 20 }}
                      className="overflow-hidden"
                    >
                      <p className="pb-6 pr-12 text-[15px] leading-relaxed text-mist">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
