import api from './api'

export const vacacionesService = {
  // ─── Configuración ─────────────────────────────────────────────────────────
  async getConfig() {
    const response = await api.get('/configuracion/vacaciones')
    return response.data
  },

  async saveConfig(data) {
    const response = await api.post('/configuracion/vacaciones', data)
    return response.data
  },

  async updateConfig(id, data) {
    const response = await api.put(`/configuracion/vacaciones/${id}`, data)
    return response.data
  },

  async deleteConfig(id) {
    const response = await api.delete(`/configuracion/vacaciones/${id}`)
    return response.data
  },

  // ─── Vacaciones de personal ─────────────────────────────────────────────────
  async getVacaciones(personalId, params = {}) {
    const response = await api.get(`/personal/${personalId}/vacaciones`, { params })
    return response.data
  },

  async registrarVacacion(personalId, formData) {
    const response = await api.post(`/personal/${personalId}/vacaciones`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  async deleteVacacion(personalId, vacacionId) {
    const response = await api.delete(`/personal/${personalId}/vacaciones/${vacacionId}`)
    return response.data
  },

  async updateSaldoInicial(personalId, saldoInicial) {
    const response = await api.patch(`/personal/${personalId}/vacaciones-saldo`, {
      saldo_inicial: saldoInicial,
    })
    return response.data
  },

  getUrlDocumento(personalId, vacacionId) {
    return `${api.defaults.baseURL}/personal/${personalId}/vacaciones/${vacacionId}/documento`
  },
}

export default vacacionesService
