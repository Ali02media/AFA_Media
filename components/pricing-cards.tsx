import { Check, ArrowUpRight, Zap } from "lucide-react";
import { CalButton } from "@/components/cal";
import { plans } from "@/lib/site";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/reveal";

export function PricingCards() {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {plans.map((plan, i) => (
        <Reveal key={plan.id} delay={i * 0.08}>
          <div
            className={cn(
              "group relative flex h-full flex-col overflow-hidden rounded-3xl p-8 transition-all duration-300 hover:-translate-y-1",
              plan.featured
                ? "border-gradient bg-ink-3 backdrop-blur-sm shadow-[0_0_60px_-20px_rgba(44,135,208,0.35)] hover:shadow-[0_0_80px_-16px_rgba(44,135,208,0.5)]"
                : "border border-line bg-ink-2 hover:border-brand-blue/20 hover:bg-ink-3"
            )}
          >
            {/* Featured ambient glow */}
            {plan.featured && (
              <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-brand-blue/20 blur-3xl transition-opacity duration-500 group-hover:opacity-150" />
            )}

            {/* Badge */}
            {plan.featured && (
              <span className="absolute -top-px left-8 inline-flex items-center gap-1.5 rounded-b-full bg-gradient-brand px-4 py-1.5 text-xs font-semibold text-white">
                <Zap className="h-3 w-3" />
                Most popular
              </span>
            )}

            {/* Plan name + blurb */}
            <h3 className="mt-4 font-display text-2xl font-semibold text-foreground">
              {plan.name}
            </h3>
            <p className="mt-2 min-h-[44px] text-sm leading-relaxed text-mist">
              {plan.blurb}
            </p>

            {/* Price */}
            <div className="mt-6 flex items-end gap-1.5">
              <span className="font-display text-5xl font-bold tracking-tight text-foreground">
                £{plan.monthly.toLocaleString()}
              </span>
              <span className="mb-2 text-sm text-mist-dim">/month</span>
            </div>
            <p className="mt-1 text-xs text-mist-dim">
              + £{plan.onboarding.toLocaleString()} one-time onboarding
            </p>

            {/* CTA */}
            <CalButton
              className={cn(
                "mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5",
                plan.featured
                  ? "bg-gradient-brand text-white shadow-[0_8px_30px_-8px_rgba(44,135,208,0.6)] hover:shadow-[0_12px_40px_-8px_rgba(25,176,161,0.7)]"
                  : "border border-line bg-ink-3 text-foreground hover:border-brand-blue/40 hover:bg-ink-4"
              )}
            >
              Get started
              <ArrowUpRight className="h-4 w-4" />
            </CalButton>

            {/* Feature list */}
            <ul className="mt-8 space-y-3 border-t border-line pt-7">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-mist">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-teal" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
