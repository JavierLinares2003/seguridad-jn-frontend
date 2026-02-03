import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import catalogoService, { CATALOGOS } from '@/services/catalogoService'

export const useCatalogosStore = defineStore('catalogos', () => {
  // State
  const catalogos = ref({})
  const loading = ref({})
  const errors = ref({})
  const lastFetch = ref({})

  // Tiempo de expiración del cache (5 minutos)
  const CACHE_TTL = 5 * 60 * 1000

  // Helper para extraer datos de respuesta API
  // API retorna: { success, message, data: [...] }
  function extractData (response) {
    if (response?.data !== undefined) {
      return response.data
    }
    return response
  }

  // Helper para extraer datos de loadAll (objeto con múltiples catálogos)
  // API retorna: { success, message, data: { catalogo1: [...], catalogo2: [...] } }
  function extractAllData (response) {
    if (response?.data !== undefined && typeof response.data === 'object') {
      return response.data
    }
    return response
  }

  // Getters
  const getCatalogo = computed(() => {
    return nombre => catalogos.value[nombre] || []
  })

  const isLoading = computed(() => {
    return nombre => loading.value[nombre] || false
  })

  const getError = computed(() => {
    return nombre => errors.value[nombre] || null
  })

  const isCached = computed(() => {
    return nombre => {
      const last = lastFetch.value[nombre]
      if (!last) {
        return false
      }
      return Date.now() - last < CACHE_TTL
    }
  })

  // Actions

  /**
   * Cargar un catálogo específico
   */
  async function loadCatalogo (nombre, options = {}) {
    const { force = false, params = {} } = options

    // Retornar cache si es válido
    if (!force && isCached.value(nombre) && catalogos.value[nombre]) {
      return catalogos.value[nombre]
    }

    loading.value[nombre] = true
    errors.value[nombre] = null

    try {
      const response = await catalogoService.get(nombre, params)
      catalogos.value[nombre] = extractData(response)
      lastFetch.value[nombre] = Date.now()
      return catalogos.value[nombre]
    } catch (error) {
      errors.value[nombre] = error.apiMessage || error.response?.data?.message || 'Error al cargar catálogo'
      throw error
    } finally {
      loading.value[nombre] = false
    }
  }

  /**
   * Cargar múltiples catálogos
   */
  async function loadCatalogos (nombres, options = {}) {
    const promises = nombres.map(nombre => loadCatalogo(nombre, options))
    return Promise.all(promises)
  }

  /**
   * Cargar todos los catálogos de una vez (excepto municipios)
   */
  async function loadAll (force = false) {
    // Si no forzamos y tenemos datos, verificar si expiraron
    if (!force && Object.keys(catalogos.value).length > 0) {
      const allCached = Object.values(lastFetch.value).every(
        time => Date.now() - time < CACHE_TTL,
      )
      if (allCached) {
        return catalogos.value
      }
    }

    loading.value._all = true

    try {
      const response = await catalogoService.getAll()
      const data = extractAllData(response)

      // Mapear respuesta a nuestro store
      for (const [key, value] of Object.entries(data)) {
        catalogos.value[key] = value
        lastFetch.value[key] = Date.now()
      }

      return catalogos.value
    } catch (error) {
      errors.value._all = error.apiMessage || error.response?.data?.message || 'Error al cargar catálogos'
      throw error
    } finally {
      loading.value._all = false
    }
  }

  /**
   * Cargar municipios filtrados por departamento
   */
  async function loadMunicipios (departamentoId = null, force = false) {
    const cacheKey = departamentoId ? `municipios_${departamentoId}` : 'municipios'

    if (!force && isCached.value(cacheKey) && catalogos.value[cacheKey]) {
      return catalogos.value[cacheKey]
    }

    loading.value[cacheKey] = true
    errors.value[cacheKey] = null

    try {
      const response = await catalogoService.getMunicipios(departamentoId)
      catalogos.value[cacheKey] = extractData(response)
      lastFetch.value[cacheKey] = Date.now()
      return catalogos.value[cacheKey]
    } catch (error) {
      errors.value[cacheKey] = error.apiMessage || error.response?.data?.message || 'Error al cargar municipios'
      throw error
    } finally {
      loading.value[cacheKey] = false
    }
  }

  /**
   * Obtener municipios por departamento (usa cache primero)
   */
  function getMunicipiosPorDepartamento (departamentoId) {
    const cacheKey = `municipios_${departamentoId}`
    return catalogos.value[cacheKey] || []
  }

  /**
   * Limpiar cache de un catálogo
   */
  function clearCache (nombre = null) {
    if (nombre) {
      delete catalogos.value[nombre]
      delete lastFetch.value[nombre]
      delete errors.value[nombre]
    } else {
      catalogos.value = {}
      lastFetch.value = {}
      errors.value = {}
    }
  }

  /**
   * Buscar item en catálogo por ID
   */
  function findById (nombre, id) {
    const catalogo = catalogos.value[nombre] || []
    return catalogo.find(item => item.id === id)
  }

  /**
   * Obtener label de item por ID
   */
  function getLabel (nombre, id, field = 'nombre') {
    const item = findById(nombre, id)
    return item ? item[field] : ''
  }

  return {
    // State
    catalogos,
    loading,
    errors,
    // Constants
    CATALOGOS,
    // Getters
    getCatalogo,
    isLoading,
    getError,
    isCached,
    // Actions
    loadCatalogo,
    loadCatalogos,
    loadAll,
    loadMunicipios,
    getMunicipiosPorDepartamento,
    clearCache,
    findById,
    getLabel,
  }
})
