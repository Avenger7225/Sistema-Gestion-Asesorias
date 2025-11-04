<template>
  <div class="p-6">
    <h1 class="text-3xl font-bold text-gray-800 mb-6 border-b pb-3">
      Gestión de Solicitudes Pendientes
    </h1>

    <!-- ✅ Validación de acceso -->
    <div v-if="!authStore.isAdmin" class="p-8 text-center bg-red-100 border-2 border-red-400 text-red-800 rounded-lg">
      <p class="text-xl font-semibold">🚫 Acceso denegado</p>
      <p class="text-sm mt-2">Solo los administradores pueden ver esta página.</p>
    </div>

    <div v-else>
      <div class="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 p-4 rounded-lg mb-6">
        <p class="font-bold">📌 Información</p>
        <p>Desde aquí puede aprobar o rechazar solicitudes de estudiantes y profesores.</p>
      </div>

      <!-- ✅ Notificación -->
      <transition name="fade">
        <div v-if="notificationMessage"
          :class="[
            'p-4 mb-4 rounded-lg shadow-md',
            notificationType === 'success' ? 'bg-green-100 border-l-4 border-green-500 text-green-700'
            : 'bg-red-100 border-l-4 border-red-500 text-red-700'
          ]">
          {{ notificationMessage }}
        </div>
      </transition>

      <!-- ✅ Loading -->
      <div v-if="isLoading" class="text-center py-10">
        <svg class="animate-spin h-8 w-8 text-blue-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
          </path>
        </svg>
        <p class="text-gray-500 mt-2">Cargando solicitudes...</p>
      </div>

      <!-- ✅ No hay solicitudes -->
      <div v-else-if="solicitudesPendientes.length === 0"
        class="p-8 text-center bg-green-50 rounded-lg text-green-700 border-2 border-green-300">
        <p class="text-xl font-semibold">🎉 No hay solicitudes pendientes</p>
      </div>

      <!-- ✅ Lista de solicitudes -->
      <div v-else>
        <p class="text-gray-600 mb-4">
          Total: <span class="font-bold text-lg text-orange-600">{{ solicitudesPendientes.length }}</span>
        </p>

        <div class="space-y-4">
          <div v-for="solicitud in solicitudesPendientes" :key="solicitud.id"
            class="bg-white p-4 border rounded-xl shadow-lg flex justify-between items-start">

            <div>
              <p class="text-base font-semibold text-gray-700">
                {{ formatTipo(solicitud.solicitud_tipo) }}:
                <span class="text-blue-600">{{ solicitud.cursoNombre }}</span>
              </p>

              <p class="text-sm text-gray-600 mt-1">
                Usuario: <span class="font-medium">{{ solicitud.usuarioNombre || "Sin nombre" }}</span>
                <span class="text-xs text-gray-400">({{ formatDate(solicitud.created_at) }})</span>
              </p>
              
              <p class="text-sm text-gray-400 mt-1">
                ID Usuario: <span class="text-xs font-mono">{{ solicitud.usuarioId }}</span>
              </p>
            </div>

            <div class="flex space-x-3 flex-shrink-0">
              <button @click="showConfirmation('aprobar', solicitud)"
                class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm shadow-md">
                ✅ Aprobar
              </button>

              <button @click="showConfirmation('rechazar', solicitud)"
                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm shadow-md">
                ❌ Rechazar
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>

    <!-- MODAL DE CONFIRMACIÓN DE ACCIÓN (Aprobar/Rechazar) -->
    <div 
      v-if="confirmationDetails.show" 
      class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center"
    >
      <div class="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 transform transition-all border-t-8"
        :class="confirmationDetails.action === 'aprobar' ? 'border-green-500' : 'border-red-500'">
        
        <h3 class="text-2xl font-bold text-gray-800 mb-3 flex items-center">
          <svg v-if="confirmationDetails.action === 'aprobar'" class="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <svg v-else class="w-6 h-6 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          Confirmar {{ confirmationDetails.action === 'aprobar' ? 'Aprobación' : 'Rechazo' }}
        </h3>

        <p class="text-gray-700 mb-4 font-medium">
          ¿Estás seguro de que quieres {{ confirmationDetails.action }} la siguiente solicitud?
        </p>
        
        <div class="bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm">
            <p class="font-semibold text-gray-700">{{ formatTipo(confirmationDetails.solicitud?.solicitud_tipo) }} para el curso "{{ confirmationDetails.solicitud?.cursoNombre }}"</p>
            <p class="text-gray-500 mt-1">Usuario: {{ confirmationDetails.solicitud?.usuarioNombre || "Sin nombre" }}</p>
        </div>

        <div class="mt-6 flex justify-end space-x-3">
          <button
            @click="cancelConfirmation"
            class="px-5 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition duration-150"
          >
            Cancelar
          </button>
          <button
            @click="executeConfirmation"
            :class="['px-5 py-2 text-white font-medium rounded-lg shadow-md transition duration-150', confirmationDetails.action === 'aprobar' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700']"
          >
            {{ confirmationDetails.action === 'aprobar' ? 'Sí, Aprobar' : 'Sí, Rechazar' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>


<script setup>
import { computed, ref, onMounted, reactive } from "vue";
import { useCursosStore } from "@/stores/cursos";
import { useAuthStore } from "@/stores/auth";
import { storeToRefs } from "pinia";

const authStore = useAuthStore();
const cursosStore = useCursosStore();

const { solicitudes, cursos, isLoading } = storeToRefs(cursosStore);

const notificationMessage = ref(null);
const notificationType = ref(null);
let notifTimeout = null;

// ESTADO DEL MODAL DE CONFIRMACIÓN (Nuevo)
const confirmationDetails = reactive({
    show: false,
    action: null, // 'aprobar' o 'rechazar'
    solicitud: null, // Objeto completo de la solicitud
});

const showNotification = (msg, type = "success") => {
  notificationMessage.value = msg;
  notificationType.value = type;

  clearTimeout(notifTimeout);
  notifTimeout = setTimeout(() => {
    notificationMessage.value = null;
  }, 3500);
};

// ✅ Solo solicitudes pendientes
const solicitudesPendientes = computed(() =>
  solicitudes.value?.filter((s) => s.estado_solicitud === "pendiente") || []
);

const getCursoName = (id) => cursos.value.find((c) => c.id === id)?.nombre || "Curso desconocido";

const formatTipo = (tipo) =>
  ({
    inscripcion_alumno: "Inscripción (Alumno)",
    asignacion_profesor: "Asignación (Profesor)", // Cambiado de inscripcion_profesor a asignacion_profesor para consistencia con otros archivos
    baja_alumno: "Baja (Alumno)",
    baja_profesor: "Baja (Profesor)",
  }[tipo] || tipo);

const formatDate = (d) =>
  new Date(d).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// --- LÓGICA DEL MODAL DE CONFIRMACIÓN ---

const showConfirmation = (action, solicitud) => {
    Object.assign(confirmationDetails, {
        show: true,
        action,
        solicitud,
    });
};

const cancelConfirmation = () => {
    Object.assign(confirmationDetails, {
        show: false,
        action: null,
        solicitud: null,
    });
};

const executeConfirmation = async () => {
    const { action, solicitud } = confirmationDetails;

    if (!solicitud) {
        cancelConfirmation();
        return;
    }

    try {
        if (action === 'aprobar') {
            await cursosStore.approveSolicitud(solicitud);
            showNotification("Solicitud aprobada ✅", "success");
        } else if (action === 'rechazar') {
            await cursosStore.rejectSolicitud(solicitud.id);
            showNotification("Solicitud rechazada ❌", "error");
        }
    } catch (error) {
        showNotification(`Error al procesar solicitud: ${error.message}`, "error");
    } finally {
        cancelConfirmation();
        // Recargar solicitudes para actualizar la lista
        await cursosStore.fetchSolicitudes();
    }
};

// --- ACCIONES MODIFICADAS PARA USAR EL MODAL ---
const handleApproval = (solicitud) => {
  showConfirmation('aprobar', solicitud);
};

const handleRejection = (solicitud) => {
  showConfirmation('rechazar', solicitud);
};

onMounted(() => {
  if (authStore.isAdmin) cursosStore.fetchCursos();
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
