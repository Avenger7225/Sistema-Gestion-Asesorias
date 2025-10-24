import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from '@/supabase'; // Asume que tienes un archivo de configuración de Supabase
import { useAuthStore } from '@/stores/auth'; // Necesitamos el ID del usuario

export const useCursosStore = defineStore('cursos', () => {
    // --- ESTADO ---
    // NOTA: Renombramos 'cursos' a 'asesorias' en el fetch, pero mantenemos la variable 'cursos' para consistencia en la app
    const cursos = ref([]); 
    const solicitudes = ref([]);
    const inscripciones = ref({}); // Estructura: { [userId]: [cursoId, cursoId, ...], ... }
    const isLoading = ref(false);
    // Nuevo estado para almacenar los nombres de profesores por ID
    const profesorNames = ref({}); 

    // Canales de Realtime para Supabase
    let asesoriasChannel = null; // Renombrado
    let solicitudesChannel = null;
    let inscripcionesChannel = null;
    
    const authStore = useAuthStore();
    const userId = computed(() => authStore.user?.id);

    // --- COMPUTADAS ---

    // Verifica si el usuario está inscrito/asignado al curso
    const isUserInvolvedInCourse = computed(() => (idCurso) => {
        if (!userId.value) return false;
        const userCursosIds = inscripciones.value[userId.value] || [];
        // Los IDs del curso de la store son números, los que vienen de Firebase/Supabase/DB deben ser consistentes
        return userCursosIds.includes(idCurso); 
    });

    // Chequea si el usuario tiene una solicitud PENDIENTE para este curso (Inscripción o Baja)
    const isUserPending = computed(() => (idCurso) => {
        if (!userId.value) return false;

        return solicitudes.value.some(s => 
            s.user_id === userId.value && 
            s.curso_id === idCurso && 
            s.estado === 'pendiente'
        );
    });

    // Combina los dos cheques para la vista Cursos.vue
    const isUserInvolved = computed(() => (idUsuario, idCurso) => {
        return isUserInvolvedInCourse.value(idCurso) || isUserPending.value(idCurso);
    });

    // Función de ayuda para obtener los cursos de un usuario
    const getCursosByUserId = computed(() => (idUsuario) => {
        if (!idUsuario) return [];
        const userCursosIds = inscripciones.value[idUsuario] || [];
        return cursos.value.filter(curso => userCursosIds.includes(curso.id));
    });


    // --- ACCIONES DE SUPABASE: REALTIME LISTENERS ---

    const setupListeners = async () => {
        isLoading.value = true;
        
        // 1. ASESORÍAS (Antes 'cursos')
        if (asesoriasChannel) supabase.removeChannel(asesoriasChannel);
        // Usamos el nombre de la tabla existente: 'asesorias'
        asesoriasChannel = supabase.channel('public:asesorias')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'asesorias' }, (payload) => {
                fetchDataAndProcess(); // Refresca los datos en caso de cambio
            })
            .subscribe();
        
        // 2. Solicitudes
        if (solicitudesChannel) supabase.removeChannel(solicitudesChannel);
        solicitudesChannel = supabase.channel('public:solicitudes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'solicitudes' }, (payload) => {
                fetchSolicitudes(); // Refresca las solicitudes
            })
            .subscribe();

        // 3. Inscripciones
        if (inscripcionesChannel) supabase.removeChannel(inscripcionesChannel);
        inscripcionesChannel = supabase.channel('public:inscripciones')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'inscripciones' }, (payload) => {
                fetchInscripciones(); // Refresca las inscripciones
            })
            .subscribe();

        // Llamada inicial para cargar los datos
        await Promise.all([fetchDataAndProcess(), fetchSolicitudes(), fetchInscripciones()]);
        
        isLoading.value = false;
    };

    /**
     * Trae las asesorías, luego los nombres de los profesores y combina la información.
     */
    const fetchDataAndProcess = async () => {
        const asesoriasData = await fetchAsesorias();
        if (!asesoriasData) return;

        const profesorIds = [...new Set(asesoriasData
            .map(a => a.id_profesor)
            .filter(id => id)
        )];
        
        await fetchProfesoresNames(profesorIds);

        // Mapear los datos de las asesorías para incluir el nombre del profesor
        cursos.value = asesoriasData.map(curso => ({
            ...curso,
            // Asignar el nombre del profesor usando el ID guardado
            profesorNombre: profesorNames.value[curso.id_profesor] || 'Sin asignar', 
            profesorId: curso.id_profesor || null, // Asegura que el ID siga accesible
        }));
    };

    /**
     * Nueva función para obtener solo los nombres de los profesores.
     * @param {string[]} ids - Array de IDs de profesores a buscar.
     */
    const fetchProfesoresNames = async (ids) => {
        if (ids.length === 0) return;

        // Asumimos que la tabla de perfiles se llama 'profiles' y tiene un campo 'username'
        const { data, error } = await supabase
            .from('usuarios') 
            .select('id, nombre')
            .in('id', ids);

        if (error) {
            console.error("Error fetching profesor names:", error);
            // En caso de error, simplemente retornamos sin actualizar los nombres
            return;
        }

        // Almacenar los nombres en el objeto profesorNames: { [id]: nombre }
        const newNames = {};
        data.forEach(p => {
            newNames[p.id] = p.username;
        });
        profesorNames.value = { ...profesorNames.value, ...newNames };
    };

    // Funciones de fetch inicial (solo traemos datos brutos)
    const fetchAsesorias = async () => { // Renombrada de fetchCursos
        // CORRECCIÓN CLAVE: No se hace JOIN aquí, solo se trae la columna 'id_profesor'.
        const { data, error } = await supabase
            .from('asesorias') // Usamos el nombre de tabla correcto
            .select('*, id_profesor'); 
        
        if (error) {
            console.error("Error fetching asesorias:", error);
            return null; 
        }
        return data; 
    };

    const fetchSolicitudes = async () => {
        const { data, error } = await supabase
            .from('solicitudes') // <--- VERIFICA ESTE NOMBRE
            .select('*');
        if (error) console.error("Error fetching solicitudes:", error); // <-- ¿Estás viendo este error en consola?
        else solicitudes.value = data;
    };
    
    const fetchInscripciones = async () => {
        // NOTA: Se asume que los campos en inscripciones son "userId" y "cursoId"
        const { data, error } = await supabase 
            .from('inscripciones')
            .select('"userId", "cursoId"'); 

        if (error) {
            console.error("Error fetching inscripciones:", error);
            return;
        }

        // Reconstruir el objeto `inscripciones`
        const tempInscripciones = {};
        data.forEach(item => {
            if (!tempInscripciones[item.userId]) {
                tempInscripciones[item.userId] = [];
            }
            // Aseguramos que el cursoId sea numérico si en la tabla 'asesorias' es un INT
            // Si en 'asesorias' es UUID/TEXT, omitir parseInt
            tempInscripciones[item.userId].push(item.cursoId); 
        });
        inscripciones.value = tempInscripciones;
    };


    // --- ACCIONES DE NEGOCIO ---

    /**
     * Envía una nueva solicitud de inscripción/asignación/baja.
     * @param {string} userId - ID del usuario.
     * @param {string} cursoId - ID del curso (asesoria).
     * @param {('inscripcion_alumno'|'inscripcion_profesor'|'baja_alumno'|'baja_profesor')} tipo - Tipo de solicitud.
     */
    const sendSolicitud = async (userId, cursoId, tipo) => {
        // Validación de duplicados PENDIENTE
        const exists = solicitudes.value.some(s => 
            s.user_id === userId && 
            s.curso_id === cursoId && 
            s.estado === 'pendiente' &&
            (s.tipo === tipo || s.tipo.includes(tipo.split('_')[0]))
        );

        if (exists) {
            throw new Error("Ya existe una solicitud pendiente de este curso. Espere la aprobación o rechazo.");
        }

        const { error } = await supabase
            .from('solicitudes')
            .insert({
                user_id: userId,
                curso_id: cursoId, // Asumimos que la columna es curso_id
                tipo: tipo,
                estado: 'pendiente',
            });

        if (error) throw new Error(error.message);
    };

    /**
     * Aprueba una solicitud, actualiza el estado y gestiona la tabla 'inscripciones'.
     * @param {object} solicitud - Objeto completo de la solicitud.
     */
    const approveSolicitud = async (solicitud) => {
        // En Supabase, usamos una función RPC para simular una transacción atómica.
        const { error } = await supabase.rpc('handle_solicitud_approval', {
            solicitud_id: solicitud.id,
            user_id_in: solicitud.user_id,
            curso_id_in: solicitud.curso_id,
            tipo_in: solicitud.tipo 
        });

        if (error) {
            console.error("Error al aprobar la solicitud (RPC):", error);
            throw new Error(`Fallo en la transacción de aprobación: ${error.message}`);
        }
    };
    
    /**
     * Rechaza una solicitud actualizando su estado.
     * @param {string} solicitudId - ID de la solicitud.
     */
    const rejectSolicitud = async (solicitudId) => {
        const { error } = await supabase
            .from('solicitudes')
            .update({ 
                estado: 'rechazada',
            })
            .eq('id', solicitudId);

        if (error) {
            console.error("Error al rechazar la solicitud:", error);
            throw new Error(`Fallo al actualizar la solicitud a 'rechazada': ${error.message}`);
        }
    };

    /**
     * Actualiza los campos editables de un curso (asesoria).
     * @param {number | string} cursoId - ID del curso a actualizar.
     * @param {object} updatedFields - Objeto con los campos a actualizar (horario, cupo, profesor, profesorId).
     */
    const updateAsesoria = async (cursoId, updatedFields) => {
        console.log(`Intentando actualizar asesoria ID ${cursoId} con campos:`, updatedFields);
        
        // La corrección anterior del nombre de la columna para la actualización es correcta:
        const payload = {
            horario: updatedFields.horario,
            cupo_maximo: updatedFields.cupo, // Se espera 'cupo' de la vista, se mapea a 'cupo_maximo' de la DB
            id_profesor: updatedFields.profesorId || null // Se espera 'profesorId' de la vista, se mapea a 'id_profesor' de la DB
        };

        const { data, error } = await supabase
            .from('asesorias')
            .update(payload)
            .eq('id', cursoId) // Asumiendo que el campo ID de la tabla 'asesorias' es 'id'
            .select(); // Opcional: devolver el registro actualizado

        if (error) {
            console.error("Error al actualizar la asesoria:", error);
            throw new Error(`No se pudo actualizar el curso: ${error.message}`);
        }
        
        // Después de la actualización, refrescamos los datos.
        fetchDataAndProcess(); 
        
        return data;
    };


    // Al limpiar la store, detenemos los listeners
    const $reset = () => {
        if (asesoriasChannel) supabase.removeChannel(asesoriasChannel);
        if (solicitudesChannel) supabase.removeChannel(solicitudesChannel);
        if (inscripcionesChannel) supabase.removeChannel(inscripcionesChannel);
        cursos.value = [];
        solicitudes.value = [];
        inscripciones.value = {};
        isLoading.value = false;
        profesorNames.value = {};
    };


    return {
        cursos, // Mantiene el nombre 'cursos' para compatibilidad con las vistas
        solicitudes,
        inscripciones,
        isLoading,
        isUserInvolved,
        isUserInvolvedInCourse,
        isUserPending,
        getCursosByUserId,
        fetchCursos: setupListeners, // Mantenemos el nombre de la función exportada
        fetchSolicitudes: setupListeners,
        sendSolicitud,
        approveSolicitud,
        rejectSolicitud,
        updateCurso: updateAsesoria, // Alias para usar en las vistas (EditarAsesoria.vue)
        $reset,
    };
});
