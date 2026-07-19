"use client";

import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CalButton } from "@/components/cal";

const spring = { type: "spring" as const, stiffness: 70, damping: 18 };

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden:  { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: spring },
};

const trust = [
  "Live in 14 days",
  "No long contracts",
  "Or you don't pay setup",
];

const stats = [
  { value: "14", suffix: " days", label: "avg. delivery" },
  { value: "4",  suffix: "",      label: "services, 1 team" },
  { value: "24", suffix: "/7",    label: "AI lead capture" },
];

export function HeroMotion() {
  return (
    <div className="flex flex-col gap-20 lg:flex-row lg:items-center">
      {/* Left: copy */}
      <motion.div
        className="flex max-w-3xl flex-col items-start gap-7 lg:flex-1"
        variants={container}
        initial="hidden"
        animate="visible"
      >
        {/* Badge */}
        <motion.span
          variants={item}
          className="relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-mist backdrop-blur-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-brand-teal opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-teal" />
          </span>
          AI-powered marketing for UK service businesses
        </motion.span>

        {/* Headline */}
        <motion.h1
          variants={item}
          className="font-display text-5xl font-semibold leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-7xl"
        >
          One partner for{" "}
          <span className="text-gradient">everything</span> that
          <br className="hidden sm:block" /> grows your business.
        </motion.h1>

        {/* Subhead */}
        <motion.p variants={item} className="max-w-xl text-lg leading-relaxed text-mist sm:text-xl">
          Websites, AI chatbots, email and paid ads — built under one roof and
          engineered to do one thing:{" "}
          <span className="font-medium text-white">get your phone ringing.</span>
        </motion.p>

        {/* CTAs */}
        <motion.div variants={item} className="mt-1 flex flex-col gap-3 sm:flex-row">
          <CalButton className="bg-gradient-brand glow-cta group inline-flex h-14 items-center justify-center gap-2 rounded-full px-8 text-base font-semibold text-white transition-all duration-300 hover:-translate-y-0.5">
            Book a Free Discovery Call
            <ArrowUpRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </CalButton>
          <Button href="/services" variant="secondary" size="lg">
            See What We Do
          </Button>
        </motion.div>

        {/* Trust bullets */}
        <motion.div
          variants={item}
          className="mt-4 flex flex-wrap items-center gap-x-7 gap-y-3"
        >
          {trust.map((t) => (
            <span key={t} className="flex items-center gap-2 text-sm text-mist-dim">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-teal" />
              {t}
            </span>
          ))}
        </motion.div>
      </motion.div>

      {/* Right: floating stats card — desktop only */}
      <motion.div
        className="hidden shrink-0 lg:block"
        initial={{ opacity: 0, x: 40, y: 20 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ type: "spring", stiffness: 60, damping: 20, delay: 0.55 }}
      >
        <div className="glass flex w-64 flex-col gap-6 rounded-2xl p-6 shadow-[0_0_60px_-20px_rgba(44,135,208,0.3)]">
          <p className="text-xs font-medium uppercase tracking-widest text-mist-dim">
            What you get
          </p>
          <div className="grid grid-cols-3 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col gap-1">
                <p className="font-display text-2xl font-bold text-white">
                  {s.value}
                  <span className="text-brand-teal">{s.suffix}</span>
                </p>
                <p className="text-[11px] leading-tight text-mist-dim">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-white/[0.06] pt-5">
            <p className="text-xs italic leading-relaxed text-mist">
              &ldquo;It looks really professional. It&apos;s straight to the point, no fuss.&rdquo;
            </p>
            <p className="mt-2 text-[11px] text-mist-dim">— Oya, Service Business Owner</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
