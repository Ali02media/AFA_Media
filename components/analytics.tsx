"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** GTM container ID, e.g. "GTM-XXXXXXX". Set NEXT_PUBLIC_GTM_ID in the host's environment
 *  variables. When it's absent nothing is injected at all, so local dev and previews stay clean
 *  and no half-configured container ever ships. */
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

/**
 * Google Tag Manager with Consent Mode v2.
 *
 * GTM is a container — it doesn't measure anything on its own. GA4 (and any future tags) are
 * added inside GTM's own UI at tagmanager.google.com and delivered from here. Whatever tags
 * GTM fires still write cookies, so under UK GDPR/PECR they need consent BEFORE they're set.
 *
 * The gate is Consent Mode: `analytics_storage` is defaulted to `denied` in the very first
 * gtag call, which runs BEFORE GTM's container script loads. GTM tags check this signal and
 * hold back cookies until it flips to `granted`. components/cookie-consent.tsx flips it if
 * the visitor accepts the banner — that's the only thing that lets cookies be written.
 *
 * `wait_for_update` gives our stored-choice restore a moment to run on first paint so an
 * already-consented returning visitor isn't briefly measured as denied.
 *
 * The <noscript> iframe part of GTM's official install goes in app/layout.tsx right after
 * the opening <body>, not here — this component only owns the <script> half.
 */
export function SiteAnalytics() {
  const pathname = usePathname();

  // Client-side navigations don't re-execute the GTM snippet, so page-view events have to be
  // pushed to the dataLayer manually. GTM's "History Change" trigger fires on the same signal;
  // pushing an explicit event lets you configure a GA4 pageview tag to fire on `event = page_view`
  // in the GTM UI, which is more reliable than relying on history-change on some SPAs.
  useEffect(() => {
    if (!GTM_ID || typeof window === "undefined") return;
    const w = window as unknown as { dataLayer?: unknown[] };
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ event: "page_view", page_path: pathname });
  }, [pathname]);

  if (!GTM_ID) return null;

  return (
    <>
      <Script
        id="gtm-consent-default"
        strategy="beforeInteractive"
        // Must run BEFORE GTM loads. If GTM fires its tags first, GA4 (or any consent-aware tag
        // inside the container) initialises with storage allowed and can set a cookie in the gap
        // between page load and the banner appearing. `beforeInteractive` guarantees the ordering.
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('consent', 'default', {
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
              analytics_storage: 'denied',
              wait_for_update: 500
            });
          `,
        }}
      />
      <Script
        id="gtm-container"
        strategy="afterInteractive"
        // The official GTM install snippet from tagmanager.google.com — copied verbatim so it
        // stays byte-identical to what Google publishes, then interpolated with the container
        // id. This appends gtm.js from Google's CDN and pushes gtm.start into the dataLayer.
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${GTM_ID}');
          `,
        }}
      />
    </>
  );
}

/**
 * The <noscript> half of GTM's install. Mounted once at the top of <body> in app/layout.tsx.
 * Rendered inline (not via <Script>) because it's the only way to guarantee the iframe is
 * where GTM's docs require it — literally the first child of <body>.
 */
export function GtmNoscript() {
  if (!GTM_ID) return null;
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
      />
    </noscript>
  );
}
