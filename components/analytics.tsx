"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** GA4 Measurement ID, e.g. "G-XXXXXXXXXX". Set NEXT_PUBLIC_GA_ID in the host's environment
 *  variables. When it's absent nothing is injected at all, so local dev and previews stay clean
 *  and no half-configured tag ever ships. */
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

/**
 * Google Analytics 4 with Consent Mode v2.
 *
 * GA4 sets cookies (`_ga`, `_ga_*`), which under UK GDPR/PECR need consent BEFORE they're set.
 * The gate is Consent Mode: `analytics_storage` is defaulted to `denied` in the very first gtag
 * call, before the GA library initialises. While denied, GA sends cookieless pings only — no
 * identifiers stored on the device. components/cookie-consent.tsx flips it to `granted` if the
 * visitor accepts, and that's the only thing that lets cookies be written.
 *
 * `wait_for_update` gives our stored-choice restore a moment to run on first paint so an
 * already-consented returning visitor isn't briefly measured as denied.
 */
export function SiteAnalytics() {
  const pathname = usePathname();

  // Client-side navigations don't re-run the GA snippet, so page_view has to be sent manually.
  // Guarded on `gtag` existing: if consent was declined the queue simply never flushes cookies.
  useEffect(() => {
    if (!GA_ID || typeof window === "undefined") return;
    const gtag = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
    gtag?.("event", "page_view", { page_path: pathname });
  }, [pathname]);

  if (!GA_ID) return null;

  return (
    <>
      <Script
        id="ga-consent-default"
        strategy="beforeInteractive"
        // Must run BEFORE gtag.js loads, or GA initialises with storage allowed and can set a
        // cookie in the gap. `beforeInteractive` guarantees that ordering.
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
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script
        id="ga-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            gtag('js', new Date());
            gtag('config', '${GA_ID}', {
              anonymize_ip: true,
              send_page_view: true
            });
          `,
        }}
      />
    </>
  );
}
