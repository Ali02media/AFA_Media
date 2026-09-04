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
    // Owner-supplied favicon set (favicon.io export). Two square PNG sizes for Android launchers
    // — the browser-tab and iOS home-screen icons live at app/favicon.ico + app/apple-icon.png
    // and are auto-discovered by Next's file conventions, so they don't belong in the manifest.
    //
    // No `maskable` entry: a proper maskable icon needs the mark inside a central 40% "safe
    // zone" with padding on all sides so Android's adaptive-shape crop (circle/squircle/…)
    // never clips it. The supplied 512 doesn't have that padding — using it here would put the
    // mark off-centre after cropping. Better none than wrong: without a maskable, Android just
    // uses this icon as-is inside its shape, which is fine.
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
