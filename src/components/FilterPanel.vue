<template>
  <aside class="filter-panel">
    <div class="field">
      <input
        class="search-input"
        type="search"
        placeholder="Search songs, artists, albums…"
        :value="query"
        @input="$emit('update:query', $event.target.value)"
      />
    </div>

    <div class="field">
      <label class="field-label">Language</label>
      <div class="chips">
        <button
          v-for="lang in LANGUAGES"
          :key="lang.value"
          class="chip"
          :class="{ active: selectedLanguages.includes(lang.value) }"
          @click="toggleLanguage(lang.value)"
        >{{ lang.label }}</button>
      </div>
    </div>

    <div class="field">
      <label class="field-label">Show</label>
      <div class="chips">
        <button class="chip" :class="{ active: isVocalOnly }" @click="selectVocal">Vocal</button>
        <button class="chip" :class="{ active: selectedLanguages.includes('instrumental') }" @click="toggleLanguage('instrumental')">Instrumental</button>
        <button class="chip" :class="{ active: selectedLanguages.includes('no-lyrics') }" @click="toggleLanguage('no-lyrics')">No Lyrics</button>
      </div>
    </div>

    <button v-if="hasFilters" class="clear-btn" @click="$emit('clear')">Clear filters</button>
  </aside>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  query: String,
  selectedLanguages: Array,
})
const emit = defineEmits(['update:query', 'update:selectedLanguages', 'clear'])

const LANGUAGES = [
  { value: 'chinese', label: '中文' },
  { value: 'cantonese', label: '粤語' },
  { value: 'hokkien', label: '閩南語' },
  { value: 'english', label: 'English' },
  { value: 'russian', label: 'Русский' },
  { value: 'japanese', label: '日本語' },
  { value: 'latin', label: 'Latin' },
]
const VOCAL_LANGS = LANGUAGES.map(l => l.value)

function toggleLanguage(lang) {
  const next = props.selectedLanguages.includes(lang)
    ? props.selectedLanguages.filter(l => l !== lang)
    : [...props.selectedLanguages, lang]
  emit('update:selectedLanguages', next)
}

function selectVocal() {
  emit('update:selectedLanguages', VOCAL_LANGS)
}

const isVocalOnly = computed(() =>
  VOCAL_LANGS.every(l => props.selectedLanguages.includes(l)) &&
  !props.selectedLanguages.includes('instrumental') &&
  !props.selectedLanguages.includes('no-lyrics')
)

const hasFilters = computed(() =>
  props.query.trim() || props.selectedLanguages.length
)
</script>

<style scoped>
.filter-panel { display: flex; flex-direction: column; gap: 1.2rem; }
.field { display: flex; flex-direction: column; gap: 0.4rem; }
.field-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
.search-input {
  width: 100%; box-sizing: border-box;
  background: var(--input-bg); border: 1px solid var(--border);
  color: var(--text); border-radius: 8px;
  padding: 0.55rem 0.75rem; font-size: 0.9rem; outline: none;
}
.search-input:focus { border-color: var(--accent); }
.chips { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.chip {
  padding: 0.3rem 0.7rem; border-radius: 20px; font-size: 0.8rem;
  border: 1px solid var(--border); background: transparent; color: var(--text-muted);
  cursor: pointer; transition: all 0.15s;
}
.chip.active { background: var(--accent); border-color: var(--accent); color: #fff; }
.clear-btn {
  align-self: flex-start; padding: 0.35rem 0.8rem; border-radius: 6px;
  border: 1px solid var(--border); background: transparent; color: var(--text-muted);
  font-size: 0.8rem; cursor: pointer;
}
.clear-btn:hover { color: var(--text); border-color: var(--text-muted); }
</style>
