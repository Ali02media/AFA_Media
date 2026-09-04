"use client";

import { useEffect } from "react";
import { getCal } from "@/components/cal";
import { CalSkeleton } from "@/components/cal-skeleton";
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
    const el = document.getElementById(EMBED_EL_ID);
    if (!el || el.dataset.calInit === "1") return;

    // Eager init: kick off the inline iframe as soon as the component mounts, so it's ready
    // before the user scrolls to it. We used to gate this behind an IntersectionObserver, but
    // that meant a fast scroller hit the CTA before the iframe had even started loading, which
    // is exactly the "slow calendar" the owner complained about. The layout's <link preconnect>
    // + <link preload> for app.cal.com have already warmed the network and cached embed.js by
    // the time we get here, so this useEffect just wires the iframe to a hot connection.
    //
    // We do defer past first paint via requestIdleCallback so the calendar's boot never
    // competes with the hero shader on the initial render.
    // (CalProvider owns bootstrap + `ui`; this only asks for the inline instance. The dataset
    // guard also prevents StrictMode double-mount from re-initialising the same element.)
    const init = () => {
      if (el.dataset.calInit === "1") return;
      el.dataset.calInit = "1";
      const Cal = getCal();
      Cal.ns[site.cal.namespace]("inline", {
        elementOrSelector: "#" + EMBED_EL_ID,
        config: { layout: "month_view", useSlotsViewOnSmallScreen: "true" },
        calLink: site.cal.link,
      });
    };

    const w = window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    };
    const handle = w.requestIdleCallback
      ? w.requestIdleCallback(init, { timeout: 1000 })
      : (window.setTimeout(init, 0) as unknown as number);

    return () => {
      const cancel = (window as unknown as { cancelIdleCallback?: (h: number) => void })
        .cancelIdleCallback;
      if (cancel) cancel(handle);
      else window.clearTimeout(handle);
    };
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
      //
      // `position: relative` anchors the skeleton behind Cal's injected iframe: the iframe's
      // opaque background paints over it the instant Cal boots, so the skeleton effectively
      // fades to nothing on its own — no timers, no MutationObserver.
      style={{ width: "100%", height: "100%", overflow: "hidden", position: "relative", ...style }}
    >
      <CalSkeleton />
    </div>
  );
}
