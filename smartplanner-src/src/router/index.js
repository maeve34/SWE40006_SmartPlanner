import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/index.js'

const routes = [
  { path: '/',          redirect: '/dashboard' },
  { path: '/login',     component: () => import('@/views/LoginView.vue'), meta: { public: true } },
  { path: '/dashboard', component: () => import('@/views/DashboardView.vue') },
  { path: '/schedule',  component: () => import('@/views/ScheduleView.vue') },
  { path: '/progress',  component: () => import('@/views/ProgressView.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.isLoggedIn) return '/login'
  if (to.path === '/login' && auth.isLoggedIn) return '/dashboard'
})

export default router
