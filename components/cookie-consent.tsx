"use client";

import { useEffect, useState } from "react";
import { Link } from "next-view-transitions";

const STORAGE_KEY = "afa-cookie-consent";
export const CONSENT_EVENT = "afa:consent-changed";
type Choice = "granted" | "denied";

function setConsent(choice: Choice) {
  const gtag = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
  // Consent Mode update. Only `analytics_storage` is ever granted — we run no advertising or
  // remarketing tags, so the ad_* signals stay denied permanently.
  gtag?.("consent", "update", { analytics_storage: choice });
  // Fire a same-tab event so consent-gated components (Microsoft Clarity in particular) can
  // load themselves the moment consent flips to granted, without the visitor needing to reload
  // the page. localStorage doesn't emit a 'storage' event in the tab that changed it — that
  // event only fires in OTHER tabs — so we need our own signal for the current tab.
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: choice }));
}

/**
 * Cookie consent banner.
 *
 * GA4 writes `_ga` cookies, which UK GDPR/PECR treat as non-essential — they need opt-IN, so
 * analytics stays denied until the visitor actively accepts. Declining is a one-click action
 * given equal visual weight to accepting, which is what "freely given" consent requires; a
 * banner where refusing is harder than accepting is not valid consent.
 *
 * The choice persists in localStorage and is replayed into Consent Mode on every load, so a
 * returning visitor is never asked twice.
 */
export function CookieConsent() {
  // `null` = undecided and not yet checked; the banner stays hidden until we've read storage so
  // it can't flash for someone who already answered.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      // Private mode / storage blocked — fall through and just show the banner.
    }

    if (stored === "granted" || stored === "denied") {
      setConsent(stored);
      return;
    }
    setVisible(true);
  }, []);

  const choose = (choice: Choice) => {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // Non-fatal: consent still applies for this page view.
    }
    setConsent(choice);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      // `role="dialog"` (not alertdialog) + non-modal: it must not trap focus or block the page,
      // since a visitor is allowed to ignore it and keep reading.
      role="dialog"
      aria-live="polite"
      aria-label="Cookie preferences"
      className="fixed inset-x-0 bottom-0 z-[100] px-4 pb-4 sm:px-6 sm:pb-6"
    >
      {/* Solid, not `glass`: a translucent panel composites against whatever is behind it, and
          over the dark hero that landed at 3.31:1 contrast — below the 4.5:1 WCAG AA minimum.
          An opaque surface makes contrast deterministic on every page. */}
      <div className="mx-auto flex max-w-3xl flex-col gap-4 rounded-2xl border border-line bg-white p-5 shadow-xl sm:flex-row sm:items-center sm:gap-6 sm:p-6">
        <p className="flex-1 text-sm leading-relaxed text-mist">
          We use analytics cookies and anonymised session recordings to understand how visitors
          use the site — sensitive fields like forms are masked. They&apos;re optional: decline
          and nothing is stored or recorded. See our{" "}
          <Link
            href="/privacy"
            className="text-brand-blue-light underline underline-offset-2 transition-colors hover:text-brand-blue"
          >
            Privacy Policy
          </Link>
          .
        </p>

        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={() => choose("denied")}
            className="cta-type rounded-full border border-line px-5 py-2.5 text-sm font-medium text-mist transition-colors hover:border-mist-dim hover:text-foreground"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => choose("granted")}
            className="cta-type bg-gradient-brand rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
