import type { NextConfig } from "next";

// Content-Security-Policy.
//
// `'unsafe-inline'` is present for scripts and styles because this app ships inline styles
// (the hero and several components use style objects) and Next's own bootstrap inline script;
// a nonce-based policy needs middleware on every request, which a fully static site doesn't
// have. That weakens the anti-XSS value of the policy, but the rest still earns its place:
// the site renders no user-supplied content, so the realistic threats are injected third-party
// scripts, clickjacking and base-tag hijacking — all of which `default-src`, `object-src`,
// `base-uri`, `form-action` and `frame-ancestors` do block.
//
// app.cal.com is allowed for scripts, frames and XHR because the booking embed loads
// embed.js from there and mounts a cross-origin iframe.
// React's dev build uses eval() for debugging features (rebuilding callstacks across
// environments); its production build never does. Allowing it only in development keeps the
// shipped policy strict without breaking the local dev server.
const isDev = process.env.NODE_ENV === "development";

const csp = [
  "default-src 'self'",
  // googletagmanager.com serves gtag.js (GA4). google-analytics.com is where the measurement
  // beacons are POSTed — without it in connect-src every hit is silently blocked.
  // clarity.ms serves Microsoft Clarity's tracking snippet (session replays + heatmaps).
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://app.cal.com https://www.googletagmanager.com https://www.clarity.ms`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  // *.clarity.ms covers the collector endpoints Clarity POSTs session data to (a.clarity.ms,
  // b.clarity.ms, region-specific hosts) — without this the recordings fail silently.
  "connect-src 'self' https://app.cal.com https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com https://*.clarity.ms",
  // googletagmanager.com is needed for GTM's <noscript> iframe fallback (JS-disabled visitors).
  "frame-src https://app.cal.com https://cal.com https://www.googletagmanager.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  // HSTS: force HTTPS for a year, including subdomains. `preload` is set because the apex is
  // HTTPS-only; remove it if a plain-HTTP subdomain is ever needed.
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
  // Stop browsers MIME-sniffing a response into something executable.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Send the origin (not the full path) to other sites; full URL stays same-origin.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Legacy clickjacking defence for browsers predating frame-ancestors.
  { key: "X-Frame-Options", value: "DENY" },
  // Deny hardware/API access the site never uses.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Content-Security-Policy", value: csp },
];

const nextConfig: NextConfig = {
  // Drop `X-Powered-By: Next.js` — free version disclosure for an attacker fingerprinting the
  // stack against known CVEs.
  poweredByHeader: false,

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },

  async redirects() {
    return [
      // The old "About" page became /process, then was rebuilt as "Our Philosophy & System"
      // at /philosophy. Permanent (308) redirects from BOTH prior URLs so search-engine
      // ranking transfers and any existing inbound link or bookmark still lands somewhere real
      // instead of a 404. Both point straight at the final URL — no redirect chain.
      { source: "/about", destination: "/philosophy", permanent: true },
      { source: "/process", destination: "/philosophy", permanent: true },
    ];
  },
};

export default nextConfig;
