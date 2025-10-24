// src/services/authService.js
import { supabase } from '@/supabase'
import { useAuthStore } from '@/stores/auth'

export async function loginWithSupabase(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  const user = data.user
  let userData;

// Buscar el usuario en la tabla "usuarios"
  const { data: userRow, error: userError } = await supabase
    .from('usuarios')
    .select('*')
    .eq('correo', user.email)
    .single()

  // Si no se encuentra el perfil (es el primer inicio de sesión)
  if (!userRow) { 
    // Lógica para determinar el rol en la primera inserción
    let rolParaInsertar = 'alumno';
    
    if (user.email === 'admin@gmail.com') {
      rolParaInsertar = 'admin';
    } else if (user.email === 'profesor@gmail.com') {
      rolParaInsertar = 'profesor';
    }
    
    // Insertar el usuario con el rol determinado
    const { error: insertError } = await supabase
      .from('usuarios')
      .insert([{ 
        id: user.id, 
        nombre: 'Nuevo usuario', 
        rol: rolParaInsertar,
        correo: user.email 
      }])

    if (insertError) throw insertError

    userData = { id: user.id, nombre: 'Nuevo usuario', rol: rolParaInsertar, correo: user.email }
  } else {
    userData = userRow
  }

  const authStore = useAuthStore()
  authStore.login({
    id: user.id,
    email: user.email,
    name: userData.nombre,
    role: userData.rol,
  })

  return userData
}

export async function logoutFromSupabase() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error

  const authStore = useAuthStore()
  authStore.logout()
}
