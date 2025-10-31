import { defineStore } from 'pinia'
import { supabase } from '@/supabase';
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://toupojjbqnyakiixelyr.supabase.co"; 
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvdXBvampicW55YWtpaXhlbHlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDcxNDYyMywiZXhwIjoyMDc2MjkwNjIzfQ.b0nAwoPY91cENzl_WJK0WxtRHeVVPZR2HEalSTkPUCs";

const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    }
});

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
      if (state.user?.correo) return state.user.correo.split('@')[0];
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

    async adminRegisterUser(correo, password, nombre, rol) {
        if (!this.isAdmin) {
            throw new Error("Acceso denegado: Solo administradores pueden registrar usuarios.");
        }
        
        // 1. CREAR USUARIO con la función de ADMINISTRACIÓN para evitar la confirmación de correo.
        const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
            email: correo, // Supabase Auth siempre espera 'email'
            password: password,
            email_confirm: true, // Esto omite el correo de confirmación
            user_metadata: {
                nombre_usuario: nombre,
                rol_usuario: rol
            }
        });

        if (authError) {
             throw new Error(authError.message); 
        }

        console.log(`[Auth Admin] Usuario ${correo} registrado con éxito. Rol: ${rol}`);

        // 2. INSERT DIRECTO en la tabla 'usuarios'
        if (authData.user) {
            const { error: userError } = await supabase // Usamos el cliente normal 'supabase'
                .from('usuarios')
                .insert([{ 
                    id: authData.user.id, 
                    nombre: nombre, 
                    rol: rol, 
                    correo: correo
                }]);
            
            if (userError) throw userError;
        }
        return authData.user;
    },

    subscribeToAuthChanges() {
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log(`[Auth Listener] Evento: ${event}`);
        if (session?.user) {
          this.user = session.user;
          await this.fetchProfile(this.user.id);
        } else {
          this.user = null;
          this.profile = null;
        }
      });
    }
  },
});
