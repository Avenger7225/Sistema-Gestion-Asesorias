<template>
  <div class="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-lg">
    <h1 class="text-3xl font-bold text-gray-800 mb-6 border-b pb-2">
      Editar Curso: {{ curso.nombre }}
    </h1>

    <div v-if="!curso.id" class="text-red-500 p-4 bg-red-100 rounded-md">
        Curso no encontrado o ID no válido.
    </div>

    <form v-else @submit.prevent="submitForm" class="space-y-6">
      
      <div>
        <label class="block text-sm font-medium text-gray-700">Nombre del Curso</label>
        <p class="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md sm:text-sm font-semibold">
          {{ curso.nombre }}
        </p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700">Descripción</label>
        <p class="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md sm:text-sm">
          {{ curso.descripcion }}
        </p>
      </div>

      <div class="border-t pt-4 space-y-6">
        <h2 class="text-xl font-semibold text-gray-700">Opciones Editables</h2>

        <div>
          <label for="horario" class="block text-sm font-medium text-gray-700">Horario y Aula (Ej: Lunes a Miercoles 10:00 - 12:00 Aula 10)</label>
          <input
            type="text"
            id="horario"
            v-model="curso.horario"
            required
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        
        <div class="grid grid-cols-2 gap-6">
          
          <div>
            <label for="cupo" class="block text-sm font-medium text-gray-700">Cupo Máximo</label>
            <input
              type="number"
              id="cupo"
              v-model.number="curso.cupo_maximo"
              required
              min="1"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
              <label for="profesor" class="block text-sm font-medium text-gray-700">Profesor Asignado</label>
              <select
                  id="profesor"
                  v-model="curso.profesorId" 
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                  <!-- El valor 'null' en el option asegura que VUE lo maneje como null -->
                  <option :value="null">-- Sin asignar --</option>
                  
                  <option 
                      v-for="profesor in profesoresDisponibles" 
                      :key="profesor.id"
                      :value="profesor.id"
                  >
                      Prof. ({{ profesor.nombre }})
                  </option>
                  
              </select>
          </div>

        </div>
      </div>

      <div class="flex justify-end space-x-4 pt-4 border-t mt-6">
        <button
          type="button"
          @click="router.back()"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition duration-150"
        >
          Cancelar
        </button>
        <button
          type="submit"
          class="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md shadow-md hover:bg-green-700 transition duration-150"
        >
          Guardar Cambios
        </button>
      </div>
    </form>
    
    <p v-if="message" :class="messageClass" class="mt-4 p-3 rounded-md">{{ message }}</p>
  </div>
</template>

<script setup>
import { ref, watchEffect, onMounted } from 'vue';
import { useCursosStore } from '@/stores/cursos';
import { useAuthStore } from '@/stores/auth';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';

const cursosStore = useCursosStore();
const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

const { cursos } = storeToRefs(cursosStore); 

// Objeto reactivo para contener los datos del curso a editar
const curso = ref({
  horario: '',
  cupo_maximo: 1,
  profesorId: null, // Debe ser null para manejar "Sin asignar"
  nombre: 'Cargando...'
}); 
const profesoresDisponibles = ref([]);
const message = ref(null);
const messageClass = ref('');

const loadData = async () => {
  // Aseguramos que los profesores se carguen primero
  profesoresDisponibles.value = await cursosStore.fetchProfesores();
  // Luego cargamos los cursos (para tener el curso actual)
  await cursosStore.fetchCursos();
};

onMounted(() => {
    loadData();
});

const getProfesorById = (id) => {
    if (!id) return { nombre: 'Sin asignar' };
    const profesor = profesoresDisponibles.value.find(p => p.id === id);
    // Retornamos un objeto para evitar errores si no se encuentra
    return { nombre: profesor ? `Prof. ${profesor.nombre}` : 'Sin asignar' }; 
};

// Sincroniza el curso del store con el formulario local
watchEffect(() => {
  const cursoIdStr = route.params.cursoId;
  const currentCursos = cursos.value; 

  if (!currentCursos || currentCursos.length === 0) {
      // Estado de carga inicial
      curso.value.id = null;
      curso.value.nombre = 'Cargando...';
      return; 
  }
  const foundCurso = currentCursos.find(c => c.id === cursoIdStr); 

  if (foundCurso) {
    // 🔑 CORRECCIÓN IMPORTANTE: Mapear id_profesor a profesorId para el v-model
    curso.value = { 
        ...foundCurso,
        // Usar null si id_profesor es undefined o '' o 0 para que el select funcione
        profesorId: foundCurso.id_profesor || null, 
    }; 
  } else {
    curso.value.id = null;
    curso.value.nombre = 'Error: ID no encontrado';
  }
});

const submitForm = async () => {
  // Aseguramos que sea null si está vacío (problema común de formularios)
  const idProfesorLimpio = curso.value.profesorId === '' ? null : curso.value.profesorId;
  const profesorData = getProfesorById(idProfesorLimpio);
  
  try {
    // Se construye el payload que la función `updateCurso` espera:
    const payload = {
        horario: curso.value.horario,
        cupo_maximo: curso.value.cupo_maximo,
        // Usamos el ID limpio
        profesorId: idProfesorLimpio, 
        profesorNombre: profesorData.nombre 
    };

    const updatedCurso = await cursosStore.updateCurso(curso.value.id, payload);

    message.value = `¡Curso "${updatedCurso.nombre}" actualizado con éxito!`;
    messageClass.value = 'bg-green-100 text-green-800';

    setTimeout(() => {
        // Redireccionar o limpiar mensaje
        // router.push({ name: 'cursos' }); 
    }, 1500);

  } catch (error) {
    // Si hay un error de Supabase, se mostrará aquí
    message.value = `Error al actualizar el curso: ${error.message || error.toString()}`;
    messageClass.value = 'bg-red-100 text-red-800';
    console.error("Error al actualizar:", error);
  }
};
</script>
