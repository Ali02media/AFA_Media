"use client";

import { useEffect } from "react";
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

    // Lazy init (mirrors booking-calendar.tsx): only load Cal's third-party iframe once the
    // embed scrolls within ~600px of the viewport, not on page load. The fixed-height container
    // reserves the space so there's no layout shift. Only the inline instance — no second
    // `init`/`ui` pass (CalProvider owns bootstrap + `ui`; Bugs 21 + 22).
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
      id="cal-inline"
      className="min-h-[640px] w-full overflow-hidden rounded-2xl"
      style={{ height: "640px" }}
    />
  );
}
