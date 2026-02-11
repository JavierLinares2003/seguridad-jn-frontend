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
            <h1 class="text-h4 font-weight-bold text-grey-darken-3">Roles y Permisos</h1>
            <p class="text-body-2 text-medium-emphasis mb-0">Visualiza los roles del sistema y sus permisos</p>
          </div>
        </div>
      </v-col>
      <v-col cols="auto">
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
              <v-btn
                color="primary"
                icon="mdi-eye-outline"
                size="small"
                variant="tonal"
                @click="openRoleDetail(role)"
              />
            </div>
          </v-card-title>

          <v-divider />

          <v-card-text class="pa-5">
            <div class="d-flex align-center justify-space-between mb-3">
              <span class="text-body-2 font-weight-medium">Permisos</span>
              <v-chip color="primary" size="small" variant="tonal">
                {{ role.permissions_count || 0 }}
              </v-chip>
            </div>

            <v-progress-linear
              class="rounded-pill"
              color="primary"
              height="8"
              :model-value="getPermissionPercentage(role.permissions_count)"
            />

            <p class="text-caption text-medium-emphasis mt-2 mb-0">
              {{ getPermissionPercentage(role.permissions_count) }}% del total de permisos
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
  import { useUsersStore } from '@/stores/users'

  const store = useUsersStore()

  // Maximo de permisos (para calcular porcentaje)
  const MAX_PERMISSIONS = 50

  // Dialog detalle rol
  const roleDetailDialog = ref(false)
  const selectedRole = ref(null)
  const rolePermissions = ref([])

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

  // Calcular porcentaje de permisos
  function getPermissionPercentage(count) {
    return Math.min(Math.round((count || 0) / MAX_PERMISSIONS * 100), 100)
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

  // Abrir detalle de rol
  async function openRoleDetail(role) {
    selectedRole.value = role
    roleDetailDialog.value = true

    try {
      const roleData = await store.fetchRoleById(role.id)
      rolePermissions.value = roleData?.permissions || []
    } catch {
      showSnackbar('Error al cargar permisos del rol', 'error')
      rolePermissions.value = []
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
