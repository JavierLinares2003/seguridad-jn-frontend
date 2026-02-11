import api from './api'

export const bitacoraService = {
  /**
   * Listar registros de bitacora con filtros
   * @param {Object} params - Filtros disponibles:
   *   - fecha_desde: string (YYYY-MM-DD)
   *   - fecha_hasta: string (YYYY-MM-DD)
   *   - usuario_id: number
   *   - modelo: string (personal|proyecto|asignacion|asistencia|prestamo|transaccion|planilla|user)
   *   - modelo_id: number
   *   - accion: string (created|updated|deleted)
   *   - modulo: string (personal|proyectos|operaciones|planillas|usuarios)
   *   - search: string
   *   - per_page: number
   *   - page: number
   */
  async getAll(params = {}) {
    const response = await api.get('/bitacora', { params })
    return response.data
  },

  /**
   * Obtener detalle de un registro
   */
  async getById(id) {
    const response = await api.get(`/bitacora/${id}`)
    return response.data
  },

  /**
   * Obtener opciones de filtros disponibles
   */
  async getFiltros() {
    const response = await api.get('/bitacora/filtros')
    return response.data
  },

  /**
   * Obtener estadisticas de actividad
   */
  async getEstadisticas() {
    const response = await api.get('/bitacora/estadisticas')
    return response.data
  },

  /**
   * Filtrar por tipo de modelo
   */
  async getByModelo(modelo, params = {}) {
    const response = await api.get(`/bitacora/modelo/${modelo}`, { params })
    return response.data
  },

  /**
   * Filtrar por usuario
   */
  async getByUsuario(usuarioId, params = {}) {
    const response = await api.get(`/bitacora/usuario/${usuarioId}`, { params })
    return response.data
  },
}

export default bitacoraService
