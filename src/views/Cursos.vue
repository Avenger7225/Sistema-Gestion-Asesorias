<template>
  <div class="p-6">
    <h1 class="text-3xl font-bold text-gray-800 mb-6">Asesorías Disponibles</h1>

    <!-- Mensaje especifico y boton para el administrador -->
    <div v-if="authStore.isAdmin" class="text-blue-500 mb-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg shadow-md" role="alert">
      <p class="font-bold">Modo con permisos de Administrador</p>
      <p>Estás viendo el catálogo general.</p>
      
      <button 
        class="px-5 py-2 text-white font-medium rounded-lg shadow-md bg-blue-500 transition duration-150 text-center mt-3 hover:bg-blue-600"
        @click="handleCreate"
      >
        Agregar Nuevo Curso
      </button>
    </div>

    <!-- Lista de Cursos -->
    <div class="space-y-6">
      <div 
        v-for="curso in cursosDisponibles" 
        :key="curso.id"
        class="bg-white border border-gray-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition duration-300"
      >
        <div class="flex justify-between items-start">
          <div>
            <h2 class="text-xl font-semibold text-blue-500">{{ curso.nombre }}</h2>
            <p class="text-gray-600 mt-1">{{ curso.descripcion }}</p>
          </div>
          
          <!-- Estado -->
          <div class="flex-shrink-0 ml-4" v-if="!authStore.isAdmin">
            <span :class="getStatusClasses(curso)">
              {{ getStatusText(curso) }}
            </span>
          </div>
        </div>
        
        <div class="mt-4 border-t border-gray-100 pt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p class="font-medium text-gray-700">Horario:</p>
            <p class="text-gray-500">{{ curso.horario }}</p>
          </div>
          <div>
            <p class="font-medium text-gray-700">Profesor:</p>
            <p class="text-gray-500">{{ curso.profesorNombre}}</p>
          </div>
          <div>
            <p class="font-medium text-gray-700">Cupo:</p>
            <p class="text-gray-500">{{ curso.cupo_maximo }} estudiantes</p>
          </div>
        </div>

        <div class="mt-6 flex justify-end space-x-3">       
          <!-- Botones de inscripcion y baja (Solo para Alumno/Profesor) -->
          <template v-if="!authStore.isAdmin">
              <div class="col-span-1 flex justify-end items-center">
                  <template v-if="cursosStore.isUserAssignedOrInscribed(authStore.user?.id, curso.id)">
                      <button 
                          @click="handleBaja(curso.id, curso.nombre)"
                          class="px-5 py-2 bg-red-600 text-white font-medium rounded-lg shadow-md hover:bg-red-700 transition duration-150"
                      >
                          Solicitar Baja
                      </button>
                  </template>
                  
                  <span 
                      v-else-if="cursosStore.isSolicitudPending(authStore.user?.id, curso.id)"
                      class="inline-block px-3 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-800"
                  >
                      SOLICITUD PENDIENTE
                  </span>
                  
                  <button 
                      v-else
                      @click="handleInscription(curso.id, curso.nombre)"
                      class="px-5 py-2 bg-green-600 text-white font-medium rounded-lg shadow-md hover:bg-green-700 transition duration-150 disabled:opacity-50"
                      :disabled="!authStore.isStudent && !authStore.isProfessor"
                  >
                      Solicitar {{ authStore.isStudent ? 'Inscripción' : 'Ser Docente' }}
                  </button>
              </div>
          </template>

          <!-- Botones de Administrador (Editar y Eliminar) -->
          <template v-else-if="authStore.isAdmin && curso.id">
            <!-- Botón de Eliminar (NUEVO) -->
            <button
              @click="handleDelete(curso.id, curso.nombre)" 
              class="px-5 py-2 bg-red-700 text-white font-medium rounded-lg shadow-md hover:bg-red-800 transition duration-150 text-center"
            >
              Eliminar Curso
            </button>
            
            <!-- Botón de Edición -->
            <button
              @click="handleEdit(curso.id)" 
              class="px-5 py-2 bg-blue-500 text-white font-medium rounded-lg shadow-md hover:bg-blue-600 transition duration-150 text-center"
            >
              Editar Curso
            </button>
          </template>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCursosStore } from '@/stores/cursos'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { onMounted } from 'vue'

// --- SETUP ---
const authStore = useAuthStore()
const cursosStore = useCursosStore()
const router = useRouter()

const userId = computed(() => authStore.user?.id)

