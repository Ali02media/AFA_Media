"use client";

import { useEffect } from "react";
import { getCal } from "@/components/cal";
import { site } from "@/lib/site";

// Cal.com INLINE embed — the booking calendar rendered directly on the page.
// Renders as ORDINARY, flat document flow, never inside the 3D MacBook transform, so clicks
// and scrolling work normally and there is nothing for the dissolve to disturb.
const EMBED_EL_ID = "afa-cal-inline";

export function BookingCalendar({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  useEffect(() => {
    // Bugs 21 + 23: this used to carry its own verbatim copy of the Cal bootstrap AND call
    // `init` + `ui` on the same namespace CalProvider had already configured, with a
    // conflicting brand colour (#00ccbd vs #2c87d0) and without resetting CalProvider's
    // theme. Last write won, so the brand colour depended on execution order — and the second
    // `ui` could restyle and re-measure the embed after load, feeding straight into the
    // ScrollTrigger desync (Bug 4). CalProvider is now the sole owner of bootstrap + `ui`;
    // this component only asks for its own inline instance, via the shared namespace/link.
    // Guard against re-entry. StrictMode double-mounts in dev, and any re-render that
    // remounts this effect calls `inline` again on an element Cal has already claimed —
    // which logged "Inline embed already exists. Ignoring this call" four times per load.
    // Harmless in itself, but it buries real warnings. Keyed on the element so a genuine
    // remount into a fresh node still initialises.
    const el = document.getElementById(EMBED_EL_ID);
    if (!el || el.dataset.calInit === "1") return;
    el.dataset.calInit = "1";

    const Cal = getCal();
    Cal.ns[site.cal.namespace]("inline", {
      elementOrSelector: "#" + EMBED_EL_ID,
      config: { layout: "month_view", useSlotsViewOnSmallScreen: "true" },
      calLink: site.cal.link,
    });
  }, []);

  return (
    <div
      id={EMBED_EL_ID}
      className={className}
      // Bug 5: `overflow: auto` made this its own scroll container, sitting under the cursor
      // at exactly the moment the reveal completes — so wheel events scrolled the calendar
      // first and only chained to the page once it hit its end, which reads as the page
      // "sticking". Cal sizes its own iframe to its content, so no scrollbar is needed here;
      // `hidden` also stops it ever becoming a scroll container again.
      style={{ width: "100%", height: "100%", overflow: "hidden", ...style }}
    />
  );
}
