<template>
  <div class="song-card" @click="$emit('play', song)">
    <div class="cover-wrap">
      <img v-if="song.coverUrl" :src="song.coverUrl" :alt="song.name" loading="lazy" />
      <div v-else class="cover-placeholder">♪</div>
      <div class="play-overlay">▶</div>
    </div>
    <div class="info">
      <p class="name">{{ song.name }}</p>
      <p class="sub">{{ song.albumName }}</p>
      <span v-if="song.isInstrumental" class="badge instrumental">Instrumental</span>
      <span v-if="song.language && song.language !== 'no-lyrics' && !song.isInstrumental" class="badge lang">{{ LANG_LABEL[song.language] ?? song.language }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({ song: Object })
defineEmits(['play'])

const LANG_LABEL = {
  chinese: '中文', cantonese: '粤語', hokkien: '閩南語',
  english: 'English', russian: 'Русский', japanese: '日本語',
  latin: 'Latin', spanish: 'Spanish',
}
</script>

<style scoped>
.song-card {
  cursor: pointer;
  border-radius: 10px;
  overflow: hidden;
  background: var(--card-bg);
  transition: transform 0.15s, box-shadow 0.15s;
}
.song-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.4); }

.cover-wrap {
  position: relative;
  aspect-ratio: 1;
  background: #111;
}
.cover-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
.cover-placeholder {
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
  font-size: 2.5rem; color: #444;
}
.play-overlay {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 2rem; color: #fff;
  background: rgba(0,0,0,0.45);
  opacity: 0; transition: opacity 0.15s;
}
.cover-wrap:hover .play-overlay { opacity: 1; }

.info { padding: 0.6rem 0.75rem 0.75rem; }
.name { margin: 0; font-size: 0.88rem; font-weight: 600; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sub { margin: 0.2rem 0 0.4rem; font-size: 0.75rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.badge {
  display: inline-block; font-size: 0.65rem; font-weight: 700; letter-spacing: 0.04em;
  text-transform: uppercase; padding: 2px 6px; border-radius: 4px;
}
.badge.instrumental { background: #2a2a4a; color: #8888ee; }
.badge.lang { background: #1a3020; color: #5dba7a; }
</style>
