"use client";

import { useEffect } from "react";
import { CalSkeleton } from "@/components/cal-skeleton";
import { site } from "@/lib/site";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Official Cal.com embed bootstrap (from the embed snippet), typed loosely.
// EXPORTED (as getCal) because it must run exactly once per page: a second verbatim copy in
// booking-calendar.tsx was what allowed the same namespace to be initialised and configured
// twice with conflicting values (Bugs 21 + 23). One copy, one owner.
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

/** Bootstrap Cal and ensure the shared namespace exists. Safe to call from any component —
 *  the bootstrap is idempotent (`C.Cal || function…`) and `init` on an existing namespace is
 *  a no-op. Consumers use this to get at `Cal.ns[...]` WITHOUT re-configuring it: `ui` is
 *  owned solely by CalProvider (Bug 21). */
export function getCal() {
  const Cal = bootstrapCal();
  Cal("init", site.cal.namespace, { origin: "https://app.cal.com" });
  return Cal;
}

/** Mount once near the root. The single owner of Cal's bootstrap and `ui` configuration. */
export function CalProvider() {
  useEffect(() => {
    const Cal = getCal();
    Cal.ns[site.cal.namespace]("ui", {
      hideEventTypeDetails: false,
      layout: "month_view",
      cssVarsPerTheme: {
        light: { "cal-brand": "#2c87d0" },
        dark: { "cal-brand": "#2c87d0" },
      },
      // Bug 22: was "dark", but --color-ink is #ffffff — the site is white. That put a dark
      // calendar inside a white card on a white page, on both the homepage and /contact.
      // The dark theme is a leftover from an earlier dark design (the `ink`/`mist` token
      // names are from the same era).
      theme: "light",
    });
  }, []);
  return null;
}

/** Data attributes that make any element open the Cal popup (embed.js binds them globally).
 *  Exported so non-CalButton CTAs — e.g. the hero ShinyButton — can open the same booking
 *  modal without duplicating the config. */
export const calAttrs = {
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
    // cta-type: CTAs use the heading face (Montserrat), not the body face.
    <button type="button" className={`cta-type ${className ?? ""}`} {...calAttrs}>
      {children}
    </button>
  );
}

/** Inline Cal embed for the contact page. */
export function CalInline() {
  useEffect(() => {
    const el = document.getElementById("cal-inline");
    if (!el || el.dataset.calInit === "1") return;

    // Eager init: mount the iframe on mount, not on scroll. On /contact the calendar is the
    // primary content of the page — waiting for scroll made no sense, and it's what made the
    // owner call the calendar "slow". Only the inline instance — no second `init`/`ui` pass
    // (CalProvider owns bootstrap + `ui`; Bugs 21 + 22). Deferred behind requestIdleCallback so
    // it doesn't fight the page's initial paint. The layout's <link preconnect> + <link preload>
    // for app.cal.com mean embed.js is already cached when init runs.
    const init = () => {
      if (el.dataset.calInit === "1") return;
      el.dataset.calInit = "1";
      const Cal = getCal();
      Cal.ns[site.cal.namespace]("inline", {
        elementOrSelector: "#cal-inline",
        config: { layout: "month_view" },
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
    // `relative` anchors the skeleton; Cal's opaque iframe covers it once it paints.
    <div
      id="cal-inline"
      className="relative min-h-[640px] w-full overflow-hidden rounded-2xl"
      style={{ height: "640px" }}
    >
      <CalSkeleton />
    </div>
  );
}
