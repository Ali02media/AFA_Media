"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
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
 * stricter gate than a Consent Mode signal buried in a GTM trigger. This component only
 * mounts the script once the visitor has actively pressed "Accept" on the banner — never
 * before, and never while it's the pending default of `denied`.
 *
 * Gate logic:
 *   • First render: check localStorage. If "granted", load immediately (returning visitor).
 *   • Otherwise: wait for the CONSENT_EVENT dispatched by cookie-consent.tsx, and load if it
 *     carries `"granted"`. If the visitor declines, this component never renders the script.
 *
 * Sensitive content masking is Clarity's default — password fields, credit-card inputs, any
 * element marked `data-clarity-mask="true"` — no server-side setup needed.
 */
export function Clarity() {
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    // Returning visitors who already granted — replay the stored decision immediately.
    try {
      if (localStorage.getItem(STORAGE_KEY) === "granted") setGranted(true);
    } catch {
      // Private mode / storage blocked — treat as no stored decision. Banner will still show.
    }

    // Fresh consent decisions in this tab.
    const onConsent = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      setGranted(detail === "granted");
    };
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, []);

  if (!CLARITY_ID || !granted) return null;

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
