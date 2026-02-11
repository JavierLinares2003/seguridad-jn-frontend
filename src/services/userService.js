import api from './api'

export const userService = {
  // ==================== USUARIOS ====================

  /**
   * Listar usuarios con filtros
   * @param {Object} params - { role, estado, search, page, per_page }
   */
  async getAll(params = {}) {
    const response = await api.get('/users', { params })
    return response.data
  },

  /**
   * Obtener detalle de un usuario
   */
  async getById(id) {
    const response = await api.get(`/users/${id}`)
    return response.data
  },

  /**
   * Crear nuevo usuario
   */
  async create(data) {
    const response = await api.post('/users', data)
    return response.data
  },

  /**
   * Actualizar usuario
   */
  async update(id, data) {
    const response = await api.put(`/users/${id}`, data)
    return response.data
  },

  /**
   * Eliminar usuario
   */
  async delete(id) {
    const response = await api.delete(`/users/${id}`)
    return response.data
  },

  /**
   * Activar/Desactivar usuario (toggle estado)
   */
  async toggleEstado(id) {
    const response = await api.patch(`/users/${id}/toggle-estado`)
    return response.data
  },

  // ==================== ROLES DE USUARIO ====================

  /**
   * Asignar rol a usuario
   */
  async assignRole(userId, role) {
    const response = await api.post(`/users/${userId}/roles`, { role })
    return response.data
  },

  /**
   * Sincronizar roles (reemplaza todos los roles)
   */
  async syncRoles(userId, roles) {
    const response = await api.put(`/users/${userId}/roles`, { roles })
    return response.data
  },

  /**
   * Remover rol de usuario
   */
  async removeRole(userId, role) {
    const response = await api.delete(`/users/${userId}/roles/${role}`)
    return response.data
  },

  // ==================== ROLES (CATALOGO) ====================

  /**
   * Listar todos los roles disponibles
   */
  async getRoles() {
    const response = await api.get('/roles')
    return response.data
  },

  /**
   * Obtener rol con sus permisos
   */
  async getRoleById(id) {
    const response = await api.get(`/roles/${id}`)
    return response.data
  },
}

export default userService
