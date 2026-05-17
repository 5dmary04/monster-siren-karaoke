import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePlayerStore = defineStore('player', () => {
  const currentSong = ref(null)   // full song detail from /api/song/:cid
  const playing = ref(false)
  const volume = ref(1)

  function setSong(song) {
    currentSong.value = song
    playing.value = false
  }

  function setPlaying(v) {
    playing.value = v
  }

  function setVolume(v) {
    volume.value = v
  }

  return { currentSong, playing, volume, setSong, setPlaying, setVolume }
})
