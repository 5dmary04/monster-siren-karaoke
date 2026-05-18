<template>
  <div class="mini-player">
    <div class="mini-left" @click="router.push(`/play/${store.currentSong?.cid}`)">
      <img v-if="store.currentSong?.coverUrl" :src="store.currentSong.coverUrl" class="mini-art" alt="" />
      <div v-else class="mini-art mini-art-placeholder">♪</div>
      <div class="mini-track">
        <p class="mini-name">{{ store.currentSong?.name ?? '' }}</p>
        <p class="mini-artist">{{ store.currentSong?.artists?.join(', ') ?? '' }}</p>
      </div>
    </div>

    <div class="mini-center">
      <button class="mini-btn play-btn" @click="store.togglePlay()">
        {{ store.playing ? '⏸' : '▶' }}
      </button>
      <input
        class="mini-seek"
        type="range" min="0" :max="store.duration || 100" step="0.5"
        :value="store.currentTime"
        @input="store.seekTo(Number($event.target.value))"
      />
    </div>

    <div class="mini-right">
      <input
        class="mini-vol"
        type="range" min="0" max="1" step="0.02"
        :value="store.volume"
        @input="store.setVolume(Number($event.target.value))"
      />
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { usePlayerStore } from '@/stores/player'

const router = useRouter()
const store = usePlayerStore()
</script>

<style scoped>
.mini-player {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  height: 64px;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0 1.25rem;
  background: var(--controls-bg);
  border-top: 1px solid var(--border);
}

.mini-left {
  display: flex; align-items: center; gap: 0.6rem;
  min-width: 0; flex: 0 0 200px;
  cursor: pointer;
}
.mini-left:hover .mini-name { color: var(--accent); }

.mini-art {
  width: 40px; height: 40px; border-radius: 4px; object-fit: cover; flex-shrink: 0;
}
.mini-art-placeholder {
  background: #1a1a1a; display: flex; align-items: center; justify-content: center;
  font-size: 1.2rem; color: #444;
}
.mini-track { min-width: 0; }
.mini-name {
  margin: 0; font-size: 0.82rem; font-weight: 600;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  transition: color 0.15s;
}
.mini-artist {
  margin: 0; font-size: 0.72rem; color: var(--text-muted);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.mini-center {
  flex: 1; display: flex; align-items: center; gap: 0.6rem; min-width: 0;
}
.mini-btn {
  background: transparent; border: 1px solid var(--border); color: var(--text);
  border-radius: 6px; cursor: pointer; font-size: 1rem;
  width: 2.2rem; height: 2.2rem;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.mini-btn:hover { background: var(--card-bg); }
.play-btn { border-color: var(--accent); color: var(--accent); }
.mini-seek { flex: 1; accent-color: var(--accent); cursor: pointer; }

.mini-right { flex-shrink: 0; }
.mini-vol { width: 70px; accent-color: var(--accent); cursor: pointer; }

@media (max-width: 600px) {
  .mini-left { flex: 0 0 140px; }
  .mini-right { display: none; }
}
</style>
