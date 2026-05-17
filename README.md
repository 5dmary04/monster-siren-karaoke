# 塞壬唱片 Karaoke

A non-commercial fan karaoke web app for [Monster Siren Records](https://monster-siren.hypergryph.com/). Streams audio and lyrics directly from MSR's own servers — nothing is hosted or redistributed.

## Features

See [FEATURES.md](FEATURES.md) for the full feature list.

## Development

```bash
npm install
npm run dev
```

Requires Node 18+. The dev server proxies MSR API and CDN requests to handle CORS and CDN auth headers automatically.

## Metadata generation

Language detection, release year, and instrumental pairing data are stored in `src/data/metadata.json`. Regenerate after MSR releases new songs:

```bash
node scripts/fetch-metadata.js
```

## Stack

Vue 3 · Vite · Vue Router · no backend · GitHub Pages
