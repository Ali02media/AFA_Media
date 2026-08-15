// Renders a JSON-LD <script>. One place that owns the serialization so every page injects
// structured data the same way. Server component — the script ships in the initial HTML, which
// is where crawlers (and AI answer engines) read it.
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // Content is our own build-time data (lib/schema.ts), never user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
