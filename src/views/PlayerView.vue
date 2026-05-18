<template>
  <div ref="playerEl" class="player" :style="bgStyle">
    <div class="blur-bg" :style="bgStyle"></div>

    <nav class="top-bar">
      <button class="back-btn" @click="$router.back()">← Back</button>
      <div class="top-info">
        <span class="album-name">{{ store.currentSong?.albumName ?? '' }}</span>
      </div>
      <button class="mode-btn" @click="store.setMode(store.mode === 'karaoke' ? 'listening' : 'karaoke')">
        {{ store.mode === 'karaoke' ? '🎤 Karaoke' : '🎧 Listening' }}
      </button>
    </nav>

    <div v-if="store.loadingDetail" class="center-state">Loading…</div>
    <div v-else-if="store.detailError" class="center-state error">{{ store.detailError }}</div>

    <template v-else>
      <div class="lyrics-area">
        <LyricDisplay
          v-if="store.mode === 'karaoke'"
          :lines="store.parsedLyrics"
          :activeLine="store.activeLine"
          @seek="store.seekTo"
        />
        <div v-else class="listening-placeholder">
          <p>🎧 Listening mode</p>
          <p class="sub">Repeat & playlist controls coming soon</p>
        </div>
      </div>

      <footer class="controls-footer">
        <AudioControls
          :song="store.currentSong"
          :playing="store.playing"
          :currentTime="store.currentTime"
          :duration="store.duration"
          :volume="store.volume"
          :hasInstrumental="!!store.instrumentalCid"
          :instrumentalMode="store.usingInstrumental"
          :isFullscreen="isFullscreen"
          v-model:volume="storeVolume"
          @toggle="store.togglePlay()"
          @seek="store.seekTo"
          @toggleInstrumental="store.toggleInstrumental()"
          @fullscreen="toggleFullscreen"
        />
      </footer>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePlayerStore } from '@/stores/player'
import { useCatalog } from '@/composables/useCatalog'
import LyricDisplay from '@/components/LyricDisplay.vue'
import AudioControls from '@/components/AudioControls.vue'

const props = defineProps({ cid: String })
const route = useRoute()
const cid = computed(() => props.cid ?? route.params.cid)

const store = usePlayerStore()
const { load: loadCatalog } = useCatalog()
onMounted(loadCatalog)

// Two-way volume binding for AudioControls v-model
const storeVolume = computed({
  get: () => store.volume,
  set: v => store.setVolume(v),
})

const playerEl = ref(null)
const isFullscreen = ref(false)

const bgStyle = computed(() => {
  const url = store.currentSong?.coverUrl
  return url ? { '--cover-url': `url(${url})` } : {}
})

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
  if (e.code === 'Space') { e.preventDefault(); store.togglePlay() }
  if (e.code === 'ArrowLeft') store.seekTo(Math.max(0, store.currentTime - 5))
  if (e.code === 'ArrowRight') store.seekTo(Math.min(store.duration, store.currentTime + 5))
  if (e.code === 'KeyF') toggleFullscreen()
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  document.addEventListener('fullscreenchange', onFullscreenChange)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  // Audio keeps playing — do NOT pause here
})

watch(cid, id => { if (id) store.playSong(id) }, { immediate: true })
</script>

<style scoped>
.player {
  position: relative;
  height: 100%;
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
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.back-btn {
  background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #fff;
  border-radius: 6px; padding: 0.35rem 0.75rem; cursor: pointer; font-size: 0.85rem;
  flex-shrink: 0;
}
.back-btn:hover { background: rgba(255,255,255,0.08); }
.top-info { flex: 1; min-width: 0; }
.album-name { font-size: 0.85rem; color: rgba(255,255,255,0.5); }
.mode-btn {
  background: transparent; border: 1px solid rgba(255,255,255,0.2); color: rgba(255,255,255,0.7);
  border-radius: 6px; padding: 0.35rem 0.75rem; cursor: pointer; font-size: 0.82rem;
  flex-shrink: 0; transition: all 0.15s;
}
.mode-btn:hover { border-color: var(--accent); color: var(--accent); }

.lyrics-area {
  position: relative;
  z-index: 1;
  flex: 1;
  overflow: hidden;
}

.listening-placeholder {
  height: 100%; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 0.5rem;
  color: rgba(255,255,255,0.4);
}
.listening-placeholder p { margin: 0; font-size: 1.5rem; }
.listening-placeholder .sub { font-size: 0.85rem; }

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
