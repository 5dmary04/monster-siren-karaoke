<template>
  <div ref="playerEl" class="player" :style="[bgStyle, karaokeStyleVars]">
    <div class="blur-bg" :class="[{ unblurred: !bgBlurred }, `mode-${store.mode}`]" :style="bgStyle"></div>

    <nav class="top-bar">
      <button class="back-btn" @click="$router.back()">← Back</button>
      <div class="top-info">
        <span class="album-name">{{ store.currentSong?.albumName ?? '' }}</span>
      </div>
      <button
        class="mode-btn"
        @click="bgBlurred = !bgBlurred"
      >{{ bgBlurred ? '🌅 Original' : '🌫️ Blur' }}</button>
      <button class="mode-btn" @click="store.setMode(store.mode === 'karaoke' ? 'listening' : 'karaoke')">
        {{ store.mode === 'karaoke' ? '🎤 Karaoke' : '📜 Listening' }}
      </button>
    </nav>

    <div v-if="store.loadingDetail" class="center-state">Loading…</div>
    <div v-else-if="store.detailError" class="center-state error">{{ store.detailError }}</div>

    <template v-else>
      <div class="lyrics-area">
        <KaraokeDisplay
          v-if="store.mode === 'karaoke'"
          :lines="store.parsedLyrics"
          :activeLine="store.activeLine"
          :currentTime="store.currentTime"
          :duration="store.duration"
          @seek="store.seekTo"
        />
        <LyricDisplay
          v-else
          :lines="store.parsedLyrics"
          :activeLine="store.activeLine"
          @seek="store.seekTo"
        />
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

    <!-- Style panel — collapsible, works in both modes -->
    <div class="style-panel" :class="{ collapsed: !panelOpen }">
      <button class="panel-toggle" @click="panelOpen = !panelOpen">
        🎨<span v-if="panelOpen"> ✕</span>
      </button>
      <template v-if="panelOpen">
      <div class="panel-title">Lyric Style</div>

      <div class="panel-label">Theme</div>
      <div class="btn-row">
        <button
          v-for="(name, i) in [...THEMES.map(t => t.name), 'Custom']" :key="name"
          class="choice-btn"
          :class="{ active: themeIdx === i }"
          @click="setTheme(i)"
        >{{ name }}</button>
      </div>

      <template v-if="themeIdx < THEMES.length">
        <div class="panel-label">
          Background
          <span class="detected-tag">
            {{ detectedVariant === 0 ? '☀️ light detected' : '🌙 dark detected' }}
          </span>
        </div>
        <div class="btn-row">
          <button class="choice-btn" :class="{ active: variantOverride === 0 }"  @click="variantOverride = 0">☀️ Light</button>
          <button class="choice-btn" :class="{ active: variantOverride === 1 }"  @click="variantOverride = 1">🌙 Dark</button>
          <button class="choice-btn" :class="{ active: variantOverride === null }" @click="variantOverride = null">🤖 Auto</button>
        </div>
      </template>

      <div class="divider" />

      <template v-if="themeIdx === THEMES.length">
        <label class="picker-row">
          <span>Base</span>
          <input type="color" v-model="style.base" />
          <span class="hex">{{ style.base }}</span>
        </label>
        <label class="picker-row">
          <span>Sweep</span>
          <input type="color" v-model="style.sweep" />
          <span class="hex">{{ style.sweep }}</span>
        </label>
        <label class="picker-row">
          <span>Border</span>
          <input type="color" v-model="style.border" />
          <span class="hex">{{ style.border }}</span>
        </label>
      </template>

      <label class="picker-row">
        <span>Size</span>
        <input type="range" min="1.2" max="4" step="0.1" v-model.number="fontSize" />
        <span class="hex">{{ fontSize }}rem</span>
      </label>
      </template>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePlayerStore } from '@/stores/player'
import { useCatalog } from '@/composables/useCatalog'
import LyricDisplay from '@/components/LyricDisplay.vue'
import KaraokeDisplay from '@/components/KaraokeDisplay.vue'
import AudioControls from '@/components/AudioControls.vue'
import {
  THEMES, themeIdx, variantOverride, detectedVariant,
  style, fontSize, setTheme, karaokeStyleVars, analyzeBrightness,
} from '@/composables/useKaraokeStyle'

const props = defineProps({ cid: String })
const route = useRoute()
const cid = computed(() => props.cid ?? route.params.cid)

const store = usePlayerStore()
const { load: loadCatalog } = useCatalog()
onMounted(loadCatalog)

