<template>
  <div class="max-w-4xl mx-auto p-6 bg-white shadow-xl rounded-lg mt-40">
    <h1 class="text-3xl font-bold text-gray-800 mb-6 border-b pb-2">
      Perfil del Usuario
    </h1>

    <div v-if="!authStore.user" class="p-6 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded-lg">
      <p class="font-bold">Cargando perfil...</p>
      <p>Asegúrate de haber iniciado sesión correctamente.</p>
    </div>

    <div v-else class="space-y-6">
      
      <div class="flex items-center space-x-4 border-b pb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p class="text-sm font-medium text-gray-500">Nombre del usuario</p>
          <p class="text-xl font-semibold text-gray-900">{{ authStore.userName || 'N/A' }}</p>
        </div>
      </div>
      
      <div class="flex items-center space-x-4 border-b pb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-2 1a9 9 0 00-18 0V7a2 2 0 012-2h14a2 2 0 012 2v2z" />
        </svg>
        <div>
          <p class="text-sm font-medium text-gray-500">Correo Electrónico</p>
          <p class="text-xl font-semibold text-gray-900">{{ authStore.user?.email || 'N/A' }}</p>
        </div>
      </div>
      
      <div class="flex items-center space-x-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292m0 5.292a4 4 0 010-5.292m0 0H7a2 2 0 00-2 2v4a2 2 0 002 2h6m-12 0h14" />
        </svg>
        <div>
          <p class="text-sm font-medium text-gray-500">Rol o tipo de Usuario</p>
          <span 
            :class="getRoleClasses(authStore.userRole)"
            class="inline-block px-3 py-1 text-sm font-bold rounded-full uppercase"
          >
            {{ authStore.userRole || 'Invitado' }}
          </span>
        </div>
      </div>
      
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

// Helper para asignar clases de Tailwind basadas en el rol
const getRoleClasses = (role) => {
  const base = 'bg-opacity-80';
  switch (role) {
    case 'alumno':
      return `${base} bg-green-500 text-white`;
    case 'profesor':
      return `${base} bg-blue-500 text-white`;
    case 'admin':
      return `${base} bg-red-500 text-white`;
    default:
      return `${base} bg-gray-500 text-white`;
  }
};
</script>