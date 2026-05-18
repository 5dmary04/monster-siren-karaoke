<template>
  <div id="app-shell" :class="{ 'with-mini': showMini }">
    <RouterView />
    <MiniPlayer v-if="showMini" />
    <audio ref="audioEl" :src="store.audioSrc" preload="auto" style="display:none" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePlayerStore } from '@/stores/player'
import { useCatalog } from '@/composables/useCatalog'
import { useAudioEngine } from '@/composables/useAudioEngine'
import MiniPlayer from '@/components/MiniPlayer.vue'

const IDLE_CID = '779416'  // 梦源之地 — shown paused on first open

const route = useRoute()
const store = usePlayerStore()
const { load: loadCatalog } = useCatalog()
const audioEl = ref(null)

const isPlayerRoute = computed(() => route.name === 'player')
const showMini = computed(() => store.hasSong && !isPlayerRoute.value)

useAudioEngine()

onMounted(async () => {
  store.setAudioRef(audioEl.value)
  // Only preload idle song when starting on browse — player route loads its own song
  if (!isPlayerRoute.value) {
    await loadCatalog()
    store.playSong(IDLE_CID, { autoplay: false })
  }
})
</script>

<style>
#app-shell {
  height: 100%;
  display: flex;
  flex-direction: column;
}
#app-shell > :first-child {
  flex: 1;
  min-height: 0;
}
#app-shell.with-mini {
  padding-bottom: 80px;
}
</style>
