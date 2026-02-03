import api from './api'

export const personalService = {
  /**
   * Listar personal con paginación y búsqueda
   */
  async getAll(params = {}) {
    const response = await api.get('/personal', { params })
    return response.data
  },

  /**
   * Obtener detalle de un personal
   */
  async getById(id) {
    const response = await api.get(`/personal/${id}`)
    return response.data
  },

  /**
   * Crear nuevo personal
   */
  async create(data) {
    const response = await api.post('/personal', data)
    return response.data
  },

  /**
   * Actualizar personal
   */
  async update(id, data) {
    const response = await api.put(`/personal/${id}`, data)
    return response.data
  },

  /**
   * Eliminar personal (soft delete)
   */
  async delete(id) {
    const response = await api.delete(`/personal/${id}`)
    return response.data
  },

  /**
   * Restaurar personal eliminado
   */
  async restore(id) {
    const response = await api.post(`/personal/${id}/restore`)
    return response.data
  },

  /**
   * Cambiar estado del personal
   */
  async cambiarEstado(id, estado) {
    const response = await api.patch(`/personal/${id}/estado`, { estado })
    return response.data
  },

  /**
   * Subir foto del personal
   */
  async uploadFoto(id, file) {
    console.log('uploadFoto called:', { id, fileName: file?.name, fileSize: file?.size, fileType: file?.type })

    const formData = new FormData()
    formData.append('foto', file)

    console.log('FormData entries:', [...formData.entries()])

    const response = await api.post(`/personal/${id}/foto`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    console.log('uploadFoto response:', response.data)
    return response.data
  },

  /**
   * Eliminar foto del personal
   */
  async deleteFoto(id) {
    const response = await api.delete(`/personal/${id}/foto`)
    return response.data
  },

  // ==================== FAMILIARES ====================

  async getFamiliares(personalId) {
    const response = await api.get(`/personal/${personalId}/familiares`)
    return response.data
  },

  async createFamiliar(personalId, data) {
    const response = await api.post(`/personal/${personalId}/familiares`, data)
    return response.data
  },

  async updateFamiliar(personalId, familiarId, data) {
    const response = await api.put(`/personal/${personalId}/familiares/${familiarId}`, data)
    return response.data
  },

  async deleteFamiliar(personalId, familiarId) {
    const response = await api.delete(`/personal/${personalId}/familiares/${familiarId}`)
    return response.data
  },

  // ==================== REFERENCIAS LABORALES ====================

  async getReferencias(personalId) {
    const response = await api.get(`/personal/${personalId}/referencias`)
    return response.data
  },

  async createReferencia(personalId, data) {
    const response = await api.post(`/personal/${personalId}/referencias`, data)
    return response.data
  },

  async updateReferencia(personalId, referenciaId, data) {
    const response = await api.put(`/personal/${personalId}/referencias/${referenciaId}`, data)
    return response.data
  },

  async deleteReferencia(personalId, referenciaId) {
    const response = await api.delete(`/personal/${personalId}/referencias/${referenciaId}`)
    return response.data
  },

  // ==================== REDES SOCIALES ====================

  async getRedesSociales(personalId) {
    const response = await api.get(`/personal/${personalId}/redes-sociales`)
    return response.data
  },

  async createRedSocial(personalId, data) {
    const response = await api.post(`/personal/${personalId}/redes-sociales`, data)
    return response.data
  },

  async updateRedSocial(personalId, redId, data) {
    const response = await api.put(`/personal/${personalId}/redes-sociales/${redId}`, data)
    return response.data
  },

  async deleteRedSocial(personalId, redId) {
    const response = await api.delete(`/personal/${personalId}/redes-sociales/${redId}`)
    return response.data
  },

  // ==================== DOCUMENTOS ====================

  async getDocumentos(personalId) {
    const response = await api.get(`/personal/${personalId}/documentos`)
    return response.data
  },

  async uploadDocumento(personalId, formData) {
    // Acepta FormData directamente o un objeto con los datos
    const data = formData instanceof FormData
      ? formData
      : (() => {
        const fd = new FormData()
        fd.append('archivo', formData.archivo)
        fd.append('tipo_documento_id', formData.tipo_documento_id)
        if (formData.descripcion) {
          fd.append('descripcion', formData.descripcion)
        }
        if (formData.nombre) {
          fd.append('nombre', formData.nombre)
        }
        if (formData.fecha_vencimiento) {
          fd.append('fecha_vencimiento', formData.fecha_vencimiento)
        }
        return fd
      })()

    const response = await api.post(`/personal/${personalId}/documentos`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  async deleteDocumento(personalId, documentoId) {
    const response = await api.delete(`/personal/${personalId}/documentos/${documentoId}`)
    return response.data
  },

  // ==================== HISTORIAL PROYECTOS ====================

  async getHistorialProyectos(personalId) {
    const response = await api.get(`/personal/${personalId}/proyectos`)
    return response.data
  },

  async downloadCV(id) {
    const response = await api.get(`/personal/${id}/cv`, {
      responseType: 'blob',
    })
    return response
  },
}

export default personalService
