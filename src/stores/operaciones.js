import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import operacionesService from '@/services/operacionesService'

export const useOperacionesStore = defineStore('operaciones', () => {
  // State
  const asignaciones = ref([])
  const currentAsignacion = ref(null)
  const personalDisponible = ref([])
  const calendarioPersonal = ref({})
  const estadisticasProyecto = ref(null)
  const loading = ref(false)
  const saving = ref(false)
  const error = ref(null)

  // State - Asistencia
  const asistenciasDia = ref([])
  const resumenAsistencia = ref(null)
  const historialAsistencia = ref(null)
  const reemplazosDisponibles = ref([])

  // Paginación para asignaciones
  const pagination = ref({
    page: 1,
    perPage: 15,
    total: 0,
    lastPage: 1,
  })

  // Filtros para asignaciones
  const filters = ref({
    proyecto_id: null,
    personal_id: null,
    estado_asignacion: null,
    solo_vigentes: false,
    orden_campo: 'fecha_inicio',
    orden_dir: 'desc',
  })

  // Getters
  const totalAsignaciones = computed(() => pagination.value.total)
  const isLoading = computed(() => loading.value)
  const isSaving = computed(() => saving.value)

  // Helper para extraer datos
  function extractData (response) {
    if (response?.data !== undefined) {
      return response.data
    }
    return response
  }

  // Helper para extraer paginación
  function extractPagination (response) {
    const data = response?.data || response

    if (data?.current_page !== undefined) {
      return {
        page: data.current_page,
        perPage: data.per_page || 15,
        total: data.total || 0,
        lastPage: data.last_page || 1,
      }
    }
    return null
  }

  // Helper para extraer items
  function extractItems (response) {
    const data = response?.data || response

    if (Array.isArray(data?.data)) {
      return data.data
    }
    if (Array.isArray(data)) {
      return data
    }
    return []
  }

  // ==================== ACCIONES ASIGNACIONES ====================

  /**
     * Crear nueva asignación
     */
  async function asignarPersonal (data) {
    saving.value = true
    error.value = null

    try {
      const response = await operacionesService.asignarPersonal(data)
      return { data: extractData(response), response }
    } catch (error_) {
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al crear asignación'
      throw error_
    } finally {
      saving.value = false
    }
  }

  /**
     * Cargar lista de asignaciones
     */
  async function fetchAsignaciones (resetPage = false) {
    if (resetPage) {
      pagination.value.page = 1
    }

    loading.value = true
    error.value = null

    try {
      const params = {
        page: pagination.value.page,
        per_page: pagination.value.perPage,
        ...Object.fromEntries(
          Object.entries(filters.value).filter(([_, v]) => v !== null && v !== '' && v !== false),
        ),
      }

      const response = await operacionesService.getAsignaciones(params)

      asignaciones.value = extractItems(response)
      const pag = extractPagination(response)
      if (pag) {
        pagination.value = pag
      }

      return response
    } catch (error_) {
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al cargar asignaciones'
      throw error_
    } finally {
      loading.value = false
    }
  }

  /**
     * Obtener asignación por ID
     */
  async function fetchAsignacion (id) {
    loading.value = true
    error.value = null

    try {
      const response = await operacionesService.getAsignacion(id)
      currentAsignacion.value = extractData(response)
      return currentAsignacion.value
    } catch (error_) {
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al cargar asignación'
      throw error_
    } finally {
      loading.value = false
    }
  }

  /**
     * Actualizar asignación
     */
  async function updateAsignacion (id, data) {
    saving.value = true
    error.value = null

    try {
      const response = await operacionesService.updateAsignacion(id, data)
      const updatedData = extractData(response)

      // Actualizar en la lista si existe
      const index = asignaciones.value.findIndex(item => item.id === id)
      if (index !== -1) {
        asignaciones.value[index] = updatedData
      }
      if (currentAsignacion.value?.id === id) {
        currentAsignacion.value = updatedData
      }

      return { data: updatedData, response }
    } catch (error_) {
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al actualizar asignación'
      throw error_
    } finally {
      saving.value = false
    }
  }

  /**
     * Eliminar asignación
     */
  async function deleteAsignacion (id) {
    saving.value = true
    error.value = null

    try {
      await operacionesService.deleteAsignacion(id)
      asignaciones.value = asignaciones.value.filter(item => item.id !== id)
      pagination.value.total--
      return true
    } catch (error_) {
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al eliminar asignación'
      throw error_
    } finally {
      saving.value = false
    }
  }

  /**
     * Finalizar asignación
     */
  async function finalizarAsignacion (id, motivo = null) {
    saving.value = true
    error.value = null

    try {
      const response = await operacionesService.finalizarAsignacion(id, motivo)
      const updatedData = extractData(response)

      const index = asignaciones.value.findIndex(item => item.id === id)
      if (index !== -1) {
        asignaciones.value[index] = updatedData
      }

      return { data: updatedData, response }
    } catch (error_) {
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al finalizar asignación'
      throw error_
    } finally {
      saving.value = false
    }
  }

  /**
     * Suspender asignación
     */
  async function suspenderAsignacion (id, motivo) {
    saving.value = true
    error.value = null

    try {
      const response = await operacionesService.suspenderAsignacion(id, motivo)
      const updatedData = extractData(response)

      const index = asignaciones.value.findIndex(item => item.id === id)
      if (index !== -1) {
        asignaciones.value[index] = updatedData
      }

      return { data: updatedData, response }
    } catch (error_) {
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al suspender asignación'
      throw error_
    } finally {
      saving.value = false
    }
  }

  /**
     * Reactivar asignación
     */
  async function reactivarAsignacion (id) {
    saving.value = true
    error.value = null

    try {
      const response = await operacionesService.reactivarAsignacion(id)
      const updatedData = extractData(response)

      const index = asignaciones.value.findIndex(item => item.id === id)
      if (index !== -1) {
        asignaciones.value[index] = updatedData
      }

      return { data: updatedData, response }
    } catch (error_) {
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al reactivar asignación'
      throw error_
    } finally {
      saving.value = false
    }
  }

  // ==================== ACCIONES DISPONIBILIDAD ====================

  /**
     * Consultar personal disponible
     */
  async function fetchPersonalDisponible (params) {
    loading.value = true
    error.value = null

    try {
      const response = await operacionesService.getPersonalDisponible(params)
      personalDisponible.value = extractData(response) || []
      return personalDisponible.value
    } catch (error_) {
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al consultar personal disponible'
      throw error_
    } finally {
      loading.value = false
    }
  }

  /**
     * Obtener calendario de un empleado
     */
  async function fetchCalendarioPersonal (personalId, params) {
    loading.value = true
    error.value = null

    try {
      const response = await operacionesService.getCalendarioPersonal(personalId, params)
      calendarioPersonal.value = extractData(response) || {}
      return calendarioPersonal.value
    } catch (error_) {
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al cargar calendario'
      throw error_
    } finally {
      loading.value = false
    }
  }

  // ==================== ESTADÍSTICAS ====================

  /**
     * Obtener estadísticas de cobertura del proyecto
     */
  async function fetchEstadisticasProyecto (proyectoId) {
    loading.value = true
    error.value = null

    try {
      const response = await operacionesService.getEstadisticasProyecto(proyectoId)
      estadisticasProyecto.value = extractData(response)
      return estadisticasProyecto.value
    } catch (error_) {
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al cargar estadísticas'
      throw error_
    } finally {
      loading.value = false
    }
  }

  // ==================== ASISTENCIA ====================

  /**
     * Registrar asistencia masiva
     */
  async function registrarAsistencia (asistencias) {
    saving.value = true
    error.value = null

    try {
      const response = await operacionesService.registrarAsistencia(asistencias)
      return { data: extractData(response), response }
    } catch (error_) {
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al registrar asistencia'
      throw error_
    } finally {
      saving.value = false
    }
  }

  /**
     * Obtener asistencia de proyecto por fecha
     */
  async function fetchAsistenciaPorFecha (fecha, proyectoId) {
    loading.value = true
    error.value = null

    try {
      const response = await operacionesService.getAsistenciaPorFecha(fecha, proyectoId)
      asistenciasDia.value = extractData(response) || []
      return asistenciasDia.value
    } catch (error_) {
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al cargar asistencia'
      throw error_
    } finally {
      loading.value = false
    }
  }

  /**
     * Obtener resumen de asistencia del proyecto
     */
  async function fetchResumenAsistencia (proyectoId, params = {}) {
    loading.value = true
    error.value = null

    try {
      const response = await operacionesService.getResumenAsistencia(proyectoId, params)
      resumenAsistencia.value = extractData(response)
      return resumenAsistencia.value
    } catch (error_) {
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al cargar resumen'
      throw error_
    } finally {
      loading.value = false
    }
  }

  /**
     * Obtener historial de asistencia de un empleado
     */
  async function fetchHistorialAsistencia (personalId, params = {}) {
    loading.value = true
    error.value = null

    try {
      const response = await operacionesService.getHistorialAsistencia(personalId, params)
      historialAsistencia.value = extractData(response)
      return historialAsistencia.value
    } catch (error_) {
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al cargar historial'
      throw error_
    } finally {
      loading.value = false
    }
  }

  /**
     * Actualizar registro de asistencia
     */
  async function updateAsistencia (id, data) {
    saving.value = true
    error.value = null

    try {
      const response = await operacionesService.updateAsistencia(id, data)
      return { data: extractData(response), response }
    } catch (error_) {
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al actualizar asistencia'
      throw error_
    } finally {
      saving.value = false
    }
  }

  /**
     * Eliminar registro de asistencia
     */
  async function deleteAsistencia (id) {
    saving.value = true
    error.value = null

    try {
      await operacionesService.deleteAsistencia(id)
      return true
    } catch (error_) {
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al eliminar asistencia'
      throw error_
    } finally {
      saving.value = false
    }
  }

  /**
     * Marcar entrada
     */
  async function marcarEntrada (asistenciaId, hora) {
    saving.value = true
    error.value = null

    try {
      const response = await operacionesService.marcarEntrada(asistenciaId, hora)
      return { data: extractData(response), response }
    } catch (error_) {
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al marcar entrada'
      throw error_
    } finally {
      saving.value = false
    }
  }

  /**
     * Marcar salida
     */
  async function marcarSalida (asistenciaId, hora) {
    saving.value = true
    error.value = null

    try {
      const response = await operacionesService.marcarSalida(asistenciaId, hora)
      return { data: extractData(response), response }
    } catch (error_) {
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al marcar salida'
      throw error_
    } finally {
      saving.value = false
    }
  }

  /**
     * Generar descansos automáticos
     */
  async function generarDescansos (fechaInicio, fechaFin) {
    saving.value = true
    error.value = null

    try {
      const response = await operacionesService.generarDescansos(fechaInicio, fechaFin)
      return { data: extractData(response), response }
    } catch (error_) {
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al generar descansos'
      throw error_
    } finally {
      saving.value = false
    }
  }

  /**
     * Obtener personal disponible para reemplazos
     */
  async function fetchReemplazosDisponibles (fecha) {
    loading.value = true
    error.value = null

    try {
      const response = await operacionesService.getReemplazosDisponibles(fecha)
      reemplazosDisponibles.value = extractData(response) || []
      return reemplazosDisponibles.value
    } catch (error_) {
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al cargar reemplazos'
      throw error_
    } finally {
      loading.value = false
    }
  }

  // ==================== UTILIDADES ====================

  function setFilters (newFilters) {
    filters.value = { ...filters.value, ...newFilters }
  }

  function resetFilters () {
    filters.value = {
      proyecto_id: null,
      personal_id: null,
      estado_asignacion: null,
      solo_vigentes: false,
      orden_campo: 'fecha_inicio',
      orden_dir: 'desc',
    }
  }

  function setPage (page) {
    pagination.value.page = page
  }

  function clearPersonalDisponible () {
    personalDisponible.value = []
  }

  function $reset () {
    asignaciones.value = []
    currentAsignacion.value = null
    personalDisponible.value = []
    calendarioPersonal.value = {}
    estadisticasProyecto.value = null
    loading.value = false
    saving.value = false
    error.value = null
    pagination.value = { page: 1, perPage: 15, total: 0, lastPage: 1 }
    resetFilters()
  }

  return {
    // State
    asignaciones,
    currentAsignacion,
    personalDisponible,
    calendarioPersonal,
    estadisticasProyecto,
    loading,
    saving,
    error,
    pagination,
    filters,

    // State - Asistencia
    asistenciasDia,
    resumenAsistencia,
    historialAsistencia,
    reemplazosDisponibles,

    // Getters
    totalAsignaciones,
    isLoading,
    isSaving,

    // Actions - Asignaciones
    asignarPersonal,
    fetchAsignaciones,
    fetchAsignacion,
    updateAsignacion,
    deleteAsignacion,
    finalizarAsignacion,
    suspenderAsignacion,
    reactivarAsignacion,

    // Actions - Disponibilidad
    fetchPersonalDisponible,
    fetchCalendarioPersonal,

    // Actions - Estadísticas
    fetchEstadisticasProyecto,

    // Actions - Asistencia
    registrarAsistencia,
    fetchAsistenciaPorFecha,
    fetchResumenAsistencia,
    fetchHistorialAsistencia,
    updateAsistencia,
    deleteAsistencia,
    marcarEntrada,
    marcarSalida,
    generarDescansos,
    fetchReemplazosDisponibles,

    // Utilidades
    setFilters,
    resetFilters,
    setPage,
    clearPersonalDisponible,
    $reset,
  }
})