// Desestructurar del store de cursos
const { cursos: cursosDelStore, isLoading, inscripciones } = storeToRefs(cursosStore) 
const cursosDisponibles = cursosDelStore

onMounted(() => {
    // Cargar cursos y solicitudes al montar
    if (cursosDelStore.value.length === 0) {
        cursosStore.fetchCursos();
        cursosStore.fetchSolicitudes(); 
    }
});

// --- MANEJADORES DE ACCIONES ---

const handleCreate = () => {
  router.push({ name: 'crear-asesoria' })
}

const handleEdit = (cursoId) => {
    console.log(`Intentando editar el Curso ID: ${cursoId}`);
    router.push({ name: 'editar-asesoria', params: { cursoId: cursoId } });
};

// NUEVO: Manejador de Eliminación (solo Admin)
const handleDelete = async (cursoId, cursoNombre) => {
    // Usamos una ventana modal custom en lugar de alert/confirm. Aquí simularemos con un error si falla.
    // Para entornos reales, usarías un componente modal (No se usa confirm() por restricción del entorno).
    if (!authStore.isAdmin) {
        alert("Error de Seguridad: No tienes permisos de administrador para eliminar.");
        return;
    }
    
    // NOTA: En un entorno de producción, DEBERÍAS usar un modal de confirmación. 
    // Por ahora, solo se intentará la eliminación.
    
    const confirmMessage = `¿Estás ABSOLUTAMENTE SEGURO de eliminar el curso "${cursoNombre}"? Esta acción es irreversible.`;
    
    // *** Esto es un HACK para evitar el confirm() real ***
    const isConfirmed = window.prompt(confirmMessage);
    if (!isConfirmed || isConfirmed.toLowerCase() !== cursoNombre.toLowerCase()) {
        alert("Eliminación cancelada o confirmación incorrecta.");
        return;
    }
    // *** FIN HACK ***

    try {
        await cursosStore.deleteCurso(cursoId);
        alert(`¡Curso "${cursoNombre}" eliminado correctamente!`);
    } catch (error) {
        alert(`Error al eliminar el curso: ${error.message}`);
    }
}

// --- LÓGICA DE ESTADO ---

const handleInscription = async (cursoId, cursoNombre) => {
// Ajuste la variable 'tipo' para que use 'asignacion_profesor' si es un profesor.
  const tipo = authStore.isStudent 
      ? 'inscripcion_alumno' 
      : 'asignacion_profesor' // <-- CAMBIO AQUÍ
  
  try {
      if (userId.value) {
        await cursosStore.sendSolicitud(userId.value, cursoId, tipo)
        // También ajusto el mensaje para que sea más claro
        const tipo_display = authStore.isStudent ? 'Inscripción' : 'Asignación Docente'
        alert(`¡Solicitud de ${tipo_display} enviada para el curso "${cursoNombre}"! El administrador debe aprobarla.`)
      } else {
        console.error("No se pudo enviar la solicitud: ID de usuario no disponible.")
      }
  } catch (error) {
      alert(`Error: ${error.message}`)
  }
}

const handleBaja = async (cursoId, cursoNombre) => {
  const tipo = authStore.isStudent ? 'baja_alumno' : 'baja_profesor'

  try {
      if (userId.value) {
        await cursosStore.sendSolicitud(userId.value, cursoId, tipo)
        alert(`¡Solicitud de BAJA enviada para el curso "${cursoNombre}"! El administrador debe aprobarla.`)
      } else {
        console.error("No se pudo enviar la solicitud: ID de usuario no disponible.")
      }
  } catch (error) {
      alert(`Error: ${error.message}`)
  }
}

const getStatusText = (curso) => {
  const userIdVal = userId.value;
  if (!userIdVal) return 'Disponible';

  // Usa las funciones del store
  if (cursosStore.isUserAssignedOrInscribed(userIdVal, curso.id)) {
    return 'Inscrito / Asignado'
  }
  
  if (cursosStore.isSolicitudPending(userIdVal, curso.id)) {
    return 'Solicitud Pendiente'
  }
  
  return 'Disponible'
}

const getStatusClasses = (curso) => {
  const base = 'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium uppercase'
  const status = getStatusText(curso)
  
  if (status === 'Inscrito / Asignado') {
    return `${base} bg-blue-100 text-blue-800`
  } else if (status === 'Solicitud Pendiente') {
    return `${base} bg-yellow-100 text-yellow-800 animate-pulse`
  } else {
    return `${base} bg-gray-100 text-gray-500`
  }
}
</script>

<style scoped>
.animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
