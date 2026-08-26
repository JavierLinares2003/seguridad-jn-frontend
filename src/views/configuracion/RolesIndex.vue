<template>
  <v-container class="pa-6" fluid>
    <!-- Header -->
    <v-row align="center" class="mb-6">
      <v-col>
        <div class="d-flex align-center">
          <v-avatar class="mr-4" color="secondary" rounded="lg" size="48">
            <v-icon icon="mdi-shield-lock" size="28" />
          </v-avatar>
          <div>
            <h1 class="text-h4 font-weight-bold">Roles y vistas</h1>
            <p class="text-body-2 text-medium-emphasis mb-0">
              Define qué pantallas puede ver cada rol en el menú
            </p>
          </div>
        </div>
      </v-col>
      <v-col cols="auto" class="d-flex ga-2">
        <v-btn
          class="text-none"
          color="grey-darken-1"
          rounded="lg"
          size="large"
          :to="{ name: 'configuracion-usuarios' }"
          variant="tonal"
        >
          <v-icon start>mdi-arrow-left</v-icon>
          Volver a Usuarios
        </v-btn>
        <v-btn
          class="text-none font-weight-bold"
          color="secondary"
          rounded="lg"
          size="large"
          variant="flat"
          @click="openCreateRole"
        >
          <v-icon start>mdi-plus</v-icon>
          Nuevo rol
        </v-btn>
      </v-col>
    </v-row>

    <!-- Lista de Roles -->
    <v-row>
      <v-col
        v-for="role in store.roles"
        :key="role.id"
        cols="12"
        lg="4"
        md="6"
      >
        <v-card
          class="h-100"
          elevation="2"
          rounded="xl"
        >
          <v-card-title class="pa-5 pb-3">
            <div class="d-flex align-center justify-space-between">
              <div class="d-flex align-center">
                <v-avatar
                  class="mr-3"
                  :color="getRoleColor(role.name)"
                  size="42"
                >
                  <v-icon :icon="getRoleIcon(role.name)" size="22" />
                </v-avatar>
                <div>
                  <h3 class="text-h6 font-weight-bold text-capitalize">{{ role.name }}</h3>
                  <p class="text-caption text-medium-emphasis mb-0">
                    {{ role.users_count || 0 }} usuarios asignados
                  </p>
                </div>
              </div>
              <div class="d-flex ga-1">
                <v-tooltip location="top" text="Ver detalle">
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      color="primary"
                      icon="mdi-eye-outline"
                      size="small"
                      variant="tonal"
                      @click="openRoleDetail(role)"
                    />
                  </template>
                </v-tooltip>
                <v-tooltip v-if="role.name !== 'admin'" location="top" text="Editar vistas">
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      color="secondary"
                      icon="mdi-view-dashboard-edit"
                      size="small"
                      variant="tonal"
                      @click="openEditVistas(role)"
                    />
                  </template>
                </v-tooltip>
                <v-tooltip v-if="role.name !== 'admin'" location="top" text="Eliminar rol">
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      color="error"
                      icon="mdi-delete-outline"
                      size="small"
                      variant="tonal"
                      @click="confirmDeleteRole(role)"
                    />
                  </template>
                </v-tooltip>
              </div>
            </div>
          </v-card-title>

          <v-divider />

          <v-card-text class="pa-5">
            <p class="text-caption text-medium-emphasis mb-2">
              Vistas que puede ver
            </p>
            <div class="d-flex flex-wrap ga-2 mb-3">
              <v-chip
                v-for="vista in roleVistas(role)"
                :key="vista"
                color="secondary"
                size="small"
                variant="tonal"
              >
                {{ vista }}
              </v-chip>
              <span
                v-if="roleVistas(role).length === 0"
                class="text-caption text-medium-emphasis"
              >
                Ninguna vista asignada
              </span>
            </div>

            <p class="text-caption text-medium-emphasis mb-0">
              {{ role.permissions_count || 0 }} permisos en total
            </p>

            <v-btn
              v-if="role.name !== 'admin'"
              class="mt-4 text-none"
              block
              color="secondary"
              rounded="lg"
              size="small"
              variant="tonal"
              @click="openEditVistas(role)"
            >
              <v-icon start>mdi-view-dashboard-edit</v-icon>
              Editar vistas
            </v-btn>
            <p v-else class="text-caption text-medium-emphasis mt-4 mb-0">
              El rol admin ve todas las pantallas y no se puede restringir.
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Loading -->
    <v-row v-if="store.loading">
      <v-col
        v-for="i in 6"
        :key="i"
        cols="12"
        lg="4"
        md="6"
      >
        <v-skeleton-loader
          elevation="2"
          rounded="xl"
          type="article"
        />
      </v-col>
    </v-row>

    <!-- Empty state -->
    <v-card
      v-if="!store.loading && store.roles.length === 0"
      class="text-center py-10"
      elevation="2"
      rounded="xl"
    >
      <v-avatar class="mb-4" color="grey-lighten-3" size="80">
        <v-icon color="grey-lighten-1" size="48">mdi-shield-off-outline</v-icon>
      </v-avatar>
      <h3 class="text-h6 font-weight-medium text-grey-darken-1 mb-1">No hay roles disponibles</h3>
      <p class="text-body-2 text-medium-emphasis">No se encontraron roles en el sistema</p>
    </v-card>

    <!-- Dialog Detalle de Rol -->
    <v-dialog v-model="roleDetailDialog" max-width="600" scrollable>
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-2">
          <div class="d-flex align-center">
            <v-avatar
              class="mr-3"
              :color="selectedRole ? getRoleColor(selectedRole.name) : 'primary'"
              size="42"
            >
              <v-icon :icon="selectedRole ? getRoleIcon(selectedRole.name) : 'mdi-shield'" size="24" />
            </v-avatar>
            <div>
              <h3 class="text-h6 font-weight-bold text-capitalize">{{ selectedRole?.name }}</h3>
              <p class="text-caption text-medium-emphasis mb-0">
                {{ rolePermissions.length }} permisos asignados
              </p>
            </div>
          </div>
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-0" style="max-height: 400px;">
          <v-list density="compact" lines="one">
            <template v-for="(group, category) in groupedPermissions" :key="category">
              <v-list-subheader class="text-overline font-weight-bold text-primary">
                {{ category }}
              </v-list-subheader>
              <v-list-item
                v-for="permission in group"
                :key="permission"
                class="pl-6"
              >
                <template #prepend>
                  <v-icon color="success" icon="mdi-check-circle" size="18" />
                </template>
                <v-list-item-title class="text-body-2">
                  {{ formatPermission(permission) }}
                </v-list-item-title>
              </v-list-item>
            </template>
          </v-list>

          <div v-if="rolePermissions.length === 0" class="text-center py-8">
            <v-icon class="mb-2" color="grey-lighten-1" icon="mdi-shield-off-outline" size="48" />
            <p class="text-body-2 text-medium-emphasis mb-0">Este rol no tiene permisos asignados</p>
          </div>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn
            class="text-none"
            color="primary"
            rounded="lg"
            variant="tonal"
            @click="roleDetailDialog = false"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Editar Vistas -->
    <v-dialog v-model="vistasDialog" max-width="560" persistent scrollable>
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-2">
          <div class="d-flex align-center">
            <v-avatar class="mr-3" color="secondary" size="42">
              <v-icon icon="mdi-view-dashboard-edit" size="24" />
            </v-avatar>
            <div>
              <h3 class="text-h6 font-weight-bold">Editar vistas</h3>
              <p class="text-caption text-medium-emphasis mb-0 text-capitalize">
                {{ editingVistasRole?.name }}
              </p>
            </div>
          </div>
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-5" style="max-height: 420px;">
          <v-alert
            class="mb-4"
            density="compact"
            rounded="lg"
            type="info"
            variant="tonal"
          >
            Selecciona las pantallas/vistas del menú que este rol puede ver
          </v-alert>

          <div v-if="loadingMenuPermissions" class="text-center py-6">
            <v-progress-circular color="primary" indeterminate />
          </div>

          <template v-else>
            <v-checkbox
              v-for="vista in menuPermissions"
              :key="vista.key || vista.name || vista"
              v-model="selectedVistas"
              color="secondary"
              density="comfortable"
              hide-details
              :label="vistaLabel(vista)"
              :value="vistaValue(vista)"
            />

            <div v-if="menuPermissions.length === 0" class="text-center py-6">
              <p class="text-body-2 text-medium-emphasis mb-0">No hay vistas disponibles</p>
            </div>
          </template>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn
            class="text-none"
            color="grey-darken-1"
            rounded="lg"
            variant="tonal"
            @click="vistasDialog = false"
          >
            Cancelar
          </v-btn>
          <v-btn
            class="text-none font-weight-bold"
            color="secondary"
            :loading="savingVistas"
            rounded="lg"
            variant="flat"
            @click="saveVistas"
          >
            <v-icon start>mdi-content-save-outline</v-icon>
            Guardar vistas
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Nuevo Rol -->
    <v-dialog v-model="createRoleDialog" max-width="560" persistent scrollable>
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-2">
          <div class="d-flex align-center">
            <v-avatar class="mr-3" color="secondary" size="42">
              <v-icon icon="mdi-shield-plus" size="24" />
            </v-avatar>
            <div>
              <h3 class="text-h6 font-weight-bold">Nuevo rol</h3>
              <p class="text-caption text-medium-emphasis mb-0">
                Nombre y pantallas que podrá ver
              </p>
            </div>
          </div>
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-5" style="max-height: 480px;">
          <v-text-field
            v-model="newRoleName"
            class="mb-2"
            color="secondary"
            density="comfortable"
            hint="Ejemplo: bodega, jefe de turno"
            label="Nombre del rol"
            persistent-hint
            prepend-inner-icon="mdi-shield-account-outline"
            rounded="lg"
            :rules="roleNameRules"
            variant="outlined"
          />

          <v-alert
            class="mb-4 mt-4"
            density="compact"
            rounded="lg"
            type="info"
            variant="tonal"
          >
            Marca las pantallas del menú que este rol podrá ver
          </v-alert>

          <div v-if="loadingMenuPermissions" class="text-center py-6">
            <v-progress-circular color="primary" indeterminate />
          </div>

          <template v-else>
            <v-checkbox
              v-for="vista in menuPermissions"
              :key="vista.key || vista.name || vista"
              v-model="selectedVistas"
              color="secondary"
              density="comfortable"
              hide-details
              :label="vistaLabel(vista)"
              :value="vistaValue(vista)"
            />

            <div v-if="menuPermissions.length === 0" class="text-center py-6">
              <p class="text-body-2 text-medium-emphasis mb-0">No hay vistas disponibles</p>
            </div>
          </template>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn
            class="text-none"
            color="grey-darken-1"
            rounded="lg"
            variant="tonal"
            @click="createRoleDialog = false"
          >
            Cancelar
          </v-btn>
          <v-btn
            class="text-none font-weight-bold"
            color="secondary"
            :disabled="!newRoleName.trim()"
            :loading="savingRole"
            rounded="lg"
            variant="flat"
            @click="saveNewRole"
          >
            <v-icon start>mdi-content-save-outline</v-icon>
            Crear rol
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Eliminar Rol -->
    <v-dialog v-model="deleteRoleDialog" max-width="420" persistent>
      <v-card rounded="xl">
        <v-card-text class="text-center pa-6">
          <v-avatar class="mb-4" color="error" size="72" variant="tonal">
            <v-icon color="error" icon="mdi-alert-circle-outline" size="40" />
          </v-avatar>
          <h3 class="text-h6 font-weight-bold mb-2">Eliminar rol</h3>
          <p class="text-body-1 text-medium-emphasis mb-0">
            ¿Eliminar el rol
            <strong class="text-grey-darken-3 text-capitalize">{{ roleToDelete?.name }}</strong>?
          </p>
          <v-alert
            v-if="roleToDelete?.users_count"
            class="mt-4 text-left"
            density="compact"
            rounded="lg"
            type="warning"
            variant="tonal"
          >
            Hay {{ roleToDelete.users_count }} usuario(s) con este rol. Cámbiales el rol antes de eliminarlo.
          </v-alert>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn
            class="text-none"
            color="grey-darken-1"
            rounded="lg"
            variant="tonal"
            @click="deleteRoleDialog = false"
          >
            Cancelar
          </v-btn>
          <v-btn
            class="text-none font-weight-bold"
            color="error"
            :disabled="!!roleToDelete?.users_count"
            :loading="store.saving"
            rounded="lg"
            variant="flat"
            @click="deleteRole"
          >
            <v-icon start>mdi-delete-outline</v-icon>
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      elevation="8"
      rounded="lg"
      :timeout="3000"
    >
      <div class="d-flex align-center">
        <v-icon
          class="mr-2"
          :icon="snackbar.color === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle'"
        />
        {{ snackbar.text }}
      </div>
    </v-snackbar>
  </v-container>
