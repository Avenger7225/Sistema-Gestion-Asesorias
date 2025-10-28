<template>
  <div>
    <!-- Mostrar loader mientras auth carga -->
    <div v-if="!authStore.isAuthReady" class="flex justify-center items-center h-screen">
      <p class="text-xl text-gray-500">Cargando datos de usuario...</p>
    </div>

    <!-- Mostrar el layout cuando ya cargó -->
    <div v-else>
      <AdminMenu v-if="authStore.isAdmin" />
      <Menu v-else />

      <main class="content-area">
        <RouterView /> 
      </main>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import Menu from '@/components/Menu.vue'
import AdminMenu from '@/components/AdminMenu.vue'
import { RouterView } from 'vue-router'

const authStore = useAuthStore()
</script>
