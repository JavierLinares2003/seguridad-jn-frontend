import { useAuthStore } from '@/stores/auth'

/**
 * Verifica si el usuario tiene un permiso específico
 * @param {string|string[]} permission - Permiso o array de permisos a verificar
 * @param {boolean} requireAll - Si true, requiere todos los permisos (AND), si false, cualquiera (OR)
 * @returns {boolean}
 */
export function hasPermission (permission, requireAll = false) {
  const authStore = useAuthStore()
  const userPermissions = authStore.permissions

  if (!userPermissions || userPermissions.length === 0) {
    return false
  }

  // Verificar si tiene permiso de superadmin
  if (userPermissions.includes('*')) {
    return true
  }

  // Si es un solo permiso
  if (typeof permission === 'string') {
    return userPermissions.includes(permission) || checkWildcard(permission, userPermissions)
  }

  // Si es un array de permisos
  if (Array.isArray(permission)) {
    if (requireAll) {
      // Debe tener TODOS los permisos
      return permission.every(p => userPermissions.includes(p) || checkWildcard(p, userPermissions))
    } else {
      // Debe tener AL MENOS UNO de los permisos
      return permission.some(p => userPermissions.includes(p) || checkWildcard(p, userPermissions))
    }
  }

  return false
}

/**
 * Verifica permisos con wildcard (ej: 'personal.*' incluye 'personal.create')
 */
function checkWildcard (permission, userPermissions) {
  const parts = permission.split('.')

  for (let i = parts.length - 1; i > 0; i--) {
    const wildcardPermission = [...parts.slice(0, i), '*'].join('.')
    if (userPermissions.includes(wildcardPermission)) {
      return true
    }
  }

  return false
}

/**
 * Composable para usar permisos en componentes
 */
export function usePermissions () {
  const authStore = useAuthStore()

  const can = (permission, requireAll = false) => {
    return hasPermission(permission, requireAll)
  }

  const canAll = permissions => {
    return hasPermission(permissions, true)
  }

  const canAny = permissions => {
    return hasPermission(permissions, false)
  }

  return {
    can,
    canAll,
    canAny,
    permissions: authStore.permissions,
  }
}

/**
 * Directiva v-can
 * Uso:
 *   v-can="'personal.create'"
 *   v-can="['personal.create', 'personal.edit']"
 *   v-can:all="['personal.create', 'personal.edit']"  // Requiere todos
 *   v-can:any="['personal.create', 'personal.edit']"  // Requiere al menos uno
 */
const canDirective = {
  mounted (el, binding) {
    updateVisibility(el, binding)
  },
  updated (el, binding) {
    updateVisibility(el, binding)
  },
}

function updateVisibility (el, binding) {
  const { value, arg } = binding
  const requireAll = arg === 'all'

  const hasAccess = hasPermission(value, requireAll)

  if (hasAccess) {
    // Restaurar el display original
    if (el._originalDisplay !== undefined) {
      el.style.display = el._originalDisplay
    }
  } else {
    // Guardar el display original
    el._originalDisplay = el.style.display
    el.style.display = 'none'
  }
}

/**
 * Plugin de Vue para registrar la directiva y helpers globales
 */
export default {
  install (app) {
    // Registrar directiva v-can
    app.directive('can', canDirective)

    // Agregar helper global $can
    app.config.globalProperties.$can = hasPermission

    // Proveer composable
    app.provide('permissions', {
      hasPermission,
      usePermissions,
    })
  },
}
