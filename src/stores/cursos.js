import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/supabase'
import { useAuthStore } from './auth'

const PROFESOR_ROLE_ID = "id_profesor_uuid"

export const useCursosStore = defineStore('cursos', () => {
    // ESTADO DEL CURSO STORE
    const cursos = ref([])
    const misCursos = ref([])
    const solicitudes = ref([])
    const loading = ref(false)
    const error = ref(null)
    const inscripciones = ref({}) 
    
    // --- LÓGICA DE CURSOS ---
    const isUserInvolved = (userid, cursoid) => {
        const inscrito = (inscripciones.value[userid] || []).includes(Number(cursoid));
        if (inscrito) {
            return true;
        }

        const pendiente = solicitudes.value.some(solicitud => 
            solicitud.user_id === userid && 
            solicitud.curso_id === Number(cursoid) &&
            solicitud.estado_solicitud === 'pendiente'
        );
        return pendiente;
    }

    // Obtener todos los cursos
    const fetchCursos = async () => {
        loading.value = true
        error.value = null
        try {
            const { data: asesorias, error: fetchError } = await supabase
                .from('asesorias')
                .select(`
                    *,
                    profesor:id_profesor(nombre) 
                `)
            
            if (fetchError) throw fetchError

            cursos.value = asesorias.map(asesoria => ({
                ...asesoria,
                profesorNombre: asesoria.profesor?.nombre || 'Sin asignar' 
            }))

            await fetchInscripciones()
            await fetchSolicitudes()

        } catch (err) {
            console.error('Error al obtener todos los cursos (asesorias):', err)
            error.value = err
        } finally {
            loading.value = false
        }
    }

    const fetchInscripciones = async () => {
        try {
            const { data: inscripcionesData, error: fetchError } = await supabase
                .from('inscripciones')
                .select(`
                    "userid", 
                    "cursoid"
                `) 

            if (fetchError) throw fetchError

            const newInscripciones = {}
            inscripcionesData.forEach(inscripcion => {
                const userid = inscripcion.userid;
                const cursoid = inscripcion.cursoid;

                if (!newInscripciones[userid]) {
                    newInscripciones[userid] = []
                }
                if (cursoid) { 
                    newInscripciones[userid].push(Number(cursoid)) 
                }
            })

            inscripciones.value = newInscripciones
            console.log("Inscripciones encontradas:", Object.keys(newInscripciones).length)

        } catch (err) {
            console.error('Error al obtener inscripciones:', err)
        }
    }

    const fetchMisCursos = async (userid) => {
        loading.value = true
        error.value = null
        try {
            await fetchInscripciones() 
            const misCursosIds = (inscripciones.value[userid] || []).map(String).map(Number).filter(id => id > 0)

            if (misCursosIds.length === 0) {
                misCursos.value = []
                console.log("MisCursos resultantes: 0")
                return
            }

            const { data: asesorias, error: fetchError } = await supabase
                .from('asesorias')
                .select(`
                    *,
                    profesor:id_profesor(nombre)
                `)
                .in('id', misCursosIds)

            if (fetchError) throw fetchError

            misCursos.value = asesorias.map(asesoria => ({
                ...asesoria,
                profesorNombre: asesorias.profesor?.nombre || 'Sin asignar'
            }))
            
            console.log(`MisCursos resultantes: ${misCursos.value.length}`)

        } catch (err) {
            console.error('Error al obtener mis cursos:', err)
            error.value = err
        } finally {
            loading.value = false
        }
    }

    const fetchSolicitudes = async () => {
        try {
            const { data: solicitudesData, error: fetchError } = await supabase
                .from('solicitudes')
                .select(`
                    *, 
                    curso:curso_id(nombre), 
                    usuario:user_id(nombre)
                `)
                .eq('estado_solicitud', 'pendiente')
            
            if (fetchError) throw fetchError

            solicitudes.value = solicitudesData.map(solicitud => ({
                ...solicitud,
                cursoNombre: solicitud.curso?.nombre || 'Curso Desconocido',
                usuarioNombre: solicitud.usuario?.nombre || 'Usuario Desconocido',
            }))
        } catch (err) {
            console.error('Error al obtener solicitudes:', err)
        }
    }

    const sendSolicitud = async (userid, cursoid, tipo) => {
        const { error: insertError } = await supabase
            .from('solicitudes')
            .insert([
                { user_id: userid, curso_id: cursoid, solicitud_tipo: tipo }
            ])
            
        if (insertError) throw insertError
        
        // Recargamos datos para actualizar la UI del usuario
        await fetchSolicitudes()
        await fetchCursos()
        await fetchInscripciones()
    }

    const approveSolicitud = async (solicitud) => {
        
        try {
            const authStore = useAuthStore()
            if (!authStore.isAdmin) throw new Error("Acceso denegado. Solo administradores pueden aprobar solicitudes.")
            
            const { error: rpcError } = await supabase.rpc('handle_solicitud_approval', {
                solicitud_id: solicitud.id, 
                user_id_in: solicitud.user_id,     
                curso_id_in: String(solicitud.curso_id),
                tipo_in: solicitud.solicitud_tipo            
            })

            if (rpcError) {
                console.error("Error al aprobar la solicitud (RPC):", rpcError)
                throw rpcError
            } 
            solicitudes.value = solicitudes.value.filter(s => s.id !== solicitud.id)
            
            // Recargar datos de inscripción del usuario
            await fetchInscripciones()
            await fetchMisCursos(solicitud.user_id) 

            return true

        } catch (err) {
            console.error('Error en approveSolicitud:', err)
            throw err
        }
    }

    const rejectSolicitud = async (solicitudId) => {
        try {
            const authStore = useAuthStore()
            if (!authStore.isAdmin) throw new Error("Acceso denegado. Solo administradores pueden rechazar solicitudes.")

            // Actualizar el estado_solicitud de la Solicitud a 'rechazada'
            const { error: updateError } = await supabase
                .from('solicitudes')
                .update({ estado_solicitud: 'rechazada' })
                .eq('id', solicitudId)
                .select()

            if (updateError) throw updateError
            solicitudes.value = solicitudes.value.filter(s => s.id !== solicitudId)
            
        } catch (err) {
            console.error('Error al rechazar solicitud:', err)
            throw err
        }
    }

    // Agregar un nuevo curso (solo Admin)
    const addCurso = async (curso) => {
        const authStore = useAuthStore()
        if (!authStore.isAdmin) throw new Error("Error de Seguridad: No tienes permisos para crear cursos.")
        
        const cupoMaximoSeguro = (curso.cupo_maximo && curso.cupo_maximo > 0) 
            ? curso.cupo_maximo 
            : 1;

        const { data, error: insertError } = await supabase
            .from('asesorias')
            .insert([
                { 
                    nombre: curso.nombre, 
                    descripcion: curso.descripcion, 
                    horario: curso.horario,
                    cupo_maximo: cupoMaximoSeguro, 
                    id_profesor: curso.profesorId || null
                }
            ])
            .select()

        if (insertError) throw insertError

        // Añadir el nuevo curso al estado_solicitud local
        if (data && data.length > 0) {
            const profesores = authStore.profesores || [] 
            const profesor = profesores.find(p => p.id === data[0].id_profesor)
            const nuevoCurso = {
                ...data[0],
                profesorNombre: profesor?.nombre || 'Sin asignar' 
            }
            cursos.value.push(nuevoCurso)
            return nuevoCurso
        }
    }

    // Editar un curso existente (solo Admin)
    const updateCurso = async (cursoid, curso) => {
        const authStore = useAuthStore()
        if (!authStore.isAdmin) throw new Error("Error de Seguridad: No tienes permisos para editar cursos.")

        const cupoMaximoSeguro = (curso.cupo_maximo && curso.cupo_maximo > 0) 
            ? curso.cupo_maximo 
            : 1;

        const { data, error: updateError } = await supabase
            .from('asesorias')
            .update({
                nombre: curso.nombre, 
                descripcion: curso.descripcion, 
                horario: curso.horario,
                cupo_maximo: cupoMaximoSeguro, 
                id_profesor: curso.profesorId || null
            })
            .eq('id', cursoid)
            .select()

        if (updateError) throw updateError

        // Actualizar el estado_solicitud local
        const index = cursos.value.findIndex(c => c.id === cursoid)
        if (index !== -1 && data && data.length > 0) {
            const profesores = authStore.profesores || [] 
            const profesor = profesores.find(p => p.id === data[0].id_profesor)
            cursos.value[index] = {
                ...data[0],
                profesorNombre: profesor?.nombre || 'Sin asignar' 
            }
        }
        return data[0]
    }
    
    // Nueva acción para eliminar un curso (solo Admin)
    const deleteCurso = async (cursoId) => {
        const authStore = useAuthStore()
        if (!authStore.isAdmin) throw new Error("Error de Seguridad: No tienes permisos para eliminar cursos.")
        
        // La tabla a usar es 'asesorias'
        const { error: deleteError } = await supabase
            .from('asesorias')
            .delete()
            .eq('id', cursoId)
            
        if (deleteError) {
             console.error("Error de Supabase al eliminar el curso:", deleteError);
             throw deleteError
        }
        
        cursos.value = cursos.value.filter(c => c.id !== cursoId)
        misCursos.value = misCursos.value.filter(c => c.id !== cursoId)

        return true
    }
    
    // --- RETURN DEL CURSO STORE ---
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
