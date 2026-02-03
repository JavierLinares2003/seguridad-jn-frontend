import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import proyectoService from '@/services/proyectoService'

export const useProyectosStore = defineStore('proyectos', () => {
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
    search: '',
    estado: null,
    sort_by: 'created_at',
    sort_order: 'desc',
  })

  // Getters
  const totalItems = computed(() => pagination.value.total)
  const isLoading = computed(() => loading.value)
  const isSaving = computed(() => saving.value)

  // Helper para extraer datos de respuesta API
  function extractData (response) {
    if (response?.data !== undefined) {
      return response.data
    }
    return response
  }

  // Helper para extraer paginación
  function extractPagination (response) {
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

    if (Array.isArray(data?.data)) {
      return data.data
    }

    if (Array.isArray(data)) {
      return data
    }

    return []
  }

  // Actions

  /**
     * Cargar lista de proyectos
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

      const response = await proyectoService.getAll(params)

      items.value = extractItems(response)
      const pag = extractPagination(response)
      if (pag) {
        pagination.value = pag
      }

      return response
    } catch (error_) {
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al cargar proyectos'
      throw error_
    } finally {
      loading.value = false
    }
  }

  /**
     * Obtener un proyecto por ID
     */
  async function fetchById (id) {
    loading.value = true
    error.value = null

    try {
      const response = await proyectoService.getById(id)
      currentItem.value = extractData(response)
      return currentItem.value
    } catch (error_) {
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al cargar proyecto'
      throw error_
    } finally {
      loading.value = false
    }
  }

  /**
     * Crear proyecto
     */
  async function create (data) {
    saving.value = true
    error.value = null

    try {
      const response = await proyectoService.create(data)
      return { data: extractData(response), response }
    } catch (error_) {
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al crear proyecto'
      throw error_
    } finally {
      saving.value = false
    }
  }

  /**
     * Actualizar proyecto
     */
  async function update (id, data) {
    saving.value = true
    error.value = null

    try {
      const response = await proyectoService.update(id, data)
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
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al actualizar proyecto'
      throw error_
    } finally {
      saving.value = false
    }
  }

  /**
     * Eliminar proyecto
     */
  async function remove (id) {
    saving.value = true
    error.value = null

    try {
      await proyectoService.delete(id)
      items.value = items.value.filter(item => item.id !== id)
      pagination.value.total--
      return true
    } catch (error_) {
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al eliminar proyecto'
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
      search: '',
      estado: null,
      sort_by: 'created_at',
      sort_order: 'desc',
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
    setFilters,
    resetFilters,
    setPage,
    $reset,

    fetchContactos: proyectoService.getContactos,
    createContacto: proyectoService.createContacto,
    updateContacto: proyectoService.updateContacto,
    deleteContacto: proyectoService.deleteContacto,

    fetchInventario: proyectoService.getInventario,
    createInventario: proyectoService.createInventario,
    updateInventario: proyectoService.updateInventario,
    deleteInventario: proyectoService.deleteInventario,

    fetchConfiguracionPersonal: proyectoService.getConfiguracionPersonal,
    createConfiguracionPersonal: proyectoService.createConfiguracionPersonal,
    updateConfiguracionPersonal: proyectoService.updateConfiguracionPersonal,
    deleteConfiguracionPersonal: proyectoService.deleteConfiguracionPersonal,
  }
})
