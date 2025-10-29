import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/supabase'

import Dashboard from '@/views/MisCursos.vue'
import Login from '@/views/Login.vue'
import AppLayout from '@/layouts/AppLayout.vue'
import Cursos from '@/views/Cursos.vue'
import Perfil from '@/views/Perfil.vue'
import NotFound from '@/views/NotFound.vue'
import AgregarAsesoria from '@/views/AgregarAsesoria.vue'
import EditarAsesoria from '@/views/EditarAsesoria.vue'
import Solicitudes from '@/views/Solicitudes.vue'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'login',
    component: Login,
    meta: { requiresGuest: true }
  },

  {
    path: '/',
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: Dashboard
      },
      {
        path: 'cursos',
        name: 'cursos',
        component: Cursos
      },
      {
        path: 'perfil',
        name: 'perfil',
        component: Perfil
      },
      {
        path: 'cursos/:cursoId/editar-asesoria',
        name: 'editar-asesoria',
        component: EditarAsesoria,
        props: true
      },
      {
        path: 'crear-asesoria',
        name: 'crear-asesoria',
        component: AgregarAsesoria
      },
      {
        path: 'solicitudes',
        name: 'solicitudes',
        component: Solicitudes
      }
    ]
  },

  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFound }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// guard global
router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()

  // Si el store aún no se inicializa, lo espera
  if (!auth.isAuthReady) {
    console.log("[Router Guard] Esperando a que auth se inicialice...")
    await auth.initAuth()
  }

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    console.log("[Router Guard] Usuario NO autenticado → /login")
    return next('/login')
  }

  if (to.meta.requiresGuest && auth.isLoggedIn) {
    console.log("[Router Guard] Ya autenticado → /dashboard")
    return next('/dashboard')
  }

  next()
})

export default router
