import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  base: '/monster-siren-karaoke/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/msr-api': {
        target: 'https://monster-siren.hypergryph.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/msr-api/, ''),
      },
      '/msr-cdn': {
        target: 'https://web.hycdn.cn',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/msr-cdn/, ''),
        headers: { Referer: 'https://monster-siren.hypergryph.com/' },
      },
    },
  },
})
