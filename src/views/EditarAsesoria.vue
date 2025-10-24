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
          <label for="horario" class="block text-sm font-medium text-gray-700">Horario (Ej: Lun/Mié 10:00 - 12:00)</label>
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
              v-model.number="curso.cupo"
              required
              min="1"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label for="profesor" class="block text-sm font-medium text-gray-700">Profesor Asignado (UUID)</label>
            <select
              id="profesor"
              v-model="curso.profesorId" 
              class="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option :value="null">-- Sin asignar --</option>
              
              <!-- Usar UUIDs como strings para la DB -->
              <option value="9f61b4aa-2a85-451e-bdbf-ea848f760d15">Prof. (Martin Sanchez)</option> 
              <option value="95e1d818-9efd-4c42-833c-e3886292631f">Otro Prof.</option>
              
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
import { ref, watchEffect } from 'vue';
import { useCursosStore } from '@/stores/cursos';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia'; 

const cursosStore = useCursosStore();
const route = useRoute();
const router = useRouter();

const { cursos } = storeToRefs(cursosStore); 

const curso = ref({}); 

const message = ref(null);
const messageClass = ref('');

// Función simulada para obtener el nombre del profesor por ID
const getProfesorById = (id) => {
    if (id === '9f61b4aa-2a85-451e-bdbf-ea848f760d15') return { nombre: 'Prof. Martin Sanchez' };
    if (id === '95e1d818-9efd-4c42-833c-e3886292631f') return { nombre: 'Prof. Ana López' };
    return { nombre: 'Sin asignar' };
};

watchEffect(() => {
  const cursoIdStr = route.params.cursoId;
  const currentCursos = cursos.value; 

  if (!currentCursos || currentCursos.length === 0) {
      curso.value = { id: null, nombre: 'Cargando...' };
      return; 
  }

  // Los IDs de los cursos son números enteros (no UUIDs), por eso usamos parseInt.
  const cursoIdNum = parseInt(cursoIdStr, 10); 
  
  const foundCurso = currentCursos.find(c => c.id === cursoIdNum); 

  if (foundCurso) {
    // Asegurarse de que el objeto local sea una copia editable, manteniendo la estructura de la store
    curso.value = { ...foundCurso }; 
  } else {
    curso.value = { id: null, nombre: 'Error: ID no encontrado' }; 
  }
});

// Convertir a función asíncrona
const submitForm = async () => {
  // 1. Determinar el nombre del profesor basado en el ID seleccionado
  const profesorData = getProfesorById(curso.value.profesorId);
  curso.value.profesor = profesorData.nombre;

  try {
    // 2. Llamar a la acción asíncrona de actualización y esperar su finalización
    await cursosStore.updateCurso(curso.value.id, curso.value);

    // 3. Mostrar mensaje de éxito
    message.value = `¡Curso "${curso.value.nombre}" actualizado con éxito!`;
    messageClass.value = 'bg-green-100 text-green-800';

    // 4. Redirigir después de 1.5 segundos
    setTimeout(() => {
        router.push({ name: 'cursos' }); 
    }, 1500);

  } catch (error) {
    message.value = `Error al actualizar el curso: ${error.message}`;
    messageClass.value = 'bg-red-100 text-red-800';
    console.error("Error al actualizar:", error);
  }
};
</script>
