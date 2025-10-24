<template>
  <div class="p-6">
    <h1 class="text-3xl font-bold text-gray-800 mb-6 border-b pb-3">Gestión de Solicitudes Pendientes</h1>
    
    <div v-if="!authStore.isAdmin" class="p-8 text-center bg-red-100 border-2 border-red-400 text-red-800 rounded-lg">
        <p class="text-xl font-semibold">🚫 Acceso Denegado</p>
        <p class="text-sm mt-2">Esta página es solo para Administradores.</p>
    </div>

    <div v-else>
        <div class="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 p-4 rounded-lg mb-6" role="alert">
            <p class="font-bold">¡Atención Administrador!</p>
            <p>Aquí podrá revisar, aprobar o rechazar las solicitudes de alumnos (inscripción/baja) y profesores (asignación docente).</p>
        </div>

        <!-- Notificación Temporal -->
        <div 
            v-if="notificationMessage" 
            :class="[
                'p-4 mb-4 rounded-lg transition-all duration-300 ease-in-out',
                notificationType === 'success' ? 'bg-green-100 border-l-4 border-green-500 text-green-700' : 
                notificationType === 'error' ? 'bg-red-100 border-l-4 border-red-500 text-red-700' : 'bg-blue-100 border-l-4 border-blue-500 text-blue-700'
            ]"
            role="alert"
        >
            <p class="font-medium">{{ notificationMessage }}</p>
        </div>

        <!-- Contenedor para la lista de solicitudes -->
        <div v-if="isLoading" class="text-center py-10">
            <svg class="animate-spin h-8 w-8 text-blue-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-gray-500 mt-2">Cargando solicitudes...</p>
        </div>

        <div v-else-if="solicitudesPendientes.length === 0" class="p-8 text-center bg-green-50 rounded-lg text-green-700 border-2 border-green-300">
            <p class="text-xl font-semibold">🥳 ¡No hay solicitudes pendientes!</p>
            <p class="text-sm mt-2">Todo el sistema está al día.</p>
        </div>

        <div v-else>
            <p class="text-gray-600 mb-4">Total de solicitudes pendientes: <span class="font-bold text-lg text-orange-600">{{ solicitudesPendientes.length }}</span></p>
            
            <!-- Lista de Solicitudes -->
            <div class="space-y-4">
                <div 
                    v-for="solicitud in solicitudesPendientes" 
                    :key="solicitud.id"
                    class="bg-white p-4 border rounded-lg shadow-md flex justify-between items-start"
                >
                    <div>
                        <p class="text-base font-semibold text-gray-700">
                            {{ formatTipo(solicitud.tipo) }} para: 
                            <span class="text-blue-600">{{ getCursoName(solicitud.curso_id) }}</span>
                        </p>
                        <p class="text-sm text-gray-500 mt-1">
                            Usuario ID: {{ solicitud.user_id }} 
                            <span class="text-xs text-gray-400">({{ formatDate(solicitud.created_at) }})</span>
                        </p>
                    </div>
                    
                    <div class="flex space-x-3 flex-shrink-0">
                        <button 
                            @click="handleApproval(solicitud)"
                            class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm font-medium"
                        >
                            Aprobar
                        </button>
                        <button 
                            @click="handleRejection(solicitud.id)"
                            class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-medium"
                        >
                            Rechazar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'; // Importamos 'ref'
import { useCursosStore } from '@/stores/cursos';
import { useAuthStore } from '@/stores/auth';
import { storeToRefs } from 'pinia';

const cursosStore = useCursosStore();
const authStore = useAuthStore();

const { solicitudes: todasSolicitudes, isLoading, cursos } = storeToRefs(cursosStore);

// --- Estado local para notificaciones (Reemplazo de alert()) ---
const notificationMessage = ref(null);
const notificationType = ref(null);
let notificationTimeout = null;

const showNotification = (message, type = 'success') => {
    notificationMessage.value = message;
    notificationType.value = type;
    
    // Limpia el timeout anterior para que no se superpongan
    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
    }

    // Oculta la notificación después de 4 segundos
    notificationTimeout = setTimeout(() => {
        notificationMessage.value = null;
        notificationType.value = null;
    }, 4000);
};


// Filtrar las solicitudes para mostrar solo las pendientes
const solicitudesPendientes = computed(() => {
    // Asegurarse de que 'solicitudes' sea un array antes de intentar filtrar
    if (!todasSolicitudes.value || !Array.isArray(todasSolicitudes.value)) return [];
    
    return todasSolicitudes.value.filter(s => s.estado === 'pendiente');
});

// Obtener el nombre del curso a partir del ID
const getCursoName = (cursoId) => {
    const curso = cursos.value.find(c => c.id === cursoId);
    return curso ? curso.nombre : 'Curso Desconocido';
}

// Formatear el tipo de solicitud para mejor lectura
const formatTipo = (tipo) => {
    if (tipo === 'inscripcion_alumno') return 'Inscripción de Alumno';
    if (tipo === 'inscripcion_profesor') return 'Asignación de Profesor';
    if (tipo === 'baja_alumno') return 'Baja de Alumno';
    if (tipo === 'baja_profesor') return 'Baja de Profesor';
    return tipo;
}

// Formatear la fecha
const formatDate = (dateString) => {
    if (!dateString) return 'Fecha desconocida';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return dateString;
    }
}


// --- Lógica de Aprobación/Rechazo ---

const handleApproval = async (solicitud) => {
    // Reemplazamos window.confirm por una simulación de modal (idealmente usar un componente real)
    if (!window.confirm(`¿Está seguro de aprobar la solicitud ${solicitud.id} para ${getCursoName(solicitud.curso_id)}?`)) {
        return;
    }

    try {
        await cursosStore.approveSolicitud(solicitud);
        showNotification('Solicitud aprobada exitosamente.', 'success'); 
    } catch (error) {
        console.error("Error al aprobar:", error);
        showNotification(`Error al aprobar: ${error.message}`, 'error');
    }
}

const handleRejection = async (solicitudId) => {
    // Reemplazamos window.confirm por una simulación de modal (idealmente usar un componente real)
    if (!window.confirm(`¿Está seguro de rechazar la solicitud ${solicitudId}?`)) {
        return;
    }

    try {
        await cursosStore.rejectSolicitud(solicitudId);
        showNotification('Solicitud rechazada exitosamente.', 'success');
    } catch (error) {
        console.error("Error al rechazar:", error);
        showNotification(`Error al rechazar: ${error.message}`, 'error');
    }
}


onMounted(() => {
    // Si no es admin, no cargamos nada
    if (!authStore.isAdmin) return; 

    // Llamamos a fetchCursos (que mapea a setupListeners)
    // Esto fuerza la carga inicial de TODOS los datos (cursos, solicitudes, inscripciones)
    // y configura los listeners de Realtime.
    cursosStore.fetchCursos(); 
});
</script>
<style scoped>
/* Estilos necesarios para la animación del spinner */
.animate-spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}
</style>
