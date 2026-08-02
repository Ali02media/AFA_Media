import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // /about was renamed to /process. Permanent (308) so search engines transfer the page's
      // ranking to the new URL rather than treating it as brand new, and so any existing
      // inbound link or bookmark still lands somewhere real instead of a 404.
      { source: "/about", destination: "/process", permanent: true },
    ];
  },
};

export default nextConfig;