const storeVolume = computed({
  get: () => store.volume,
  set: v => store.setVolume(v),
})

const playerEl  = ref(null)
const isFullscreen = ref(false)
const bgBlurred = ref(true)
const panelOpen = ref(false)

const bgStyle = computed(() => {
  const url = store.currentSong?.coverUrl
  return url ? { '--cover-url': `url(${url})` } : {}
})

// Re-analyze brightness whenever the cover art changes
watch(() => store.currentSong?.coverUrl, url => {
  analyzeBrightness(url ?? '').catch(() => {})
}, { immediate: true })

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    playerEl.value?.requestFullscreen().catch(() => {})
  } else {
    document.exitFullscreen()
  }
}
function onFullscreenChange() { isFullscreen.value = !!document.fullscreenElement }

function onKeydown(e) {
  if (e.target.tagName === 'INPUT') return
  if (e.code === 'Space')      { e.preventDefault(); store.togglePlay() }
  if (e.code === 'ArrowLeft')  store.seekTo(Math.max(0, store.currentTime - 5))
  if (e.code === 'ArrowRight') store.seekTo(Math.min(store.duration, store.currentTime + 5))
  if (e.code === 'KeyF')       toggleFullscreen()
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  document.addEventListener('fullscreenchange', onFullscreenChange)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  document.removeEventListener('fullscreenchange', onFullscreenChange)
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

/* Mode-dependent background dimming */
.blur-bg {
  position: absolute;
  inset: -40px;
  background-image: var(--cover-url);
  background-size: cover;
  background-position: center;
  transition: filter 0.4s ease;
  z-index: 0;
}
.blur-bg.mode-karaoke  { filter: blur(60px); }
.blur-bg.mode-listening { filter: blur(60px) brightness(0.25); }
.blur-bg.unblurred.mode-karaoke  { filter: none; inset: 0; }
.blur-bg.unblurred.mode-listening { filter: brightness(0.25); inset: 0; }

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

.controls-footer { position: relative; z-index: 1; }

.center-state {
  position: relative; z-index: 1;
  flex: 1; display: flex; align-items: center; justify-content: center;
  color: rgba(255,255,255,0.5); font-size: 1.1rem;
}
.center-state.error { color: #e05555; }

/* ── Style panel ── */
.style-panel {
  position: absolute;
  top: 4.5rem;
  right: 0.75rem;
  width: 230px;
  background: rgba(10,10,10,0.9);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 10px;
  padding: 0.9rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 10;
  backdrop-filter: blur(10px);
  transition: width 0.2s, padding 0.2s;
}
.style-panel.collapsed {
  width: auto;
  padding: 0;
  background: transparent;
  border-color: transparent;
  backdrop-filter: none;
}
.panel-toggle {
  background: rgba(0,0,0,0.45);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 6px;
  color: #fff;
  font-size: 1.1rem;
  width: 2.2rem;
  height: 2.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  transition: background 0.15s;
  flex-shrink: 0;
  align-self: flex-end;
}
.panel-toggle:hover { background: rgba(0,0,0,0.7); }
.panel-title {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.45);
}
.panel-label {
  font-size: 0.72rem;
  color: rgba(255,255,255,0.45);
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.15rem;
}
.detected-tag { font-size: 0.65rem; color: rgba(255,255,255,0.3); }
.btn-row { display: flex; flex-wrap: wrap; gap: 0.35rem; }
.choice-btn {
  flex: 1 1 auto;
  min-width: fit-content;
  padding: 0.3rem 0.5rem;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 5px;
  color: rgba(255,255,255,0.6);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.choice-btn:hover  { background: rgba(255,255,255,0.12); color: #fff; }
.choice-btn.active { background: var(--accent); border-color: var(--accent); color: #fff; }
.divider { height: 1px; background: rgba(255,255,255,0.1); margin: 0.1rem 0; }
.picker-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.78rem;
  color: rgba(255,255,255,0.7);
  cursor: default;
}
.picker-row span:first-child { width: 3rem; flex-shrink: 0; }
.picker-row input[type=color] {
  width: 2rem; height: 1.5rem;
  border: none; border-radius: 4px;
  cursor: pointer; padding: 0; background: none;
}
.picker-row input[type=range] { flex: 1; accent-color: var(--accent); }
.hex { font-size: 0.68rem; color: rgba(255,255,255,0.35); min-width: 3.2rem; text-align: right; }
</style>
