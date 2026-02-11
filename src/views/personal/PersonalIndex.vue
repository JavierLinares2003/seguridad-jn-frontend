<template>
  <v-container class="pa-6" fluid>
    <!-- Header -->
    <v-row align="center" class="mb-6">
      <v-col>
        <div class="d-flex align-center">
          <v-avatar class="mr-4" color="primary" rounded="lg" size="48">
            <v-icon icon="mdi-account-group" size="28" />
          </v-avatar>
          <div>
            <h1 class="text-h4 font-weight-bold text-grey-darken-3">Gestion de Personal</h1>
            <p class="text-body-2 text-medium-emphasis mb-0">Administra el personal de tu organizacion</p>
          </div>
        </div>
      </v-col>
      <v-col cols="auto">
        <v-btn
          v-can="'create-personal'"
          class="text-none font-weight-bold"
          color="primary"
          elevation="2"
          rounded="lg"
          size="large"
          :to="{ name: 'personal-create' }"
        >
          <v-icon start>mdi-plus</v-icon>
          Nuevo Personal
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
              placeholder="Nombre, DPI, Email..."
              prepend-inner-icon="mdi-magnify"
              rounded="lg"
              variant="outlined"
              @update:model-value="debouncedSearch"
            />
          </v-col>

          <v-col cols="12" md="3">
            <v-select
              v-model="store.filters.departamento_id"
              bg-color="grey-lighten-5"
              clearable
              color="primary"
              density="comfortable"
              hide-details
              item-title="nombre"
              item-value="id"
              :items="departamentos"
              label="Departamento"
              prepend-inner-icon="mdi-domain"
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
              :items="estadosPersonal"
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
        <!-- Foto -->
        <template #item.foto="{ item }">
          <v-avatar class="elevation-2" rounded="lg" size="44">
            <v-img
              v-if="item.foto_url"
              :alt="item.nombre_completo"
              cover
              :src="item.foto_url"
            />
            <v-icon v-else color="grey-lighten-1" size="24">mdi-account</v-icon>
          </v-avatar>
        </template>

        <!-- Nombre completo -->
        <template #item.nombre_completo="{ item }">
          <div class="py-2">
            <p class="text-body-1 font-weight-medium mb-0">{{ item.apellidos }}, {{ item.nombres }}</p>
            <p class="text-caption text-medium-emphasis mb-0">
              <v-icon class="mr-1" icon="mdi-card-account-details-outline" size="12" />
              {{ formatDPI(item.dpi) }}
            </p>
          </div>
        </template>

        <!-- Email -->
        <template #item.email="{ item }">
          <span class="text-body-2">{{ item.email }}</span>
        </template>

        <!-- Telefono -->
        <template #item.telefono="{ item }">
          <span class="text-body-2">{{ formatPhone(item.telefono) }}</span>
        </template>

        <!-- Estado -->
        <template #item.estado="{ item }">
          <v-chip
            class="font-weight-medium text-capitalize"
            :color="getEstadoColor(item.estado)"
            label
            size="small"
            variant="flat"
          >
            <v-icon :icon="getEstadoIcon(item.estado)" size="14" start />
            {{ item.estado }}
          </v-chip>
        </template>

        <!-- Departamento -->
        <template #item.departamento="{ item }">
          <v-chip
            v-if="item.departamento?.nombre"
            color="primary"
            label
            size="small"
            variant="tonal"
          >
            {{ item.departamento.nombre }}
          </v-chip>
          <span v-else class="text-medium-emphasis">-</span>
        </template>

        <!-- Acciones -->
        <template #item.actions="{ item }">
          <div class="d-flex justify-center ga-1">
            <v-tooltip location="top" text="Ver detalle">
              <template #activator="{ props }">
                <v-btn
                  v-can="'view-personal'"
                  v-bind="props"
                  color="info"
                  icon="mdi-eye-outline"
                  rounded="lg"
                  size="small"
                  :to="{ name: 'personal-detalle', params: { id: item.id } }"
                  variant="tonal"
                />
              </template>
            </v-tooltip>
            <v-tooltip location="top" text="Editar">
              <template #activator="{ props }">
                <v-btn
                  v-can="'edit-personal'"
                  v-bind="props"
                  color="warning"
                  icon="mdi-pencil-outline"
                  rounded="lg"
                  size="small"
                  :to="{ name: 'personal-edit', params: { id: item.id } }"
                  variant="tonal"
                />
              </template>
            </v-tooltip>
            <v-tooltip location="top" text="Eliminar">
              <template #activator="{ props }">
                <v-btn
                  v-can="'delete-personal'"
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
            <h3 class="text-h6 font-weight-medium text-grey-darken-1 mb-1">No se encontro personal</h3>
            <p class="text-body-2 text-medium-emphasis">Intenta ajustar los filtros de busqueda</p>
          </div>
        </template>

        <!-- Loading -->
        <template #loading>
          <v-skeleton-loader type="table-row@5" />
        </template>
      </v-data-table-server>
    </v-card>

    <!-- Dialog Confirmar Eliminacion -->
    <v-dialog v-model="deleteDialog" max-width="420" persistent>
      <v-card rounded="xl">
        <v-card-text class="text-center pa-6">
          <v-avatar class="mb-4" color="error" size="72" variant="tonal">
            <v-icon color="error" icon="mdi-alert-circle-outline" size="40" />
          </v-avatar>
          <h3 class="text-h6 font-weight-bold mb-2">Confirmar Eliminacion</h3>
          <p class="text-body-1 text-medium-emphasis mb-0">
            Esta seguro de eliminar a
            <strong class="text-grey-darken-3">{{ itemToDelete?.nombres }} {{ itemToDelete?.apellidos }}</strong>?
          </p>
          <v-alert
            class="mt-4 text-left"
            density="compact"
            rounded="lg"
            type="info"
            variant="tonal"
          >
            <span class="text-caption">Esta accion se puede revertir desde el panel de administracion.</span>
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
            @click="deleteItem"
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
  import { onMounted, reactive, ref } from 'vue'
  import { useCatalogos } from '@/composables/useCatalogos'
  import { CATALOGOS } from '@/services/catalogoService'
  import { usePersonalStore } from '@/stores/personal'
  import { formatDPI } from '@/utils/dpiFormatter'
  import { formatPhone } from '@/utils/phoneFormatter'

  const store = usePersonalStore()

  // Catálogos
  const { getCatalogo } = useCatalogos([CATALOGOS.DEPARTAMENTOS])
  const departamentos = getCatalogo(CATALOGOS.DEPARTAMENTOS)

  // Estados
  const estadosPersonal = [
    { text: 'Activo', value: 'activo' },
    { text: 'Inactivo', value: 'inactivo' },
    { text: 'Suspendido', value: 'suspendido' },
  ]

  // Headers de la tabla
  const headers = [
    { title: '', key: 'foto', sortable: false, width: '60px' },
    { title: 'Nombre', key: 'nombre_completo', sortable: true },
    { title: 'Email', key: 'email', sortable: true },
    { title: 'Teléfono', key: 'telefono', sortable: false },
    { title: 'Departamento', key: 'departamento', sortable: false },
    { title: 'Estado', key: 'estado', sortable: true, align: 'center' },
    { title: 'Acciones', key: 'actions', sortable: false, align: 'center', width: '150px' },
  ]

  // Búsqueda con debounce
  const searchQuery = ref('')
  let searchTimeout = null

  function debouncedSearch (value) {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      store.setFilters({ buscar: value })
      loadData(true)
    }, 400)
  }

  // Dialog de eliminación
  const deleteDialog = ref(false)
  const itemToDelete = ref(null)

  // Snackbar
  const snackbar = reactive({
    show: false,
    text: '',
    color: 'success',
  })

  function showSnackbar (text, color = 'success') {
    snackbar.text = text
    snackbar.color = color
    snackbar.show = true
  }

  // Cargar datos
  async function loadData (resetPage = false) {
    try {
      await store.fetchAll(resetPage)
    } catch {
      showSnackbar('Error al cargar datos', 'error')
    }
  }

  // Opciones de tabla
  function onOptionsUpdate ({ page, itemsPerPage, sortBy }) {
    store.pagination.page = page
    store.pagination.perPage = itemsPerPage

    if (sortBy.length > 0) {
      store.setFilters({
        sort_by: sortBy[0].key,
        sort_order: sortBy[0].order,
      })
    }

    loadData()
  }

  // Resetear filtros
  function resetFilters () {
    searchQuery.value = ''
    store.resetFilters()
    loadData(true)
  }

  // Color del estado
  function getEstadoColor (estado) {
    const colors = {
      activo: 'success',
      inactivo: 'grey',
      suspendido: 'warning',
    }
    return colors[estado] || 'grey'
  }

  // Icono del estado
  function getEstadoIcon (estado) {
    const icons = {
      activo: 'mdi-check-circle-outline',
      inactivo: 'mdi-close-circle-outline',
      suspendido: 'mdi-pause-circle-outline',
    }
    return icons[estado] || 'mdi-help-circle-outline'
  }

  // Confirmar eliminación
  function confirmDelete (item) {
    itemToDelete.value = item
    deleteDialog.value = true
  }

  // Eliminar item
  async function deleteItem () {
    if (!itemToDelete.value) return

    try {
      await store.remove(itemToDelete.value.id)
      showSnackbar('Personal eliminado correctamente')
      deleteDialog.value = false
      itemToDelete.value = null
    } catch {
      showSnackbar('Error al eliminar personal', 'error')
    }
  }

  // Cargar datos al montar
  onMounted(() => {
    loadData()
  })
</script>
