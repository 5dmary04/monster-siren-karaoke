const BASE = import.meta.env.VITE_API_BASE ?? '/msr-api'

async function get(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Referer: 'https://monster-siren.hypergryph.com/' },
  })
  if (!res.ok) throw new Error(`MSR API ${res.status}: ${path}`)
  const json = await res.json()
  // MSR wraps responses in { status: 0, msg: 'success', data: ... }
  if (json.code !== undefined && json.code !== 0) throw new Error(json.msg)
  return json.data ?? json
}

export const fetchSongs = () => get('/api/songs')
export const fetchSong = cid => get(`/api/song/${cid}`)
export const fetchAlbums = () => get('/api/albums')
export const fetchAlbum = cid => get(`/api/album/${cid}/detail`)

// All web.hycdn.cn assets (lyrics, images) require Referer: monster-siren.hypergryph.com.
// Route them through our proxy so the browser never hits the CDN directly.
// VITE_CDN_BASE is set to the Cloudflare Worker URL in production.
const CDN_BASE = import.meta.env.VITE_CDN_BASE ?? '/msr-cdn'

export function cdnUrl(url) {
  if (!url) return ''
  return url.replace('https://web.hycdn.cn', CDN_BASE)
}

export async function fetchLRC(url) {
  const res = await fetch(cdnUrl(url))
  if (!res.ok) throw new Error(`LRC fetch failed: ${res.status}`)
  return res.text()
}
