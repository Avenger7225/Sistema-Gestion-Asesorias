import { defineStore } from 'pinia'
import { supabase } from '@/supabase';

export const useAuthStore = defineStore('auth', { 
  state: () => ({
    user: null, // Objeto de autenticación de Supabase (ID, email, etc.)
    profile: null, // Objeto de perfil cargado desde la tabla 'perfiles' (nombre, rol)
    isAuthReady: false,
    error: null, // Para manejo de errores
  }),

  getters: {
    isLoggedIn: (state) => state.user !== null && state.profile !== null,

    userName: (state) => {
      if (state.profile?.nombre) return state.profile.nombre;
      if (state.user?.email) return state.user.email.split('@')[0];
      return 'Usuario Invitado';
    },

    // Obtiene el rol
    userRole: (state) => state.profile?.rol || 'invitado',

    // Getters para control de acceso en la UI
    isStudent: (state) => state.profile?.rol === 'alumno',
    isProfessor: (state) => state.profile?.rol === 'profesor',
    isAdmin: (state) => state.profile?.rol === 'admin',
  },

  actions: {
    // 1. Carga el perfil del usuario desde la tabla 'perfiles'
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
          // Si es PGRST116 (No se encontró fila), no es un error crítico, solo falta el perfil.
          if (error.code !== 'PGRST116') {
            throw error;
          }
        }

        this.profile = data || null; // Puede ser null si no existe el perfil.

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

    // 2. Inicializa la autenticación al cargar la aplicación
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

    // 3. (Opcional, pero útil) Agregamos el listener para manejar cambios en tiempo real.
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
