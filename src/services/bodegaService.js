import api from './api'

export const bodegaService = {
  async getDashboard () {
    const response = await api.get('/bodega/dashboard')
    return response.data
  },

  async getCategorias () {
    const response = await api.get('/bodega/categorias')
    return response.data
  },

  async createCategoria (data) {
    const response = await api.post('/bodega/categorias', data)
    return response.data
  },

  async updateCategoria (id, data) {
    const response = await api.put(`/bodega/categorias/${id}`, data)
    return response.data
  },

  async deleteCategoria (id) {
    const response = await api.delete(`/bodega/categorias/${id}`)
    return response.data
  },

  async getStockBajo () {
    const response = await api.get('/bodega/stock-bajo')
    return response.data
  },

  async getProductos (params = {}) {
    const response = await api.get('/bodega/productos', { params })
    return response.data
  },

  async getProducto (id) {
    const response = await api.get(`/bodega/productos/${id}`)
    return response.data
  },

  async createProducto (data) {
    const response = await api.post('/bodega/productos', data)
    return response.data
  },

  async updateProducto (id, data) {
    const response = await api.put(`/bodega/productos/${id}`, data)
    return response.data
  },

  async deleteProducto (id) {
    const response = await api.delete(`/bodega/productos/${id}`)
    return response.data
  },

  async createVariante (productoId, data) {
    const response = await api.post(`/bodega/productos/${productoId}/variantes`, data)
    return response.data
  },

  async getMovimientos (params = {}) {
    const response = await api.get('/bodega/movimientos', { params })
    return response.data
  },

  async createMovimiento (data) {
    const response = await api.post('/bodega/movimientos', data)
    return response.data
  },

  async entregar (data) {
    const response = await api.post('/bodega/movimientos/entrega', data)
    return response.data
  },

  async crearEntrega (data) {
    const response = await api.post('/bodega/entregas', data)
    return response.data
  },

  async getEntrega (id) {
    const response = await api.get(`/bodega/entregas/${id}`)
    return response.data
  },

  async getEntregas (params = {}) {
    const response = await api.get('/bodega/entregas', { params })
    return response.data
  },

  async getProveedores (params = {}) {
    const response = await api.get('/bodega/proveedores', { params })
    return response.data
  },

  async createProveedor (data) {
    const response = await api.post('/bodega/proveedores', data)
    return response.data
  },

  async updateProveedor (id, data) {
    const response = await api.put(`/bodega/proveedores/${id}`, data)
    return response.data
  },

  async downloadBoleta (id, params = {}) {
    const response = await api.get(`/bodega/entregas/${id}/boleta`, {
      responseType: 'blob',
      params,
    })
    return response
  },

  async devolverEntrega (id, data = {}) {
    const response = await api.post(`/bodega/entregas/${id}/devolver`, data)
    return response.data
  },

  async getKits (params = {}) {
    const response = await api.get('/bodega/kits', { params })
    return response.data
  },

  async getKit (id) {
    const response = await api.get(`/bodega/kits/${id}`)
    return response.data
  },

  async createKit (data) {
    const response = await api.post('/bodega/kits', data)
    return response.data
  },

  async updateKit (id, data) {
    const response = await api.put(`/bodega/kits/${id}`, data)
    return response.data
  },

  async deleteKit (id) {
    const response = await api.delete(`/bodega/kits/${id}`)
    return response.data
  },

  async getCompras (params = {}) {
    const response = await api.get('/bodega/compras', { params })
    return response.data
  },

  async getCompra (id) {
    const response = await api.get(`/bodega/compras/${id}`)
    return response.data
  },

  async createCompra (data) {
    const response = await api.post('/bodega/compras', data)
    return response.data
  },

  async getArmas (params = {}) {
    const response = await api.get('/bodega/armas', { params })
    return response.data
  },

  async getArmasCatalogo () {
    const response = await api.get('/bodega/armas/catalogo')
    return response.data
  },

  async createArma (data) {
    const response = await api.post('/bodega/armas', data)
    return response.data
  },

  async updateArma (id, data) {
    const response = await api.put(`/bodega/armas/${id}`, data)
    return response.data
  },

  async leerFacturaPdf (file) {
    const formData = new FormData()
    formData.append('pdf', file)
    const response = await api.post('/bodega/compras/leer-pdf', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 45000,
    })
    return response.data
  },

  async getSolicitudesCompra (params = {}) {
    const response = await api.get('/bodega/solicitudes-compra', { params })
    return response.data
  },

  async crearSolicitudCompra (data) {
    const response = await api.post('/bodega/solicitudes-compra', data)
    return response.data
  },

  async avanzarSolicitudCompra (id, accion) {
    const response = await api.post(`/bodega/solicitudes-compra/${id}/avanzar`, { accion })
    return response.data
  },
}

export default bodegaService
