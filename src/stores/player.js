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
  const pendingSeekTime = ref(null)  // applied in onCanPlay after new src loads
  const loadingDetail = ref(false)
  const detailError = ref(null)

  // Mode: 'karaoke' (scrolling lyrics + vocal/inst toggle) or 'listening' (future: repeat/playlist)
  const mode = ref('karaoke')

  // Survives navigation so back→player feels instant
  const prefetchCache = ref({})

  // Computed
  const audioSrc = computed(() => currentSong.value?.sourceUrl ?? '')
  const hasSong = computed(() => !!currentSong.value)
  const parsedLyrics = computed(() => parseLRC(lrcText.value))
  const activeLine = computed(() => findActiveLine(parsedLyrics.value, currentTime.value))
  const instrumentalCid = computed(() => currentSong.value?.pairedCid ?? null)

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

      // Fetch this song and its pair in parallel — eliminates first-toggle lag
      const [{ detail, lrcText: text }, pairedData] = await Promise.all([
        _fetchSongData(id),
        pairedCid ? _fetchSongData(pairedCid) : Promise.resolve(null),
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
    const savedLrc = lrcText.value
    usingInstrumental.value = !usingInstrumental.value
    shouldAutoplay.value = wasPlaying
    pendingSeekTime.value = savedTime  // applied in onCanPlay after new src loads
    try {
      const { detail, lrcText: text } = await _fetchSongData(targetCid)
      currentSong.value = _mergeCatalog(detail, targetCid)
      lrcText.value = text || savedLrc
    } catch {
      usingInstrumental.value = !usingInstrumental.value
      shouldAutoplay.value = false
    }
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
  }

  return {
    audioRef, currentSong, playing, volume, currentTime, duration,
    lrcText, usingInstrumental, shouldAutoplay, pendingSeekTime, loadingDetail, detailError,
    mode, prefetchCache,
    audioSrc, hasSong, parsedLyrics, activeLine, instrumentalCid,
    setAudioRef, playSong, toggleInstrumental, seekTo, togglePlay, setVolume, setMode,
  }
})
