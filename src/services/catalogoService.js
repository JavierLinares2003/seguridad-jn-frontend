import api from './api'

// Lista de catálogos disponibles
export const CATALOGOS = {
  ESTADOS_CIVILES: 'estados-civiles',
  TIPOS_SANGRE: 'tipos-sangre',
  SEXOS: 'sexos',
  TIPOS_CONTRATACION: 'tipos-contratacion',
  TIPOS_PAGO: 'tipos-pago',
  DEPARTAMENTOS: 'departamentos',
  DEPARTAMENTOS_GEOGRAFICOS: 'departamentos-geograficos',
  MUNICIPIOS: 'municipios',
  PARENTESCOS: 'parentescos',
  REDES_SOCIALES: 'redes-sociales',
  NIVELES_ESTUDIO: 'niveles-estudio',
  TIPOS_PERSONAL: 'tipos-personal',
  TURNOS: 'turnos',
  TIPOS_PROYECTO: 'tipos-proyecto',
  TIPOS_DOCUMENTOS_PERSONAL: 'tipos-documentos-personal',
  TIPOS_DOCUMENTOS_PROYECTO: 'tipos-documentos-proyecto',
  PERIODICIDADES_PAGO: 'periodicidades-pago',
  TIPOS_DOCUMENTOS_FACTURACION: 'tipos-documentos-facturacion',
}

export const catalogoService = {
  /**
   * Obtener lista de catálogos disponibles
   */
  async getDisponibles () {
    const response = await api.get('/catalogos')
    return response.data
  },

  /**
   * Obtener todos los catálogos de una vez (excepto municipios)
   */
  async getAll () {
    const response = await api.get('/catalogos/all')
    return response.data
  },

  /**
   * Obtener un catálogo específico
   * @param {string} slug - Nombre del catálogo (ej: 'estados-civiles')
   * @param {object} params - Parámetros opcionales
   */
  async get (slug, params = {}) {
    const response = await api.get(`/catalogos/${slug}`, { params })
    // Return the data array directly if it exists in the standard API response structure
    if (response.data && response.data.data) {
      return response.data.data
    }
    return response.data
  },

  /**
   * Obtener municipios filtrados por departamento
   * @param {number} departamentoId
   */
  async getMunicipios (departamentoId = null) {
    const params = departamentoId ? { departamento_id: departamentoId } : {}
    const response = await api.get('/catalogos/municipios', { params })
    return response.data
  },

  /**
   * Obtener departamentos geográficos con municipios
   */
  async getDepartamentosConMunicipios () {
    const response = await api.get('/catalogos/departamentos-geograficos', {
      params: { con_municipios: true },
    })
    return response.data
  },

  /**
   * Obtener catálogo incluyendo inactivos
   * @param {string} slug
   */
  async getConInactivos (slug) {
    const response = await api.get(`/catalogos/${slug}`, {
      params: { todos: true },
    })
    return response.data
  },
}

export default catalogoService
