"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { nav } from "@/lib/site";
import { CalButton } from "@/components/cal";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const overDarkHero = pathname === "/" && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <motion.header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background,border-color] duration-500",
          scrolled ? "glass-nav" : "border-b border-transparent bg-transparent"
        )}
        initial={{ y: -64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.1 }}
      >
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5" aria-label="AFA Media home">
            <Image
              src="/afa-logo.png"
              alt="AFA Media"
              width={132}
              height={105}
              className="h-9 w-auto"
              priority
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-8 md:flex">
            {nav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group relative text-sm font-medium transition-colors duration-200",
                    overDarkHero
                      ? active ? "text-white" : "text-white/70 hover:text-white"
                      : active ? "text-foreground" : "text-mist hover:text-foreground"
                  )}
                >
                  {item.label}
                  <span className={cn(
                    "absolute -bottom-0.5 left-0 h-px bg-gradient-to-r from-brand-blue to-brand-teal transition-all duration-300",
                    active ? "w-full" : "w-0 group-hover:w-full"
                  )} />
                </Link>
              );
            })}
            <CalButton className="bg-gradient-brand glow-cta inline-flex h-10 items-center gap-1.5 rounded-full px-5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5">
              Book a Call
              <ArrowUpRight className="h-4 w-4" />
            </CalButton>
          </div>

          {/* Mobile hamburger */}
          <motion.button
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg md:hidden",
              overDarkHero ? "text-white" : "text-foreground"
            )}
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            whileTap={{ scale: 0.9 }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {open ? (
                <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <X className="h-6 w-6" />
                </motion.span>
              ) : (
                <motion.span key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <Menu className="h-6 w-6" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </nav>
      </motion.header>

      {/* Mobile full-screen overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col bg-ink/96 px-6 pt-24 backdrop-blur-2xl md:hidden"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 90, damping: 22 }}
          >
            {/* Ambient orb in mobile menu */}
            <div className="orb orb-blue pointer-events-none absolute -right-32 top-20 h-72 w-72 opacity-40" />

            <nav className="flex flex-col gap-1">
              {nav.map((item, i) => {
                const active = pathname === item.href;
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring", stiffness: 80, damping: 18, delay: i * 0.06 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "block border-b border-line py-5 font-display text-3xl font-semibold transition-colors",
                        active ? "text-gradient" : "text-foreground hover:text-brand-teal-dark"
                      )}
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            <motion.div
              className="mt-8"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, type: "spring", stiffness: 80, damping: 20 }}
            >
              <CalButton className="bg-gradient-brand glow-cta inline-flex h-14 w-full items-center justify-center gap-2 rounded-full text-base font-semibold text-white">
                Book a Free Discovery Call
                <ArrowUpRight className="h-5 w-5" />
              </CalButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
