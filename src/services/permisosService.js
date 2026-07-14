import api from './api'

export const permisosService = {
  async getPermisos(personalId, params = {}) {
    const response = await api.get(`/personal/${personalId}/permisos`, { params })
    return response.data
  },

  async registrarPermiso(personalId, formData) {
    const response = await api.post(`/personal/${personalId}/permisos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  async getPermiso(personalId, permisoId) {
    const response = await api.get(`/personal/${personalId}/permisos/${permisoId}`)
    return response.data
  },

  async deletePermiso(personalId, permisoId) {
    const response = await api.delete(`/personal/${personalId}/permisos/${permisoId}`)
    return response.data
  },

  getUrlDocumento(personalId, permisoId) {
    return `${api.defaults.baseURL}/personal/${personalId}/permisos/${permisoId}/documento`
  },
}

export default permisosService
