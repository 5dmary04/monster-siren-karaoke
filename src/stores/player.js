import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchSong, fetchLRC } from '@/api/msr'
import { useCatalog } from '@/composables/useCatalog'
import { parseLRC, findActiveLine } from '@/composables/useLRCParser'

export const usePlayerStore = defineStore('player', () => {
  const catalog = useCatalog()

  // Audio element ref — set once by App.vue on mount
  const audioRef = ref(null)

  // Playback state
  const currentSong = ref(null)
  const playing = ref(false)
  const volume = ref(1)
  const currentTime = ref(0)
  const duration = ref(0)
  const lrcText = ref('')
  const usingInstrumental = ref(false)
  const shouldAutoplay = ref(false)
  const pendingSeekTime = ref(null)   // applied in onCanPlay after new src loads
  const switchStartTime = ref(null)   // performance.now() at toggle click; useAudioEngine adds elapsed to seek target
  const loadingDetail = ref(false)
  const detailError = ref(null)

  // Mode: 'karaoke' or 'listening' — persisted to localStorage so it survives page reloads
  const mode = ref(localStorage.getItem('playerMode') ?? 'karaoke')

  // Survives navigation so back→player feels instant
  const prefetchCache = ref({})

  // Computed
  // When usingInstrumental, pull the sourceUrl directly from the prefetch cache so
  // currentSong never has to change during a vocal↔instrumental toggle.
  const audioSrc = computed(() => {
    if (usingInstrumental.value && instrumentalCid.value) {
      const cached = prefetchCache.value[instrumentalCid.value]
      if (cached?.detail?.sourceUrl) return cached.detail.sourceUrl
    }
    return currentSong.value?.sourceUrl ?? ''
  })
  const hasSong = computed(() => !!currentSong.value)
  const parsedLyrics = computed(() => parseLRC(lrcText.value))
  const activeLine = computed(() => findActiveLine(parsedLyrics.value, currentTime.value))
  const instrumentalCid = computed(() => currentSong.value?.pairedCid ?? null)
  // sourceUrl of the paired track — used by App.vue to preload it in a hidden <audio>
  const pairedAudioSrc = computed(() => {
    const cid = instrumentalCid.value
    if (!cid) return ''
    return prefetchCache.value[cid]?.detail?.sourceUrl ?? ''
  })

  // --- Actions ---

  function setAudioRef(el) {
    audioRef.value = el
  }

  async function _fetchSongData(id) {
    if (prefetchCache.value[id]) return prefetchCache.value[id]
    const detail = await fetchSong(id)
    const text = detail.lyricUrl ? await fetchLRC(detail.lyricUrl) : ''
    const entry = { detail, lrcText: text }
    prefetchCache.value[id] = entry
    return entry
  }

  function _mergeCatalog(detail, id) {
    const catalogEntry = catalog.songs.value.find(s => s.cid === id)
    return {
      ...detail,
      albumName: catalogEntry?.albumName ?? currentSong.value?.albumName ?? '',
      coverUrl: catalogEntry?.coverUrl ?? currentSong.value?.coverUrl ?? '',
      pairedCid: catalogEntry?.pairedCid ?? null,
    }
  }

  async function playSong(id, { autoplay = true } = {}) {
    loadingDetail.value = true
    detailError.value = null
    shouldAutoplay.value = autoplay
    try {
      // Look up catalog entry early so we know pairedCid before any await
      const catalogEntry = catalog.songs.value.find(s => s.cid === id)
      const pairedCid = catalogEntry?.pairedCid ?? null

      // In karaoke mode prefetch both vocal and instrumental so toggle is instant.
      // In listening mode skip the paired track to avoid unnecessary network load.
      const loadPair = mode.value === 'karaoke' && pairedCid
      const [{ detail, lrcText: text }, pairedData] = await Promise.all([
        _fetchSongData(id),
        loadPair ? _fetchSongData(pairedCid) : Promise.resolve(null),
      ])

      currentSong.value = _mergeCatalog(detail, id)
      usingInstrumental.value = catalogEntry?.isInstrumental ?? false

      // Instrumental tracks have no lyricUrl — fall back to the paired vocal's lyrics
      lrcText.value = text || pairedData?.lrcText || ''
    } catch (e) {
      detailError.value = e.message
      shouldAutoplay.value = false
    } finally {
      loadingDetail.value = false
    }
  }

  async function toggleInstrumental() {
    const targetCid = instrumentalCid.value
    if (!targetCid) return
    const wasPlaying = playing.value
    const savedTime = audioRef.value?.currentTime ?? 0

    // Ensure target is in cache (karaoke mode prefetches it in playSong, but guard anyway)
    if (!prefetchCache.value[targetCid]) {
      try { await _fetchSongData(targetCid) } catch { return }
    }

    // Freeze display time now so activeLine / KaraokeDisplay don't flicker during src swap
    currentTime.value = savedTime
    usingInstrumental.value = !usingInstrumental.value  // audioSrc recomputes from cache (sync)
    shouldAutoplay.value = wasPlaying
    pendingSeekTime.value = savedTime   // applied in onCanPlay once new src is ready
    switchStartTime.value = performance.now()  // onCanPlay adds elapsed → compensates load lag
    // currentSong and lrcText are intentionally left unchanged — display stays the same
  }

  function seekTo(time) {
    if (!audioRef.value) return
    audioRef.value.currentTime = time
  }

  function togglePlay() {
    if (!audioRef.value) return
    if (playing.value) audioRef.value.pause()
    else audioRef.value.play()
  }

  function setVolume(v) {
    volume.value = v
    if (audioRef.value) audioRef.value.volume = v
  }

  function setMode(m) {
    mode.value = m
    localStorage.setItem('playerMode', m)
  }

  return {
    audioRef, currentSong, playing, volume, currentTime, duration,
    lrcText, usingInstrumental, shouldAutoplay, pendingSeekTime, switchStartTime, loadingDetail, detailError,
    mode, prefetchCache,
    audioSrc, pairedAudioSrc, hasSong, parsedLyrics, activeLine, instrumentalCid,
    setAudioRef, playSong, toggleInstrumental, seekTo, togglePlay, setVolume, setMode,
  }
})
