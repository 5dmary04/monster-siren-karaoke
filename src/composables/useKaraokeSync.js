import { ref, watch, onUnmounted } from 'vue'
import { findActiveLine } from './useLRCParser'

// Takes reactive refs: audioEl (the <audio> DOM element), lines (parsed LRC array).
// Returns: activeLine (reactive index), currentTime (reactive seconds).
export function useKaraokeSync(audioEl, lines) {
  const activeLine = ref(-1)
  const currentTime = ref(0)

  function onTimeUpdate() {
    currentTime.value = audioEl.value?.currentTime ?? 0
    activeLine.value = findActiveLine(lines.value, currentTime.value)
  }

  let attached = null

  watch(audioEl, (el, prevEl) => {
    if (prevEl) prevEl.removeEventListener('timeupdate', onTimeUpdate)
    if (el) {
      el.addEventListener('timeupdate', onTimeUpdate)
      attached = el
    }
  }, { immediate: true })

  onUnmounted(() => {
    attached?.removeEventListener('timeupdate', onTimeUpdate)
  })

  return { activeLine, currentTime }
}
