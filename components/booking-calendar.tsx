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
    const el = document.getElementById(EMBED_EL_ID);
    if (!el || el.dataset.calInit === "1") return;

    // Lazy init: only load Cal's third-party iframe once the calendar scrolls within ~600px of
    // the viewport, instead of on page load. The CTA (and this calendar) sits at the BOTTOM of
    // 4 pages — loading a live cross-origin booking iframe immediately on every one of them is a
    // heavy, wasted cost before anyone scrolls to it. The fixed-height container reserves the
    // space so there's no layout shift when it fills in.
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

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          init();
          io.disconnect();
        }
      },
      { rootMargin: "600px" },
    );
    io.observe(el);
    return () => io.disconnect();
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
