<template>
  <header class="app-header">
    <nav class="nav-menu">
      <router-link to="/dashboard" class="nav-link">Mis asesorías</router-link>
      <router-link to="/cursos" class="nav-link">Asesorías Disponibles</router-link>
      <router-link to="/perfil" class="nav-link">Perfil</router-link>

      <span v-if="authStore.isStudent" class="tag-alumno">Alumno</span>
      <span v-else-if="authStore.isProfessor" class="tag-profesor">Profesor</span>

      <button @click="logout" class="logout-button">Salir</button>
    </nav>
  </header>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/supabase';

const router = useRouter()
const authStore = useAuthStore()

const logout = async () => {
  await supabase.auth.signOut()
  this.user = null
  this.isAuthReady = false
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

.tag-alumno{
  background:green;
  padding: 0.5%;
  border-radius: 10%;
  margin-left: 60%;
}

.tag-profesor{
  background:green;
  padding: 0.5%;
  border-radius: 10%;
  margin-left: 60%;
}
</style>