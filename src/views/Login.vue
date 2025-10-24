<template>
  <div class="login-container">
    <div class="login-card">
      <h2>Iniciar Sesion</h2>
      
      <div v-if="Message" class="error-alert">
        <span class="error-icon">⚠️</span>
        {{ Message }}
      </div>

      <!-- Formulario -->
      <form @submit.prevent="handleLogin" class="login-form">

        <div class="form-group">
          <label for="username">Correo</label>
          <input
            id="username"
            v-model="username"
            type="text"
            placeholder="Ingresa tu usuario"
            required
            autocomplete="username"
          />
        </div>

        <div class="form-group">
          <label for="password">Contraseña</label>
          <div class="password-input">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Ingresa tu contraseña"
              required
              autocomplete="current-password"
            />
            <button
              type="button"
              class="toggle-password"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? 'ocultar' : 'ver' }}
            </button>
          </div>
        </div>

        <!-- Botón de entrar -->
        <button 
          type="submit" 
          class="login-button"
        >
          <span>Entrar</span>
        </button>

      </form>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { loginWithSupabase } from '@/services/authServices'

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const Message = ref('')
const router = useRouter()
const authStore = useAuthStore()

const handleLogin = async () => {
  Message.value = ''

  try {
    const user = await loginWithSupabase(username.value, password.value)

    // Redirigir según rol
    if (user.rol === 'admin') {
      router.push({ name: 'dashboard' })
    } else {
      router.push({ name: 'dashboard' })
    }
  } catch (error) {
    Message.value = error.message || 'Error al iniciar sesión.'
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 420px;
}

h2 {
  margin: 0 0 24px 0;
  color: #333;
  text-align: center;
  font-size: 28px;
}

.error-alert {
  background-color: #fee;
  border: 1px solid #fcc;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 20px;
  color: #c33;
  display: flex;
  align-items: center;
  gap: 8px;
}

.error-icon {
  font-size: 18px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

label {
  font-weight: 600;
  color: #555;
  font-size: 14px;
}

input {
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.3s ease;
}

input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.password-input {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input input {
  flex: 1;
  padding-right: 50px;
}

.toggle-password {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  padding: 4px 8px;
  transition: opacity 0.2s;
}

.toggle-password:hover:not(:disabled) {
  opacity: 0.7;
}

.toggle-password:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.login-button {
  padding: 14px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 8px;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>