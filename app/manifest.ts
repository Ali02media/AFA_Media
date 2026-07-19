import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AFA Media",
    short_name: "AFA Media",
    description: "Marketing that gets your phone ringing — websites, AI chatbots, email and paid ads for UK service businesses.",
    start_url: "/",
    display: "standalone",
    background_color: "#05060a",
    theme_color: "#05060a",
    icons: [
      { src: "/afa-logo.png", sizes: "192x192", type: "image/png" },
      { src: "/afa-logo.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
