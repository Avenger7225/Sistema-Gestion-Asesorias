import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/supabase' 

// --- Variables locales ---
// NOTA: Estas variables ya no se usan como simulación pura, pero las mantenemos para la estructura
const initialInscripciones = {
  // Alumno (UUID simulado)
  '95e1d818-9efd-4c42-833c-e3886292631f': [1, 3], 
  // Profesor (UUID simulado)
  '9f61b4aa-2a85-451e-bdbf-ea848f760d15': [1, 4] 
}

export const useCursosStore = defineStore('cursos', () => {
  const cursos = ref([]) 
  const inscripciones = ref(initialInscripciones) // Se usará la simulación por ahora
  const solicitudes = ref([]) // 🛑 Ahora se llenará con datos reales
  const isLoading = ref(false)

  // Función auxiliar para obtener las inscripciones (la lógica real de RLS la implementaremos luego)
  function getCursosByUserId(userId) {
    const userCursosIds = inscripciones.value[userId] || []
    return cursos.value.filter(curso => userCursosIds.includes(curso.id))
  }

  // --- Funciones de Supabase ---

  async function fetchCursos() {
    isLoading.value = true;
    
    // Obtener los cursos (asesorias)
    const { data: asesoriasData, error: cursosError } = await supabase
      .from('asesorias')
      .select(`
        id,
        nombre,
        id_profesor,
        descripcion,
        horario,
        cupo_maximo
      `)
      .order('id', { ascending: true });

    if (cursosError) {
      console.error('Error al cargar cursos desde Supabase:', cursosError);
      isLoading.value = false;
      return;
    }

    // Mapear los datos de Supabase a la estructura local
    cursos.value = asesoriasData.map(asesoria => ({
      id: asesoria.id,
      nombre: asesoria.nombre,
      descripcion: asesoria.descripcion || 'Sin descripción.',
      horario: asesoria.horario || 'Sin horario',
      cupo: asesoria.cupo_maximo || 0, // Mapeado de cupo_maximo (DB) a cupo (local)
      profesorId: asesoria.id_profesor,
      profesor: 'Sin asignar', 
    }));
    
    // 🛑 NUEVA FUNCIÓN: Obtener solicitudes pendientes
    await fetchSolicitudes();

    isLoading.value = false;
  }
  
  // 🛑 NUEVA FUNCIÓN: Obtener solicitudes (necesita política RLS de SELECT)
  async function fetchSolicitudes() {
      // Necesita la política RLS de SELECT en la tabla 'solicitudes' para funcionar
      const { data, error } = await supabase
          .from('solicitudes')
          .select('*')
          .eq('estado', 'pendiente'); // Solo cargamos las pendientes para el contador
          
      if (error) {
          console.error("Error al cargar solicitudes:", error);
          return;
      }
      // Mapear los nombres de columna de la DB a la estructura local si es necesario
      solicitudes.value = data; 
  }


  // 🏆 NUEVA FUNCIÓN: Enviar Solicitud (INSERT)
  async function sendSolicitud(userId, cursoId, tipo) {
      // Verificar si ya existe una solicitud pendiente
      const existing = solicitudes.value.find(s => 
          s.user_id === userId && s.curso_id === cursoId && s.estado === 'pendiente'
      );

      if (existing) {
          console.warn('Ya existe una solicitud pendiente para este curso.');
          throw new Error('Ya tienes una solicitud pendiente para este curso.');
      }
      
      const { data, error } = await supabase
          .from('solicitudes') // <-- Insertar en la tabla 'solicitudes'
          .insert({
              user_id: userId, // ID del usuario autenticado
              curso_id: cursoId, // ID del curso
              tipo: tipo, // 'inscripcion_alumno' o 'inscripcion_profesor'
              estado: 'pendiente' // Estado inicial
          })
          .select()
          .single();
          
      if (error) {
          console.error("Error al enviar solicitud:", error);
          throw new Error(`Error al enviar solicitud a la base de datos: ${error.message}`);
      }
      
      // Actualizar el store local: agregar la nueva solicitud
      solicitudes.value.push(data);
      console.log(`Solicitud de tipo ${tipo} enviada con éxito.`);
      
      // NOTA: Por ahora no hacemos una notificación aquí.
  }

  // Función para saber si el usuario ya tiene una solicitud pendiente o está inscrito
  function isUserInvolved(userId, cursoId) {
      // 1. Está inscrito o asignado (usando la simulación local por ahora)
      if (inscripciones.value[userId] && inscripciones.value[userId].includes(cursoId)) {
          return true;
      }
      // 2. Tiene una solicitud pendiente
      return solicitudes.value.some(s => 
          s.user_id === userId && 
          s.curso_id === cursoId && 
          s.estado === 'pendiente'
      );
  }


  async function addCurso(newCursoData) {
    const { data, error } = await supabase
        .from('asesorias')
        .insert({
            nombre: newCursoData.nombre,
            descripcion: newCursoData.descripcion, 
            horario: newCursoData.horario, 
            cupo_maximo: newCursoData.cupo,
            id_profesor: newCursoData.profesorId 
        })
        .select()
        .single();
        
    if (error) {
        console.error("Error al insertar curso:", error);
        throw new Error(`Error al insertar en la base de datos: ${error.message}`);
    }
    
    const newLocalCurso = {
      ...newCursoData,
      id: data.id, 
    };
    
    cursos.value.push(newLocalCurso);
    console.log(`Nuevo curso agregado y guardado en Supabase: ${newLocalCurso.nombre}`);
  }

  async function updateCurso(id, updatedData) {
    const { error } = await supabase
      .from('asesorias') 
      .update({
        nombre: updatedData.nombre, 
        horario: updatedData.horario, 
        cupo_maximo: updatedData.cupo, 
        id_profesor: updatedData.profesorId,
      })
      .eq('id', id);
      
    if (error) {
      console.error("Error de Supabase al actualizar:", error);
      throw new Error(`Error al actualizar en la base de datos: ${error.message}`);
    }

    const index = cursos.value.findIndex(c => c.id === id);
    if (index !== -1) {
      cursos.value[index] = { 
          ...cursos.value[index], 
          ...updatedData,
          cupo: updatedData.cupo
      };
      console.log(`Curso actualizado y guardado en Supabase: ${updatedData.nombre}`);
    } else {
      throw new Error("No se pudo encontrar el curso para actualizar localmente.");
    }
  }

  return { 
    cursos, 
    isLoading,
    solicitudes, 
    inscripciones,
    getCursosByUserId, 
    isUserInvolved,
    sendSolicitud,
    addCurso,
    updateCurso,
    fetchCursos,
    fetchSolicitudes,
  }
})