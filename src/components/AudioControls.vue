<template>
  <div class="audio-controls">
    <div class="track-info">
      <p class="track-name">{{ song?.name ?? '—' }}</p>
      <p class="track-artist">{{ song?.artists?.join(', ') ?? '' }}</p>
    </div>

    <div class="center-controls">
      <div class="progress-row">
        <span class="time">{{ fmt(currentTime) }}</span>
        <input
          class="seek-bar"
          type="range" min="0" :max="duration || 100" step="0.5"
          :value="currentTime"
          @input="$emit('seek', Number($event.target.value))"
        />
        <span class="time">{{ fmt(duration) }}</span>
      </div>

      <div class="btn-row">
        <button class="ctrl-btn" @click="$emit('seek', Math.max(0, currentTime - 5))" title="Back 5s">⏮ 5s</button>
        <button class="ctrl-btn play-btn" @click="$emit('toggle')">
          {{ playing ? '⏸' : '▶' }}
        </button>
        <button class="ctrl-btn" @click="$emit('seek', Math.min(duration, currentTime + 5))" title="Forward 5s">5s ⏭</button>
      </div>
    </div>

    <div class="right-controls">
      <label class="vol-label">🔊</label>
      <input
        class="vol-bar"
        type="range" min="0" max="1" step="0.02"
        :value="volume"
        @input="$emit('update:volume', Number($event.target.value))"
      />
      <button v-if="hasInstrumental" class="ctrl-btn instrumental-toggle" :class="{ active: instrumentalMode }" @click="$emit('toggleInstrumental')" title="Toggle vocal / instrumental">
        {{ instrumentalMode ? '🎵 Inst.' : '🎤 Vocal' }}
      </button>
      <button class="ctrl-btn" @click="$emit('fullscreen')" title="Fullscreen (F)">⛶</button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  song: Object,
  playing: Boolean,
  currentTime: Number,
  duration: Number,
  volume: Number,
  hasInstrumental: Boolean,
  instrumentalMode: Boolean,
})
defineEmits(['toggle', 'seek', 'update:volume', 'toggleInstrumental', 'fullscreen'])

function fmt(s) {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = String(Math.floor(s % 60)).padStart(2, '0')
  return `${m}:${sec}`
}
</script>

<style scoped>
.audio-controls {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.5rem;
  background: var(--controls-bg);
  border-top: 1px solid var(--border);
}

.track-info { min-width: 0; }
.track-name { margin: 0; font-weight: 700; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.track-artist { margin: 0.15rem 0 0; font-size: 0.78rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.center-controls { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; min-width: 400px; }
.progress-row { display: flex; align-items: center; gap: 0.5rem; width: 100%; }
.time { font-size: 0.75rem; color: var(--text-muted); min-width: 2.5rem; }
.seek-bar { flex: 1; accent-color: var(--accent); cursor: pointer; }
.btn-row { display: flex; gap: 0.75rem; align-items: center; }

.right-controls { display: flex; align-items: center; gap: 0.5rem; justify-content: flex-end; }
.vol-label { font-size: 0.85rem; }
.vol-bar { width: 80px; accent-color: var(--accent); cursor: pointer; }

.ctrl-btn {
  background: transparent; border: 1px solid var(--border); color: var(--text);
  border-radius: 6px; padding: 0.3rem 0.6rem; cursor: pointer; font-size: 0.85rem;
  transition: background 0.15s;
}
.ctrl-btn:hover { background: var(--card-bg); }
.play-btn { font-size: 1.4rem; padding: 0.2rem 0.8rem; border-color: var(--accent); color: var(--accent); }
.instrumental-toggle.active { border-color: var(--accent); color: var(--accent); }

@media (max-width: 700px) {
  .audio-controls { grid-template-columns: 1fr; grid-template-rows: auto auto auto; }
  .center-controls { min-width: unset; width: 100%; }
}
</style>
