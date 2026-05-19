<template>
  <div class="mini-player">
    <!-- Lyric floats above the bar -->
    <p class="mini-lyric-float" :class="{ dim: !hasActiveLyric }">{{ lyricText }}</p>

    <!-- Left: art + song name — click to open full player -->
    <div class="mini-left" @click="router.push(`/play/${store.currentSong?.cid}`)">
      <img v-if="store.currentSong?.coverUrl" :src="store.currentSong.coverUrl" class="mini-art" alt="" />
      <div v-else class="mini-art mini-art-placeholder">♪</div>
      <div class="mini-track">
        <p class="mini-name">{{ store.currentSong?.name ?? '' }}</p>
      </div>
    </div>

    <!-- Center: transport controls -->
    <div class="mini-center">
      <button class="ctrl-btn" @click="store.seekTo(Math.max(0, store.currentTime - 5))" title="Back 5s">⏮ 5s</button>
      <button class="ctrl-btn play-btn" @click="store.togglePlay()">{{ store.playing ? '⏸' : '▶' }}</button>
      <button class="ctrl-btn" @click="store.seekTo(Math.min(store.duration, store.currentTime + 5))" title="Forward 5s">5s ⏭</button>
    </div>

    <!-- Right: mode toggle + volume + open-player -->
    <div class="mini-right">
      <button
        class="ctrl-btn mode-toggle"
        :title="store.mode === 'karaoke' ? 'Karaoke mode — click to switch to Listening' : 'Listening mode — click to switch to Karaoke'"
        @click="store.setMode(store.mode === 'karaoke' ? 'listening' : 'karaoke')"
      >{{ store.mode === 'karaoke' ? '🎤 Karaoke' : '📜 Listening' }}</button>
      <span class="vol-icon">🔊</span>
      <input class="vol-bar" type="range" min="0" max="1" step="0.02"
        :value="store.volume" @input="store.setVolume(Number($event.target.value))" />
      <button class="ctrl-btn" @click="router.push(`/play/${store.currentSong?.cid}`)" title="Open player">⛶</button>
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePlayerStore } from '@/stores/player'

const router = useRouter()
const store = usePlayerStore()

const hasActiveLyric = computed(() => store.parsedLyrics.length > 0 && store.activeLine >= 0)

const lyricText = computed(() => {
  if (!store.parsedLyrics.length) return '♪'
  if (store.activeLine < 0) return '· · ·'
  return store.parsedLyrics[store.activeLine]?.text ?? '· · ·'
})
</script>

<style scoped>
.mini-player {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  height: 80px;
  z-index: 100;
  overflow: visible;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 1rem;
  padding: 0 1.5rem;
  background: var(--controls-bg);
  border-top: 1px solid var(--border);
}

.mini-lyric-float {
  position: absolute;
  bottom: 100%;
  left: 0; right: 0;
  margin: 0;
  padding: 12px 2rem;
  text-align: center;
  background: linear-gradient(to top, rgba(17,17,17,0.2) 70%, transparent);
  font-size: 2rem;
  font-weight: 700;
  color: var(--accent);
  -webkit-text-stroke: 3px #ffffff;
  paint-order: stroke fill;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  pointer-events: none;
  transition: color 0.2s;
}
.mini-lyric-float.dim { color: var(--text-muted); }

.mini-left {
  display: flex; align-items: center; gap: 0.75rem;
  min-width: 0; cursor: pointer;
}
.mini-left:hover .mini-name { color: var(--accent); }

.mini-art {
  width: 48px; height: 48px; border-radius: 5px; object-fit: cover; flex-shrink: 0;
}
.mini-art-placeholder {
  width: 48px; height: 48px; border-radius: 5px; flex-shrink: 0;
  background: #1a1a1a; display: flex; align-items: center; justify-content: center;
  font-size: 1.2rem; color: #444;
}
.mini-track { min-width: 0; }
.mini-name {
  margin: 0; font-size: 0.95rem; font-weight: 700;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  transition: color 0.15s;
}

.mini-center { display: flex; gap: 0.75rem; align-items: center; }

.mini-right {
  display: flex; align-items: center; gap: 0.5rem; justify-content: flex-end;
}
.vol-icon { font-size: 0.85rem; }
.vol-bar { width: 80px; accent-color: var(--accent); cursor: pointer; }

.ctrl-btn {
  background: transparent; border: 1px solid var(--border); color: var(--text);
  border-radius: 6px; padding: 0.3rem 0.6rem; cursor: pointer; font-size: 0.85rem;
  transition: background 0.15s;
}
.ctrl-btn:hover { background: var(--card-bg); }
.play-btn {
  font-size: 1.4rem; border-color: var(--accent); color: var(--accent);
  width: 3rem; height: 2.4rem; padding: 0;
  display: flex; align-items: center; justify-content: center;
}

@media (max-width: 700px) {
  .mini-player { grid-template-columns: 1fr auto; }
  .mini-right { display: none; }
  .tune-panel { display: none; }
}
</style>
