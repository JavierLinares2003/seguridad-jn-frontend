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
  const isAdmin = computed(() => {
    const roles = user.value?.roles
    if (Array.isArray(roles)) {
      return roles.some(role => (typeof role === 'string' ? role : role?.name) === 'admin')
    }
    return user.value?.role === 'admin'
  })

  function unwrapPayload(response) {
    const body = response?.data !== undefined ? response.data : response
    if (body && typeof body === 'object' && body.data && typeof body.data === 'object' && !Array.isArray(body.data)) {
      if (body.data.user || body.data.token || body.data.id || body.data.permissions) {
        return body.data
      }
    }
    return body || {}
  }

  function normalizePermissions(raw) {
    if (!raw) return []
    const list = Array.isArray(raw) ? raw : Object.values(raw)
    return list
      .map(item => (typeof item === 'string' ? item : item?.name || item?.permission))
      .filter(Boolean)
  }

  function applySession({ userData, authToken, rawPermissions }) {
    user.value = userData || null
    if (authToken) {
      token.value = authToken
      localStorage.setItem('auth_token_jn', authToken)
    }
    permissions.value = normalizePermissions(rawPermissions || userData?.permissions)
  }

  // Actions
  async function login(credentials) {
    loading.value = true
    error.value = null

    try {
      const response = await authService.login(credentials)
      const payload = unwrapPayload(response)
      const userData = payload.user || payload
      applySession({
        userData,
        authToken: payload.token,
        rawPermissions: payload.permissions || userData?.permissions,
      })

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
      const payload = unwrapPayload(response)
      const newUser = payload.user || payload
      applySession({
        userData: newUser,
        authToken: payload.token,
        rawPermissions: payload.permissions || newUser?.permissions,
      })

      return { success: true }
    } catch (error_) {
      error.value = error_.apiMessage || error_.response?.data?.message || 'Error al registrarse'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  async function checkAuth() {
    // Si no hay token, marcar como inicializado y retornar false
    if (!token.value) {
      initialized.value = true
      return false
    }

    // Si ya tenemos el usuario cargado, no hacer otra petición
    if (user.value) {
      initialized.value = true
      return true
    }

    loading.value = true
    try {
      // API retorna: { success, message, data: {...} }
      const response = await authService.getProfile()
      const data = unwrapPayload(response)
      const userData = data.user || (data.id ? data : null)

      if (userData) {
        applySession({
          userData,
          rawPermissions: data.permissions || userData.permissions,
        })
      }

      initialized.value = true
      return true
    } catch (error_) {
      // Si el error es 401, el interceptor ya limpió todo
      // Solo necesitamos asegurarnos de que estamos inicializados
      // No llamar logout() aquí porque el interceptor ya lo hizo
      const is401 = error_.response?.status === 401

      if (!is401) {
        // Para otros errores, limpiar manualmente
        user.value = null
        token.value = null
        permissions.value = []
        localStorage.removeItem('auth_token_jn')
      }

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
      const data = unwrapPayload(response)
      const userData = data.user || (data.id ? data : null)

      if (userData) {
        applySession({
          userData,
          rawPermissions: data.permissions || userData.permissions,
        })
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
    if (isAdmin.value) {
      return true
    }

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
    isAdmin,
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
