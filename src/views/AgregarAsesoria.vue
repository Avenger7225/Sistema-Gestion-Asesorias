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
        <label for="horario" class="block text-sm font-medium text-gray-700">Horario y Aula (Ej: Lunes a Miercoles 10:00 - 12:00 Aula 10)</label>
        <input
          type="text"
          id="horario"
          v-model="newCurso.horario"
          required
          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>
      
      <!-- INICIO: Nuevos Campos de Classroom -->
      <div>
        <label for="enlace" class="block text-sm font-medium text-gray-700">Enlace a Google Classroom (Opcional)</label>
        <input
          type="url"
          id="enlace"
          v-model="newCurso.classroom"
          placeholder="https://classroom.google.com/c/..."
          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      <div>
        <label for="clave" class="block text-sm font-medium text-gray-700">Clave de Acceso a Classroom (Opcional)</label>
        <input
          type="text"
          id="clave"
          v-model="newCurso.clave_classroom"
          placeholder="Ej: abc123def"
          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>
      <!-- FIN: Nuevos Campos de Classroom -->

      <div class="grid grid-cols-2 gap-6">
        <div>
          <label for="cupo_maximo" class="block text-sm font-medium text-gray-700">Cupo Máximo</label>
          <input
            type="number"
            id="cupo_maximo"
            v-model.number="newCurso.cupo_maximo"
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
import { ref, onMounted } from 'vue';
import { useCursosStore } from '@/stores/cursos';
import { useRouter } from 'vue-router';

const cursosStore = useCursosStore();
const router = useRouter();

const newCurso = ref({
  nombre: '',
  descripcion: '',
  horario: '',
  cupo_maximo: 1,
  profesorId: null,
  classroom: '',
  clave_classroom: '',
});

const profesoresDisponibles = ref([]);
const message = ref(null);
const messageClass = ref('');

const loadData = async () => {
  profesoresDisponibles.value = await cursosStore.fetchProfesores();
  await cursosStore.fetchCursos();
};

onMounted(() => {
    loadData();
});

const getProfesorById = (id) => {
    if (!id) return { nombre: 'Sin asignar' };
    const profesor = profesoresDisponibles.value.find(p => p.id === id);
    return { nombre: profesor ? `Prof. ${profesor.nombre}` : 'Sin asignar' }; 
};

const submitForm = async () => { 
  message.value = null;
  messageClass.value = '';
  
  try {
    // La store debe ser modificada para aceptar estos nuevos campos
    await cursosStore.addCurso(newCurso.value); 
    message.value = `¡Curso "${newCurso.value.nombre}" agregado con éxito!`;
    messageClass.value = 'bg-green-100 text-green-800';

    setTimeout(() => {
        router.push({ name: 'cursos' });
    }, 1500);

  } catch (error) {
    message.value = `Error al guardar el curso: ${error.message}`;
    messageClass.value = 'bg-red-100 text-red-800';
    console.error("Error al guardar:", error);
  }
};
</script>
