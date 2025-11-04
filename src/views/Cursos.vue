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
            <p class="font-medium text-gray-700">Horario y Aula:</p>
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
                  
                  <!-- 1. PENDIENTE (PRIORIDAD AL ESTADO DE SOLICITUD) -->
                  <span 
                      v-if="cursosStore.isSolicitudPending(authStore.user?.id, curso.id)"
                      class="inline-block px-3 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-800 animate-pulse"
                  >
                      SOLICITUD PENDIENTE
                  </span>

                  <!-- 2. INSCRITO / ASIGNADO (Permite solicitar Baja) -->
                  <template v-else-if="cursosStore.isUserAssignedOrInscribed(authStore.user?.id, curso.id)">
                      <button 
                          @click="showBajaConfirmation(curso.id, curso.nombre)"
                          class="px-5 py-2 bg-red-600 text-white font-medium rounded-lg shadow-md hover:bg-red-700 transition duration-150"
                      >
                          Solicitar Baja
                      </button>
                  </template>
                  
                  <!-- 3. DISPONIBLE (Permite solicitar Inscripción/Docente) -->
                  <button 
                      v-else
                      @click="showInscriptionConfirmation(curso.id, curso.nombre)"
                      class="px-5 py-2 bg-green-600 text-white font-medium rounded-lg shadow-md hover:bg-green-700 transition duration-150 disabled:opacity-50"
                      :disabled="!authStore.isStudent && !authStore.isProfessor || (authStore.isProfessor && curso.profesorNombre && curso.profesorNombre !== 'Sin asignar')"
                      >
                      Solicitar {{ authStore.isStudent ? 'Inscripción' : 'Ser Docente' }}
                  </button>
              </div>
          </template>

          <!-- Botones de Administrador (Editar y Eliminar) -->
          <template v-if="authStore.isAdmin || authStore.isProfessor"> 
              <button
                @click="handleVerAlumnos(curso)" 
                class="px-5 py-2 bg-indigo-600 text-white font-medium rounded-lg shadow-md hover:bg-indigo-700 transition duration-150 text-center"
              >
                Ver Alumnos
              </button>
          </template>

          <template v-if="authStore.isAdmin && curso.id">
              <button
                @click="handleDelete(curso.id, curso.nombre)" 
                class="px-5 py-2 bg-red-700 text-white font-medium rounded-lg shadow-md hover:bg-red-800 transition duration-150 text-center"
              >
                Eliminar Curso
              </button>
              
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

    <!-- MODAL 1: Lista de Alumnos (Sin cambios, solo añadido bg-opacity) -->
      <div 
        v-if="isModalOpen" 
        class="fixed inset-0 z-40 overflow-y-auto flex items-center justify-center bg-gray-900 bg-opacity-50"
      >
          <div class="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4 transform transition-all">
          
          <h3 class="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">
            Alumnos Inscritos en: {{ selectedCurso?.nombre }}
          </h3>

          <div v-if="isFetchingAlumnos" class="p-4 bg-blue-50 text-blue-700 rounded-lg">Cargando lista de alumnos...</div>

          <div v-else-if="alumnosInscritos.length === 0" class="p-4 bg-yellow-50 text-yellow-700 rounded-lg">
            <p>No hay alumnos inscritos en este curso todavía.</p>
          </div>

          <div v-else class="max-h-80 overflow-y-auto space-y-3">
              <div 
                  v-for="alumno in alumnosInscritos" 
                  :key="alumno.id"
                  class="p-3 border rounded-lg bg-gray-50 flex justify-between items-center"
              >
                  <div>
                      <p class="font-semibold text-gray-800">{{ alumno.nombre }}</p>
                      <p class="text-sm text-gray-500">{{ alumno.email }}</p>
                  </div>
                  </div>
          </div>
          
          <div class="mt-6 flex justify-end">
            <button
              @click="closeModal"
              class="px-6 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition duration-150"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL 2: Confirmación de Solicitud (Nuevo) -->
      <div 
        v-if="confirmationDetails.show" 
        class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-opacity-70"
      >
        <div class="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4 transform transition-all">
          
          <h3 class="text-xl font-bold text-gray-800 mb-3 border-b pb-2 flex items-center">
            <svg v-if="confirmationDetails.type === 'baja'" class="w-6 h-6 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            <svg v-else class="w-6 h-6 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
            {{ confirmationDetails.title }}
          </h3>

          <p class="text-gray-700 mb-4">{{ confirmationDetails.message }}</p>
          <p class="text-xs text-red-500 mt-2">El administrador debe aprobar esta solicitud.</p>

          <div class="mt-6 flex justify-end space-x-3">
            <button
              @click="cancelConfirmation"
              class="px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition duration-150"
            >
              Cancelar
            </button>
            <button
              @click="executeConfirmation"
              :class="['px-4 py-2 text-white font-medium rounded-lg shadow-md transition duration-150', confirmationDetails.type === 'baja' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700']"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>

  </div>
</template>

<script setup>
import { computed, ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCursosStore } from '@/stores/cursos'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { onMounted } from 'vue'

const authStore = useAuthStore()
const cursosStore = useCursosStore()
const router = useRouter()
const userId = computed(() => authStore.user?.id)

// ESTADOS DEL MODAL DE ALUMNOS
const isModalOpen = ref(false);
const selectedCurso = ref(null);
const alumnosInscritos = ref([]);
const isFetchingAlumnos = ref(false);

