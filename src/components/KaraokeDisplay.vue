<template>
  <div class="karaoke-display">

    <!-- Slot A — top-left of bottom half (lines 0, 2, 4 …) -->
    <div class="slot slot-a">
      <div
        v-if="slotALine < lines.length"
        class="lyric-row"
        @click="$emit('seek', lines[slotALine].time)"
      >
        <span class="lyric-bg">{{ lines[slotALine].text }}</span>
        <span v-if="slotASinging" ref="fillA" class="lyric-fill">{{ lines[slotALine].text }}</span>
      </div>
    </div>

    <!-- Slot B — bottom-right (lines 1, 3, 5 …) -->
    <div class="slot slot-b">
      <div
        v-if="slotBLine < lines.length"
        class="lyric-row"
        @click="$emit('seek', lines[slotBLine].time)"
      >
        <span class="lyric-bg">{{ lines[slotBLine].text }}</span>
        <span v-if="slotBSinging" ref="fillB" class="lyric-fill">{{ lines[slotBLine].text }}</span>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { karaokeStyleVars } from '@/composables/useKaraokeStyle'

const props = defineProps({
  lines:       { type: Array,  default: () => [] },
  activeLine:  { type: Number, default: -1 },
  currentTime: { type: Number, default: 0 },
  duration:    { type: Number, default: 0 },
})
defineEmits(['seek'])

const fillA = ref(null)
const fillB = ref(null)

// ── Slot logic ───────────────────────────────────────────────────────────────

const slotALine = computed(() => {
  if (props.activeLine < 0) return 0
  return props.activeLine % 2 === 0 ? props.activeLine : props.activeLine + 1
})
const slotBLine = computed(() => {
  if (props.activeLine < 0) return 1
  return props.activeLine % 2 === 1 ? props.activeLine : props.activeLine + 1
})

const slotASinging = computed(() => props.activeLine >= 0 && props.activeLine % 2 === 0)
const slotBSinging = computed(() => props.activeLine >= 0 && props.activeLine % 2 === 1)

// ── Sweep timing ─────────────────────────────────────────────────────────────

const SECS_PER_CHAR = 0.18
const TAIL_LAG      = 0.35

function sweepDurFor(lineIdx) {
  if (lineIdx < 0 || lineIdx >= props.lines.length) return 4
  const line      = props.lines[lineIdx]
  const nextLine  = props.lines[lineIdx + 1]
  const maxDur    = Math.max(0.5, line.text.length * SECS_PER_CHAR)
  const rawWindow = nextLine
    ? nextLine.time - line.time
    : Math.max(1, props.duration - line.time)
  return Math.min(maxDur, Math.max(0.3, rawWindow - TAIL_LAG))
}

watch(() => props.activeLine, async idx => {
  await nextTick()
  if (idx < 0) return
  const line = props.lines[idx]
  if (!line) return
  const dur     = sweepDurFor(idx)
  const elapsed = Math.max(0, props.currentTime - line.time)
  const el = idx % 2 === 0 ? fillA.value : fillB.value
  if (!el) return
  el.style.animationName = 'none'
  el.style.setProperty('--line-dur',   `${dur}s`)
  el.style.setProperty('--line-delay', `-${elapsed}s`)
  requestAnimationFrame(() => { el.style.animationName = '' })
})
</script>

<style scoped>
.karaoke-display {
  position: relative;
  height: 100%;
}

.slot-a {
  position: absolute;
  top: 52%;
  left: 2rem;
  max-width: 70%;
}
.slot-b {
  position: absolute;
  bottom: 2rem;
  right: 2rem;
  max-width: 70%;
  text-align: right;
}

.lyric-row {
  position: relative;
  cursor: pointer;
  white-space: nowrap;
  line-height: 1.35;
  font-size: var(--k-font-size, 2.6rem);
  font-weight: 900;
}
.lyric-bg {
  color: var(--k-base, #ffffff);
  -webkit-text-stroke: var(--k-stroke, 5px) var(--k-border, #1b4332);
  paint-order: stroke fill;
}
.lyric-fill {
  position: absolute;
  top: 0; left: 0;
  overflow: hidden;
  white-space: nowrap;
  color: var(--k-sweep, #00e5ff);
  -webkit-text-stroke: var(--k-stroke, 5px) var(--k-border, #1b4332);
  paint-order: stroke fill;
  animation: karaoke-wipe linear forwards;
  animation-duration: var(--line-dur,  4s);
  animation-delay:    var(--line-delay, 0s);
}
@keyframes karaoke-wipe {
  from { width: 0% }
  to   { width: 100% }
}
</style>
