import { watch, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { usePlayerStore } from '@/stores/player'

// Called once from App.vue. Wires audio element events → player store.
export function useAudioEngine() {
  const store = usePlayerStore()
  const { audioRef, currentTime, playing, duration, shouldAutoplay, pendingSeekTime, volume } = storeToRefs(store)

  let attached = null

  function onTimeUpdate() {
    // Skip while a pendingSeekTime is queued: the audio's currentTime is unreliable
    // between a src change and the subsequent canplay + seek, and updating the store
    // here would cause activeLine to flicker and restart the karaoke animation.
    if (pendingSeekTime.value !== null) return
    currentTime.value = attached?.currentTime ?? 0
  }
  function onPlay() { playing.value = true }
  function onPause() { playing.value = false }
  function onEnded() { playing.value = false }
  function onDurationChange() { duration.value = attached?.duration ?? 0 }
  function onCanPlay() {
    if (pendingSeekTime.value !== null) {
      attached.currentTime = pendingSeekTime.value
      pendingSeekTime.value = null
    }
    if (shouldAutoplay.value) {
      attached?.play().catch(() => {})
      shouldAutoplay.value = false
    }
  }

  function attach(el) {
    el.addEventListener('timeupdate', onTimeUpdate)
    el.addEventListener('play', onPlay)
    el.addEventListener('pause', onPause)
    el.addEventListener('ended', onEnded)
    el.addEventListener('durationchange', onDurationChange)
    el.addEventListener('canplay', onCanPlay)
    attached = el
  }

  function detach(el) {
    el.removeEventListener('timeupdate', onTimeUpdate)
    el.removeEventListener('play', onPlay)
    el.removeEventListener('pause', onPause)
    el.removeEventListener('ended', onEnded)
    el.removeEventListener('durationchange', onDurationChange)
    el.removeEventListener('canplay', onCanPlay)
    attached = null
  }

  watch(audioRef, (el, prev) => {
    if (prev) detach(prev)
    if (el) attach(el)
  }, { immediate: true })

  // Keep audio element volume in sync with store
  watch(volume, v => { if (attached) attached.volume = v }, { immediate: true })

  onUnmounted(() => { if (attached) detach(attached) })
}
