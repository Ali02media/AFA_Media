"use client";

import { useEffect } from "react";
import { site } from "@/lib/site";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Official Cal.com embed bootstrap (from the embed snippet), typed loosely.
function bootstrapCal() {
  const C = window as any;
  const A = "https://app.cal.com/embed/embed.js";
  const L = "init";
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
  return C.Cal;
}

/** Mount once near the root. Loads Cal, inits the namespace, sets dark UI. */
export function CalProvider() {
  useEffect(() => {
    const Cal = bootstrapCal();
    Cal("init", site.cal.namespace, { origin: "https://app.cal.com" });
    Cal.ns[site.cal.namespace]("ui", {
      hideEventTypeDetails: false,
      layout: "month_view",
      cssVarsPerTheme: {
        light: { "cal-brand": "#2c87d0" },
        dark: { "cal-brand": "#2c87d0" },
      },
      theme: "dark",
    });
  }, []);
  return null;
}

const calAttrs = {
  "data-cal-link": site.cal.link,
  "data-cal-namespace": site.cal.namespace,
  "data-cal-config": JSON.stringify({
    layout: "month_view",
    useSlotsViewOnSmallScreen: "true",
  }),
};

/** A button that opens the Cal popup on click (handled by embed.js). */
export function CalButton({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button type="button" className={className} {...calAttrs}>
      {children}
    </button>
  );
}

/** Inline Cal embed for the contact page. */
export function CalInline() {
  useEffect(() => {
    const Cal = bootstrapCal();
    Cal("init", site.cal.namespace, { origin: "https://app.cal.com" });
    Cal.ns[site.cal.namespace]("inline", {
      elementOrSelector: "#cal-inline",
      config: { layout: "month_view", theme: "dark" },
      calLink: site.cal.link,
    });
    Cal.ns[site.cal.namespace]("ui", {
      hideEventTypeDetails: false,
      layout: "month_view",
      theme: "dark",
    });
  }, []);
  return (
    <div
      id="cal-inline"
      className="min-h-[640px] w-full overflow-hidden rounded-2xl"
      style={{ height: "640px" }}
    />
  );
}
