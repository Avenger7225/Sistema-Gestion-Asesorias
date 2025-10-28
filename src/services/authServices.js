import { supabase } from '@/supabase'
import { useAuthStore } from '@/stores/auth' 

/**
 * Inicia sesión en Supabase y asegura que el perfil existe en la tabla 'usuarios'.
 * @param {string} email 
 * @param {string} password 
 * @returns {object} Los datos del perfil (userData)
 */
export async function loginWithSupabase(email, password) {
  // Paso 1: Autenticación con Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  const user = data.user
  let userData;

  // Paso 2: Buscar el perfil en la tabla "usuarios" usando el ID del usuario
  const { data: userRow, error: userError } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', user.id) // Usar el ID de Supabase para buscar
    .single()

  // Revisar si el perfil NO se encontró
  // Supabase/PostgREST devuelve un error con código PGRST116 cuando single() no encuentra la fila.
  if (userError && userError.code === 'PGRST116') { 
    console.log(`[AuthServices] Perfil no encontrado para ${user.email}. Creando nuevo perfil.`)
    
    // Lógica para determinar el rol en la primera inserción
    let rolParaInsertar = 'alumno';
    
    // *** IMPORTANTE: Usamos 'administrador' aquí para unificar con el store ***
    if (user.email === 'admin@gmail.com') {
      rolParaInsertar = 'administrador'; 
    } else if (user.email === 'profesor@gmail.com') {
      rolParaInsertar = 'maestro'; 
    }
    
    // Paso 3: Insertar el usuario con el rol determinado
    const { data: insertedData, error: insertError } = await supabase
      .from('usuarios')
      .insert([{ 
        id: user.id, // Insertar con el ID de Supabase Auth
        nombre: 'Nuevo usuario', 
        rol: rolParaInsertar,
        correo: user.email 
      }])
      .select() // Pide que te devuelva el objeto insertado
      .single()

    if (insertError) throw insertError
    
    // La data insertada se encuentra en insertedData
    userData = insertedData 

  } else if (userError) {
     // Si hay otro tipo de error (ej: permisos RLS), lanzarlo
     throw userError
  } else {
    // Si se encuentra el perfil
    userData = userRow
  }
  
  // Devolvemos el objeto del perfil (rol, nombre, etc.) para que Login.vue lo use.
  return userData 
}

/**
 * Cierra la sesión en Supabase y limpia el store.
 */
export async function logoutFromSupabase() {
  const authStore = useAuthStore() 
  
  // La acción logout del store llama a supabase.auth.signOut() y limpia el estado.
  await authStore.logout()
  
  // El store.logout ya no redirige, el router guard lo hará.
}
