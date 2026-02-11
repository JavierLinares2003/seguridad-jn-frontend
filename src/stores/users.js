import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import userService from '@/services/userService'

export const useUsersStore = defineStore('users', () => {
  // State
  const items = ref([])
  const currentItem = ref(null)
  const roles = ref([])
  const currentRole = ref(null)
  const loading = ref(false)
  const saving = ref(false)
  const error = ref(null)

  // Paginacion
  const pagination = ref({
    page: 1,
    perPage: 15,
    total: 0,
    lastPage: 1,
  })

  // Filtros
  const filters = ref({
    search: '',
    role: null,
    estado: null,
  })

  // Getters
  const totalItems = computed(() => pagination.value.total)
  const isLoading = computed(() => loading.value)
  const isSaving = computed(() => saving.value)

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
        perPage: data.meta.per_page || 15,
        total: data.meta.total || 0,
        lastPage: data.meta.last_page || 1,
      }
    }

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

  // ==================== USUARIOS ====================

  /**
   * Cargar lista de usuarios
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

      const response = await userService.getAll(params)

      items.value = extractItems(response)
      const pag = extractPagination(response)
      if (pag) {
        pagination.value = pag
      }

      return response
    } catch (error_) {
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al cargar usuarios'
      throw error_
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtener un usuario por ID
   */
  async function fetchById(id) {
    loading.value = true
    error.value = null

    try {
      const response = await userService.getById(id)
      currentItem.value = extractData(response)
      return currentItem.value
    } catch (error_) {
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al cargar usuario'
      throw error_
    } finally {
      loading.value = false
    }
  }

  /**
   * Crear usuario
   */
  async function create(data) {
    saving.value = true
    error.value = null

    try {
      const response = await userService.create(data)
      return { data: extractData(response), response }
    } catch (error_) {
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al crear usuario'
      throw error_
    } finally {
      saving.value = false
    }
  }

  /**
   * Actualizar usuario
   */
  async function update(id, data) {
    saving.value = true
    error.value = null

    try {
      const response = await userService.update(id, data)
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
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al actualizar usuario'
      throw error_
    } finally {
      saving.value = false
    }
  }

  /**
   * Eliminar usuario
   */
  async function remove(id) {
    saving.value = true
    error.value = null

    try {
      await userService.delete(id)
      items.value = items.value.filter(item => item.id !== id)
      pagination.value.total--
      return true
    } catch (error_) {
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al eliminar usuario'
      throw error_
    } finally {
      saving.value = false
    }
  }

  /**
   * Toggle estado del usuario
   */
  async function toggleEstado(id) {
    saving.value = true
    error.value = null

    try {
      const response = await userService.toggleEstado(id)
      const updatedData = extractData(response)

      // Actualizar item en la lista
      const index = items.value.findIndex(item => item.id === id)
      if (index !== -1) {
        items.value[index] = { ...items.value[index], ...updatedData }
      }

      return updatedData
    } catch (error_) {
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al cambiar estado'
      throw error_
    } finally {
      saving.value = false
    }
  }

  // ==================== ROLES DE USUARIO ====================

  /**
   * Asignar rol a usuario
   */
  async function assignRole(userId, role) {
    saving.value = true
    error.value = null

    try {
      const response = await userService.assignRole(userId, role)
      return extractData(response)
    } catch (error_) {
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al asignar rol'
      throw error_
    } finally {
      saving.value = false
    }
  }

  /**
   * Sincronizar roles de usuario
   */
  async function syncRoles(userId, rolesArray) {
    saving.value = true
    error.value = null

    try {
      const response = await userService.syncRoles(userId, rolesArray)
      return extractData(response)
    } catch (error_) {
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al sincronizar roles'
      throw error_
    } finally {
      saving.value = false
    }
  }

  /**
   * Remover rol de usuario
   */
  async function removeRole(userId, role) {
    saving.value = true
    error.value = null

    try {
      const response = await userService.removeRole(userId, role)
      return extractData(response)
    } catch (error_) {
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al remover rol'
      throw error_
    } finally {
      saving.value = false
    }
  }

  // ==================== ROLES (CATALOGO) ====================

  /**
   * Cargar lista de roles
   */
  async function fetchRoles() {
    loading.value = true
    error.value = null

    try {
      const response = await userService.getRoles()
      roles.value = extractData(response) || []
      return roles.value
    } catch (error_) {
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al cargar roles'
      throw error_
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtener rol por ID
   */
  async function fetchRoleById(id) {
    loading.value = true
    error.value = null

    try {
      const response = await userService.getRoleById(id)
      currentRole.value = extractData(response)
      return currentRole.value
    } catch (error_) {
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al cargar rol'
      throw error_
    } finally {
      loading.value = false
    }
  }

  // ==================== FILTROS ====================

  function setFilters(newFilters) {
    filters.value = { ...filters.value, ...newFilters }
  }

  function resetFilters() {
    filters.value = {
      search: '',
      role: null,
      estado: null,
    }
  }

  function setPage(page) {
    pagination.value.page = page
  }

  function $reset() {
    items.value = []
    currentItem.value = null
    roles.value = []
    currentRole.value = null
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
    roles,
    currentRole,
    loading,
    saving,
    error,
    pagination,
    filters,
    // Getters
    totalItems,
    isLoading,
    isSaving,
    // Actions - Usuarios
    fetchAll,
    fetchById,
    create,
    update,
    remove,
    toggleEstado,
    // Actions - Roles de usuario
    assignRole,
    syncRoles,
    removeRole,
    // Actions - Roles catalogo
    fetchRoles,
    fetchRoleById,
    // Filtros
    setFilters,
    resetFilters,
    setPage,
    $reset,
  }
})
