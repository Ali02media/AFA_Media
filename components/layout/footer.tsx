import { Link } from "next-view-transitions";
import Image from "next/image";
import { Mail, Phone, MapPin, ArrowUpRight } from "lucide-react";
import { nav, site } from "@/lib/site";
import { CalButton } from "@/components/cal";

export function Footer() {
  return (
    <footer className="relative border-t border-line bg-ink-2">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 md:grid-cols-[1.5fr_1fr_1.4fr]">
        {/* Brand */}
        <div>
          <Image
            src="/afa-logo.png"
            alt="AFA Media"
            width={150}
            height={120}
            className="h-11 w-auto"
          />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-mist">
            Helping UK service businesses scale through high-converting websites,
            AI assistants and paid growth — all under one roof.
          </p>
          <p className="mt-6 text-xs text-mist-dim">
            GDPR compliant · UK-based · Est. 2025
          </p>
        </div>

        {/* Nav */}
        <div>
          <h4 className="text-xs font-medium uppercase tracking-widest text-mist-dim">
            Navigation
          </h4>
          <ul className="mt-5 space-y-3 text-sm">
            <li>
              <Link href="/" className="text-mist transition-colors hover:text-foreground">
                Home
              </Link>
            </li>
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-mist transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact + CTA */}
        <div>
          <h4 className="text-xs font-medium uppercase tracking-widest text-mist-dim">
            Get in touch
          </h4>
          <ul className="mt-5 space-y-4 text-sm">
            <li>
              <a
                href={site.phoneHref}
                className="flex items-center gap-3 text-mist transition-colors hover:text-foreground"
              >
                <Phone className="h-4 w-4 shrink-0 text-brand-teal" />
                {site.phone}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${site.email}`}
                className="flex items-center gap-3 text-mist transition-colors hover:text-foreground"
              >
                <Mail className="h-4 w-4 shrink-0 text-brand-teal" />
                {site.email}
              </a>
            </li>
            <li className="flex items-center gap-3 text-mist">
              <MapPin className="h-4 w-4 shrink-0 text-brand-teal" />
              {site.location}
            </li>
          </ul>
          <CalButton className="bg-gradient-brand glow-cta mt-7 inline-flex h-12 items-center gap-2 rounded-full px-6 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5">
            Book a Free Call
            <ArrowUpRight className="h-4 w-4" />
          </CalButton>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-6 text-xs text-mist-dim sm:flex-row sm:px-8">
          <p>© {new Date().getFullYear()} AFA Media. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="transition-colors hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-foreground">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
