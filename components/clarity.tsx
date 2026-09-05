"use client";

import Script from "next/script";
import { useEffect } from "react";
import { CONSENT_EVENT } from "@/components/cookie-consent";

/** Clarity project ID (e.g. "yd7q5vyevl"). Set NEXT_PUBLIC_CLARITY_ID in the host's env vars.
 *  Absent → component renders nothing, so local dev and PR previews stay clean. */
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID;
const STORAGE_KEY = "afa-cookie-consent";

/**
 * Microsoft Clarity — session recordings, click heatmaps, mouse-movement heatmaps.
 *
 * Kept OUT of Google Tag Manager on purpose. Session replays are a bigger privacy commitment
 * than analytics: they record what visitors do on the page frame-by-frame. That earns a
 * dedicated code-level gate rather than a Consent Mode signal buried in a GTM trigger.
 *
 * Consent model (per Clarity's docs):
 *   • The tag script loads on EVERY page. This is required for Clarity's server-side install
 *     verifier — it crawls the site without accepting cookies, so if we gated the <script>
 *     itself the project stays in "Almost There!" state forever with track:false.
 *   • Clarity's default behaviour is consent-first: loading the script sets NO cookies and
 *     records NO session until we push `clarity("consent")` explicitly. So loading the tag
 *     unconditionally is GDPR-safe.
 *   • On Accept, we call `clarity("consent")` which flips it into recording mode.
 *
 * Sensitive content masking is Clarity's default — password fields, credit-card inputs, any
 * element marked `data-clarity-mask="true"` — no server-side setup needed.
 */
export function Clarity() {
  useEffect(() => {
    // Grant consent if the visitor previously accepted (persists across reloads).
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      // Private mode / storage blocked — no-op, banner will handle it.
    }
    if (stored === "granted") {
      // Queue this — the Clarity library will drain the queue once its runtime finishes loading.
      const c = (window as unknown as { clarity?: (...a: unknown[]) => void }).clarity;
      c?.("consent");
    }

    // React to a fresh decision made in this tab.
    const onConsent = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail === "granted") {
        const c = (window as unknown as { clarity?: (...a: unknown[]) => void }).clarity;
        c?.("consent");
      }
    };
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, []);

  if (!CLARITY_ID) return null;

  return (
    <Script
      id="ms-clarity"
      strategy="afterInteractive"
      // Verbatim from https://clarity.microsoft.com/projects/view/${CLARITY_ID}/gettingstarted
      // with the project id interpolated. Kept byte-identical to Clarity's published snippet.
      dangerouslySetInnerHTML={{
        __html: `
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${CLARITY_ID}");
        `,
      }}
    />
  );
}
