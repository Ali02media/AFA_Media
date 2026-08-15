WORK SHOWCASE IMAGES
====================

The fanned project showcase on /philosophy (components/ui/work-showcase.tsx) loads its
screenshots from THIS folder. Save each screenshot with the EXACT filename below (WebP
preferred for size; .jpg/.png also work if you also change the extension in work-showcase.tsx).

Cards are shown landscape and centre-cropped from the TOP, so a normal full-width website
screenshot (roughly 16:9, e.g. 1600×1000) looks best.

Required files:
  afa-media.webp          — the AFA Media "Marketing that gets your phone ringing" hero
  aurelia.webp            — AURELIA premium motion studio (dark cinematic room)
  foundation.webp         — "Foundation of the new digital epoch" (blue 3D tile)
  aethera.webp            — Aethera "Beyond silence, we build the eternal" (green valley)
  digital-workers.webp    — "Deploy digital workers for mundane workflows" (purple hills)
  launchex.webp           — Launchex prizes (liquid chrome)
  meadow-brighton.webp    — "The Perfect Lawn, All Year Round" before/after
  legentax.webp           — Legentax "Just a Call Away" accounting (green)

Cards show the screenshot only — no per-card title (they're a mix of demo and client work, so
the section copy carries that context instead of labelling each one). Until a file is present,
that card falls back to a neutral panel — nothing breaks. To add/remove/reorder cards, edit the
`projects` array in components/ui/work-showcase.tsx.
