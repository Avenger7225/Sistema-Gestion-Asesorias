import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
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
  
  // BLOQUE PRINCIPAL DE LA APP (RUTAS PROTEGIDAS)
  {
    path: '/',
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: Dashboard,
        props: true
      },
      {
        path: 'cursos',
        name: 'cursos',
        component: Cursos,
        props: true
      },
      {
        path: 'perfil',
        name: 'perfil',
        component: Perfil,
        props: true
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
        component: AgregarAsesoria,
        props: true
      },
      {
        path: 'solicitudes',
        name: 'solicitudes',
        component: Solicitudes,
        props: true
      }
    ]
  },

  // RUTA 404
  {
    path: '/:pathMatch(.*)*', 
    name: 'not-found', 
    component: NotFound
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// GUARD DE NAVEGACIÓN GLOBAL
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  // Esperar a que el store se cargue de localStorage
  if (!authStore.isInitialized) {
    if (to.name !== 'login') {
      setTimeout(() => {
        next(to.fullPath);
      }, 50); 
      return;
    }
  }

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresGuest = to.matched.some(record => record.meta.requiresGuest)
  const requiredRoles = to.meta.roles

  if (requiresAuth) {
    if (!authStore.isLoggedIn) {
      next({ name: 'login' })
    } else if (requiredRoles && !requiredRoles.includes(authStore.userRole)) {
      next({ name: 'dashboard' })
    } else {
      next()
    }
    return
  }

  if (requiresGuest && authStore.isLoggedIn) {
    next({ name: 'dashboard' })
    return
  }
  next()
})

export default router
