# Monster Siren Karaoke — Project Plan

## What This Is

A non-commercial fan web app for singing/practicing along with Monster Siren Records songs.
Streams audio and lyrics directly from MSR's own CDN — no redistribution of assets.

**Problems it solves vs existing karaoke apps:**
- Existing apps are region-locked or have low audio quality
- MSR provides timed LRC lyrics but no karaoke app uses them
- Offline karaoke stores rarely have MSR songs; this runs on the customer's own device

**Legal basis:** Yostar's Terms and Conditions of Re-creation allows non-commercial, non-profit derivative works by individuals that promote distribution of the game, with attribution. Streaming from MSR's own servers (not redistributing) keeps this clearly within those terms.

---

## Stack

| Concern | Choice |
|---|---|
| Framework | Vue 3 + Vite |
| State | Pinia |
| Routing | Vue Router 4 (hash history, for GitHub Pages) |
| Hosting | GitHub Pages |
| Backend | None — all data from MSR's public API |

---

## MSR API Reference

Base: `https://monster-siren.hypergryph.com/api/`

All responses are wrapped: `{ code: 0, msg: "", data: { list: [...] } }`

| Endpoint | Returns |
|---|---|
| `GET /api/songs` | Full catalog: `{cid, name, albumCid, artists}`, ~500 songs |
| `GET /api/song/:cid` | Detail: `{cid, name, albumCid, sourceUrl, lyricUrl, artists}` |
| `GET /api/albums` | All albums: `{cid, name, coverUrl, artistes}` |
| `GET /api/album/:cid/detail` | `{name, intro, belong, coverUrl, coverDeUrl, songs[]}` |

**Key facts:**
- Audio: WAV files from `res01.hycdn.cn` — direct CDN links, no auth
- Lyrics: LRC files from `web.hycdn.cn` — direct CDN links, no auth
- Instrumental versions = separate song entries with `(Instrumental)` in name
- `sourceUrl` and `lyricUrl` are nullable — handle gracefully
- LRC format: `[MM:SS.mmm]text` — some metadata lines at top, ignore non-lyric lines
- **CORS:** API requires a proxy from external origins (solved via Vite proxy in dev, Cloudflare Worker in production — see below)

---

## CORS Solution

The MSR API blocks cross-origin requests. Strategy:

**Dev:** Vite proxy in `vite.config.js` rewrites `/msr-api/*` → `https://monster-siren.hypergryph.com/*`

**Production (GitHub Pages):** Deploy a free Cloudflare Worker:
```js
export default {
  fetch(req) {
    const url = req.url.replace('https://your-worker.workers.dev', 'https://monster-siren.hypergryph.com')
    return fetch(url, { headers: req.headers }).then(res => {
      const r = new Response(res.body, res)
      r.headers.set('Access-Control-Allow-Origin', '*')
      return r
    })
  }
}
```
Then set `VITE_API_BASE=https://your-worker.workers.dev` in the GitHub Pages environment.

Audio/lyric CDN URLs (`hycdn.cn`) are fetched directly by the browser — no proxy needed.

---

## Language & Year Filtering

The MSR API has no language or year fields. Solutions:

### Language — auto-detect from LRC content at build time
```js
function detectLanguage(lrcText) {
  const t = lrcText.replace(/\[\d+:\d+[^\]]*\]/g, '')
  if (/[一-鿿㐀-䶿]/.test(t)) return 'chinese'
  if (/[Ѐ-ӿ]/.test(t)) return 'russian'
  if (/[぀-ヿ]/.test(t)) return 'japanese'
  if (/[a-zA-Z]/.test(t)) return 'english'
  return 'unknown'
}
```
Songs without lyrics → `'unknown'`. Instrumental entries (detected by name) → `'instrumental'`.

### Year — inferred from album CID order
Album CIDs are sequential integers. Higher CID = more recent. The build script maps CID rank → approximate year (2018 to present). Can be manually corrected in `metadata.json`.

