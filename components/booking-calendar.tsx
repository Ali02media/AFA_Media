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
    if (!el) return;

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

    // Load Cal only when the element is within 600px of the viewport — saves all Cal.com
    // requests on initial page load while still giving the iframe time to boot before the
    // user reaches the CTA section.
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          observer.disconnect();
          init();
        }
      },
      { rootMargin: "0px 0px 600px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
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