</template>

<script setup>
  import { computed, onMounted, reactive, ref } from 'vue'
  import userService from '@/services/userService'
  import { useUsersStore } from '@/stores/users'

  const store = useUsersStore()

  // Dialog detalle rol
  const roleDetailDialog = ref(false)
  const selectedRole = ref(null)
  const rolePermissions = ref([])

  // Dialog editar vistas
  const vistasDialog = ref(false)
  const editingVistasRole = ref(null)
  const menuPermissions = ref([])
  const selectedVistas = ref([])
  const loadingMenuPermissions = ref(false)
  const savingVistas = ref(false)

  const createRoleDialog = ref(false)
  const newRoleName = ref('')
  const savingRole = ref(false)
  const deleteRoleDialog = ref(false)
  const roleToDelete = ref(null)

  const roleNameRules = [
    v => !!String(v || '').trim() || 'El nombre es obligatorio',
    v => String(v || '').trim().length >= 3 || 'Mínimo 3 caracteres',
    v => String(v || '').trim().toLowerCase() !== 'admin' || 'Ese nombre está reservado',
  ]

  // Snackbar
  const snackbar = reactive({
    show: false,
    text: '',
    color: 'success',
  })

  function showSnackbar(text, color = 'success') {
    snackbar.text = text
    snackbar.color = color
    snackbar.show = true
  }

  // Obtener color del rol
  function getRoleColor(roleName) {
    const colors = {
      admin: 'error',
      supervisor: 'warning',
      operador: 'info',
      'gestor-personal': 'success',
      'gestor-proyectos': 'purple',
    }
    return colors[roleName] || 'primary'
  }

  // Obtener icono del rol
  function getRoleIcon(roleName) {
    const icons = {
      admin: 'mdi-shield-crown',
      supervisor: 'mdi-shield-star',
      operador: 'mdi-shield-account',
      'gestor-personal': 'mdi-shield-check',
      'gestor-proyectos': 'mdi-shield-half-full',
    }
    return icons[roleName] || 'mdi-shield'
  }

  function roleVistas(role) {
    const raw = role?.vistas
    if (Array.isArray(raw) && raw.length) {
      return raw.map(item => (typeof item === 'string' ? item : item.label || item.name)).filter(Boolean)
    }
    return []
  }

  // Agrupar permisos por categoria
  const groupedPermissions = computed(() => {
    const groups = {}
    rolePermissions.value.forEach(permission => {
      const parts = permission.split('-')
      const category = parts[parts.length - 1] || 'General'
      const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1)

      if (!groups[formattedCategory]) {
        groups[formattedCategory] = []
      }
      groups[formattedCategory].push(permission)
    })
    return groups
  })

  // Formatear nombre de permiso
  function formatPermission(permission) {
    return permission
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  function vistaValue(vista) {
    if (typeof vista === 'string') return vista
    return vista.permission || vista.key || vista.name || vista.vista || vista.id
  }

  function vistaLabel(vista) {
    if (typeof vista === 'string') return formatPermission(vista)
    return vista.label || vista.title || vista.name || formatPermission(vistaValue(vista))
  }

  function normalizeVistasList(raw) {
    if (!raw) return []
    if (!Array.isArray(raw)) return []
    return raw.map(item => {
      if (typeof item === 'string') return item
      return item.permission || item.key || item.name || item.vista || item.id
    }).filter(Boolean)
  }

  // Abrir detalle de rol
  async function openRoleDetail(role) {
    selectedRole.value = role
    roleDetailDialog.value = true

    try {
      const response = await userService.getRoleById(role.id)
      const roleData = response?.data ?? response
      rolePermissions.value = roleData?.permissions || []
    } catch {
      showSnackbar('Error al cargar permisos del rol', 'error')
      rolePermissions.value = []
    }
  }

  async function loadMenuPermissions() {
    const menuResponse = await userService.getMenuPermissions()
    const menuData = menuResponse?.data ?? menuResponse
    const menuList = Array.isArray(menuData)
      ? menuData
      : (Array.isArray(menuData?.data) ? menuData.data : [])
    menuPermissions.value = menuList
    return menuList
  }

  async function openCreateRole() {
    newRoleName.value = ''
    selectedVistas.value = []
    createRoleDialog.value = true
    loadingMenuPermissions.value = true
    try {
      await loadMenuPermissions()
    } catch {
      showSnackbar('Error al cargar vistas disponibles', 'error')
      menuPermissions.value = []
    } finally {
      loadingMenuPermissions.value = false
    }
  }

  async function saveNewRole() {
    const name = newRoleName.value.trim()
    if (!name || name.toLowerCase() === 'admin') {
      showSnackbar('Ingresa un nombre válido para el rol', 'error')
      return
    }

    savingRole.value = true
    try {
      await store.createRole({
        name,
        vistas: selectedVistas.value,
      })
      showSnackbar('Rol creado correctamente')
      createRoleDialog.value = false
      await store.fetchRoles()
    } catch (err) {
      showSnackbar(err.apiMessage || 'Error al crear el rol', 'error')
    } finally {
      savingRole.value = false
    }
  }

  function confirmDeleteRole(role) {
    if (role.name === 'admin') return
    roleToDelete.value = role
    deleteRoleDialog.value = true
  }

  async function deleteRole() {
    if (!roleToDelete.value) return

    try {
      await store.deleteRole(roleToDelete.value.id)
      showSnackbar('Rol eliminado correctamente')
      deleteRoleDialog.value = false
      roleToDelete.value = null
      await store.fetchRoles()
    } catch (err) {
      showSnackbar(err.apiMessage || 'Error al eliminar el rol', 'error')
    }
  }

  async function openEditVistas(role) {
    if (role.name === 'admin') return

    editingVistasRole.value = role
    selectedVistas.value = []
    vistasDialog.value = true
    loadingMenuPermissions.value = true

    try {
      const [, roleResponse] = await Promise.all([
        loadMenuPermissions(),
        userService.getRoleById(role.id),
      ])

      const roleData = roleResponse?.data ?? roleResponse
      const current = roleData?.permissions
        || role.permissions
        || []
      const menuKeys = menuPermissions.value.map(vistaValue)
      selectedVistas.value = normalizeVistasList(current).filter(p => menuKeys.includes(p))
    } catch {
      showSnackbar('Error al cargar vistas del rol', 'error')
      menuPermissions.value = []
    } finally {
      loadingMenuPermissions.value = false
    }
  }

  async function saveVistas() {
    if (!editingVistasRole.value) return

    savingVistas.value = true
    try {
      await userService.syncRolePermissions(editingVistasRole.value.id, selectedVistas.value)
      showSnackbar('Vistas actualizadas correctamente')
      vistasDialog.value = false
      await store.fetchRoles()
    } catch (err) {
      showSnackbar(err.apiMessage || 'Error al guardar vistas', 'error')
    } finally {
      savingVistas.value = false
    }
  }

  // Cargar datos al montar
  onMounted(async () => {
    try {
      await store.fetchRoles()
    } catch {
      showSnackbar('Error al cargar roles', 'error')
    }
  })
</script>