Both are stored in `src/data/metadata.json` (keyed by `albumCid`):
```json
{
  "4507": { "year": 2021, "language": "chinese" },
  "6656": { "year": 2024, "language": "english" }
}
```
Regenerate with: `node scripts/fetch-metadata.js`

---

## Project Structure

```
monster_siren_karaoke/
├── src/
│   ├── api/
│   │   └── msr.js              # All MSR API fetch wrappers
│   ├── composables/
│   │   ├── useCatalog.js       # Loads + caches full catalog; filter state
│   │   ├── useLRCParser.js     # parseLRC(), findActiveLine(), detectLanguage()
│   │   └── useKaraokeSync.js   # audio timeupdate → reactive activeLine
│   ├── stores/
│   │   └── player.js           # Pinia: currentSong, playing, volume
│   ├── views/
│   │   ├── BrowseView.vue      # Song grid + FilterPanel
│   │   └── PlayerView.vue      # Karaoke player (lyrics + audio controls)
│   ├── components/
│   │   ├── SongCard.vue        # Card in the browse grid
│   │   ├── FilterPanel.vue     # Search input, language chips, year select
│   │   ├── LyricDisplay.vue    # Scrolling LRC with active-line highlight
│   │   └── AudioControls.vue   # Play/pause/seek/volume/instrumental toggle
│   ├── data/
│   │   └── metadata.json       # albumCid → {year, language}
│   ├── assets/
│   │   └── main.css            # Global CSS variables + resets
│   ├── router/index.js         # Hash history: / and /play/:cid
│   ├── App.vue
│   └── main.js
├── scripts/
│   └── fetch-metadata.js       # Node script to regenerate metadata.json
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions → GitHub Pages
├── PLAN.md                     # This file
├── vite.config.js
└── package.json
```

---

## Implementation Phases

### Phase 1 — Scaffold ✅
- Vue 3 + Vite project created
- vue-router + pinia installed
- vite.config.js: base path + dev proxy
- router, store, App.vue, main.js wired up

### Phase 2 — API Layer ✅
- `src/api/msr.js`: fetch wrappers for all endpoints
- `src/composables/useCatalog.js`: load catalog on mount, merge metadata, filter state
- Dev proxy verified: `/msr-api/api/songs` returns catalog correctly

### Phase 3 — Browse View ✅
- `BrowseView.vue`: song grid, result count, loading/error states
- `FilterPanel.vue`: search input, language chips, year select, clear button
- `SongCard.vue`: cover art, name, album, language/instrumental badge

### Phase 4 — Karaoke Core ✅
- `useLRCParser.js`: parseLRC() + binary-search findActiveLine() + detectLanguage()
- `useKaraokeSync.js`: watches audioEl ref, fires on timeupdate, returns activeLine
- `LyricDisplay.vue`: scrolls active line to center, past/active/future styling, click-to-seek
- `AudioControls.vue`: play/pause, seek bar, ±5s buttons, volume, instrumental toggle, fullscreen
- `PlayerView.vue`: blurred album art background, assembles all pieces, keyboard shortcuts

### Phase 5 — Metadata Script ✅
- `scripts/fetch-metadata.js`: fetches catalog, samples lyrics per album, writes metadata.json
- Run once, commit result, re-run when MSR adds new albums

### Phase 6 — GitHub Actions ✅
- `.github/workflows/deploy.yml`: build + deploy to GitHub Pages on push to main

### Phase 7 — Production CORS (TODO)
- Deploy Cloudflare Worker proxy
- Add `VITE_API_BASE` env var to GitHub Pages environment
- Update `src/api/msr.js` to use `import.meta.env.VITE_API_BASE ?? '/msr-api'`

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| Space | Play / Pause |
| ← | Seek back 5s |
| → | Seek forward 5s |
| F | Toggle fullscreen |

Clicking any lyric line seeks audio to that line's timestamp.

---

## Verification Checklist

Run `npm run dev` and go through each section in order.

