import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/supabase'
import { useAuthStore } from './auth'

export const useCursosStore = defineStore('cursos', () => {

    // ESTADOS REACTIVOS
    const cursos = ref([])
    const misCursos = ref([])
    const solicitudes = ref([])
    const loading = ref(false)
    const error = ref(null)
    const inscripciones = ref({}) 

    const isUserAssignedOrInscribed = (userid, cursoid) => {
        const inscrito = (inscripciones.value[userid] || []).includes(cursoid);
        if (inscrito) return true;

        const asignadoComoProfesor = cursos.value.some(curso => 
            curso.id === cursoid && 
            curso.id_profesor === userid
        );
        if (asignadoComoProfesor) return true;
        
        return false;
    }

    const isSolicitudPending = (userid, cursoid) => {
        return solicitudes.value.some(solicitud =>
            solicitud.user_id === userid &&
            solicitud.curso_id === cursoid &&
            solicitud.estado_solicitud === 'pendiente'
        );
    }

    const isUserInvolved = (userid, cursoid) => {
        const inscrito = (inscripciones.value[userid] || []).includes(cursoid);
        if (inscrito) return true;

        const pendiente = solicitudes.value.some(solicitud =>
            solicitud.user_id === userid &&
            solicitud.curso_id === cursoid &&
            solicitud.estado_solicitud === 'pendiente'
        );
        if (pendiente) return true;
        const asignadoComoProfesor = cursos.value.some(curso => 
            curso.id === cursoid && 
            curso.id_profesor === userid
        );
        if (asignadoComoProfesor) return true;

        return false;
    }

    const fetchCursos = async () => {
        loading.value = true
        error.value = null

        try {
            const { data, error: fetchError } = await supabase
                .from('asesorias')
                .select(`
                    *,
                    profesor:id_profesor(nombre)
                `)
                .order('nombre')

            if (fetchError) throw fetchError

            cursos.value = data.map(asesoria => ({
                ...asesoria,
                profesorNombre: asesoria.profesor?.nombre || 'Sin asignar'
            }))

            await fetchInscripciones()
            await fetchSolicitudes()

        } catch (err) {
            console.error('❌ Error fetchCursos:', err)
            error.value = err
        } finally {
            loading.value = false
        }
    }

    const fetchInscripciones = async () => {
        try {
            const { data, error: fetchError } = await supabase
                .from('inscripciones')
                .select(`userid, cursoid`)

            if (fetchError) throw fetchError

            const newInscripciones = {}

    data.forEach(inscripcion => {
        const userid = inscripcion.userid;
        const cursoid = inscripcion.cursoid;
        if (!newInscripciones[userid]) newInscripciones[userid] = [];
        if (cursoid) newInscripciones[userid].push(cursoid); 
    })

        inscripciones.value = newInscripciones

        } catch (err) {
            console.error('❌ Error fetchInscripciones:', err)
        }
    }

    const fetchAlumnosInscritos = async (cursoid) => {
        try {
            const { data, error: fetchError } = await supabase
                .from('inscripciones')
                .select(`
                    usuario:userid(id, nombre, correo),
                    cursoid
                `)
                .eq('cursoid', cursoid)

            if (fetchError) throw fetchError
            return data.map(i => ({
                id: i.usuario.id,
                nombre: i.usuario.nombre,
                email: i.usuario.correo
            }));

        } catch (err) {
            console.error('❌ Error fetchAlumnosInscritos:', err)
            return []
        }
    }
    
    const fetchProfesores = async () => {
        try {
            const { data, error } = await supabase
                .from('usuarios')
                .select('id, nombre')
                .eq('rol', 'profesor')
                .order('nombre', { ascending: true }); 

            if (error) throw error;
            
            return data;
        } catch (err) {
            console.error('❌ Error al cargar la lista de profesores:', err.message);
            return [];
        }
    }

    const fetchMisCursos = async () => {
    const authStore = useAuthStore();
    const userid = authStore.user?.id;

        if (!userid) {
            console.warn('❌ fetchMisCursos abortado: El ID de usuario no está disponible.');
            misCursos.value = [];
            return;
        }
        
        loading.value = true
        error.value = null

        try {
            await fetchInscripciones()
            const misCursosIds = (inscripciones.value[userid] || [])
                .filter(id => id); 

            const { data: profesorCursos, error: profesorError } = await supabase
                .from('asesorias')
                .select('id') 
                .eq('id_profesor', userid);
            if (profesorError) throw profesorError;
            
            const profesorCursosIds = profesorCursos.map(c => c.id);
            const todosLosIds = [...new Set([...misCursosIds, ...profesorCursosIds])];

            if (todosLosIds.length === 0) {
                misCursos.value = [];
                return;
            }

            const { data, error: fetchError } = await supabase
                .from('asesorias')
                .select(`
                    *,
                    profesor:id_profesor(nombre)
                `)
                .in('id', todosLosIds); 

            if (fetchError) throw fetchError;

            misCursos.value = data.map(asesoria => ({
                ...asesoria,
                profesorNombre: asesoria.profesor?.nombre || 'Sin asignar'
            }));

        } catch (err) {
            console.error('❌ Error fetchMisCursos:', err);
            error.value = err;
        } finally {
            loading.value = false;
        }
    }

    const fetchSolicitudes = async () => {
        try {
            const { data, error: fetchError } = await supabase
                .from('solicitudes')
                .select(`
                    *,
                    curso:curso_id(nombre),
                    usuario:user_id(nombre)
                `)

            if (fetchError) throw fetchError

            solicitudes.value = data.map(solicitud => ({
                ...solicitud,            
                cursoNombre: solicitud.curso?.nombre || 'Curso desconocido',
                usuarioNombre: solicitud.usuario?.nombre || 'Usuario desconocido',
        }))

        } catch (err) {
            console.error('❌ Error fetchSolicitudes:', err)
        }
    }

    const sendSolicitud = async (userid, cursoid, tipo) => {
        const { error } = await supabase
            .from('solicitudes')
            .insert([
                { user_id: userid, curso_id: cursoid, solicitud_tipo: tipo }
            ])

        if (error) throw error

        await fetchSolicitudes()
        await fetchCursos()
        await fetchInscripciones()
    }

    const approveSolicitud = async (solicitud) => {
        try {
            const authStore = useAuthStore()
            if (!authStore.isAdmin) throw new Error("Acceso denegado.")

            const { error } = await supabase.rpc("handle_solicitud_approval", {
                solicitud_id: solicitud.id,
                user_id_in: solicitud.user_id,
                curso_id_in: solicitud.curso_id,
                tipo_in: solicitud.solicitud_tipo
            })

            if (error) throw error

            solicitudes.value = solicitudes.value.filter(s => s.id !== solicitud.id)
            await fetchInscripciones()

        } catch (err) {
            console.error("❌ Error approveSolicitud:", err)
            throw err
        }
    }

    const rejectSolicitud = async (solicitudId) => {
        try {
            const authStore = useAuthStore()
            if (!authStore.isAdmin) throw new Error("Acceso denegado.")

            const { error } = await supabase
                .from("solicitudes")
                .update({ estado_solicitud: "rechazada" })
                .eq("id", solicitudId)

            if (error) throw error

            solicitudes.value = solicitudes.value.filter(s => s.id !== solicitudId)

        } catch (err) {
            console.error("❌ Error rejectSolicitud:", err)
            throw err
        }
    }

    const addCurso = async (curso) => {
    const authStore = useAuthStore()
    if (!authStore.isAdmin) throw new Error("No tienes permisos.")

    const { data, error } = await supabase
        .from("asesorias")
        .insert([{
            nombre: curso.nombre,
            descripcion: curso.descripcion,
            horario: curso.horario,
            cupo_maximo: curso.cupo_maximo > 0 ? curso.cupo_maximo : 1,
            id_profesor: curso.profesorId || null,
            classroom: curso.classroom || null,           // <-- nuevo
            clave_classroom: curso.clave_classroom || null // <-- nuevo
        }])
        .select();

    if (error) throw error;

    // Asegurarse de que data[0] contiene los campos nuevos (si la BD los devuelve)
    cursos.value.push({
        ...data[0],
        profesorNombre: curso.profesorNombre || "Sin asignar"
    });

    return data[0];
    };

    const updateCurso = async (cursoid, curso) => {
        const authStore = useAuthStore()
        if (!authStore.isAdmin) throw new Error("No tienes permisos.")

        // Crear el payload con los campos que realmente pueden ser editados
        const updatePayload = {
            horario: curso.horario,
            cupo_maximo: Math.max(1, curso.cupo_maximo || 1),
            id_profesor: curso.profesorId || null,
            // Agregamos los campos de Classroom para que se guarden
            classroom: curso.classroom ?? null,
            clave_classroom: curso.clave_classroom ?? null,
        };

        const { data, error } = await supabase
            .from("asesorias")
            .update(updatePayload)
            .eq("id", cursoid)
            .select();

        if (error) {
            console.error('❌ Error Supabase UPDATE:', error);
            throw error;
        }

        if (data && data.length > 0) {
            const updatedData = {
                ...data[0],
                profesorNombre: curso.profesorNombre || "Sin asignar"
            };

            const index = cursos.value.findIndex(c => c.id === cursoid)
            if (index !== -1) {
                cursos.value[index] = updatedData
            }

            const idx2 = misCursos.value.findIndex(c => c.id === cursoid);
            if (idx2 !== -1) {
            misCursos.value[idx2] = updatedData;
            }

            return updatedData
        }

        throw new Error("La actualización no devolvió el curso modificado.");
    };

    const deleteCurso = async (cursoId) => {
        const authStore = useAuthStore()
        if (!authStore.isAdmin) throw new Error("No tienes permisos.")

        const { error } = await supabase
            .from("asesorias")
            .delete()
            .eq("id", cursoId)

        if (error) throw error

        cursos.value = cursos.value.filter(c => c.id !== cursoId)
        misCursos.value = misCursos.value.filter(c => c.id !== cursoId)
        return true
    }

    return {
        cursos,
        misCursos,
        solicitudes,
        inscripciones,
        loading,
        error,

        isUserInvolved,
        fetchCursos,
        fetchMisCursos,
        fetchSolicitudes,
        fetchInscripciones,
        sendSolicitud,
        approveSolicitud,
        rejectSolicitud,
        addCurso,
        updateCurso,
        deleteCurso,
        isUserAssignedOrInscribed,
        isSolicitudPending,
        fetchAlumnosInscritos,
        fetchProfesores
    }
})