import { trustPoints } from "@/lib/site";

export function TrustBar() {
  const items = [...trustPoints, ...trustPoints];
  return (
    <section className="relative border-y border-line bg-ink-2/50 py-5">
      <div className="relative flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_12%,#000_88%,transparent)]">
        <div className="flex shrink-0 animate-marquee items-center gap-12 pr-12">
          {items.map((point, i) => (
            <div key={i} className="flex items-center gap-3 whitespace-nowrap">
              <span className="h-1.5 w-1.5 rounded-full bg-gradient-brand" />
              <span className="text-sm font-medium tracking-tight text-mist">
                {point}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
