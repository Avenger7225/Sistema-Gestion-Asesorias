import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/supabase'
import { useAuthStore } from './auth'

export const useCursosStore = defineStore('cursos', () => {

    // ======== ESTADO ========
    const cursos = ref([])
    const misCursos = ref([])
    const solicitudes = ref([])
    const loading = ref(false)
    const error = ref(null)
    const inscripciones = ref({}) 


    // ======== HELPERS ========
    const isUserInvolved = (userid, cursoid) => {
        const inscrito = (inscripciones.value[userid] || []).includes(cursoid); // <-- QUITAMOS Number()
        if (inscrito) return true;

        // 2. Verificar si tiene solicitud pendiente
        const pendiente = solicitudes.value.some(solicitud =>
            // Ambas comparaciones ahora son entre Strings (UUIDs), lo cual es correcto.
            solicitud.user_id === userid &&
            solicitud.curso_id === cursoid && // <-- QUITAMOS Number()
            solicitud.estado_solicitud === 'pendiente'
        );
        return pendiente;
    }


    // -------------------------------------------------------------
    // ✅ Obtener TODOS los cursos con profesor asignado (asesorías)
    // -------------------------------------------------------------
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


    // -------------------------------------------------------------
    // ✅ Obtener todas las inscripciones de usuarios a cursos
    // -------------------------------------------------------------
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
        // ❌ ¡Quitamos Number() si cursoid es un UUID!
        if (cursoid) newInscripciones[userid].push(cursoid); 
    })

            inscripciones.value = newInscripciones

        } catch (err) {
            console.error('❌ Error fetchInscripciones:', err)
        }
    }


    // -------------------------------------------------------------
    // ✅ Mis cursos
    // -------------------------------------------------------------
    const fetchMisCursos = async (userid) => {
        loading.value = true
        error.value = null

        try {
            await fetchInscripciones()

            const misCursosIds = (inscripciones.value[userid] || [])
                .map(Number)
                .filter(id => id > 0)

            if (misCursosIds.length === 0) {
                misCursos.value = []
                return
            }

            const { data, error: fetchError } = await supabase
                .from('asesorias')
                .select(`
                    *,
                    profesor:id_profesor(nombre)
                `)
                .in('id', misCursosIds)

            if (fetchError) throw fetchError

            misCursos.value = data.map(asesoria => ({
                ...asesoria,
                profesorNombre: asesoria.profesor?.nombre || 'Sin asignar'
            }))

        } catch (err) {
            console.error('❌ Error fetchMisCursos:', err)
            error.value = err
        } finally {
            loading.value = false
        }
    }


    // -------------------------------------------------------------
    // ✅ Solicitudes pendientes
    // -------------------------------------------------------------
    const fetchSolicitudes = async () => {
    try {
        const { data, error: fetchError } = await supabase
            .from('solicitudes')
            .select(`
                *,
                curso:curso_id(nombre),
                usuario:user_id(nombre) // <-- Mantenemos este join para el nombre del Admin
            `)

        if (fetchError) throw fetchError

        solicitudes.value = data.map(solicitud => ({
            ...solicitud,
            // ⚠️ El campo solicitud.user_id ahora es el ID (UUID) de la solicitud en la DB.
            // Si el join oculta el user_id original, debes pedirlo así: user_id!inner(id, nombre)
            // Pero asumiremos que al pedir el * (asterisco), el user_id del root se mantiene.
            
            cursoNombre: solicitud.curso?.nombre || 'Curso desconocido',
            usuarioNombre: solicitud.usuario?.nombre || 'Usuario desconocido',
        }))

    } catch (err) {
        console.error('❌ Error fetchSolicitudes:', err)
    }
    }


    // -------------------------------------------------------------
    // ✅ Enviar Solicitud (Alumno/Profesor)
    // -------------------------------------------------------------
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


    // -------------------------------------------------------------
    // ✅ Aprobar solicitud (Admin)
    // -------------------------------------------------------------
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

    // -------------------------------------------------------------
    // ✅ Rechazar solicitud (Admin)
    // -------------------------------------------------------------
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


    // -------------------------------------------------------------
    // ✅ Admin: Crear Curso
    // -------------------------------------------------------------
    const addCurso = async (curso) => {
        const authStore = useAuthStore()
        if (!authStore.isAdmin) throw new Error("No tienes permisos.")

        const { data, error } = await supabase
            .from("asesorias")
            .insert([
                {
                    nombre: curso.nombre,
                    descripcion: curso.descripcion,
                    horario: curso.horario,
                    cupo_maximo: curso.cupo_maximo > 0 ? curso.cupo_maximo : 1,
                    id_profesor: curso.profesorId || null
                }
            ])
            .select()

        if (error) throw error

        cursos.value.push({
            ...data[0],
            profesorNombre: curso.profesorNombre || "Sin asignar"
        })

        return data[0]
    }


    // -------------------------------------------------------------
    // ✅ Admin: Editar curso
    // -------------------------------------------------------------
    const updateCurso = async (cursoid, curso) => {
        const authStore = useAuthStore()
        if (!authStore.isAdmin) throw new Error("No tienes permisos.")

        const { data, error } = await supabase
            .from("asesorias")
            .update({
                nombre: curso.nombre,
                descripcion: curso.descripcion,
                horario: curso.horario,
                cupo_maximo: curso.cupo_maximo > 0 ? curso.cupo_maximo : 1,
                id_profesor: curso.profesorId || null,
            })
            .eq("id", cursoid)
            .select()

        if (error) throw error

        const index = cursos.value.findIndex(c => c.id === cursoid)
        if (index !== -1) {
            cursos.value[index] = {
                ...data[0],
                profesorNombre: curso.profesorNombre || "Sin asignar"
            }
        }

        return data[0]
    }


    // -------------------------------------------------------------
    // ✅ Admin: Eliminar curso
    // -------------------------------------------------------------
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



    // ===== RETURN API =====
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
    }
})
