import api from './api'

export const operacionesService = {
  // ==================== ASIGNACIONES ====================

  /**
     * Crear nueva asignación de personal
     */
  async asignarPersonal (data) {
    const response = await api.post('/operaciones/asignar-personal', data)
    return response.data
  },

  async asignarExtra (data) {
    const response = await api.post('/operaciones/asignar-extra', data)
    return response.data
  },

  /**
     * Listar asignaciones con filtros y paginación
     */
  async getAsignaciones (params = {}) {
    const response = await api.get('/operaciones/asignaciones', { params })
    return response.data
  },

  /**
     * Obtener detalle de una asignación
     */
  async getAsignacion (id) {
    const response = await api.get(`/operaciones/asignaciones/${id}`)
    return response.data
  },

  /**
     * Actualizar asignación
     */
  async updateAsignacion (id, data) {
    const response = await api.put(`/operaciones/asignaciones/${id}`, data)
    return response.data
  },

  /**
     * Eliminar asignación
     */
  async deleteAsignacion (id) {
    const response = await api.delete(`/operaciones/asignaciones/${id}`)
    return response.data
  },

  /**
     * Finalizar asignación
     */
  async finalizarAsignacion (id, motivo = null) {
    const response = await api.post(`/operaciones/asignaciones/${id}/finalizar`, { motivo })
    return response.data
  },

  /**
     * Suspender asignación
     */
  async suspenderAsignacion (id, motivo) {
    const response = await api.post(`/operaciones/asignaciones/${id}/suspender`, { motivo })
    return response.data
  },

  /**
     * Reactivar asignación suspendida
     */
  async reactivarAsignacion (id) {
    const response = await api.post(`/operaciones/asignaciones/${id}/reactivar`)
    return response.data
  },

  /**
     * Listar proyectos para asignaciones (con estadísticas)
     * @param {Object} params - { estado?, page?, per_page?, search? }
     */
  async getProyectosAsignaciones (params = {}) {
    const response = await api.get('/operaciones/asignaciones/proyectos', { params })
    return response.data
  },

  // ==================== CONSULTAS DE DISPONIBILIDAD ====================

  /**
     * Consultar personal disponible
     * @param {Object} params - { fecha_inicio, fecha_fin?, configuracion_puesto_id? }
     */
  async getPersonalDisponible (params) {
    const response = await api.get('/operaciones/personal-disponible', { params })
    return response.data
  },

  /**
     * Obtener calendario de disponibilidad de un empleado
     * @param {number} personalId
     * @param {Object} params - { fecha_inicio, fecha_fin } (máximo 90 días)
     */
  async getCalendarioPersonal (personalId, params) {
    const response = await api.get(`/operaciones/personal/${personalId}/calendario`, { params })
    return response.data
  },

  // ==================== ESTADÍSTICAS ====================

  /**
     * Obtener estadísticas de cobertura del proyecto
     */
  async getEstadisticasProyecto (proyectoId) {
    const response = await api.get(`/operaciones/proyectos/${proyectoId}/estadisticas`)
    return response.data
  },

  // ==================== ASISTENCIA ====================

  /**
     * Registrar asistencia masiva
     * @param {Array} asistencias - Array de registros de asistencia
     */
  async registrarAsistencia (asistencias) {
    const response = await api.post('/operaciones/asistencia', { asistencias })
    return response.data
  },

  /**
     * Listar asistencias con filtros
     */
  async getAsistencias (params = {}) {
    const response = await api.get('/operaciones/asistencia', { params })
    return response.data
  },

  /**
     * Obtener detalle de una asistencia
     */
  async getAsistencia (id) {
    const response = await api.get(`/operaciones/asistencia/${id}`)
    return response.data
  },

  /**
     * Actualizar registro de asistencia
     */
  async updateAsistencia (id, data) {
    const response = await api.put(`/operaciones/asistencia/${id}`, data)
    return response.data
  },

  /**
     * Eliminar registro de asistencia
     */
  async deleteAsistencia (id) {
    const response = await api.delete(`/operaciones/asistencia/${id}`)
    return response.data
  },

  /**
     * Obtener asistencia por fecha
     * @param {string} fecha - Fecha en formato YYYY-MM-DD
     * @param {Object} params - { proyecto_id?, per_page?, page? }
     *   - Sin proyecto_id: retorna todos los proyectos (paginado)
     *   - Con proyecto_id: retorna solo ese proyecto
     *   - Con proyecto_id=0: retorna solo sin asignar
     */
  async getAsistenciaPorFecha (fecha, params = {}) {
    const response = await api.get(`/operaciones/asistencia/fecha/${fecha}`, { params })
    return response.data
  },

  /**
     * Obtener resumen estadístico de asistencia del proyecto
     */
  async getResumenAsistencia (proyectoId, params = {}) {
    const response = await api.get(`/operaciones/asistencia/resumen/${proyectoId}`, { params })
    return response.data
  },

  /**
     * Obtener historial de asistencia de un empleado
     */
  async getHistorialAsistencia (personalId, params = {}) {
    const response = await api.get(`/operaciones/asistencia/historial/${personalId}`, { params })
    return response.data
  },

  /**
     * Marcar entrada
     */
  async marcarEntrada (asistenciaId, hora) {
    const response = await api.post(`/operaciones/asistencia/${asistenciaId}/entrada`, { hora })
    return response.data
  },

  /**
     * Marcar salida
     */
  async marcarSalida (asistenciaId, hora) {
    const response = await api.post(`/operaciones/asistencia/${asistenciaId}/salida`, { hora })
    return response.data
  },

  /**
     * Generar descansos automáticos
     */
  async generarDescansos (fechaInicio, fechaFin) {
    const response = await api.post('/operaciones/asistencia/generar-descansos', {
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
    })
    return response.data
  },

  /**
     * Obtener personal disponible para reemplazos
     */
  async getReemplazosDisponibles (fecha) {
    const response = await api.get('/operaciones/asistencia/reemplazos-disponibles', {
      params: { fecha },
    })
    return response.data
  },

  /**
     * Obtener catálogo de motivos de ausencia
     */
  async getMotivosAusencia () {
    const response = await api.get('/operaciones/asistencia/motivos-ausencia')
    return response.data
  },

  /**
     * Registrar ausencia de un agente
     * @param {number} asistenciaId - ID del registro de asistencia
     * @param {Object} data - { motivo_ausencia_id, tipo_inasistencia: '12_horas'|'24_horas', descripcion? }
     */
  async registrarAusencia (asistenciaId, data) {
    const response = await api.post(`/operaciones/asistencia/${asistenciaId}/ausencia`, data)
    return response.data
  },

  /**
     * Obtener permisos disponibles de un agente para la fecha de asistencia
     * @param {number} asistenciaId - ID del registro de asistencia
     */
  async getPermisosDisponibles (asistenciaId) {
    const response = await api.get(`/operaciones/asistencia/${asistenciaId}/permisos-disponibles`)
    return response.data
  },

  /**
     * Obtener vista agrupada de asistencia
     * @param {Object} params - { fecha, agrupar_por: 'proyecto'|'departamento' }
     */
  async getVistaAgrupada (params = {}) {
    const response = await api.get('/operaciones/asistencia/vista-agrupada', { params })
    return response.data
  },

  /**
     * Obtener departamentos disponibles con personal sin asignar
     * @param {string} fecha - Fecha en formato YYYY-MM-DD
     */
  async getDepartamentosDisponibles (fecha) {
    const response = await api.get(`/operaciones/asistencia/departamentos-disponibles/${fecha}`)
    return response.data
  },

  /**
     * Obtener calendario de turno de un agente
     * @param {number} personalAsignadoId - ID de la asignación
     * @param {Object} params - { fecha_inicio, fecha_fin }
     */
  async getCalendarioTurno (personalAsignadoId, params = {}) {
    const response = await api.get(`/operaciones/asistencia/calendario-turno/${personalAsignadoId}`, { params })
    return response.data
  },

  // ==================== PRÉSTAMOS ====================

  /**
     * Listar préstamos con filtros
     * @param {Object} params - { personal_id?, estado?, fecha_desde?, fecha_hasta? }
     */
  async getPrestamos (params = {}) {
    const response = await api.get('/operaciones/prestamos', { params })
    return response.data
  },

  /**
     * Crear nuevo préstamo (acepta comprobante opcional)
     */
  async crearPrestamo (data) {
    if (data.comprobante instanceof File) {
      const formData = new FormData()
      for (const [key, value] of Object.entries(data)) {
        if (value !== null && value !== undefined) {
          formData.append(key, value)
        }
      }
      const response = await api.post('/operaciones/prestamos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data
    }
    const response = await api.post('/operaciones/prestamos', data)
    return response.data
  },

  /**
     * Obtener detalle de un préstamo
     */
  async getPrestamo (id) {
    const response = await api.get(`/operaciones/prestamos/${id}`)
    return response.data
  },

  /**
     * Cancelar préstamo
     */
  async cancelarPrestamo (id) {
    const response = await api.post(`/operaciones/prestamos/${id}/cancelar`)
    return response.data
  },

  /**
     * Obtener historial de pagos de un préstamo
     */
  async getHistorialPrestamo (id) {
    const response = await api.get(`/operaciones/prestamos/${id}/historial`)
    return response.data
  },

  // ==================== TRANSACCIONES ====================

  /**
     * Listar transacciones con filtros
     * @param {Object} params - { personal_id?, tipo?, estado?, fecha_desde?, fecha_hasta?, prestamo_id? }
     */
  async getTransacciones (params = {}) {
    const response = await api.get('/operaciones/transacciones', { params })
    return response.data
  },

  /**
     * Crear nueva transacción (acepta comprobante opcional)
     */
  async crearTransaccion (data) {
    if (data.comprobante instanceof File) {
      const formData = new FormData()
      for (const [key, value] of Object.entries(data)) {
        if (value !== null && value !== undefined) {
          formData.append(key, value)
        }
      }
      const response = await api.post('/operaciones/transacciones', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data
    }
    const response = await api.post('/operaciones/transacciones', data)
    return response.data
  },

  /**
     * Obtener detalle de una transacción
     */
  async getTransaccion (id) {
    const response = await api.get(`/operaciones/transacciones/${id}`)
    return response.data
  },

  /**
     * Cancelar transacción
     */
  async cancelarTransaccion (id) {
    const response = await api.post(`/operaciones/transacciones/${id}/cancelar`)
    return response.data
  },

  /**
     * Aplicar transacción
     */
  async aplicarTransaccion (id) {
    const response = await api.post(`/operaciones/transacciones/${id}/aplicar`)
    return response.data
  },

  /**
     * Ver comprobante de una transacción (devuelve blob)
     */
  async getComprobanteTransaccion (id) {
    const response = await api.get(`/operaciones/transacciones/${id}/comprobante`, {
      responseType: 'blob',
    })
    return response
  },

  /**
     * Eliminar comprobante de una transacción
     */
  async deleteComprobanteTransaccion (id) {
    const response = await api.delete(`/operaciones/transacciones/${id}/comprobante`)
    return response.data
  },

  /**
     * Ver comprobante de un préstamo (devuelve blob)
     */
  async getComprobantePrestamo (id) {
    const response = await api.get(`/operaciones/prestamos/${id}/comprobante`, {
      responseType: 'blob',
    })
    return response
  },

  /**
     * Eliminar comprobante de un préstamo
     */
  async deleteComprobantePrestamo (id) {
    const response = await api.delete(`/operaciones/prestamos/${id}/comprobante`)
    return response.data
  },

  // ==================== ALERTAS DE COBERTURA ====================

  /**
     * Obtener alertas de cobertura de proyectos
     */
  async getAlertasCobertura (params = {}) {
    const response = await api.get('/operaciones/alertas-cobertura', { params })
    return response.data
  },
}

export default operacionesService
