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
     * Obtener asistencia de proyecto por fecha
     * @param {string} fecha - Fecha en formato YYYY-MM-DD
     * @param {number} proyectoId - ID del proyecto
     */
  async getAsistenciaPorFecha (fecha, proyectoId) {
    const response = await api.get(`/operaciones/asistencia/fecha/${fecha}`, {
      params: { proyecto_id: proyectoId },
    })
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
     * Crear nuevo préstamo
     */
  async crearPrestamo (data) {
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
     * Crear nueva transacción
     */
  async crearTransaccion (data) {
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
