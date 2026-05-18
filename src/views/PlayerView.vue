<template>
  <div ref="playerEl" class="player" :style="bgStyle">
    <div class="blur-bg" :style="bgStyle"></div>

    <nav class="top-bar">
      <button class="back-btn" @click="$router.back()">← Back</button>
      <div class="top-info">
        <span class="album-name">{{ song?.albumName ?? '' }}</span>
      </div>
    </nav>

    <div v-if="loadingDetail" class="center-state">Loading…</div>
    <div v-else-if="detailError" class="center-state error">{{ detailError }}</div>

    <template v-else>
      <div class="lyrics-area">
        <LyricDisplay
          :lines="parsedLyrics"
          :activeLine="activeLine"
          @seek="seekTo"
        />
      </div>

      <footer class="controls-footer">
        <AudioControls
          :song="song"
          :playing="playing"
          :currentTime="currentTime"
          :duration="duration"
          :volume="volume"
          :hasInstrumental="!!instrumentalCid"
          :instrumentalMode="usingInstrumental"
          :isFullscreen="isFullscreen"
          v-model:volume="volume"
          @toggle="togglePlay"
          @seek="seekTo"
          @toggleInstrumental="toggleInstrumental"
          @fullscreen="toggleFullscreen"
        />
      </footer>
    </template>

    <audio
      ref="audioEl"
      :src="audioSrc"
      :volume="volume"
      @play="playing = true"
      @pause="playing = false"
      @ended="playing = false"
      @durationchange="duration = audioEl?.duration ?? 0"
      @canplay="tryAutoplay"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { fetchSong, fetchLRC } from '@/api/msr'
import { useCatalog } from '@/composables/useCatalog'
import { useKaraokeSync } from '@/composables/useKaraokeSync'
import { parseLRC } from '@/composables/useLRCParser'
import LyricDisplay from '@/components/LyricDisplay.vue'
import AudioControls from '@/components/AudioControls.vue'

const props = defineProps({ cid: String })
const route = useRoute()
const cid = computed(() => props.cid ?? route.params.cid)

// DOM refs
const playerEl = ref(null)
const audioEl = ref(null)

// State
const song = ref(null)
const lrcText = ref('')
const loadingDetail = ref(true)
const detailError = ref(null)
const playing = ref(false)
const duration = ref(0)
const volume = ref(1)
const usingInstrumental = ref(false)
const isFullscreen = ref(false)

// Pre-fetched instrumental/vocal data so the toggle feels instant
const prefetchCache = ref({})  // cid → { detail, lrcText }

// Catalog access (for cover art, album name, instrumental pairing).
// load() is safe to call multiple times — it no-ops if already loaded.
const { songs, load: loadCatalog } = useCatalog()
onMounted(loadCatalog)

const instrumentalCid = computed(() => song.value?.pairedCid ?? null)

const audioSrc = computed(() => {
  if (!song.value) return ''
  return song.value.sourceUrl ?? ''
})

// Karaoke sync
const parsedLyrics = computed(() => parseLRC(lrcText.value))
const { activeLine, currentTime } = useKaraokeSync(audioEl, parsedLyrics)

// Album cover for background
const bgStyle = computed(() => {
  const url = song.value?.coverUrl
  return url ? { '--cover-url': `url(${url})` } : {}
})

async function fetchSongData(id) {
  if (prefetchCache.value[id]) return prefetchCache.value[id]
  const detail = await fetchSong(id)
  const text = detail.lyricUrl ? await fetchLRC(detail.lyricUrl) : ''
  const cached = { detail, lrcText: text }
  prefetchCache.value[id] = cached
  return cached
}

async function loadSong(id, { silent = false } = {}) {
  if (!silent) {
    loadingDetail.value = true
    detailError.value = null
    lrcText.value = ''
  }
  try {
    const { detail, lrcText: text } = await fetchSongData(id)
    const catalogEntry = songs.value.find(s => s.cid === id)
    song.value = { ...detail, albumName: catalogEntry?.albumName ?? '', coverUrl: catalogEntry?.coverUrl ?? '', pairedCid: catalogEntry?.pairedCid ?? null }
    lrcText.value = text
  } catch (e) {
    detailError.value = e.message
  } finally {
    loadingDetail.value = false
  }
}

// After a song loads, silently pre-fetch its instrumental/vocal pair in background
watch(instrumentalCid, (pairedCid) => {
  if (pairedCid && !prefetchCache.value[pairedCid]) {
    fetchSongData(pairedCid).catch(() => {})
  }
})

function tryAutoplay() {
  audioEl.value?.play().catch(() => {})
}

function togglePlay() {
  if (!audioEl.value) return
  if (playing.value) { audioEl.value.pause() } else { audioEl.value.play() }
}

function seekTo(time) {
  if (!audioEl.value) return
  audioEl.value.currentTime = time
}

async function toggleInstrumental() {
  if (!instrumentalCid.value) return
  usingInstrumental.value = !usingInstrumental.value
  const targetCid = usingInstrumental.value ? instrumentalCid.value : cid.value
  const wasPlaying = playing.value
  const savedTime = audioEl.value?.currentTime ?? 0
  const savedLrcText = lrcText.value  // preserve vocal lyrics as fallback
  // Use silent mode — data is pre-fetched so this resolves from cache instantly
  await loadSong(targetCid, { silent: true })
  // Instrumental tracks often have no lyrics; keep the vocal version's lyrics
  if (!lrcText.value) lrcText.value = savedLrcText
  if (audioEl.value) {
    audioEl.value.currentTime = savedTime
    if (wasPlaying) audioEl.value.play().catch(() => {})
  }
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    playerEl.value?.requestFullscreen().catch(() => {})
  } else {
    document.exitFullscreen()
  }
}

function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}

function onKeydown(e) {
  if (e.target.tagName === 'INPUT') return
  if (e.code === 'Space') { e.preventDefault(); togglePlay() }
  if (e.code === 'ArrowLeft') seekTo(Math.max(0, currentTime.value - 5))
  if (e.code === 'ArrowRight') seekTo(Math.min(duration.value, currentTime.value + 5))
  if (e.code === 'KeyF') toggleFullscreen()
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  document.addEventListener('fullscreenchange', onFullscreenChange)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  audioEl.value?.pause()
})

watch(cid, id => { if (id) loadSong(id) }, { immediate: true })
watch(volume, v => { if (audioEl.value) audioEl.value.volume = v })
</script>

<style scoped>
.player {
  position: relative;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #0a0a0a;
  color: #fff;
}

.blur-bg {
  position: absolute;
  inset: -40px;
  background-image: var(--cover-url);
  background-size: cover;
  background-position: center;
  filter: blur(60px) brightness(0.25);
  z-index: 0;
}

.top-bar {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.back-btn {
  background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #fff;
  border-radius: 6px; padding: 0.35rem 0.75rem; cursor: pointer; font-size: 0.85rem;
}
.back-btn:hover { background: rgba(255,255,255,0.08); }
.album-name { font-size: 0.85rem; color: rgba(255,255,255,0.5); }

.lyrics-area {
  position: relative;
  z-index: 1;
  flex: 1;
  overflow: hidden;
}

.controls-footer {
  position: relative;
  z-index: 1;
}

.center-state {
  position: relative; z-index: 1;
  flex: 1; display: flex; align-items: center; justify-content: center;
  color: rgba(255,255,255,0.5); font-size: 1.1rem;
}
.center-state.error { color: #e05555; }
</style>
