#!/usr/bin/env node
// Fetches the MSR catalog and generates src/data/metadata.json
// with language detection and album ordering as a year proxy.
// Run: node scripts/fetch-metadata.js
//
// Requires Node 18+ (native fetch).

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'

const BASE = 'https://monster-siren.hypergryph.com'
const OUT = join(dirname(fileURLToPath(import.meta.url)), '../src/data/metadata.json')

async function get(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Referer: BASE + '/' },
  })
  const json = await res.json()
  return json.data ?? json
}

function detectLanguage(lrcText) {
  if (!lrcText) return 'unknown'
  // Only analyse timestamped lyric lines.
  const CREDIT_RE = /(?:词|曲|作词|作曲|演唱|编曲|吉他|混音|母带|监制|录音|和声|人声|主唱|制作人?|弦乐|钢琴|贝斯|配乐)[：:]|鹰角网络|版权|©/
  const stamped = lrcText.replace(/\r/g, '').split('\n')
    .filter(l => /^\[\d+:\d+/.test(l))
    .filter(l => !CREDIT_RE.test(l))   // drop production-credit lines wherever they appear
  const total = stamped.length
  if (total === 0) return 'unknown'
  // Skip first 2 (MSR production credits often stamped at 00:00) and
  // last 1 when there are >5 lines (copyright notices sometimes appear at the end).
  const slice = stamped.slice(2, total > 5 ? total - 1 : total)
  const t = slice.map(l => l.replace(/\[\d+:[^\]]*\]/g, '')).join(' ')
  if (!t.trim()) return 'unknown'
  // Check Kana before CJK: Japanese uses Hiragana/Katakana alongside Kanji,
  // and Kanji is inside the CJK block — checking CJK first misclassifies Japanese as Chinese.
  if (/[぀-ヿ]/.test(t)) return 'japanese'
  if (/[一-鿿㐀-䶿]/.test(t)) return 'chinese'
  if (/[Ѐ-ӿ]/.test(t)) return 'russian'
  if (/[a-zA-Z]/.test(t)) return 'english'
  return 'unknown'
}

async function fetchLRC(url) {
  try {
    const res = await fetch(url)
    return res.ok ? res.text() : ''
  } catch { return '' }
}

async function main() {
  // Preserve hand-maintained overrides and sublanguage tags across reruns.
  let overrides = {}
  let songSublangs = {}
  try {
    const existing = JSON.parse(readFileSync(OUT, 'utf8'))
    overrides = existing._overrides ?? {}
    songSublangs = existing._songSublangs ?? {}
  } catch {}

  console.log('Fetching album list…')
  const albumsData = await get('/api/albums')
  const albums = albumsData.list ?? albumsData
  console.log(`  ${albums.length} albums found`)

  console.log('Fetching songs…')
  const songsData = await get('/api/songs')
  const songs = songsData.list ?? songsData
  console.log(`  ${songs.length} songs found`)

  // Sort albums by cid (numeric ascending = chronological proxy)
  const sorted = [...albums].sort((a, b) => Number(a.cid) - Number(b.cid))
  const totalAlbums = sorted.length
  const currentYear = new Date().getFullYear()
  const START_YEAR = 2018
  const yearRange = currentYear - START_YEAR

  const meta = {}
  for (let i = 0; i < sorted.length; i++) {
    const album = sorted[i]
    const year = Math.round(START_YEAR + (i / totalAlbums) * yearRange)
    meta[album.cid] = { year }
  }

  // Detect language per vocal song (not per album — MSR albums regularly mix languages).
  const vocalSongs = songs.filter(s => !/instrumental/i.test(s.name))
  console.log(`Detecting languages for ${vocalSongs.length} non-instrumental songs (this takes a few minutes)…`)
  let done = 0
  const songLangs = {}

  for (const s of vocalSongs) {
    try {
      const detail = await get(`/api/song/${s.cid}`)
      if (detail.lyricUrl) {
        const lrc = await fetchLRC(detail.lyricUrl)
        const lang = detectLanguage(lrc)
        if (lang !== 'unknown') {
          songLangs[s.cid] = lang
        } else {
          // Has a lyricUrl with timestamp lines but language is undetectable.
          // Mark 'other' so the song stays visible under Vocal rather than No Lyrics.
          const hasLines = lrc.replace(/\r/g, '').split('\n').some(l => /^\[\d+:\d+/.test(l))
          if (hasLines) songLangs[s.cid] = 'other'
        }
      }
    } catch {}
    done++
    if (done % 50 === 0) console.log(`  ${done}/${vocalSongs.length} songs done`)
    await new Promise(r => setTimeout(r, 60))
  }

  // Build instrumental pairs by name matching.
  console.log('Detecting instrumental pairs…')
  const pairs = {}
  const instrumentalSongs = songs.filter(s => /instrumental/i.test(s.name))
  for (const inst of instrumentalSongs) {
    const baseName = inst.name.replace(/\s*\(instrumental\)/i, '').trim().toLowerCase()
    const vocal = songs.find(s =>
      !(/instrumental/i.test(s.name)) &&
      s.name.trim().toLowerCase() === baseName
    )
    if (vocal) {
      pairs[inst.cid] = vocal.cid
      pairs[vocal.cid] = inst.cid
    }
  }
  console.log(`  ${instrumentalSongs.length} instrumental songs, ${Object.keys(pairs).length / 2} pairs found`)

  // Apply overrides to vocals first, so instrumentals inherit the corrected language.
  for (const [cid, lang] of Object.entries(overrides)) {
    songLangs[cid] = lang
  }

  // Instrumentals inherit the language of their vocal pair.
  // If the instrumental itself has an explicit override, that wins instead.
  for (const inst of instrumentalSongs) {
    const vocalCid = pairs[inst.cid]
    if (vocalCid && songLangs[vocalCid] && !overrides[inst.cid]) {
      songLangs[inst.cid] = songLangs[vocalCid]
    }
  }

  writeFileSync(OUT, JSON.stringify({
    _pairs: pairs,
    _songLangs: songLangs,
    _overrides: overrides,
    _songSublangs: songSublangs,
    ...meta,
  }, null, 2))
  console.log(`\nWritten to ${OUT}`)
  console.log(`Albums: ${albums.length}, Songs with language: ${Object.keys(songLangs).length}, Pairs: ${Object.keys(pairs).length / 2}`)
}

main().catch(e => { console.error(e); process.exit(1) })
