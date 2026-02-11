import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import bitacoraService from '@/services/bitacoraService'

export const useBitacoraStore = defineStore('bitacora', () => {
  // State
  const items = ref([])
  const currentItem = ref(null)
  const filtrosDisponibles = ref(null)
  const estadisticas = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Paginacion
  const pagination = ref({
    page: 1,
    perPage: 20,
    total: 0,
    lastPage: 1,
  })

  // Filtros
  const filters = ref({
    search: '',
    fecha_desde: null,
    fecha_hasta: null,
    usuario_id: null,
    modelo: null,
    accion: null,
    modulo: null,
  })

  // Getters
  const totalItems = computed(() => pagination.value.total)
  const isLoading = computed(() => loading.value)

  // Helper para extraer datos de respuesta API
  function extractData(response) {
    if (response?.data !== undefined) {
      return response.data
    }
    return response
  }

  // Helper para extraer paginacion
  function extractPagination(response) {
    const data = response?.data || response

    if (data?.meta) {
      return {
        page: data.meta.current_page || 1,
        perPage: data.meta.per_page || 20,
        total: data.meta.total || 0,
        lastPage: data.meta.last_page || 1,
      }
    }

    if (data?.current_page !== undefined) {
      return {
        page: data.current_page,
        perPage: data.per_page || 20,
        total: data.total || 0,
        lastPage: data.last_page || 1,
      }
    }

    return null
  }

  // Helper para extraer items de lista
  function extractItems(response) {
    const data = response?.data || response

    if (Array.isArray(data?.data)) {
      return data.data
    }

    if (Array.isArray(data)) {
      return data
    }

    return []
  }

  /**
   * Cargar registros de bitacora
   */
  async function fetchAll(resetPage = false) {
    if (resetPage) {
      pagination.value.page = 1
    }

    loading.value = true
    error.value = null

    try {
      const params = {
        page: pagination.value.page,
        per_page: pagination.value.perPage,
        ...Object.fromEntries(
          Object.entries(filters.value).filter(([_, v]) => v !== null && v !== ''),
        ),
      }

      const response = await bitacoraService.getAll(params)

      items.value = extractItems(response)
      const pag = extractPagination(response)
      if (pag) {
        pagination.value = pag
      }

      return response
    } catch (error_) {
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al cargar bitacora'
      throw error_
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtener detalle de un registro
   */
  async function fetchById(id) {
    loading.value = true
    error.value = null

    try {
      const response = await bitacoraService.getById(id)
      currentItem.value = extractData(response)
      return currentItem.value
    } catch (error_) {
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al cargar registro'
      throw error_
    } finally {
      loading.value = false
    }
  }

  /**
   * Cargar filtros disponibles
   */
  async function fetchFiltros() {
    try {
      const response = await bitacoraService.getFiltros()
      filtrosDisponibles.value = extractData(response)
      return filtrosDisponibles.value
    } catch (error_) {
      console.error('Error al cargar filtros:', error_)
    }
  }

  /**
   * Cargar estadisticas
   */
  async function fetchEstadisticas() {
    try {
      const response = await bitacoraService.getEstadisticas()
      estadisticas.value = extractData(response)
      return estadisticas.value
    } catch (error_) {
      console.error('Error al cargar estadisticas:', error_)
    }
  }

  function setFilters(newFilters) {
    filters.value = { ...filters.value, ...newFilters }
  }

  function resetFilters() {
    filters.value = {
      search: '',
      fecha_desde: null,
      fecha_hasta: null,
      usuario_id: null,
      modelo: null,
      accion: null,
      modulo: null,
    }
  }

  function setPage(page) {
    pagination.value.page = page
  }

  function $reset() {
    items.value = []
    currentItem.value = null
    filtrosDisponibles.value = null
    estadisticas.value = null
    loading.value = false
    error.value = null
    pagination.value = { page: 1, perPage: 20, total: 0, lastPage: 1 }
    resetFilters()
  }

  return {
    // State
    items,
    currentItem,
    filtrosDisponibles,
    estadisticas,
    loading,
    error,
    pagination,
    filters,
    // Getters
    totalItems,
    isLoading,
    // Actions
    fetchAll,
    fetchById,
    fetchFiltros,
    fetchEstadisticas,
    setFilters,
    resetFilters,
    setPage,
    $reset,
  }
})
