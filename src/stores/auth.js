import { defineStore } from 'pinia'
import { supabase } from '@/supabase';

export const useAuthStore = defineStore('auth', { 
  state: () => ({
    user: null,
    profile: null,
    isAuthReady: false,
    error: null,
  }),

  getters: {
    isLoggedIn: (state) => state.user !== null && state.profile !== null,
    userName: (state) => {
      if (state.profile?.nombre) return state.profile.nombre;
      if (state.user?.email) return state.user.email.split('@')[0];
      return 'Usuario Invitado';
    },
    userRole: (state) => state.profile?.rol || 'invitado',

    // Getters para control de acceso en la UI
    isStudent: (state) => state.profile?.rol === 'alumno',
    isProfessor: (state) => state.profile?.rol === 'profesor',
    isAdmin: (state) => state.profile?.rol === 'admin',
  },

  actions: {
    async fetchProfile(userId) {
      this.profile = null;
      this.error = null;

      try {
        console.log(`[Auth] Buscando perfil para UID: ${userId}`);
        const { data, error } = await supabase
          .from('usuarios')
          .select('nombre, rol')
          .eq('id', userId)
          .single();

        if (error) {
          if (error.code !== 'PGRST116') {
            throw error;
          }
        }

        this.profile = data || null;

        if (this.profile) {
          console.log(`[Auth] Perfil cargado: ${this.profile.nombre}, Rol: ${this.profile.rol} ✅`);
        } else {
          console.warn(`[Auth] Usuario autenticado, pero sin perfil asociado. (Rol: invitado)`);
        }

      } catch (err) {
        console.error('[Auth] Error CRÍTICO al cargar perfil:', err.message);
        this.error = err.message;
        this.profile = null;
      }
    },

    // Inicializa la autenticación al cargar la aplicación
    async initAuth() {
      console.log("[Auth] Inicializando sesión desde getSession()...")

      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        this.user = session.user
        // Si hay usuario, intentamos cargar su perfil
        await this.fetchProfile(this.user.id)
        console.log("[Auth] Sesión activa ✅")
      } else {
        this.user = null
        this.profile = null
        console.log("[Auth] No hay sesión activa ❌")
      }

      // CRÍTICO: Se establece a true al final de la carga inicial.
      this.isAuthReady = true
      console.log(`[Auth] AuthReady: ${this.isAuthReady}. Logeado: ${this.isLoggedIn}`);
    },

    async logout() {
      await supabase.auth.signOut();
      this.user = null;
      this.profile = null;
      this.isAuthReady = false;
      console.log("[Auth] Sesión cerrada 🚪");
    },

    // (Opcional, pero útil) Agregamos el listener para manejar cambios en tiempo real.
    // Esto se llamaría DESPUÉS de initAuth y solo si es necesario reaccionar a logins/logouts.
    subscribeToAuthChanges() {
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log(`[Auth Listener] Evento: ${event}`);

        // Si el evento es un login o una actualización de token
        if (session?.user) {
          this.user = session.user;
          // Recarga el perfil ante cualquier cambio de sesión
          await this.fetchProfile(this.user.id);
        } else {
          // Si el evento es un logout
          this.user = null;
          this.profile = null;
        }
      });
    }
  },
});
