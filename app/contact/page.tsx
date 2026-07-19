import type { Metadata } from "next";
import { Mail, Phone, MapPin, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/section";
import { CalInline } from "@/components/cal";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Book a Free Discovery Call | AFA Media",
  description:
    "Book your free 30-minute discovery call with AFA Media. We'll map where you're losing leads and show you exactly how to fix it. No hard sell, just a plan.",
  alternates: { canonical: "/contact" },
};

const details = [
  { icon: Mail,    label: "Email",    value: site.email,    href: `mailto:${site.email}` },
  { icon: Phone,   label: "Phone",    value: site.phone,    href: site.phoneHref },
  { icon: MapPin,  label: "Location", value: site.location, href: null },
];

export default function ContactPage() {
  return (
    <main className="relative min-h-screen pb-24 pt-32 sm:pt-40">
      {/* Ambient */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="orb orb-blue absolute left-1/4 top-1/4 h-[500px] w-[500px] opacity-20" />
        <div className="orb orb-teal absolute right-1/3 bottom-1/4 h-[400px] w-[400px] opacity-15" />
      </div>

      <Container>
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-ink-3 px-4 py-1.5 text-xs font-medium text-mist">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-teal" />
            30 minutes, no obligation
          </span>
          <h1 className="mt-6 font-display text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
            Let&apos;s talk about{" "}
            <span className="text-gradient">your growth.</span>
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-mist">
            Pick a time that works for you. We&apos;ll map where you&apos;re
            losing leads and show you exactly what we&apos;d do about it.
          </p>
        </div>

        {/* Layout: Cal embed + sidebar */}
        <div className="mt-16 grid gap-10 lg:grid-cols-[1fr_320px]">
          {/* Cal inline */}
          <div className="glass rounded-3xl p-2">
            <CalInline />
          </div>

          {/* Sidebar */}
          <aside className="flex flex-col gap-6">
            {/* No hard sell guarantee */}
            <div className="flex gap-4 rounded-2xl border border-line bg-ink-2 p-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-blue/10">
                <ShieldCheck className="h-5 w-5 text-brand-teal" />
              </div>
              <div>
                <p className="font-display font-semibold text-foreground">No hard sell</p>
                <p className="mt-1 text-sm leading-relaxed text-mist">
                  This is a strategy conversation. You&apos;ll leave with clarity
                  regardless of whether we work together.
                </p>
              </div>
            </div>

            {/* What to expect */}
            <div className="rounded-2xl border border-line bg-ink-2 p-6">
              <p className="font-display font-semibold text-foreground">What to expect</p>
              <ul className="mt-4 space-y-3">
                {[
                  "We'll review your current online presence",
                  "Identify the #1 bottleneck losing you leads",
                  "Show you what we'd build and why",
                  "Give you a clear next step — even if it's DIY",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-mist">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-teal" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact details */}
            <div className="rounded-2xl border border-line bg-ink-2 p-6">
              <p className="font-display font-semibold text-foreground">Prefer to reach out?</p>
              <ul className="mt-4 space-y-3">
                {details.map(({ icon: Icon, label, value, href }) => (
                  <li key={label} className="flex items-center gap-3">
                    <Icon className="h-4 w-4 shrink-0 text-brand-blue-light" />
                    {href ? (
                      <a
                        href={href}
                        className="text-sm text-mist transition-colors hover:text-foreground"
                      >
                        {value}
                      </a>
                    ) : (
                      <span className="text-sm text-mist">{value}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </Container>
    </main>
  );
}
