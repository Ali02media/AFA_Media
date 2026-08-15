"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

/**
 * Vercel Web Analytics + Speed Insights.
 *
 * Chosen over GA4 deliberately: both are cookieless, so no consent banner is required under UK
 * GDPR and nothing contradicts the "essential cookies only" line in /privacy. Both also load
 * from our own origin (`/_vercel/…`, proxied by Vercel), so the Content-Security-Policy needs
 * no third-party allowance.
 *
 * These endpoints only exist on Vercel; locally and on other hosts the requests 404 harmlessly.
 * Web Analytics and Speed Insights each need enabling for the project in the Vercel dashboard
 * before data appears.
 *
 * Using the React components (rather than raw script tags) keeps `track()` available for custom
 * conversion events later — e.g. counting "Book a Call" clicks — and reports parameterised
 * routes if dynamic segments are ever added.
 */
export function SiteAnalytics() {
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