### 1. Startup & Catalog
- [ ] `npm run dev` starts without errors
- [ ] Browse view loads catalog — result count shows ~500+ songs
- [ ] Album cover images load (cover art appears in song cards)

### 2. Search
- [ ] Search "don't miss it" — finds the song instantly (no network call)
- [ ] Search by artist name (e.g. "PREWVY") narrows the list
- [ ] Search by album name (e.g. "Lingering Remnants") finds songs from that album
- [ ] Clearing the search box restores full list

### 3. Language Filter
- [ ] Select **中文** — shows Chinese songs only; "Don't Miss It" (Russian) does NOT appear
- [ ] Confirm "in your blue eyes" does NOT appear under 中文 (it's Japanese)
- [ ] Select **Русский** — "Don't Miss It" and other Russian songs appear
- [ ] Select **日本語** — "in your blue eyes" and other Japanese songs appear
- [ ] Select **粤語** — shows Cantonese-tagged songs (Yanking/花街迎春/Missy)
- [ ] Select **閩南語** — shows 浸春芜 and its instrumental pair
- [ ] Select **Latin** — shows 冬涤 and Mare Natus
- [ ] Select **Instrumental** — shows only instrumental-tagged songs
- [ ] Select **No Lyrics** — shows songs without a lyric file
- [ ] No-lyrics songs do NOT appear when only language chips (中文 etc.) are selected

### 4. Year Filter
- [ ] Year dropdown shows years in descending order
- [ ] Selecting a year filters to that release year; combining with language filter works

### 5. Filter Persistence (back navigation)
- [ ] Set a language filter, click any song, press browser Back
- [ ] Filter is still active on return — same chips highlighted, same songs shown
- [ ] Search text and year filter also persist on back navigation

### 6. Song Cards & Badges
- [ ] Chinese songs show badge "中文", Russian "Русский", Japanese "日本語"
- [ ] Cantonese songs show "粤語", Hokkien "閩南語", Latin "Latin"
- [ ] Instrumental songs show badge "Instrumental" (purple-ish color)
- [ ] No-lyrics songs show NO language badge

### 7. Player Load
- [ ] Clicking a song navigates to `/play/:cid`
- [ ] Album art appears as blurred background; song title and artist display correctly
- [ ] Audio starts playing (or play button works)

### 8. Audio Playback
- [ ] Play/pause, seek bar, ±5s buttons, volume slider all work
- [ ] Audio plays to end without interruption

### 9. Lyrics Display & Sync
- [ ] Open "Don't Miss It" — lyrics appear in Russian (not Chinese or garbled)
- [ ] Active lyric line auto-scrolls to center as song progresses
- [ ] Past lines dimmed, active line highlighted (accent color, larger)
- [ ] Clicking a lyric line seeks audio to that timestamp
- [ ] Production credit lines do NOT appear (no 作词/作曲 lines)

### 10. Instrumental Toggle
- [ ] Open a vocal song with a pair (e.g. Closure, 浸春芜) — toggle button visible
- [ ] Toggle switches to instrumental; playback position preserved
- [ ] Toggle back to vocal works
- [ ] Open an instrumental song directly — toggle switches to vocal pair
- [ ] Song without a pair — no toggle button shown

### 11. No-Lyrics Songs
- [ ] "No lyrics available" shown (no crash, no blank screen)

### 12. Keyboard Shortcuts
- [ ] Space = play/pause, ← = back 5s, → = forward 5s, F = fullscreen
- [ ] Shortcuts do NOT fire when typing in the search box

### 13. Fullscreen & Mobile
- [ ] Fullscreen button and F key work; Esc exits
- [ ] On narrow screen (< 640px): filter panel stacks above grid
- [ ] Player lyrics readable on phone-sized screen

---

## Out of Scope (v1)

- User accounts / favorites
- Offline audio caching (legally gray; unnecessary since MSR is accessible wherever needed)
- PWA / installable app
- Microphone input / pitch detection
- Playlist queue management