// ESTADO DEL MODAL DE CONFIRMACIÓN (Nuevo)
const confirmationDetails = reactive({
    show: false,
    title: '',
    message: '',
    cursoId: null,
    cursoNombre: '',
    type: null, // 'inscripcion' o 'baja'
});

const { cursos: cursosDelStore, isLoading, solicitudes, inscripciones } = storeToRefs(cursosStore) 
const cursosDisponibles = cursosDelStore

onMounted(() => {
    if (cursosDelStore.value.length === 0) {
        cursosStore.fetchCursos();
    }
});

// --- FUNCIONES DE ADMINISTRACIÓN ---
const handleCreate = () => {
  router.push({ name: 'crear-asesoria' })
}

const handleEdit = (cursoId) => {
    router.push({ name: 'editar-asesoria', params: { cursoId: cursoId } });
};

const handleDelete = async (cursoId, cursoNombre) => {
    if (!authStore.isAdmin) {
        return;
    }
    
    const confirmation = window.prompt(`Para confirmar la eliminación del curso "${cursoNombre}", escribe EXACTAMENTE el nombre del curso.`);
    
    if (confirmation !== cursoNombre) {
        return;
    }

    try {
        await cursosStore.deleteCurso(cursoId);
    } catch (error) {
    }
}

const handleVerAlumnos = async (curso) => {
    if (!authStore.isAdmin && !authStore.isProfessor) return; 
    selectedCurso.value = curso;
    alumnosInscritos.value = [];
    isModalOpen.value = true;
    isFetchingAlumnos.value = true;

    try {
        const alumnos = await cursosStore.fetchAlumnosInscritos(curso.id);
        alumnosInscritos.value = alumnos;
    } catch (error) {
        console.error("Error al cargar alumnos:", error);
    } finally {
        isFetchingAlumnos.value = false;
    }
};

const closeModal = () => {
    isModalOpen.value = false;
    selectedCurso.value = null;
    alumnosInscritos.value = [];
};

// --- LÓGICA DE CONFIRMACIÓN DE SOLICITUDES (NUEVO) ---
const showInscriptionConfirmation = (cursoId, cursoNombre) => {
    const isStudent = authStore.isStudent;
    const action = isStudent ? 'Inscripción' : 'como Docente';
    
    Object.assign(confirmationDetails, {
        show: true,
        title: `Solicitud de ${action}`,
        message: `¿Estás seguro de enviar tu solicitud de ${action.toLowerCase()} para el curso "${cursoNombre}"?`,
        cursoId,
        //cursoNombre,
        type: 'inscripcion',
    });
};

// Muestra el modal de confirmación para Baja
const showBajaConfirmation = (cursoId, cursoNombre) => {
    const action = authStore.isStudent ? 'Baja como Alumno' : 'Baja como Docente';

    Object.assign(confirmationDetails, {
        show: true,
        title: `Confirmar Solicitud de Baja`,
        message: `¿Estás seguro de enviar la solicitud de ${action.toLowerCase()} para el curso "${cursoNombre}"?`,
        cursoId,
        //cursoNombre,
        type: 'baja',
    });
};

// Cancela y oculta el modal
const cancelConfirmation = () => {
    confirmationDetails.show = false;
    confirmationDetails.cursoId = null;
    confirmationDetails.type = null;
};

// Ejecuta la acción después de la confirmación
const executeConfirmation = async () => {
    const { cursoId, cursoNombre, type } = confirmationDetails;
    
    if (type === 'inscripcion') {
        await submitInscription(cursoId, cursoNombre);
    } else if (type === 'baja') {
        await submitBaja(cursoId, cursoNombre);
    }
    
    cancelConfirmation(); // Oculta el modal después de la ejecución
};

// --- FUNCIONES DE SOLICITUD (Modificadas para ser privadas) ---

const submitInscription = async (cursoId, cursoNombre) => {
  const tipo = authStore.isStudent 
      ? 'inscripcion_alumno' 
      : 'asignacion_profesor'
  
  try {
      if (userId.value) {
        await cursosStore.sendSolicitud(userId.value, cursoId, tipo)
        const tipo_display = authStore.isStudent ? 'Inscripción' : 'Asignación Docente'
        // Se podría añadir un pequeño mensaje de éxito aquí si se usara un sistema de notificación
      } else {
        console.error("No se pudo enviar la solicitud: ID de usuario no disponible.")
      }
  } catch (error) {
    // Se podría añadir un pequeño mensaje de error aquí
    console.error(`Error al enviar solicitud: ${error.message}`)
  }
}

const submitBaja = async (cursoId, cursoNombre) => {
  const tipo = authStore.isStudent ? 'baja_alumno' : 'baja_profesor'

  try {
      if (userId.value) {
        await cursosStore.sendSolicitud(userId.value, cursoId, tipo)
        // Se podría añadir un pequeño mensaje de éxito aquí
      } else {
        console.error("No se pudo enviar la solicitud: ID de usuario no disponible.")
      }
  } catch (error) {
    console.error(`Error al enviar solicitud: ${error.message}`)
  }
}

// --- LÓGICA DE ESTADO ---
const getStatusText = (curso) => {
  const userIdVal = userId.value;
  if (!userIdVal) return 'Disponible';

  if (cursosStore.isSolicitudPending(userIdVal, curso.id)) {
    return 'Solicitud Pendiente'
  }
  
  if (cursosStore.isUserAssignedOrInscribed(userIdVal, curso.id)) {
    return 'Inscrito / Asignado'
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
