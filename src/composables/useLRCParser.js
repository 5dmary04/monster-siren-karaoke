// Parses LRC format into [{time: seconds, text: string}], sorted by time.
// Handles [MM:SS.mmm] and [MM:SS.xx] formats.
export function parseLRC(raw) {
  if (!raw) return []
  const lines = []
  for (const line of raw.replace(/\r/g, '').split('\n')) {
    const match = line.match(/^\[(\d+):(\d+(?:\.\d+)?)\](.*)$/)
    if (!match) continue
    const time = parseInt(match[1]) * 60 + parseFloat(match[2])
    const text = match[3].trim()
    if (text) lines.push({ time, text })
  }
  return lines.sort((a, b) => a.time - b.time)
}

// Returns the index of the active line for a given currentTime, or -1 if before the first line.
// Uses binary search for efficiency.
export function findActiveLine(lines, currentTime) {
  if (!lines.length) return -1
  if (currentTime < lines[0].time) return -1
  let lo = 0, hi = lines.length - 1, result = 0
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (lines[mid].time <= currentTime) {
      result = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return result
}

// Detect dominant language from LRC text by Unicode block sampling.
export function detectLanguage(lrcText) {
  if (!lrcText) return 'unknown'
  const stripped = lrcText.replace(/\[\d+:\d+[^\]]*\]/g, '')
  if (/[一-鿿㐀-䶿]/.test(stripped)) return 'chinese'
  if (/[Ѐ-ӿ]/.test(stripped)) return 'russian'
  if (/[぀-ヿ]/.test(stripped)) return 'japanese'
  if (/[a-zA-Z]/.test(stripped)) return 'english'
  return 'unknown'
}
