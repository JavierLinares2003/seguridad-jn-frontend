import api from './api'

export const proyectoService = {
  /**
     * Listar proyectos con paginación y búsqueda
     */
  async getAll(params = {}) {
    const response = await api.get('/proyectos', { params })
    return response.data
  },

  /**
     * Obtener detalle de un proyecto
     */
  async getById(id) {
    const response = await api.get(`/proyectos/${id}`)
    return response.data
  },

  /**
     * Crear nuevo proyecto
     */
  async create(data) {
    const response = await api.post('/proyectos', data)
    return response.data
  },

  /**
     * Actualizar proyecto
     */
  async update(id, data) {
    const response = await api.put(`/proyectos/${id}`, data)
    return response.data
  },

  /**
     * Eliminar proyecto (soft delete)
     */
  async delete(id) {
    const response = await api.delete(`/proyectos/${id}`)
    return response.data
  },

  // --- CONTACTOS ---
  async getContactos(proyectoId) {
    const response = await api.get(`/proyectos/${proyectoId}/contactos`)
    return response.data
  },
  async createContacto(proyectoId, data) {
    const response = await api.post(`/proyectos/${proyectoId}/contactos`, data)
    return response.data
  },
  async updateContacto(proyectoId, contactoId, data) {
    const response = await api.put(`/proyectos/${proyectoId}/contactos/${contactoId}`, data)
    return response.data
  },
  async deleteContacto(proyectoId, contactoId) {
    const response = await api.delete(`/proyectos/${proyectoId}/contactos/${contactoId}`)
    return response.data
  },

  // --- INVENTARIO ---
  async getInventario(proyectoId) {
    const response = await api.get(`/proyectos/${proyectoId}/inventario`)
    return response.data
  },
  async createInventario(proyectoId, data) {
    const response = await api.post(`/proyectos/${proyectoId}/inventario`, data)
    return response.data
  },
  async updateInventario(proyectoId, itemId, data) {
    const response = await api.put(`/proyectos/${proyectoId}/inventario/${itemId}`, data)
    return response.data
  },
  async deleteInventario(proyectoId, itemId) {
    const response = await api.delete(`/proyectos/${proyectoId}/inventario/${itemId}`)
    return response.data
  },

  // --- CONFIGURACIÓN PERSONAL (PUESTOS) ---
  async getConfiguracionPersonal(proyectoId) {
    const response = await api.get(`/proyectos/${proyectoId}/configuracion-personal`)
    return response.data
  },
  async createConfiguracionPersonal(proyectoId, data) {
    const response = await api.post(`/proyectos/${proyectoId}/configuracion-personal`, data)
    return response.data
  },
  async updateConfiguracionPersonal(proyectoId, configId, data) {
    const response = await api.put(`/proyectos/${proyectoId}/configuracion-personal/${configId}`, data)
    return response.data
  },
  async deleteConfiguracionPersonal(proyectoId, configId) {
    const response = await api.delete(`/proyectos/${proyectoId}/configuracion-personal/${configId}`)
    return response.data
  },

  // --- DOCUMENTOS ---
  async getDocumentos(proyectoId) {
    const response = await api.get(`/proyectos/${proyectoId}/documentos`)
    return response.data
  },

  async uploadDocumento(proyectoId, formData) {
    // Acepta FormData directamente o un objeto con los datos
    const data = formData instanceof FormData
      ? formData
      : (() => {
        const fd = new FormData()
        fd.append('archivo', formData.archivo)
        fd.append('tipo_documento_proyecto_id', formData.tipo_documento_proyecto_id)
        if (formData.descripcion) {
          fd.append('descripcion', formData.descripcion)
        }
        if (formData.nombre_documento) {
          fd.append('nombre_documento', formData.nombre_documento)
        }
        if (formData.fecha_vencimiento) {
          fd.append('fecha_vencimiento', formData.fecha_vencimiento)
        }
        return fd
      })()

    const response = await api.post(`/proyectos/${proyectoId}/documentos`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  async deleteDocumento(proyectoId, documentoId) {
    const response = await api.delete(`/proyectos/${proyectoId}/documentos/${documentoId}`)
    return response.data
  },

  async getDocumentoResumen(proyectoId) {
    const response = await api.get(`/proyectos/${proyectoId}/documentos/resumen`)
    return response.data
  },

  async getDocumentosPorEstado(proyectoId, estado) {
    const response = await api.get(`/proyectos/${proyectoId}/documentos/estado/${estado}`)
    return response.data
  },

  // --- ACTAS ---
  async getActas(proyectoId) {
    const response = await api.get(`/proyectos/${proyectoId}/actas`)
    return response.data
  },

  async generateActa(proyectoId, data) {
    const response = await api.post(`/proyectos/${proyectoId}/actas`, data)
    return response.data
  },

  async downloadActa(proyectoId, actaId) {
    const response = await api.get(`/proyectos/${proyectoId}/actas/${actaId}/download`, {
      responseType: 'blob',
    })
    return response
  },
}

export default proyectoService
