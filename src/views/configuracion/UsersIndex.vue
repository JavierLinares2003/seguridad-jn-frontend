<template>
  <v-container class="pa-6" fluid>
    <!-- Header -->
    <v-row align="center" class="mb-6">
      <v-col>
        <div class="d-flex align-center">
          <v-avatar class="mr-4" color="primary" rounded="lg" size="48">
            <v-icon icon="mdi-account-cog" size="28" />
          </v-avatar>
          <div>
            <h1 class="text-h4 font-weight-bold text-grey-darken-3">Gestion de Usuarios</h1>
            <p class="text-body-2 text-medium-emphasis mb-0">Administra usuarios y sus roles en el sistema</p>
          </div>
        </div>
      </v-col>
      <v-col cols="auto">
        <v-btn
          class="text-none font-weight-bold"
          color="primary"
          elevation="2"
          rounded="lg"
          size="large"
          @click="openCreateDialog"
        >
          <v-icon start>mdi-plus</v-icon>
          Nuevo Usuario
        </v-btn>
      </v-col>
    </v-row>

    <!-- Filtros -->
    <v-card class="mb-6" elevation="2" rounded="xl">
      <v-card-text class="pa-5">
        <div class="d-flex align-center mb-4">
          <v-icon class="mr-2" color="primary" icon="mdi-filter-outline" />
          <span class="text-subtitle-1 font-weight-medium">Filtros de busqueda</span>
        </div>
        <v-row align="center">
          <v-col cols="12" md="4">
            <v-text-field
              v-model="searchQuery"
              bg-color="grey-lighten-5"
              clearable
              color="primary"
              density="comfortable"
              hide-details
              label="Buscar"
              placeholder="Nombre, email..."
              prepend-inner-icon="mdi-magnify"
              rounded="lg"
              variant="outlined"
              @update:model-value="debouncedSearch"
            />
          </v-col>

          <v-col cols="12" md="3">
            <v-select
              v-model="store.filters.role"
              bg-color="grey-lighten-5"
              clearable
              color="primary"
              density="comfortable"
              hide-details
              item-title="name"
              item-value="name"
              :items="store.roles"
              label="Rol"
              prepend-inner-icon="mdi-shield-account"
              rounded="lg"
              variant="outlined"
              @update:model-value="loadData(true)"
            />
          </v-col>

          <v-col cols="12" md="3">
            <v-select
              v-model="store.filters.estado"
              bg-color="grey-lighten-5"
              clearable
              color="primary"
              density="comfortable"
              hide-details
              item-title="text"
              item-value="value"
              :items="estadosUsuario"
              label="Estado"
              prepend-inner-icon="mdi-list-status"
              rounded="lg"
              variant="outlined"
              @update:model-value="loadData(true)"
            />
          </v-col>

          <v-col cols="12" md="2">
            <v-btn
              block
              class="text-none"
              color="grey-darken-1"
              rounded="lg"
              size="large"
              variant="tonal"
              @click="resetFilters"
            >
              <v-icon start>mdi-filter-off-outline</v-icon>
              Limpiar
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- DataTable -->
    <v-card elevation="2" rounded="xl">
      <v-data-table-server
        v-model:items-per-page="store.pagination.perPage"
        v-model:page="store.pagination.page"
        :headers="headers"
        hover
        :items="store.items"
        :items-length="store.pagination.total"
        :loading="store.loading"
        :search="searchQuery"
        @update:options="onOptionsUpdate"
      >
        <!-- Nombre -->
        <template #item.name="{ item }">
          <div class="py-2">
            <div class="d-flex align-center">
              <v-avatar class="mr-3" color="primary" size="40">
                <span class="text-body-2 font-weight-bold text-white">
                  {{ getInitials(item.name) }}
                </span>
              </v-avatar>
              <div>
                <p class="text-body-1 font-weight-medium mb-0">{{ item.name }}</p>
                <p class="text-caption text-medium-emphasis mb-0">{{ item.email }}</p>
              </div>
            </div>
          </div>
        </template>

        <!-- Roles -->
        <template #item.roles="{ item }">
          <div class="d-flex flex-wrap ga-1">
            <v-chip
              v-for="role in (item.roles || [])"
              :key="role.id || role.name || role"
              class="text-capitalize"
              color="primary"
              label
              size="small"
              variant="tonal"
            >
              {{ role.name || role }}
            </v-chip>
            <span v-if="!item.roles?.length" class="text-medium-emphasis">Sin roles</span>
          </div>
        </template>

        <!-- Estado -->
        <template #item.estado="{ item }">
          <v-chip
            class="font-weight-medium"
            :color="item.estado ? 'success' : 'grey'"
            label
            size="small"
            variant="flat"
          >
            <v-icon :icon="item.estado ? 'mdi-check-circle-outline' : 'mdi-close-circle-outline'" size="14" start />
            {{ item.estado ? 'Activo' : 'Inactivo' }}
          </v-chip>
        </template>

        <!-- Fecha creacion -->
        <template #item.created_at="{ item }">
          <span class="text-body-2">{{ formatDate(item.created_at) }}</span>
        </template>

        <!-- Acciones -->
        <template #item.actions="{ item }">
          <div class="d-flex justify-center ga-1">
            <v-tooltip location="top" text="Editar">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  color="warning"
                  icon="mdi-pencil-outline"
                  rounded="lg"
                  size="small"
                  variant="tonal"
                  @click="openEditDialog(item)"
                />
              </template>
            </v-tooltip>
            <v-tooltip location="top" text="Gestionar Roles">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  color="info"
                  icon="mdi-shield-account-outline"
                  rounded="lg"
                  size="small"
                  variant="tonal"
                  @click="openRolesDialog(item)"
                />
              </template>
            </v-tooltip>
            <v-tooltip location="top" :text="item.estado ? 'Desactivar' : 'Activar'">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  :color="item.estado ? 'grey' : 'success'"
                  :icon="item.estado ? 'mdi-account-off-outline' : 'mdi-account-check-outline'"
                  rounded="lg"
                  size="small"
                  variant="tonal"
                  @click="toggleUserEstado(item)"
                />
              </template>
            </v-tooltip>
            <v-tooltip location="top" text="Eliminar">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  color="error"
                  icon="mdi-delete-outline"
                  rounded="lg"
                  size="small"
                  variant="tonal"
                  @click="confirmDelete(item)"
                />
              </template>
            </v-tooltip>
          </div>
        </template>

        <!-- No data -->
        <template #no-data>
          <div class="text-center py-10">
            <v-avatar class="mb-4" color="grey-lighten-3" size="80">
              <v-icon color="grey-lighten-1" size="48">mdi-account-off-outline</v-icon>
            </v-avatar>
            <h3 class="text-h6 font-weight-medium text-grey-darken-1 mb-1">No se encontraron usuarios</h3>
            <p class="text-body-2 text-medium-emphasis">Intenta ajustar los filtros de busqueda</p>
          </div>
        </template>

        <!-- Loading -->
        <template #loading>
          <v-skeleton-loader type="table-row@5" />
        </template>
      </v-data-table-server>
    </v-card>

    <!-- Dialog Crear/Editar Usuario -->
    <v-dialog v-model="userDialog" max-width="550" persistent>
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-2">
          <div class="d-flex align-center">
            <v-avatar class="mr-3" color="primary" size="42">
              <v-icon :icon="editingUser ? 'mdi-account-edit' : 'mdi-account-plus'" size="24" />
            </v-avatar>
            <div>
              <h3 class="text-h6 font-weight-bold">{{ editingUser ? 'Editar Usuario' : 'Nuevo Usuario' }}</h3>
              <p class="text-caption text-medium-emphasis mb-0">
                {{ editingUser ? 'Modifica los datos del usuario' : 'Ingresa los datos del nuevo usuario' }}
              </p>
            </div>
          </div>
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-5">
          <v-form ref="userFormRef" @submit.prevent="saveUser">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="userForm.name"
                  color="primary"
                  density="comfortable"
                  label="Nombre completo"
                  prepend-inner-icon="mdi-account-outline"
                  :rules="[v => !!v || 'El nombre es requerido']"
                  rounded="lg"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="userForm.email"
                  color="primary"
                  density="comfortable"
                  label="Correo electronico"
                  prepend-inner-icon="mdi-email-outline"
                  :rules="[
                    v => !!v || 'El correo es requerido',
                    v => /.+@.+\..+/.test(v) || 'Correo invalido'
                  ]"
                  rounded="lg"
                  type="email"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="userForm.password"
                  :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  color="primary"
                  density="comfortable"
                  :hint="editingUser ? 'Dejar vacio para mantener la contrasena actual' : ''"
                  label="Contrasena"
                  persistent-hint
                  prepend-inner-icon="mdi-lock-outline"
                  :rules="editingUser ? [] : [v => !!v || 'La contrasena es requerida']"
                  rounded="lg"
                  :type="showPassword ? 'text' : 'password'"
                  variant="outlined"
                  @click:append-inner="showPassword = !showPassword"
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="userForm.password_confirmation"
                  :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  color="primary"
                  density="comfortable"
                  label="Confirmar contrasena"
                  prepend-inner-icon="mdi-lock-check-outline"
                  :rules="userForm.password ? [v => v === userForm.password || 'Las contrasenas no coinciden'] : []"
                  rounded="lg"
                  :type="showPassword ? 'text' : 'password'"
                  variant="outlined"
                  @click:append-inner="showPassword = !showPassword"
                />
              </v-col>

              <v-col v-if="!editingUser" cols="12">
                <v-select
                  v-model="userForm.role"
                  color="primary"
                  density="comfortable"
                  item-title="name"
                  item-value="name"
                  :items="store.roles"
                  label="Rol inicial"
                  prepend-inner-icon="mdi-shield-account-outline"
                  rounded="lg"
                  variant="outlined"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn
            class="text-none"
            color="grey-darken-1"
            rounded="lg"
            variant="tonal"
            @click="closeUserDialog"
          >
            Cancelar
          </v-btn>
          <v-btn
            class="text-none font-weight-bold"
            color="primary"
            :loading="store.saving"
            rounded="lg"
            variant="flat"
            @click="saveUser"
          >
            <v-icon start>mdi-content-save-outline</v-icon>
            {{ editingUser ? 'Guardar Cambios' : 'Crear Usuario' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Gestionar Roles -->
    <v-dialog v-model="rolesDialog" max-width="500" persistent>
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-2">
          <div class="d-flex align-center">
            <v-avatar class="mr-3" color="info" size="42">
              <v-icon icon="mdi-shield-account" size="24" />
            </v-avatar>
            <div>
              <h3 class="text-h6 font-weight-bold">Gestionar Roles</h3>
              <p class="text-caption text-medium-emphasis mb-0">
                {{ selectedUser?.name }}
              </p>
            </div>
          </div>
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-5">
          <v-alert
            class="mb-4"
            density="compact"
            rounded="lg"
            type="info"
            variant="tonal"
          >
            Selecciona los roles que deseas asignar al usuario
          </v-alert>

          <v-checkbox
            v-for="role in store.roles"
            :key="role.name"
            v-model="selectedRoles"
            color="primary"
            density="comfortable"
            hide-details
            :label="role.name"
            :value="role.name"
          >
            <template #label>
              <div class="d-flex align-center justify-space-between w-100">
                <span class="text-capitalize font-weight-medium">{{ role.name }}</span>
                <v-chip class="ml-2" color="grey" size="x-small" variant="tonal">
                  {{ role.permissions_count || 0 }} permisos
                </v-chip>
              </div>
            </template>
          </v-checkbox>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn
            class="text-none"
            color="grey-darken-1"
            rounded="lg"
            variant="tonal"
            @click="rolesDialog = false"
          >
            Cancelar
          </v-btn>
          <v-btn
            class="text-none font-weight-bold"
            color="info"
            :loading="store.saving"
            rounded="lg"
            variant="flat"
            @click="saveUserRoles"
          >
            <v-icon start>mdi-content-save-outline</v-icon>
            Guardar Roles
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Confirmar Eliminacion -->
    <v-dialog v-model="deleteDialog" max-width="420" persistent>
      <v-card rounded="xl">
        <v-card-text class="text-center pa-6">
          <v-avatar class="mb-4" color="error" size="72" variant="tonal">
            <v-icon color="error" icon="mdi-alert-circle-outline" size="40" />
          </v-avatar>
          <h3 class="text-h6 font-weight-bold mb-2">Confirmar Eliminacion</h3>
          <p class="text-body-1 text-medium-emphasis mb-0">
            Esta seguro de eliminar al usuario
            <strong class="text-grey-darken-3">{{ itemToDelete?.name }}</strong>?
          </p>
          <v-alert
            class="mt-4 text-left"
            density="compact"
            rounded="lg"
            type="warning"
            variant="tonal"
          >
            <span class="text-caption">Esta accion no se puede deshacer.</span>
          </v-alert>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn
            class="text-none"
            color="grey-darken-1"
            rounded="lg"
            variant="tonal"
            @click="deleteDialog = false"
          >
            Cancelar
          </v-btn>
          <v-btn
            class="text-none font-weight-bold"
            color="error"
            :loading="store.saving"
            rounded="lg"
            variant="flat"
            @click="deleteUser"
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
  import { format } from 'date-fns'
  import { es } from 'date-fns/locale'
  import { onMounted, reactive, ref } from 'vue'
  import { useUsersStore } from '@/stores/users'

  const store = useUsersStore()

  // Estados
  const estadosUsuario = [
    { text: 'Activo', value: true },
    { text: 'Inactivo', value: false },
  ]

  // Headers de la tabla
  const headers = [
    { title: 'Usuario', key: 'name', sortable: true },
    { title: 'Roles', key: 'roles', sortable: false },
    { title: 'Estado', key: 'estado', sortable: true, align: 'center' },
    { title: 'Fecha Registro', key: 'created_at', sortable: true },
    { title: 'Acciones', key: 'actions', sortable: false, align: 'center', width: '180px' },
  ]

  // Busqueda con debounce
  const searchQuery = ref('')
  let searchTimeout = null

  function debouncedSearch(value) {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      store.setFilters({ search: value })
      loadData(true)
    }, 400)
  }

  // Dialog de usuario
  const userDialog = ref(false)
  const userFormRef = ref(null)
  const editingUser = ref(null)
  const showPassword = ref(false)
  const userForm = reactive({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: null,
  })

  // Dialog de roles
  const rolesDialog = ref(false)
  const selectedUser = ref(null)
  const selectedRoles = ref([])

  // Dialog de eliminacion
  const deleteDialog = ref(false)
  const itemToDelete = ref(null)

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

  // Cargar datos
  async function loadData(resetPage = false) {
    try {
      await store.fetchAll(resetPage)
    } catch {
      showSnackbar('Error al cargar datos', 'error')
    }
  }

  // Opciones de tabla
  function onOptionsUpdate({ page, itemsPerPage }) {
    store.pagination.page = page
    store.pagination.perPage = itemsPerPage
    loadData()
  }

  // Resetear filtros
  function resetFilters() {
    searchQuery.value = ''
    store.resetFilters()
    loadData(true)
  }

  // Obtener iniciales
  function getInitials(name) {
    if (!name) return '?'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Formatear fecha
  function formatDate(date) {
    if (!date) return '-'
    return format(new Date(date), 'dd MMM yyyy', { locale: es })
  }

  // Abrir dialog crear
  function openCreateDialog() {
    editingUser.value = null
    userForm.name = ''
    userForm.email = ''
    userForm.password = ''
    userForm.password_confirmation = ''
    userForm.role = null
    showPassword.value = false
    userDialog.value = true
  }

  // Abrir dialog editar
  function openEditDialog(user) {
    editingUser.value = user
    userForm.name = user.name
    userForm.email = user.email
    userForm.password = ''
    userForm.password_confirmation = ''
    userForm.role = null
    showPassword.value = false
    userDialog.value = true
  }

  // Cerrar dialog usuario
  function closeUserDialog() {
    userDialog.value = false
    editingUser.value = null
  }

  // Guardar usuario
  async function saveUser() {
    const { valid } = await userFormRef.value.validate()
    if (!valid) return

    try {
      const data = {
        name: userForm.name,
        email: userForm.email,
      }

      if (userForm.password) {
        data.password = userForm.password
        data.password_confirmation = userForm.password_confirmation
      }

      if (!editingUser.value && userForm.role) {
        data.role = userForm.role
      }

      if (editingUser.value) {
        await store.update(editingUser.value.id, data)
        showSnackbar('Usuario actualizado correctamente')
      } else {
        await store.create(data)
        showSnackbar('Usuario creado correctamente')
      }

      closeUserDialog()
      loadData()
    } catch (err) {
      showSnackbar(err.apiMessage || 'Error al guardar usuario', 'error')
    }
  }

  // Abrir dialog roles
  function openRolesDialog(user) {
    selectedUser.value = user
    // Extraer nombres de roles (pueden venir como objetos o strings)
    selectedRoles.value = (user.roles || []).map(r => r.name || r)
    rolesDialog.value = true
  }

  // Guardar roles de usuario
  async function saveUserRoles() {
    try {
      await store.syncRoles(selectedUser.value.id, selectedRoles.value)
      showSnackbar('Roles actualizados correctamente')
      rolesDialog.value = false
      loadData()
    } catch (err) {
      showSnackbar(err.apiMessage || 'Error al actualizar roles', 'error')
    }
  }

  // Toggle estado usuario
  async function toggleUserEstado(user) {
    try {
      await store.toggleEstado(user.id)
      showSnackbar(`Usuario ${user.estado ? 'desactivado' : 'activado'} correctamente`)
      loadData()
    } catch (err) {
      showSnackbar(err.apiMessage || 'Error al cambiar estado', 'error')
    }
  }

  // Confirmar eliminacion
  function confirmDelete(item) {
    itemToDelete.value = item
    deleteDialog.value = true
  }

  // Eliminar usuario
  async function deleteUser() {
    if (!itemToDelete.value) return

    try {
      await store.remove(itemToDelete.value.id)
      showSnackbar('Usuario eliminado correctamente')
      deleteDialog.value = false
      itemToDelete.value = null
    } catch (err) {
      showSnackbar(err.apiMessage || 'Error al eliminar usuario', 'error')
    }
  }

  // Cargar datos al montar
  onMounted(async () => {
    await store.fetchRoles()
    loadData()
  })
</script>
