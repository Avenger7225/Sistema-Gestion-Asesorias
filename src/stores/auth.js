import { defineStore } from 'pinia'

const LOCAL_STORAGE_KEY = 'user_session'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null, 
    isLoggedIn: false,
    userRole: null, 
    isInitialized: false, // Nuevo estado para saber si lo cargamos desde localStorage
  }),
  actions: {
    login(userData) {
      this.user = userData
      this.isLoggedIn = true
      this.userRole = userData.role
      
      // Guardar el estado del usuario en localStorage
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userData))
      this.isInitialized = true
    },
    
    logout() {
      this.user = null
      this.isLoggedIn = false
      this.userRole = null
      localStorage.removeItem(LOCAL_STORAGE_KEY)
      this.isInitialized = true
    },

    initialize() {
      const storedUser = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (storedUser) {
        const userData = JSON.parse(storedUser)
        this.user = userData
        this.isLoggedIn = true
        this.userRole = userData.role
      }
      this.isInitialized = true
    }
  },
  getters: {
    isAdmin: (state) => state.userRole === 'admin',
    isProfessor: (state) => state.userRole === 'profesor',
    isStudent: (state) => state.userRole === 'alumno',
  }
})
