<template>
  <div class="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-lg">
    <h1 class="text-3xl font-bold text-gray-800 mb-6 border-b pb-2">
      Agregar Nuevo Curso 
    </h1>

    <form @submit.prevent="submitForm" class="space-y-6">
      <div>
        <label for="nombre" class="block text-sm font-medium text-gray-700">Nombre del Curso</label>
        <input
          type="text"
          id="nombre"
          v-model="newCurso.nombre"
          required
          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      <div>
        <label for="descripcion" class="block text-sm font-medium text-gray-700">Descripción</label>
        <textarea
          id="descripcion"
          v-model="newCurso.descripcion"
          rows="3"
          required
          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        ></textarea>
      </div>

      <div>
        <label for="horario" class="block text-sm font-medium text-gray-700">Horario (Ej: Lun/Mié 10:00 - 12:00)</label>
        <input
          type="text"
          id="horario"
          v-model="newCurso.horario"
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
            v-model.number="newCurso.cupo"
            required
            min="1"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label for="profesor" class="block text-sm font-medium text-gray-700">Profesor Asignado (UUID)</label>
          <select
            id="profesor"
            v-model="newCurso.profesorId"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option :value="null">-- Sin asignar --</option>
            
            <!-- NOTA: Aquí debes listar los profesores reales obtenidos del store -->
            <option value="9f61b4aa-2a85-451e-bdbf-ea848f760d15">Profesor Prueba 1</option>
            <option value="1f23c4d5-56e7-890a-b12c-d34e56f7890a">Profesor Prueba 2</option>
            
          </select>
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
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-md hover:bg-blue-700 transition duration-150"
        >
          Guardar Curso
        </button>
      </div>
    </form>
    
    <p v-if="message" :class="messageClass" class="mt-4 p-3 rounded-md">{{ message }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useCursosStore } from '@/stores/cursos';
import { useRouter } from 'vue-router';

const cursosStore = useCursosStore();
const router = useRouter();

// Inicialización del nuevo curso con valores por defecto
const newCurso = ref({
  nombre: '',
  descripcion: '',
  horario: '',
  cupo: 1,
  profesorId: null, // ID del profesor (UUID)
});

const message = ref(null);
const messageClass = ref('');

// 🏆 FUNCIÓN PRINCIPAL ASÍNCRONA PARA GUARDAR EN SUPABASE
const submitForm = async () => { 
  // Limpiamos mensajes
  message.value = null;
  messageClass.value = '';
  
  try {
    // La acción addCurso en el Store espera el objeto newCurso.value
    await cursosStore.addCurso(newCurso.value); 

    // 4. Mostrar mensaje de éxito
    message.value = `¡Curso "${newCurso.value.nombre}" agregado con éxito!`;
    messageClass.value = 'bg-green-100 text-green-800';

    // 5. Redirigir
    setTimeout(() => {
        router.push({ name: 'cursos' }); // Volver a la lista de cursos
    }, 1500);

  } catch (error) {
    // El error.message viene del error que lanzamos en el Store
    message.value = `Error al guardar el curso: ${error.message}`;
    messageClass.value = 'bg-red-100 text-red-800';
    console.error("Error al guardar:", error);
  }
};
</script>
