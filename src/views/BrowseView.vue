<template>
  <div class="browse">
    <header class="browse-header">
      <h1 class="logo">塞壬唱片 Karaoke</h1>
      <p class="tagline">Fan karaoke for Monster Siren Records · streams directly from MSR · non-commercial</p>
    </header>

    <div class="layout">
      <FilterPanel
        v-model:query="query"
        v-model:selectedLanguages="selectedLanguages"
        v-model:selectedYear="selectedYear"
        :availableYears="availableYears"
        @clear="clearFilters"
      />

      <main class="content">
        <div v-if="loading" class="state-msg">Loading catalog…</div>
        <div v-else-if="error" class="state-msg error">
          Failed to load catalog: {{ error }}
          <br/><small>Check that monster-siren.hypergryph.com is accessible in your region.</small>
        </div>
        <template v-else>
          <p class="result-count">{{ filtered.length }} song{{ filtered.length !== 1 ? 's' : '' }}</p>
          <div class="song-grid">
            <SongCard
              v-for="song in filtered"
              :key="song.cid"
              :song="song"
              @play="goPlay(song)"
            />
          </div>
          <p v-if="filtered.length === 0" class="state-msg">No songs match your filters.</p>
        </template>
      </main>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCatalog } from '@/composables/useCatalog'
import FilterPanel from '@/components/FilterPanel.vue'
import SongCard from '@/components/SongCard.vue'

const router = useRouter()
const {
  loading, error,
  query, selectedLanguages, selectedYear, availableYears,
  filtered, load,
} = useCatalog()

onMounted(load)

function goPlay(song) {
  router.push(`/play/${song.cid}`)
}

function clearFilters() {
  query.value = ''
  selectedLanguages.value = []
  selectedYear.value = null
}
</script>

<style scoped>
.browse { min-height: 100vh; display: flex; flex-direction: column; }

.browse-header {
  padding: 2rem 2rem 1rem;
  border-bottom: 1px solid var(--border);
}
.logo { margin: 0; font-size: 1.6rem; font-weight: 800; letter-spacing: -0.02em; }
.tagline { margin: 0.3rem 0 0; font-size: 0.78rem; color: var(--text-muted); }

.layout { display: grid; grid-template-columns: 240px 1fr; gap: 0; flex: 1; }

aside.filter-panel, :deep(.filter-panel) {
  padding: 1.5rem 1.25rem;
  border-right: 1px solid var(--border);
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  box-sizing: border-box;
}

.content { padding: 1.25rem 1.5rem; min-width: 0; }
.result-count { margin: 0 0 1rem; font-size: 0.8rem; color: var(--text-muted); }
.song-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1rem;
}
.state-msg { text-align: center; padding: 4rem 1rem; color: var(--text-muted); }
.state-msg.error { color: #e05555; }

@media (max-width: 640px) {
  .layout { grid-template-columns: 1fr; }
  :deep(.filter-panel) { position: static; height: auto; border-right: none; border-bottom: 1px solid var(--border); }
}
</style>
