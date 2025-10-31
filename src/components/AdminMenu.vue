<template>
  <header class="app-header">
    <nav class="nav-menu">
      <router-link to="/dashboard" class="nav-link">Inicio</router-link>
      <router-link to="/cursos" class="nav-link">Asesorías Disponibles</router-link>
      <router-link 
        v-if="authStore.isAdmin" 
        :to="{ name: 'admin-register' }"
        class="nav-link"
      >
        Registrar Usuario
      </router-link>
      <router-link to="/perfil" class="nav-link">Perfil</router-link>

      <span class="tag-admin">Administrador</span>

      <button @click="handleLogout" class="logout-button">Salir</button>
    </nav>
  </header>
</template>

<script setup>
import { useRouter } from "vue-router"
import { useAuthStore } from "@/stores/auth"
import { supabase } from '@/supabase';

const router = useRouter()
const authStore = useAuthStore()

const handleLogout = async () => {
    try {
        await authStore.logout() // Llama a la acción que limpia la sesión
        
        // --- 🔑 SOLUCIÓN: Redirigir después de limpiar la sesión ---
        router.push({ name: 'login' }) // Usa el nombre de tu ruta de login
        // --------------------------------------------------------

    } catch (error) {
        console.error("Error al cerrar sesión:", error)
    }
}
</script>

<style scoped>
.app-header {
  background-color: #3498db;
  color: white;
  padding: 15px 30px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav-menu {
  display: flex;
  gap: 20px;
  align-items: center;
}

.nav-link {
  color: white;
  text-decoration: none;
  font-weight: 500;
  padding: 5px 0;
  transition: opacity 0.2s;
}

.nav-link:hover {
  opacity: 0.8;
}

.logout-button {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 5px;
  cursor: pointer;
  margin-left: auto;
}

.tag-admin{
  background:brown;
  padding: 0.6%;
  border-radius: 10%;
  margin-left: 68%;
}
</style>