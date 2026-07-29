"use client";

import { useEffect } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Cal.com INLINE embed (the booking calendar rendered directly on the page, not a popup).
// This is the snippet you provided, adapted to React: the same namespace ("30-min-meeting"),
// calLink and brand colour. It must render as ORDINARY, flat document flow — never inside the
// 3D MacBook transform — so clicks/scroll work and there's nothing for the handoff to bounce.
const EMBED_EL_ID = "afa-cal-inline";

export function BookingCalendar({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  useEffect(() => {
    // Official Cal bootstrap.
    (function (C: any, A: string, L: string) {
      const p = (a: any, ar: any) => a.q.push(ar);
      const d = C.document;
      C.Cal =
        C.Cal ||
        function (...ar: any[]) {
          const cal = C.Cal;
          if (!cal.loaded) {
            cal.ns = {};
            cal.q = cal.q || [];
            d.head.appendChild(d.createElement("script")).src = A;
            cal.loaded = true;
          }
          if (ar[0] === L) {
            const api: any = function (...a: any[]) {
              p(api, a);
            };
            const namespace = ar[1];
            api.q = api.q || [];
            if (typeof namespace === "string") {
              cal.ns[namespace] = cal.ns[namespace] || api;
              p(cal.ns[namespace], ar);
              p(cal, ["initNamespace", namespace]);
            } else p(cal, ar);
            return;
          }
          p(cal, ar);
        };
    })(window, "https://app.cal.com/embed/embed.js", "init");

    const Cal = (window as any).Cal;
    Cal("init", "30-min-meeting", { origin: "https://app.cal.com" });
    Cal.config = Cal.config || {};
    Cal.config.forwardQueryParams = true;
    Cal.ns["30-min-meeting"]("inline", {
      elementOrSelector: "#" + EMBED_EL_ID,
      config: { layout: "month_view", useSlotsViewOnSmallScreen: "true" },
      calLink: "ali-ahmed-lwiikf/30-min-meeting",
    });
    Cal.ns["30-min-meeting"]("ui", {
      cssVarsPerTheme: { light: { "cal-brand": "#00ccbd" } },
      hideEventTypeDetails: false,
      layout: "month_view",
    });
  }, []);

  return (
    <div
      id={EMBED_EL_ID}
      className={className}
      style={{ width: "100%", height: "100%", overflow: "auto", ...style }}
    />
  );
}
