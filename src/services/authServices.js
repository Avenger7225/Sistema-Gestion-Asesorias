import { supabase } from '@/supabase'
import { useAuthStore } from '@/stores/auth' 

export async function loginWithSupabase(email, password) {
  // Autenticación con Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  const user = data.user
  let userData;

  // Buscar el perfil en la tabla "usuarios" usando el ID del usuario
  const { data: userRow, error: userError } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', user.id)
    .single()

  // Revisar si el perfil NO se encontró
  if (userError && userError.code === 'PGRST116') { 
    console.log(`[AuthServices] Perfil no encontrado para ${user.email}. Creando nuevo perfil.`)
    let rolParaInsertar = 'alumno';
    
    if (user.email === 'admin@gmail.com') {
      rolParaInsertar = 'admin'; 
    } else if (user.email === 'profesor@gmail.com') {
      rolParaInsertar = 'profesor'; 
    }
    
    // Insertar el usuario con el rol determinado
    const { data: insertedData, error: insertError } = await supabase
      .from('usuarios')
      .insert([{ 
        id: user.id,
        nombre: 'Nuevo usuario', 
        rol: rolParaInsertar,
        correo: user.email 
      }])
      .select()
      .single()

    if (insertError) throw insertError
    
    // La data insertada se encuentra en insertedData
    userData = insertedData 

  } else if (userError) {
     throw userError
  } else {
    // Si se encuentra el perfil
    userData = userRow
  }
  
  return userData 
}

/**
 * Cierra la sesión en Supabase y limpia el store.
 */
export async function logoutFromSupabase() {
  const authStore = useAuthStore() 
  await authStore.logout()
}
