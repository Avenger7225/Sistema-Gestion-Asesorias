<template>
  <div class="p-6">
    <!-- Mensaje de bienvenida -->
    <h1 class="text-3xl font-bold text-gray-800 mb-2">
      Hola, {{ authStore.user?.name || 'Usuario' }}!
    </h1>
    
    <p class="text-lg text-gray-600 mb-8">
      Rol: 
      <span v-if="authStore.isStudent" class="inline-block px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">Alumno</span>
      <span v-else-if="authStore.isProfessor" class="inline-block px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">Profesor</span>
      <span v-else-if="authStore.isAdmin" class="inline-block px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800">Administrador</span>
      <span v-else class="inline-block px-3 py-1 text-sm font-semibold rounded-full bg-gray-100 text-gray-600">Invitado</span>
    </p>

    <!-- --- SECCIÓN DE CURSOS ASIGNADOS (Alumno/Profesor) --- -->
    <div v-if="authStore.isStudent || authStore.isProfessor" class="mt-8 border-t pt-6">
        <h2 class="text-2xl font-semibold text-gray-700 mb-4">
            {{ authStore.isStudent ? 'Mis Asesorías Inscritas' : 'Mis Asesorías Asignadas' }}
        </h2>

        <div v-if="isLoading" class="p-4 bg-yellow-50 rounded-lg text-yellow-700">Cargando cursos...</div>
        
        <div v-else-if="misCursos.length === 0" class="p-4 bg-blue-50 border-l-4 border-blue-400 text-blue-700 rounded-lg">
            <p v-if="authStore.isStudent">No estás inscrito en ninguna asesoría. ¡Explora las disponibles!</p>
            <p v-else-if="authStore.isProfessor">Actualmente no tienes cursos asignados. Revisa el listado de solicitudes pendientes.</p>
        </div>

        <div v-else class="space-y-4">
            <div 
                v-for="curso in misCursos" 
                :key="curso.id"
                class="bg-white border border-gray-200 rounded-lg p-4 shadow-md"
            >
                <h3 class="text-xl font-bold text-gray-800">{{ curso.nombre }}</h3>
                <p class="text-sm text-gray-500 mt-1">{{ curso.descripcion }}</p>
                
                <div class="mt-3 text-sm grid grid-cols-2 gap-2">
                    <p><strong>Horario:</strong> {{ curso.horario }}</p>
                    <p><strong>Profesor:</strong> {{ curso.profesor }}</p>
                </div>
            </div>
        </div>
    </div>
    
    <!-- --- SECCIÓN DE ADMINISTRADOR --- -->
    <div v-else-if="authStore.isAdmin" class="mt-8 border-t pt-6">
        <h2 class="text-2xl font-semibold text-gray-700 mb-4">Panel de Administración Rápida</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-indigo-50 border-l-4 border-indigo-400 p-4 rounded-lg shadow-md">
                <p class="text-lg font-semibold text-indigo-800">Cursos Totales:</p>
                <p class="text-3xl text-indigo-600 font-extrabold">{{ cursosStore.cursos.length }}</p>
            </div>
            <div class="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-lg shadow-md">
                <p class="text-lg font-semibold text-orange-800">Solicitudes Pendientes:</p>
                <!-- Asume que ya cargamos las solicitudes en la store -->
                <p class="text-3xl text-orange-600 font-extrabold">{{ cursosStore.solicitudes.length }}</p>
            </div>
        </div>
        
        <div class="mt-6 flex justify-end">
             <router-link 
                 :to="{ name: 'solicitudes' }"
                 class="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 transition duration-150"
             >
                solicitudes pendientes
             </router-link>
        </div>
    </div>
    
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useCursosStore } from '@/stores/cursos';
import { storeToRefs } from 'pinia';

const authStore = useAuthStore();
const cursosStore = useCursosStore();

// Desestructurar estado del store
const { isLoading, cursos } = storeToRefs(cursosStore);

// ID del usuario actual (UUID del authStore)
const currentUserId = computed(() => authStore.user?.id);

// Computada para obtener los cursos del usuario
const misCursos = computed(() => {
    if (!currentUserId.value) return [];
    
    // Aquí usamos la función que desarrollamos previamente
    return cursosStore.getCursosByUserId(currentUserId.value);
});


onMounted(() => {
    // Aseguramos que los cursos y solicitudes estén cargados al entrar a la vista
    if (cursos.value.length === 0) {
        cursosStore.fetchCursos();
    }
    cursosStore.fetchSolicitudes();
});
</script>

<style scoped>
/* Estilos adicionales si fueran necesarios */
</style>