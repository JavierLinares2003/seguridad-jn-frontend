import api from './api'

export const planillaService = {
  /**
     * Generar nueva planilla
     */
  async generarPlanilla (data) {
    const response = await api.post('/operaciones/planillas/generar', data)
    return response.data
  },

  /**
     * Listar planillas con filtros
     */
  async getPlanillas (params = {}) {
    const response = await api.get('/operaciones/planillas', { params })
    return response.data
  },

  /**
     * Obtener detalle de planilla
     */
  async getPlanilla (id) {
    const response = await api.get(`/operaciones/planillas/${id}`)
    return response.data
  },

  /**
     * Aprobar planilla
     */
  async aprobarPlanilla (id) {
    const response = await api.put(`/operaciones/planillas/${id}/aprobar`)
    return response.data
  },

  /**
     * Marcar planilla como pagada
     */
  async marcarPagada (id) {
    const response = await api.put(`/operaciones/planillas/${id}/marcar-pagada`)
    return response.data
  },

  /**
     * Cancelar planilla
     */
  async cancelarPlanilla (id, motivo = null) {
    const response = await api.put(`/operaciones/planillas/${id}/cancelar`, { motivo })
    return response.data
  },

  /**
     * Exportar planilla
     */
  async exportarPlanilla (id, formato) {
    const response = await api.get(`/operaciones/planillas/${id}/export/${formato}`, {
      responseType: 'blob',
    })
    return response.data
  },
}

export default planillaService
