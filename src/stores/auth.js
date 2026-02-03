import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import authService from '@/services/authService'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null)
  const token = ref(localStorage.getItem('auth_token_jn') || null)
  const permissions = ref([])
  const loading = ref(false)
  const error = ref(null)
  const initialized = ref(false)

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const userRole = computed(() => {
    if (user.value?.roles && Array.isArray(user.value.roles) && user.value.roles.length > 0) {
      return user.value.roles.join(', ')
    }
    return user.value?.role || 'Rol no definido'
  })
  const userName = computed(() => user.value?.name || '')
  const isSuperAdmin = computed(() => permissions.value.includes('*'))

  // Actions
  async function login(credentials) {
    loading.value = true
    error.value = null

    try {
      // API retorna: { success, message, data: { user, token, permissions } }
      const response = await authService.login(credentials)
      const { user: userData, token: authToken, permissions: userPermissions } = response.data

      user.value = userData
      token.value = authToken
      permissions.value = userPermissions || userData?.permissions || []
      localStorage.setItem('auth_token_jn', authToken)

      return { success: true }
    } catch (error_) {
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al iniciar sesión'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  async function register(userData) {
    loading.value = true
    error.value = null

    try {
      // API retorna: { success, message, data: { user, token, permissions } }
      const response = await authService.register(userData)
      const { user: newUser, token: authToken, permissions: userPermissions } = response.data

      user.value = newUser
      token.value = authToken
      permissions.value = userPermissions || newUser?.permissions || []
      localStorage.setItem('auth_token_jn', authToken)

      return { success: true }
    } catch (error_) {
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al registrarse'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  async function checkAuth() {
    if (!token.value) {
      initialized.value = true
      return false
    }

    if (user.value) {
      initialized.value = true
      return true
    }

    loading.value = true
    try {
      // API retorna: { success, message, data: {...} }
      const response = await authService.getProfile()
      const data = response.data

      // Manejar diferentes estructuras de respuesta:
      // 1. { user: {...}, permissions: [...] }
      // 2. { id, name, ..., permissions: [...] } (usuario directo)
      if (data.user) {
        user.value = data.user
        permissions.value = data.permissions || data.user?.permissions || []
      } else if (data.id) {
        // La respuesta es el usuario directamente
        user.value = data
        permissions.value = data.permissions || []
      }

      initialized.value = true
      return true
    } catch {
      logout()
      initialized.value = true
      return false
    } finally {
      loading.value = false
    }
  }

  async function fetchUser() {
    if (!token.value) {
      return null
    }

    loading.value = true
    try {
      // API retorna: { success, message, data: {...} }
      const response = await authService.getProfile()
      const data = response.data

      // Manejar diferentes estructuras de respuesta
      if (data.user) {
        user.value = data.user
        permissions.value = data.permissions || data.user?.permissions || []
      } else if (data.id) {
        user.value = data
        permissions.value = data.permissions || []
      }

      return user.value
    } catch {
      logout()
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Verifica si el usuario tiene un permiso específico
   */
  function hasPermission(permission, requireAll = false) {
    if (!permissions.value || !Array.isArray(permissions.value) || permissions.value.length === 0) {
      return false
    }

    if (!permission) {
      return false
    }

    // Superadmin tiene todos los permisos
    if (permissions.value.includes('*')) {
      return true
    }

    // Si es un solo permiso
    if (typeof permission === 'string') {
      return permissions.value.includes(permission) || checkWildcard(permission)
    }

    // Si es un array de permisos
    if (Array.isArray(permission)) {
      return requireAll ? permission.every(p => permissions.value.includes(p) || checkWildcard(p)) : permission.some(p => permissions.value.includes(p) || checkWildcard(p))
    }

    return false
  }

  /**
   * Verifica permisos con wildcard
   */
  function checkWildcard(permission) {
    const parts = permission.split('.')

    for (let i = parts.length - 1; i > 0; i--) {
      const wildcardPermission = [...parts.slice(0, i), '*'].join('.')
      if (permissions.value.includes(wildcardPermission)) {
        return true
      }
    }

    return false
  }

  function logout() {
    authService.logout()
    user.value = null
    token.value = null
    permissions.value = []
    localStorage.removeItem('auth_token_jn')
  }

  function clearError() {
    error.value = null
  }

  function setToken(newToken) {
    token.value = newToken
    localStorage.setItem('auth_token_jn', newToken)
  }

  function setPermissions(newPermissions) {
    permissions.value = newPermissions || []
  }

  return {
    // State
    user,
    token,
    permissions,
    loading,
    error,
    initialized,
    // Getters
    isAuthenticated,
    userRole,
    userName,
    isSuperAdmin,
    // Actions
    login,
    register,
    checkAuth,
    fetchUser,
    hasPermission,
    logout,
    clearError,
    setToken,
    setPermissions,
  }
})
