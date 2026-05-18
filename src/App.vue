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
import { useAudioEngine } from '@/composables/useAudioEngine'
import MiniPlayer from '@/components/MiniPlayer.vue'

const route = useRoute()
const store = usePlayerStore()
const audioEl = ref(null)

const isPlayerRoute = computed(() => route.name === 'player')
const showMini = computed(() => store.hasSong && !isPlayerRoute.value)

useAudioEngine()

onMounted(() => {
  store.setAudioRef(audioEl.value)
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
  padding-bottom: 64px;
}
</style>
