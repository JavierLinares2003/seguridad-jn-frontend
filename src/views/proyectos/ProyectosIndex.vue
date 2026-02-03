<template>
  <v-container class="pa-6" fluid>
    <!-- Header -->
    <v-row align="center" class="mb-6">
      <v-col>
        <div class="d-flex align-center">
          <v-avatar class="mr-4" color="primary" rounded="lg" size="48">
            <v-icon icon="mdi-briefcase-outline" size="28" />
          </v-avatar>
          <div>
            <h1 class="text-h4 font-weight-bold text-grey-darken-3">Gestión de Proyectos</h1>
            <p class="text-body-2 text-medium-emphasis mb-0">Administra los proyectos de la empresa</p>
          </div>
        </div>
      </v-col>
      <v-col cols="auto">
        <v-btn
          v-if="canCreate"
          class="text-none font-weight-bold"
          color="primary"
          elevation="2"
          rounded="lg"
          size="large"
          :to="{ name: 'proyectos-create' }"
        >
          <v-icon start>mdi-plus</v-icon>
          Nuevo Proyecto
        </v-btn>
      </v-col>
    </v-row>

    <!-- Filtros -->
    <v-card class="mb-6" elevation="2" rounded="xl">
      <v-card-text class="pa-5">
        <div class="d-flex align-center mb-4">
          <v-icon class="mr-2" color="primary" icon="mdi-filter-outline" />
          <span class="text-subtitle-1 font-weight-medium">Filtros de búsqueda</span>
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
              placeholder="Nombre, Correlativo, Cliente..."
              prepend-inner-icon="mdi-magnify"
              rounded="lg"
              variant="outlined"
              @update:model-value="debouncedSearch"
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
              :items="estadosProyecto"
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
        <!-- Correlativo -->
        <template #item.correlativo="{ item }">
          <v-chip
            class="font-weight-bold"
            color="primary"
            label
            size="small"
            variant="tonal"
          >
            {{ item.correlativo }}
          </v-chip>
        </template>

        <!-- Nombre -->
        <template #item.nombre_proyecto="{ item }">
          <div class="py-2">
            <p class="text-body-1 font-weight-medium mb-0">{{ item.nombre_proyecto }}</p>
            <p class="text-caption text-medium-emphasis mb-0">
              <v-icon class="mr-1" icon="mdi-domain" size="12" />
              {{ item.empresa_cliente }}
            </p>
          </div>
        </template>

        <!-- Tipo -->
        <template #item.tipo_proyecto="{ item }">
          <span class="text-body-2">{{ item.tipo_proyecto?.nombre || '-' }}</span>
        </template>

        <!-- Fechas -->
        <template #item.fechas="{ item }">
          <div class="py-1">
            <div v-if="item.fecha_inicio_estimada" class="text-caption">
              <strong>Inicio:</strong> {{ formatDate(item.fecha_inicio_estimada) }}
            </div>
            <div v-if="item.fecha_fin_estimada" class="text-caption text-medium-emphasis">
              <strong>Fin:</strong> {{ formatDate(item.fecha_fin_estimada) }}
            </div>
          </div>
        </template>

        <!-- Estado -->
        <template #item.estado_proyecto="{ item }">
          <v-chip
            class="font-weight-medium text-capitalize"
            :color="getEstadoColor(item.estado_proyecto)"
            label
            size="small"
            variant="flat"
          >
            <v-icon :icon="getEstadoIcon(item.estado_proyecto)" size="14" start />
            {{ item.estado_proyecto }}
          </v-chip>
        </template>

        <!-- Acciones -->
        <template #item.actions="{ item }">
          <div class="d-flex justify-center ga-1">
            <v-tooltip location="top" text="Ver detalle">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  color="info"
                  icon="mdi-eye-outline"
                  rounded="lg"
                  size="small"
                  :to="{ name: 'proyectos-detalle', params: { id: item.id } }"
                  variant="tonal"
                />
              </template>
            </v-tooltip>
            <v-tooltip v-if="canEdit" location="top" text="Editar">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  color="warning"
                  icon="mdi-pencil-outline"
                  rounded="lg"
                  size="small"
                  :to="{ name: 'proyectos-edit', params: { id: item.id } }"
                  variant="tonal"
                />
              </template>
            </v-tooltip>
            <v-tooltip v-if="canDelete" location="top" text="Eliminar">
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
              <v-icon color="grey-lighten-1" size="48">mdi-briefcase-off-outline</v-icon>
            </v-avatar>
            <h3 class="text-h6 font-weight-medium text-grey-darken-1 mb-1">No se encontraron proyectos</h3>
            <p class="text-body-2 text-medium-emphasis">Intenta ajustar los filtros de búsqueda</p>
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
          <h3 class="text-h6 font-weight-bold mb-2">Confirmar Eliminación</h3>
          <p class="text-body-1 text-medium-emphasis mb-0">
            ¿Está seguro de eliminar el proyecto
            <strong class="text-grey-darken-3">{{ itemToDelete?.nombre_proyecto }}</strong>?
          </p>
          <v-alert
            class="mt-4 text-left"
            density="compact"
            rounded="lg"
            type="info"
            variant="tonal"
          >
            <span class="text-caption">Esta acción moverá el proyecto a la papelera (Soft Delete).</span>
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
  import { format } from 'date-fns'
  import { es } from 'date-fns/locale'
  import { computed, onMounted, reactive, ref } from 'vue'
  import { useAuthStore } from '@/stores/auth'
  import { useProyectosStore } from '@/stores/proyectos'

  const store = useProyectosStore()
  const authStore = useAuthStore()

  const canCreate = computed(() => authStore.hasPermission('create-proyectos'))
  const canEdit = computed(() => authStore.hasPermission('edit-proyectos'))
  const canDelete = computed(() => authStore.hasPermission('delete-proyectos'))

  // Estados
  const estadosProyecto = [
    { text: 'Planificación', value: 'planificacion' },
    { text: 'Activo', value: 'activo' },
    { text: 'Suspendido', value: 'suspendido' },
    { text: 'Finalizado', value: 'finalizado' },
  ]

  // Headers de la tabla
  const headers = [
    { title: 'Correlativo', key: 'correlativo', sortable: true, width: '150px' },
    { title: 'Proyecto', key: 'nombre_proyecto', sortable: true },
    { title: 'Tipo', key: 'tipo_proyecto', sortable: false },
    { title: 'Fechas Estimadas', key: 'fechas', sortable: false },
    { title: 'Estado', key: 'estado_proyecto', sortable: true, align: 'center' },
    { title: 'Acciones', key: 'actions', sortable: false, align: 'center', width: '150px' },
  ]

  // Búsqueda con debounce
  const searchQuery = ref('')
  let searchTimeout = null

  function debouncedSearch (value) {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      store.setFilters({ search: value })
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
      showSnackbar('Error al cargar proyectos', 'error')
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
      planificacion: 'info',
      activo: 'success',
      suspendido: 'warning',
      finalizado: 'grey-darken-1',
    }
    return colors[estado] || 'grey'
  }

  // Icono del estado
  function getEstadoIcon (estado) {
    const icons = {
      planificacion: 'mdi-clipboard-text-clock-outline',
      activo: 'mdi-play-circle-outline',
      suspendido: 'mdi-pause-circle-outline',
      finalizado: 'mdi-check-circle-outline',
    }
    return icons[estado] || 'mdi-help-circle-outline'
  }

  // Formatear Fecha
  function formatDate (date) {
    if (!date) return '-'
    return format(new Date(date), 'dd MMM yyyy', { locale: es })
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
      showSnackbar('Proyecto eliminado correctamente')
      deleteDialog.value = false
      itemToDelete.value = null
    } catch {
      showSnackbar('Error al eliminar proyecto', 'error')
    }
  }

  // Cargar datos al montar
  onMounted(() => {
    loadData()
  })
</script>
