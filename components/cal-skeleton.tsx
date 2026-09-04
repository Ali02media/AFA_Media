/**
 * Loading placeholder for the Cal.com inline embed.
 *
 * Rendered as the FIRST child of the calendar container. Because Cal appends its own iframe
 * as a sibling and that iframe paints an opaque background, we don't need to hide the
 * skeleton ourselves — it simply disappears behind the iframe once Cal boots. No timers,
 * no MutationObserver, no risk of a lingering placeholder.
 *
 * Styled to hint at a calendar (header row + grid of day cells) rather than a generic block,
 * so if there's any perceptible wait the user reads "your calendar is loading" instead of
 * "the page is broken". `aria-hidden` because it's decorative — the real widget (and its
 * own accessible content) arrives shortly.
 */
export function CalSkeleton() {
  const cells = Array.from({ length: 35 });
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 flex flex-col gap-4 rounded-2xl bg-white p-6"
    >
      <div className="flex items-center justify-between">
        <div className="h-5 w-32 animate-pulse rounded bg-slate-200/80" />
        <div className="flex gap-2">
          <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200/80" />
          <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200/80" />
        </div>
      </div>
      <div className="grid flex-1 grid-cols-7 gap-2">
        {cells.map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-md bg-slate-200/60"
            // Faint stagger so the pulse feels alive instead of uniform.
            style={{ animationDelay: `${(i % 7) * 40}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
