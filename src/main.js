import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import router from './router'
import { useAuthStore } from '@/stores/auth'
import './style.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

// ✅ inicializar auth ANTES de cargar router
const auth = useAuthStore()

console.log("[Main] Cargando sesión antes del router...")

auth.initAuth().then(() => {
  console.log("[Main] Auth listo, montando app...")
  app.use(router)
  app.mount('#app')
})
