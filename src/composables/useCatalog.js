import { ref, computed } from 'vue'
import { fetchSongs, fetchAlbums, cdnUrl } from '@/api/msr'
import metaRaw from '@/data/metadata.json'

const songs = ref([])
const albums = ref([])
const albumMap = ref({})
const loading = ref(false)
const error = ref(null)
let loaded = false

// Filter state at module level so it survives navigation away and back.
const query = ref('')
const selectedLanguages = ref([])

export function useCatalog() {
  async function load() {
    if (loaded) return
    loaded = true
    loading.value = true
    error.value = null
    try {
      const [songsData, albumsData] = await Promise.all([fetchSongs(), fetchAlbums()])
      const albumList = albumsData.list ?? albumsData
      albumList.forEach(a => { albumMap.value[a.cid] = a })
      albums.value = albumList

      const pairs = metaRaw._pairs ?? {}
      const songLangs = metaRaw._songLangs ?? {}
      const songSublangs = metaRaw._songSublangs ?? {}
      songs.value = (songsData.list ?? songsData).map(s => {
        const meta = metaRaw[s.albumCid] ?? {}
        const isInstrumental = /instrumental/i.test(s.name)
        const language = isInstrumental ? 'instrumental' : (songLangs[s.cid] ?? 'no-lyrics')
        return {
          ...s,
          albumName: albumMap.value[s.albumCid]?.name ?? '',
          coverUrl: cdnUrl(albumMap.value[s.albumCid]?.coverUrl ?? ''),
          language,
          sublanguage: songSublangs[s.cid] ?? null,
          year: meta.year ?? null,
          isInstrumental,
          pairedCid: pairs[s.cid] ?? null,
        }
      })
    } catch (e) {
      error.value = e.message
      loaded = false
    } finally {
      loading.value = false
    }
  }

  const filtered = computed(() => {
    let list = songs.value
    const q = query.value.trim().toLowerCase()
    if (q) {
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.artists?.join(' ').toLowerCase().includes(q) ||
        s.albumName.toLowerCase().includes(q)
      )
    }
    if (selectedLanguages.value.length) {
      list = list.filter(s =>
        selectedLanguages.value.includes(s.language) ||
        (s.sublanguage && selectedLanguages.value.includes(s.sublanguage))
      )
    }
    return list
  })

  return {
    songs, albums, albumMap, loading, error,
    query, selectedLanguages,
    filtered,
    load,
  }
}
