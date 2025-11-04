<template>
  <div class="p-6">
    <!-- Mensaje de bienvenida -->
    <h1 class="text-3xl font-bold text-gray-800 mb-2">
      Hola, {{ authStore.userName }}!
    </h1>
    
    <p class="text-lg text-gray-600 mb-8">
      Rol: 
      <span v-if="authStore.isStudent" class="inline-block px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">Alumno</span>
      <span v-else-if="authStore.isProfessor" class="inline-block px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">Profesor</span>
      <span v-else-if="authStore.isAdmin" class="inline-block px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800">Administrador</span>
    </p>

    <!-- --- SECCIÓN DE CURSOS ASIGNADOS (Alumno/Profesor) --- -->
    <div v-if="authStore.isStudent || authStore.isProfessor" class="mt-8 border-t pt-6">
        <h2 class="text-2xl font-semibold text-gray-700 mb-4">
            {{ authStore.isStudent ? 'Mis Asesorías Inscritas' : 'Mis Asesorías Asignadas' }}
        </h2>

        <div v-if="isLoading" class="p-4 bg-yellow-50 rounded-lg text-yellow-700">Cargando cursos...</div>

        <div v-if="cursosStore.error" class="p-4 bg-red-50 text-red-700 rounded-lg">
            Error al cargar los cursos: {{ cursosStore.error.message || cursosStore.error }}
        </div>

        <!-- Usamos el nuevo estado 'misCursos' de la store -->
        <div v-else-if="misCursos.length === 0" class="p-4 bg-blue-50 border-l-4 border-blue-400 text-blue-700 rounded-lg">
            <p v-if="authStore.isStudent">No estás inscrito en ninguna asesoría. ¡Explora las disponibles!</p>
            <p v-else-if="authStore.isProfessor">Actualmente no tienes cursos asignados. Revisa el listado de solicitudes pendientes.</p>
        </div>

        <div v-else class="space-y-4">
            <div 
                v-for="curso in misCursos" 
                :key="curso.id"
                class="bg-white border border-gray-200 rounded-xl p-5 shadow-lg"
            >
                <h3 class="text-xl font-bold text-gray-800">{{ curso.nombre }}</h3>
                <p class="text-sm text-gray-500 mt-1">{{ curso.descripcion }}</p>
                
                <div class="mt-3 text-sm grid grid-cols-1 md:grid-cols-2 gap-2">
                    <p><strong>Horario:</strong> {{ curso.horario }}</p>
                    <p><strong>Profesor:</strong> {{ curso.profesorNombre }}</p> 
                </div>

                <!-- INICIO: Información de Google Classroom -->
                <div v-if="curso.classroom || curso.clave_classroom" class="mt-4 pt-3 border-t border-dashed border-gray-200">
                    <h4 class="text-base font-semibold text-indigo-700 mb-2">Acceso a Google Classroom</h4>
                    
                    <div class="space-y-2 text-sm">
                        <!-- Enlace -->
                        <div v-if="curso.classroom" class="flex items-center">
                            <svg class="w-4 h-4 text-indigo-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 100 2h3.586l-2.793 2.793a1 1 0 101.414 1.414L16 6.414V10a1 1 0 102 0V3a1 1 0 00-1-1h-7zM7 11a1 1 0 100 2h2a1 1 0 100-2H7zM3 15a1 1 0 100 2h2a1 1 0 100-2H3zM13 15a1 1 0 100 2h2a1 1 0 100-2h-2zM7 7a1 1 0 100 2h2a1 1 0 100-2H7zM3 7a1 1 0 100 2h2a1 1 0 100-2H3zM17 17H3v-4H1v6a1 1 0 001 1h16a1 1 0 001-1v-6h-2v4z"/></svg>
                            <a :href="curso.classroom" target="_blank" class="text-indigo-600 hover:text-indigo-800 hover:underline font-medium break-all">
                                Ir a la Clase
                            </a>
                        </div>
                        
                        <!-- Clave -->
                        <div v-if="curso.clave_classroom" class="flex items-center">
                            <svg class="w-4 h-4 text-indigo-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 8h-2.5V6.5a4.5 4.5 0 00-9 0V8H4a2 2 0 00-2 2v7a2 2 0 002 2h12a2 2 0 002-2v-7a2 2 0 00-2-2zm-9-1.5a2.5 2.5 0 015 0V8H9V6.5zM4 10h12v7H4v-7z" clip-rule="evenodd"/></svg>
                            <p class="text-gray-700">Clave: <span class="font-bold tracking-widest">{{ curso.clave_classroom }}</span></p>
                        </div>
                    </div>
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
                <p class="text-3xl text-orange-600 font-extrabold">{{ solicitudesPendientesCount }}</p>
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
import { computed, onMounted, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useCursosStore } from '@/stores/cursos';
import { storeToRefs } from 'pinia';

const authStore = useAuthStore();
const cursosStore = useCursosStore();

const { loading: isLoading, cursos, misCursos, solicitudes } = storeToRefs(cursosStore);
const currentUserId = computed(() => authStore.user?.id);

const solicitudesPendientesCount = computed(() => {
    if (!solicitudes.value) return 0;
    return solicitudes.value.filter(solicitud => solicitud.estado_solicitud === 'pendiente').length;
});

watch(currentUserId, (newId) => {
    if (newId) { 
        cursosStore.fetchMisCursos();
    }
}, { immediate: true });

watch(cursos, (newCursos) => {
    if (newCursos.length > 0 && currentUserId.value) {
        cursosStore.fetchMisCursos(); 
    }
});

onMounted(async () => {
    await cursosStore.fetchCursos();
    if (authStore.isAdmin) {
        await cursosStore.fetchSolicitudes();
    }
});
</script>
