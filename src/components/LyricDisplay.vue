<template>
  <div ref="containerEl" class="lyric-display" :class="{ 'no-lyrics': !lines.length }">
    <p v-if="!lines.length" class="empty">♪ No lyrics available</p>
    <template v-else>
      <p
        v-for="(line, i) in lines"
        :key="i"
        :ref="el => { if (el) lineEls[i] = el }"
        class="lyric-line"
        :class="{ active: i === activeLine, past: i < activeLine }"
        @click="$emit('seek', line.time)"
      >{{ line.text }}</p>
    </template>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  lines: { type: Array, default: () => [] },
  activeLine: { type: Number, default: -1 },
})
defineEmits(['seek'])

const containerEl = ref(null)
const lineEls = []   // plain array — no reactivity needed, just DOM refs

watch(() => props.activeLine, async idx => {
  if (idx < 0) return
  await nextTick()
  lineEls[idx]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
})
</script>

<style scoped>
.lyric-display {
  height: 100%;
  overflow-y: scroll;
  padding: 40% 1rem;
  box-sizing: border-box;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.2) transparent;
}
.lyric-display::-webkit-scrollbar { width: 4px; }
.lyric-display::-webkit-scrollbar-track { background: transparent; }
.lyric-display::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 2px; }

.empty { text-align: center; color: var(--text-muted); margin-top: 4rem; font-size: 1.1rem; }

.lyric-line {
  text-align: center;
  margin: 0.7rem 0;
  font-size: 1.25rem;
  line-height: 1.6;
  color: var(--text-muted);
  cursor: pointer;
  transition: color 0.2s, transform 0.2s, font-size 0.2s;
  padding: 0 1rem;
}
.lyric-line:hover { color: var(--text); }
.lyric-line.past { color: #555; }
.lyric-line.active {
  color: var(--accent);
  font-size: 1.55rem;
  font-weight: 700;
  transform: scale(1.04);
}
</style>
