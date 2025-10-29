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
            'p-4 mb-4 rounded-lg',
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
            class="bg-white p-4 border rounded-lg shadow-md flex justify-between items-start">

            <div>
              <p class="text-base font-semibold text-gray-700">
                {{ formatTipo(solicitud.solicitud_tipo) }}:
                <span class="text-blue-600">{{ solicitud.cursoNombre }}</span>
              </p>

              <p class="text-sm text-gray-600 mt-1">
                Usuario: <span class="font-medium">{{ solicitud.usuarioNombre || "Sin nombre" }}</span>
                <span class="text-xs text-gray-400">({{ formatDate(solicitud.created_at) }})</span>
              </p>
            </div>

            <div class="flex space-x-3 flex-shrink-0">
              <button @click="handleApproval(solicitud)"
                class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm">
                ✅ Aprobar
              </button>

              <button @click="handleRejection(solicitud.id)"
                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm">
                ❌ Rechazar
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup>
import { computed, ref, onMounted } from "vue";
import { useCursosStore } from "@/stores/cursos";
import { useAuthStore } from "@/stores/auth";
import { storeToRefs } from "pinia";

const authStore = useAuthStore();
const cursosStore = useCursosStore();

const { solicitudes, cursos, isLoading } = storeToRefs(cursosStore);

const notificationMessage = ref(null);
const notificationType = ref(null);
let notifTimeout = null;

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
    inscripcion_profesor: "Asignación (Profesor)",
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

// ✅ Acciones
const handleApproval = async (solicitud) => {
  if (!confirm("¿Aprobar esta solicitud?")) return;
  await cursosStore.approveSolicitud(solicitud);
  showNotification("Solicitud aprobada ✅", "success");
  await cursosStore.fetchSolicitudes();
  console.log('Aprobando solicitud:', solicitud)
};

const handleRejection = async (id) => {
  if (!confirm("¿Rechazar esta solicitud?")) return;
  await cursosStore.rejectSolicitud(id);
  showNotification("Solicitud rechazada ❌", "error");
  await cursosStore.fetchSolicitudes();
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
