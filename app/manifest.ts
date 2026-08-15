import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AFA Media",
    short_name: "AFA Media",
    description: "Marketing that gets your phone ringing — websites, AI chatbots and paid ads for UK service businesses.",
    start_url: "/",
    display: "standalone",
    // Match the site (light surface / white navbar) and the viewport themeColor in layout.tsx —
    // these were previously #05060a (near-black), contradicting the white theme elsewhere.
    background_color: "#ffffff",
    theme_color: "#ffffff",
    // Square icons cropped from the logo mark. The previous entries both pointed at
    // /afa-logo.png — a 560x445 image with the wordmark — so the declared sizes were a lie and
    // launchers letterboxed it. `maskable` is a separate asset because Android crops adaptive
    // icons to a circle/squircle and would otherwise clip the hexagon's corners.
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
