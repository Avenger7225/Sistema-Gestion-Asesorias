<template>
  <div class="max-w-xl mx-auto p-6 bg-white shadow-xl rounded-lg mt-10">
    <h1 class="text-3xl font-bold text-gray-800 mb-6 border-b pb-2">
      👤 Registro de Nuevo Usuario (Admin)
    </h1>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      
      <div>
        <label for="nombre" class="block text-sm font-medium text-gray-700">Nombre del usuario</label>
        <input 
          type="text" 
          id="nombre" 
          v-model="formData.nombre" 
          required 
          class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        >
      </div>

      <div>
        <label for="email" class="block text-sm font-medium text-gray-700">Correo Electrónico</label>
        <input 
          type="email" 
          id="email" 
          v-model="formData.email" 
          required 
          class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        >
      </div>

      <div>
        <label for="password" class="block text-sm font-medium text-gray-700">Contraseña</label>
        <input 
          type="password" 
          id="password" 
          v-model="formData.password" 
          required 
          class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        >
      </div>

      <div>
        <label for="rol" class="block text-sm font-medium text-gray-700">Asignar Rol</label>
        <select 
          id="rol" 
          v-model="formData.rol" 
          required 
          class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white"
        >
          <option value="alumno">Alumno</option>
          <option value="profesor">Profesor</option>
          <option value="admin">Administrador</option>
        </select>
      </div>

      <div v-if="error" class="p-3 text-red-700 bg-red-100 rounded-md">Error: {{ error }}</div>
      <div v-if="success" class="p-3 text-green-700 bg-green-100 rounded-md">¡Usuario "{{ lastRegisteredUser }}" registrado con éxito como **{{ lastRegisteredRole }}**!</div>
      
      <button 
        type="submit" 
        :disabled="isLoading"
        class="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {{ isLoading ? 'Registrando...' : 'Registrar Usuario' }}
      </button>

    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { onMounted } from 'vue';

// --- SETUP ---
const authStore = useAuthStore();
const router = useRouter();

// --- ESTADO DEL FORMULARIO ---
const formData = ref({
    nombre: '',
    email: '',
    password: '',
    rol: 'alumno', // Default a alumno
});

const isLoading = ref(false);
const error = ref(null);
const success = ref(false);
const lastRegisteredUser = ref('');
const lastRegisteredRole = ref('');

// --- GUARDIA DE SEGURIDAD (Redirección si no es Admin) ---
onMounted(() => {
    // Redirigir si el rol no es 'admin' al montar la página
    if (authStore.userRole !== 'admin') {
        router.push('/');
    }
});

// --- MANEJADOR DE ENVÍO ---
const handleSubmit = async () => {
    error.value = null;
    success.value = false;
    isLoading.value = true;
    
    // Validar contraseña
    if (formData.value.password.length < 4) {
        error.value = "La contraseña debe tener al menos 4 caracteres.";
        isLoading.value = false;
        return;
    }

    try {
        await authStore.adminRegisterUser(
            formData.value.email,
            formData.value.password,
            formData.value.nombre,
            formData.value.rol
        );
        
        lastRegisteredUser.value = formData.value.nombre;
        lastRegisteredRole.value = formData.value.rol;
        success.value = true;
        
        // Limpiar formulario excepto el rol para facilitar registros consecutivos
        formData.value.nombre = '';
        formData.value.email = '';
        formData.value.password = '';
        

    } catch (err) {
        console.error("Error de registro:", err);
        // Supabase puede devolver un error de formato: "Email already registered"
        error.value = err.message.includes('already registered') 
            ? 'El correo electrónico ya está registrado.' 
            : err.message || "Error desconocido al registrar el usuario.";
    } finally {
        isLoading.value = false;
    }
};
</script>