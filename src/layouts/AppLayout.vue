<template>
  <div>
    <!-- Si es Admin, muestra AdminMenu -->
    <AdminMenu v-if="authStore.isAdmin" />
    <!-- Si es Admin, muestra el Menu normal -->
    <Menu v-else /> 

    <main class="content-area">
      <RouterView /> 
    </main>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth';
import Menu from '@/components/Menu.vue'; 
import AdminMenu from '@/components/AdminMenu.vue';
import { RouterView } from 'vue-router';

const authStore = useAuthStore();
</script>

<style scoped>
.content-area {
  padding: 20px;
}
</style>
