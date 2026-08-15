import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

// The wildcard rule already lets every well-behaved crawler in — search engines and AI bots
// alike. The named AI/answer-engine agents are listed explicitly so the intent is unambiguous
// (some, like Google-Extended and the OpenAI/Anthropic/Perplexity bots, are what people
// specifically want to confirm are welcome for AI-search / GEO visibility). `/privacy` and
// `/terms` are `noindex`, so they're disallowed here too to keep the signals consistent.
const AI_CRAWLERS = [
  "GPTBot",          // OpenAI (ChatGPT training/browse)
  "OAI-SearchBot",   // OpenAI search
  "ChatGPT-User",    // ChatGPT on-demand fetch
  "ClaudeBot",       // Anthropic
  "Claude-Web",      // Anthropic
  "anthropic-ai",    // Anthropic (legacy)
  "PerplexityBot",   // Perplexity
  "Google-Extended", // Google Gemini / Vertex AI training
  "Applebot-Extended", // Apple Intelligence
  "CCBot",           // Common Crawl (feeds many models)
  "Bytespider",      // TikTok / Doubao
];

export default function robots(): MetadataRoute.Robots {
  const disallow = ["/privacy", "/terms"];
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      { userAgent: AI_CRAWLERS, allow: "/", disallow },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
