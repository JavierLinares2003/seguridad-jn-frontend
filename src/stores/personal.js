import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import personalService from '@/services/personalService'

export const usePersonalStore = defineStore('personal', () => {
  // State
  const items = ref([])
  const currentItem = ref(null)
  const loading = ref(false)
  const saving = ref(false)
  const error = ref(null)

  // Paginación
  const pagination = ref({
    page: 1,
    perPage: 15,
    total: 0,
    lastPage: 1,
  })

  // Filtros
  const filters = ref({
    buscar: '',
    departamento_id: null,
    estado: null,
    sort_by: 'apellidos',
    sort_order: 'asc',
  })

  // Getters
  const totalItems = computed(() => pagination.value.total)
  const isLoading = computed(() => loading.value)
  const isSaving = computed(() => saving.value)

  // Helper para extraer datos de respuesta API
  function extractData (response) {
    // API retorna: { success, message, data: {...} }
    if (response?.data !== undefined) {
      return response.data
    }
    return response
  }

  // Helper para extraer paginación
  function extractPagination (response) {
    // Posibles estructuras:
    // { data: [...], meta: {...} }
    // { data: { data: [...], meta: {...} } }
    const data = response?.data || response

    // Si hay meta directamente
    if (data?.meta) {
      return {
        page: data.meta.current_page || 1,
        perPage: data.meta.per_page || 15,
        total: data.meta.total || 0,
        lastPage: data.meta.last_page || 1,
      }
    }

    // Si es paginación de Laravel directamente
    if (data?.current_page !== undefined) {
      return {
        page: data.current_page,
        perPage: data.per_page || 15,
        total: data.total || 0,
        lastPage: data.last_page || 1,
      }
    }

    return null
  }

  // Helper para extraer items de lista
  function extractItems (response) {
    const data = response?.data || response

    // Si es { data: [...], meta: {...} }
    if (Array.isArray(data?.data)) {
      return data.data
    }

    // Si es array directo
    if (Array.isArray(data)) {
      return data
    }

    return []
  }

  // Actions

  /**
   * Cargar lista de personal
   */
  async function fetchAll (resetPage = false) {
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

      const response = await personalService.getAll(params)

      items.value = extractItems(response)
      const pag = extractPagination(response)
      if (pag) {
        pagination.value = pag
      }

      return response
    } catch (error_) {
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al cargar personal'
      throw error_
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtener un personal por ID
   */
  async function fetchById (id) {
    loading.value = true
    error.value = null

    try {
      const response = await personalService.getById(id)
      currentItem.value = extractData(response)
      return currentItem.value
    } catch (error_) {
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al cargar personal'
      throw error_
    } finally {
      loading.value = false
    }
  }

  /**
   * Crear personal
   */
  async function create (data) {
    saving.value = true
    error.value = null

    try {
      const response = await personalService.create(data)
      return { data: extractData(response), response }
    } catch (error_) {
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al crear personal'
      throw error_
    } finally {
      saving.value = false
    }
  }

  /**
   * Actualizar personal
   */
  async function update (id, data) {
    saving.value = true
    error.value = null

    try {
      const response = await personalService.update(id, data)
      const updatedData = extractData(response)

      // Actualizar item en la lista si existe
      const index = items.value.findIndex(item => item.id === id)
      if (index !== -1) {
        items.value[index] = updatedData
      }
      if (currentItem.value?.id === id) {
        currentItem.value = updatedData
      }
      return { data: updatedData, response }
    } catch (error_) {
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al actualizar personal'
      throw error_
    } finally {
      saving.value = false
    }
  }

  /**
   * Eliminar personal
   */
  async function remove (id) {
    saving.value = true
    error.value = null

    try {
      await personalService.delete(id)
      items.value = items.value.filter(item => item.id !== id)
      pagination.value.total--
      return true
    } catch (error_) {
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al eliminar personal'
      throw error_
    } finally {
      saving.value = false
    }
  }

  /**
   * Restaurar personal
   */
  async function restore (id) {
    saving.value = true
    error.value = null

    try {
      const response = await personalService.restore(id)
      return { data: extractData(response), response }
    } catch (error_) {
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al restaurar personal'
      throw error_
    } finally {
      saving.value = false
    }
  }

  /**
   * Cambiar estado
   */
  async function cambiarEstado (id, estado) {
    saving.value = true
    error.value = null

    try {
      const response = await personalService.cambiarEstado(id, estado)
      const index = items.value.findIndex(item => item.id === id)
      if (index !== -1) {
        items.value[index].estado = estado
      }
      return response
    } catch (error_) {
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al cambiar estado'
      throw error_
    } finally {
      saving.value = false
    }
  }

  /**
   * Subir foto
   */
  async function uploadFoto (id, file) {
    saving.value = true
    try {
      const response = await personalService.uploadFoto(id, file)
      const data = extractData(response)
      if (currentItem.value?.id === id && data?.foto_url) {
        currentItem.value.foto_url = data.foto_url
      }
      return data
    } catch (error_) {
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al subir foto'
      throw error_
    } finally {
      saving.value = false
    }
  }

  /**
   * Setear filtros
   */
  function setFilters (newFilters) {
    filters.value = { ...filters.value, ...newFilters }
  }

  /**
   * Resetear filtros
   */
  function resetFilters () {
    filters.value = {
      buscar: '',
      departamento_id: null,
      estado: null,
      sort_by: 'apellidos',
      sort_order: 'asc',
    }
  }

  /**
   * Cambiar página
   */
  function setPage (page) {
    pagination.value.page = page
  }

  /**
   * Limpiar store
   */
  function $reset () {
    items.value = []
    currentItem.value = null
    loading.value = false
    saving.value = false
    error.value = null
    pagination.value = { page: 1, perPage: 15, total: 0, lastPage: 1 }
    resetFilters()
  }

  return {
    // State
    items,
    currentItem,
    loading,
    saving,
    error,
    pagination,
    filters,
    // Getters
    totalItems,
    isLoading,
    isSaving,
    // Actions
    fetchAll,
    fetchById,
    create,
    update,
    remove,
    restore,
    cambiarEstado,
    uploadFoto,
    setFilters,
    resetFilters,
    setPage,
    $reset,
  }
})
