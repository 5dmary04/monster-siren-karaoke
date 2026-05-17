import { createRouter, createWebHashHistory } from 'vue-router'
import BrowseView from '@/views/BrowseView.vue'
import PlayerView from '@/views/PlayerView.vue'

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: BrowseView },
    { path: '/play/:cid', component: PlayerView, props: true },
  ],
})
