import { Check, Minus, ArrowUpRight } from "lucide-react";
import { CalButton } from "@/components/cal";
import { plans, pricingFeatures } from "@/lib/site";
import { cn } from "@/lib/utils";

// A missing Mastery-only feature renders as an X on the Growth column — deliberately, not an
// oversight. Seeing a feature you don't get sit right next to one you do creates a small,
// subconscious loss-aversion nudge toward the higher tier, which a flat "here's what's
// included" list can't do. Every X here reflects a feature we actually discussed cutting from
// Growth (advanced AI training, page-aware prompts, 3D/animation, advanced SEO) — nothing is
// fabricated just for the effect.
function FeatureCell({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return <span className="text-sm text-mist">{value}</span>;
  }
  return value ? (
    <Check className="h-5 w-5 text-brand-teal" />
  ) : (
    <Minus className="h-5 w-5 text-mist-dim" />
  );
}

export function PricingComparison() {
  return (
    <div className="w-full">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-line bg-line lg:grid-cols-3">
        {/* Feature-label column — hidden on mobile (2-col: Growth | Mastery only) */}
        <div className="hidden bg-ink-2 lg:block" />

        {plans.map((plan) => (
          <div
            key={plan.id}
            className={cn(
              "relative flex flex-col gap-3 px-5 py-8 sm:px-8",
              plan.featured ? "bg-ink-3" : "bg-ink-2"
            )}
          >
            {plan.featured && (
              <span className="absolute -top-px left-1/2 -translate-x-1/2 rounded-b-full bg-gradient-brand px-4 py-1.5 text-xs font-semibold text-white">
                Recommended
              </span>
            )}
            <p className="font-display text-2xl font-semibold text-foreground">
              {plan.name}
            </p>
            <p className="min-h-[44px] text-sm leading-relaxed text-mist">
              {plan.blurb}
            </p>
            <div className="mt-2 flex items-end gap-1.5">
              <span className="font-display text-4xl font-bold tracking-tight text-foreground">
                £{plan.monthly}
              </span>
              <span className="mb-1 text-sm text-mist-dim">/month</span>
            </div>
            <p className="text-xs text-mist-dim">
              + £{plan.onboarding} one-time setup
            </p>
            <CalButton
              className={cn(
                "mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5",
                plan.featured
                  ? "bg-gradient-brand text-white shadow-[0_8px_30px_-8px_rgba(44,135,208,0.6)] hover:shadow-[0_12px_40px_-8px_rgba(25,176,161,0.7)]"
                  : "border border-line bg-ink-3 text-foreground hover:border-brand-blue/40 hover:bg-ink-4"
              )}
            >
              Get started
              <ArrowUpRight className="h-4 w-4" />
            </CalButton>
          </div>
        ))}

        {/* Feature rows */}
        {pricingFeatures.map((row) => (
          <div key={row.label} className="contents">
            <div className="hidden items-center bg-ink-2 px-6 py-4 text-sm text-mist lg:flex">
              {row.label}
            </div>
            <div className="flex flex-col justify-center gap-1 bg-ink-2 px-5 py-4 sm:px-8">
              <span className="text-xs uppercase tracking-wide text-mist-dim lg:hidden">
                {row.label}
              </span>
              <FeatureCell value={row.growth} />
            </div>
            <div className="flex flex-col justify-center gap-1 bg-ink-3 px-5 py-4 sm:px-8">
              <span className="text-xs uppercase tracking-wide text-mist-dim lg:hidden">
                {row.label}
              </span>
              <FeatureCell value={row.mastery} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
