/**
 * router/index.js
 *
 * Automatic routes for `./src/pages/*.vue`
 * Manual routes for `./src/views/*.vue`
 */

import { setupLayouts } from 'virtual:generated-layouts'
import { createRouter, createWebHistory } from 'vue-router'
import { routes as autoRoutes } from 'vue-router/auto-routes'
import { useAuthStore } from '@/stores/auth'

// Rutas manuales para views
const manualRoutes = [
  {
    path: '/',
    name: 'home',
    redirect: '/inicio',
    meta: { requiresAuth: true },
  },
  {
    path: '/inicio',
    name: 'inicio',
    component: () => import('@/views/WelcomeView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { requiresAuth: false, layout: 'blank' },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/RegisterView.vue'),
    meta: { requiresAuth: false, layout: 'blank' },
  },
  {
    path: '/forbidden',
    name: 'forbidden',
    component: () => import('@/views/ForbiddenView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/perfil',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { requiresAuth: true },
  },
  // Personal
  {
    path: '/personal',
    name: 'personal',
    component: () => import('@/views/personal/PersonalIndex.vue'),
    meta: { requiresAuth: true, permissions: ['view-personal'] },
  },
  {
    path: '/personal/crear',
    name: 'personal-create',
    component: () => import('@/views/personal/PersonalForm.vue'),
    meta: { requiresAuth: true, permissions: ['create-personal'] },
  },
  {
    path: '/personal/:id',
    name: 'personal-detalle',
    component: () => import('@/views/personal/PersonalDetalle.vue'),
    meta: { requiresAuth: true, permissions: ['view-personal'] },
  },
  {
    path: '/personal/:id/editar',
    name: 'personal-edit',
    component: () => import('@/views/personal/PersonalForm.vue'),
    meta: { requiresAuth: true, permissions: ['edit-personal'] },
  },
  // Proyectos
  {
    path: '/proyectos',
    name: 'proyectos',
    component: () => import('@/views/proyectos/ProyectosIndex.vue'),
    meta: { requiresAuth: true, permissions: ['view-proyectos'] },
  },
  {
    path: '/proyectos/crear',
    name: 'proyectos-create',
    component: () => import('@/views/proyectos/ProyectoForm.vue'),
    meta: { requiresAuth: true, permissions: ['create-proyectos'] },
  },
  {
    path: '/proyectos/:id',
    name: 'proyectos-detalle',
    component: () => import('@/views/proyectos/ProyectoDetalle.vue'),
    meta: { requiresAuth: true, permissions: ['view-proyectos'] },
  },
  {
    path: '/proyectos/:id/editar',
    name: 'proyectos-edit',
    component: () => import('@/views/proyectos/ProyectoForm.vue'),
    meta: { requiresAuth: true, permissions: ['edit-proyectos'] },
  },
  // Operaciones
  {
    path: '/operaciones',
    name: 'operaciones',
    component: () => import('@/views/operaciones/OperacionesIndex.vue'),
    meta: { requiresAuth: true, permissions: ['view-operaciones'] },
  },
  {
    path: '/operaciones/asistencia',
    name: 'operaciones-asistencia',
    component: () => import('@/views/operaciones/AsistenciaView.vue'),
    meta: { requiresAuth: true, permissions: ['view-operaciones'] },
  },
  {
    path: '/operaciones/asignaciones',
    name: 'operaciones-asignaciones',
    component: () => import('@/views/operaciones/OperacionesIndex.vue'),
    meta: { requiresAuth: true, permissions: ['view-operaciones'] },
  },
  {
    path: '/operaciones/alertas-cobertura',
    name: 'operaciones-alertas-cobertura',
    component: () => import('@/views/operaciones/AlertasCoberturaView.vue'),
    meta: { requiresAuth: true, permissions: ['view-operaciones'] },
  },
  {
    path: '/operaciones/planillas',
    name: 'operaciones-planillas',
    component: () => import('@/views/planillas/PlanillasList.vue'),
    meta: { requiresAuth: true, permissions: ['view-planillas'] },
  },
  {
    path: '/operaciones/planillas/generar',
    name: 'operaciones-planillas-generar',
    component: () => import('@/views/planillas/PlanillaGenerar.vue'),
    meta: { requiresAuth: true, permissions: ['create-planillas'] },
  },
  {
    path: '/operaciones/planillas/:id',
    name: 'operaciones-planillas-detalle',
    component: () => import('@/views/planillas/PlanillaDetalle.vue'),
    meta: { requiresAuth: true, permissions: ['view-planillas'] },
  },
  // Configuracion
  {
    path: '/configuracion/usuarios',
    name: 'configuracion-usuarios',
    component: () => import('@/views/configuracion/UsersIndex.vue'),
    meta: { requiresAuth: true, permissions: ['view-users'] },
  },
  {
    path: '/configuracion/roles',
    name: 'configuracion-roles',
    component: () => import('@/views/configuracion/RolesIndex.vue'),
    meta: { requiresAuth: true, permissions: ['view-roles'] },
  },
  {
    path: '/configuracion/bitacora',
    name: 'configuracion-bitacora',
    component: () => import('@/views/configuracion/BitacoraIndex.vue'),
    meta: { requiresAuth: true, permissions: ['view-bitacora'] },
  },
]

// Combinar rutas automáticas con manuales
console.log('AutoRoutes loaded:', autoRoutes)

let routes = []
try {
  // Aplicar layouts a TODAS las rutas (automáticas y manuales)
  const allRoutes = [...(autoRoutes || []), ...manualRoutes]
  routes = setupLayouts(allRoutes)
} catch (error) {
  console.error('Error in setupLayouts:', error)
  routes = [...(autoRoutes || []), ...manualRoutes]
}

console.log('Final Routes Configuration:', routes)

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Navigation Guard
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  // Verificar autenticación al iniciar la app
  if (!authStore.initialized) {
    await authStore.checkAuth()
  }

  const requiresAuth = to.meta.requiresAuth !== false
  const isAuthenticated = authStore.isAuthenticated

  // Ruta protegida y usuario no autenticado
  if (requiresAuth && !isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  // Usuario autenticado intentando acceder a login/register
  if (isAuthenticated && (to.name === 'login' || to.name === 'register')) {
    next({ name: 'dashboard' })
    return
  }

  // Verificar roles si la ruta lo requiere
  if (to.meta.roles && !to.meta.roles.includes(authStore.userRole)) {
    next({ name: 'forbidden' })
    return
  }

  // Verificar permisos si la ruta lo requiere
  if (to.meta.permissions) {
    const requiredPermissions = to.meta.permissions
    const requireAll = to.meta.requireAllPermissions !== false

    if (!authStore.hasPermission(requiredPermissions, requireAll)) {
      next({ name: 'forbidden' })
      return
    }
  }

  next()
})

// Workaround for https://github.com/vitejs/vite/issues/11804
router.onError((err, to) => {
  if (err?.message?.includes?.('Failed to fetch dynamically imported module')) {
    if (localStorage.getItem('vuetify:dynamic-reload')) {
      console.error('Dynamic import error, reloading page did not fix it', err)
    } else {
      console.log('Reloading page to fix dynamic import error')
      localStorage.setItem('vuetify:dynamic-reload', 'true')
      location.assign(to.fullPath)
    }
  } else {
    console.error(err)
  }
})

router.isReady().then(() => {
  localStorage.removeItem('vuetify:dynamic-reload')
})

export default router
