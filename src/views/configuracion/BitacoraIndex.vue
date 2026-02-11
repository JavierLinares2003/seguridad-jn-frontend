<template>
  <v-container class="pa-6" fluid>
    <!-- Header -->
    <v-row align="center" class="mb-6">
      <v-col>
        <div class="d-flex align-center">
          <v-avatar class="mr-4" color="deep-purple" rounded="lg" size="48">
            <v-icon icon="mdi-history" size="28" />
          </v-avatar>
          <div>
            <h1 class="text-h4 font-weight-bold text-grey-darken-3">Bitacora del Sistema</h1>
            <p class="text-body-2 text-medium-emphasis mb-0">Registro de actividades y cambios en el sistema</p>
          </div>
        </div>
      </v-col>
      <v-col cols="auto">
        <v-btn
          class="text-none"
          color="deep-purple"
          rounded="lg"
          size="large"
          variant="tonal"
          @click="showEstadisticas = true"
        >
          <v-icon start>mdi-chart-bar</v-icon>
          Estadisticas
        </v-btn>
      </v-col>
    </v-row>

    <!-- Filtros -->
    <v-card class="mb-6" elevation="2" rounded="xl">
      <v-card-text class="pa-5">
        <div class="d-flex align-center mb-4">
          <v-icon class="mr-2" color="deep-purple" icon="mdi-filter-outline" />
          <span class="text-subtitle-1 font-weight-medium">Filtros de busqueda</span>
          <v-spacer />
          <v-btn
            class="text-none"
            color="grey-darken-1"
            rounded="lg"
            size="small"
            variant="text"
            @click="resetFilters"
          >
            <v-icon start>mdi-filter-off-outline</v-icon>
            Limpiar
          </v-btn>
        </div>

        <v-row>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="searchQuery"
              bg-color="grey-lighten-5"
              clearable
              color="deep-purple"
              density="comfortable"
              hide-details
              label="Buscar"
              placeholder="Descripcion, IP..."
              prepend-inner-icon="mdi-magnify"
              rounded="lg"
              variant="outlined"
              @update:model-value="debouncedSearch"
            />
          </v-col>

          <v-col cols="12" md="2">
            <v-select
              v-model="store.filters.modulo"
              bg-color="grey-lighten-5"
              clearable
              color="deep-purple"
              density="comfortable"
              hide-details
              item-title="text"
              item-value="value"
              :items="modulos"
              label="Modulo"
              prepend-inner-icon="mdi-view-module"
              rounded="lg"
              variant="outlined"
              @update:model-value="loadData(true)"
            />
          </v-col>

          <v-col cols="12" md="2">
            <v-select
              v-model="store.filters.accion"
              bg-color="grey-lighten-5"
              clearable
              color="deep-purple"
              density="comfortable"
              hide-details
              item-title="text"
              item-value="value"
              :items="acciones"
              label="Accion"
              prepend-inner-icon="mdi-gesture-tap"
              rounded="lg"
              variant="outlined"
              @update:model-value="loadData(true)"
            />
          </v-col>

          <v-col cols="12" md="2">
            <v-text-field
              v-model="store.filters.fecha_desde"
              bg-color="grey-lighten-5"
              clearable
              color="deep-purple"
              density="comfortable"
              hide-details
              label="Desde"
              prepend-inner-icon="mdi-calendar-start"
              rounded="lg"
              type="date"
              variant="outlined"
              @update:model-value="loadData(true)"
            />
          </v-col>

          <v-col cols="12" md="2">
            <v-text-field
              v-model="store.filters.fecha_hasta"
              bg-color="grey-lighten-5"
              clearable
              color="deep-purple"
              density="comfortable"
              hide-details
              label="Hasta"
              prepend-inner-icon="mdi-calendar-end"
              rounded="lg"
              type="date"
              variant="outlined"
              @update:model-value="loadData(true)"
            />
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
        <!-- Fecha -->
        <template #item.fecha="{ item }">
          <div class="py-2">
            <p class="text-body-2 font-weight-medium mb-0">{{ formatDate(item.fecha) }}</p>
            <p class="text-caption text-medium-emphasis mb-0">{{ formatTime(item.fecha) }}</p>
          </div>
        </template>

        <!-- Usuario -->
        <template #item.usuario="{ item }">
          <div v-if="item.usuario" class="d-flex align-center">
            <v-avatar class="mr-2" color="primary" size="32">
              <span class="text-caption font-weight-bold text-white">
                {{ getInitials(item.usuario.name) }}
              </span>
            </v-avatar>
            <span class="text-body-2">{{ item.usuario.name }}</span>
          </div>
          <span v-else class="text-medium-emphasis">Sistema</span>
        </template>

        <!-- Accion -->
        <template #item.accion="{ item }">
          <v-chip
            class="font-weight-medium text-capitalize"
            :color="getAccionColor(item.accion)"
            label
            size="small"
            variant="flat"
          >
            <v-icon :icon="getAccionIcon(item.accion)" size="14" start />
            {{ getAccionText(item.accion) }}
          </v-chip>
        </template>

        <!-- Modulo -->
        <template #item.modulo="{ item }">
          <v-chip
            class="text-capitalize"
            :color="getModuloColor(item.modulo)"
            label
            size="small"
            variant="tonal"
          >
            {{ item.modulo }}
          </v-chip>
        </template>

        <!-- Descripcion -->
        <template #item.descripcion="{ item }">
          <div class="py-2" style="max-width: 300px;">
            <p class="text-body-2 mb-0 text-truncate">{{ item.descripcion }}</p>
            <p v-if="item.modelo" class="text-caption text-medium-emphasis mb-0">
              {{ item.modelo }} #{{ item.modelo_id }}
            </p>
          </div>
        </template>

        <!-- IP -->
        <template #item.ip_address="{ item }">
          <span class="text-body-2 font-mono">{{ item.ip_address || '-' }}</span>
        </template>

        <!-- Acciones -->
        <template #item.actions="{ item }">
          <v-tooltip location="top" text="Ver detalle">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                color="deep-purple"
                icon="mdi-eye-outline"
                rounded="lg"
                size="small"
                variant="tonal"
                @click="openDetail(item)"
              />
            </template>
          </v-tooltip>
        </template>

        <!-- No data -->
        <template #no-data>
          <div class="text-center py-10">
            <v-avatar class="mb-4" color="grey-lighten-3" size="80">
              <v-icon color="grey-lighten-1" size="48">mdi-history</v-icon>
            </v-avatar>
            <h3 class="text-h6 font-weight-medium text-grey-darken-1 mb-1">No hay registros</h3>
            <p class="text-body-2 text-medium-emphasis">No se encontraron actividades con los filtros seleccionados</p>
          </div>
        </template>

        <!-- Loading -->
        <template #loading>
          <v-skeleton-loader type="table-row@5" />
        </template>
      </v-data-table-server>
    </v-card>

    <!-- Dialog Detalle -->
    <v-dialog v-model="detailDialog" max-width="700" scrollable>
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-2">
          <div class="d-flex align-center">
            <v-avatar class="mr-3" :color="getAccionColor(selectedItem?.accion)" size="42">
              <v-icon :icon="getAccionIcon(selectedItem?.accion)" size="24" />
            </v-avatar>
            <div>
              <h3 class="text-h6 font-weight-bold">Detalle de Actividad</h3>
              <p class="text-caption text-medium-emphasis mb-0">
                {{ formatDateTime(selectedItem?.fecha) }}
              </p>
            </div>
          </div>
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-5" style="max-height: 500px;">
          <!-- Info basica -->
          <v-row class="mb-4">
            <v-col cols="6">
              <p class="text-caption text-medium-emphasis mb-1">Usuario</p>
              <p class="text-body-2 font-weight-medium mb-0">
                {{ selectedItem?.usuario?.name || 'Sistema' }}
              </p>
            </v-col>
            <v-col cols="6">
              <p class="text-caption text-medium-emphasis mb-1">Accion</p>
              <v-chip
                class="text-capitalize"
                :color="getAccionColor(selectedItem?.accion)"
                label
                size="small"
                variant="flat"
              >
                {{ getAccionText(selectedItem?.accion) }}
              </v-chip>
            </v-col>
            <v-col cols="6">
              <p class="text-caption text-medium-emphasis mb-1">Modulo</p>
              <p class="text-body-2 font-weight-medium text-capitalize mb-0">
                {{ selectedItem?.modulo }}
              </p>
            </v-col>
            <v-col cols="6">
              <p class="text-caption text-medium-emphasis mb-1">Modelo</p>
              <p class="text-body-2 font-weight-medium mb-0">
                {{ selectedItem?.modelo }} #{{ selectedItem?.modelo_id }}
              </p>
            </v-col>
            <v-col cols="6">
              <p class="text-caption text-medium-emphasis mb-1">Direccion IP</p>
              <p class="text-body-2 font-mono mb-0">{{ selectedItem?.ip_address || 'N/A' }}</p>
            </v-col>
            <v-col cols="6">
              <p class="text-caption text-medium-emphasis mb-1">Descripcion</p>
              <p class="text-body-2 mb-0">{{ selectedItem?.descripcion }}</p>
            </v-col>
          </v-row>

          <v-divider class="mb-4" />

          <!-- Cambios detallados -->
          <div v-if="selectedItem?.cambios && hasCambios" class="mt-2">
            <div class="d-flex align-center mb-3">
              <v-icon class="mr-2" color="warning" icon="mdi-delta" size="20" />
              <p class="text-subtitle-2 font-weight-bold mb-0">Cambios realizados</p>
            </div>

            <v-table class="rounded-lg" density="compact">
              <thead>
                <tr class="bg-grey-lighten-4">
                  <th class="text-left" style="width: 30%;">Campo</th>
                  <th class="text-left" style="width: 35%;">Valor Anterior</th>
                  <th class="text-left" style="width: 35%;">Valor Nuevo</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="campo in getCamposModificados" :key="campo">
                  <td class="font-weight-medium">{{ formatCampoName(campo) }}</td>
                  <td>
                    <v-chip
                      class="text-truncate"
                      color="error"
                      label
                      size="small"
                      style="max-width: 200px;"
                      variant="tonal"
                    >
                      {{ formatCampoValue(selectedItem.cambios.old?.[campo]) }}
                    </v-chip>
                  </td>
                  <td>
                    <v-chip
                      class="text-truncate"
                      color="success"
                      label
                      size="small"
                      style="max-width: 200px;"
                      variant="tonal"
                    >
                      {{ formatCampoValue(selectedItem.cambios.attributes?.[campo]) }}
                    </v-chip>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </div>

          <!-- Campos modificados (fallback si no hay detalle) -->
          <div v-else-if="selectedItem?.campos_modificados?.length" class="mt-2">
            <p class="text-subtitle-2 font-weight-bold mb-2">Campos modificados:</p>
            <div class="d-flex flex-wrap ga-1">
              <v-chip
                v-for="campo in selectedItem.campos_modificados"
                :key="campo"
                color="warning"
                label
                size="small"
                variant="tonal"
              >
                {{ campo }}
              </v-chip>
            </div>
          </div>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn
            class="text-none"
            color="deep-purple"
            rounded="lg"
            variant="tonal"
            @click="detailDialog = false"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Estadisticas -->
    <v-dialog v-model="showEstadisticas" max-width="700">
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-2">
          <div class="d-flex align-center">
            <v-avatar class="mr-3" color="deep-purple" size="42">
              <v-icon icon="mdi-chart-bar" size="24" />
            </v-avatar>
            <div>
              <h3 class="text-h6 font-weight-bold">Estadisticas de Actividad</h3>
              <p class="text-caption text-medium-emphasis mb-0">Resumen de actividad del sistema</p>
            </div>
          </div>
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-5">
          <v-row v-if="store.estadisticas">
            <v-col cols="6" md="3">
              <v-card color="success" rounded="lg" variant="tonal">
                <v-card-text class="text-center pa-4">
                  <v-icon class="mb-2" icon="mdi-plus-circle" size="32" />
                  <h3 class="text-h5 font-weight-bold">{{ store.estadisticas.created || 0 }}</h3>
                  <p class="text-caption mb-0">Creaciones</p>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="6" md="3">
              <v-card color="warning" rounded="lg" variant="tonal">
                <v-card-text class="text-center pa-4">
                  <v-icon class="mb-2" icon="mdi-pencil-circle" size="32" />
                  <h3 class="text-h5 font-weight-bold">{{ store.estadisticas.updated || 0 }}</h3>
                  <p class="text-caption mb-0">Actualizaciones</p>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="6" md="3">
              <v-card color="error" rounded="lg" variant="tonal">
                <v-card-text class="text-center pa-4">
                  <v-icon class="mb-2" icon="mdi-delete-circle" size="32" />
                  <h3 class="text-h5 font-weight-bold">{{ store.estadisticas.deleted || 0 }}</h3>
                  <p class="text-caption mb-0">Eliminaciones</p>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="6" md="3">
              <v-card color="primary" rounded="lg" variant="tonal">
                <v-card-text class="text-center pa-4">
                  <v-icon class="mb-2" icon="mdi-sigma" size="32" />
                  <h3 class="text-h5 font-weight-bold">{{ store.estadisticas.total || 0 }}</h3>
                  <p class="text-caption mb-0">Total</p>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <v-skeleton-loader v-else type="article" />
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn
            class="text-none"
            color="deep-purple"
            rounded="lg"
            variant="tonal"
            @click="showEstadisticas = false"
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
  import { format } from 'date-fns'
  import { es } from 'date-fns/locale'
  import { computed, onMounted, reactive, ref, watch } from 'vue'
  import { useBitacoraStore } from '@/stores/bitacora'

  const store = useBitacoraStore()

  // Opciones de filtros
  const modulos = [
    { text: 'Personal', value: 'personal' },
    { text: 'Proyectos', value: 'proyectos' },
    { text: 'Operaciones', value: 'operaciones' },
    { text: 'Planillas', value: 'planillas' },
    { text: 'Usuarios', value: 'usuarios' },
  ]

  const acciones = [
    { text: 'Creado', value: 'created' },
    { text: 'Actualizado', value: 'updated' },
    { text: 'Eliminado', value: 'deleted' },
  ]

  // Headers de la tabla
  const headers = [
    { title: 'Fecha', key: 'fecha', sortable: true, width: '140px' },
    { title: 'Usuario', key: 'usuario', sortable: false },
    { title: 'Accion', key: 'accion', sortable: true, width: '120px' },
    { title: 'Modulo', key: 'modulo', sortable: true, width: '120px' },
    { title: 'Descripcion', key: 'descripcion', sortable: false },
    { title: 'IP', key: 'ip_address', sortable: false, width: '130px' },
    { title: '', key: 'actions', sortable: false, align: 'center', width: '70px' },
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

  // Dialogs
  const detailDialog = ref(false)
  const selectedItem = ref(null)
  const showEstadisticas = ref(false)

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
      showSnackbar('Error al cargar bitacora', 'error')
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

  // Formatear fecha
  function formatDate(date) {
    if (!date) return '-'
    return format(new Date(date), 'dd MMM yyyy', { locale: es })
  }

  function formatTime(date) {
    if (!date) return ''
    return format(new Date(date), 'HH:mm:ss')
  }

  function formatDateTime(date) {
    if (!date) return '-'
    return format(new Date(date), "dd MMM yyyy 'a las' HH:mm", { locale: es })
  }

  // Computed para verificar si hay cambios
  const hasCambios = computed(() => {
    const cambios = selectedItem.value?.cambios
    if (!cambios) return false
    return (cambios.old && Object.keys(cambios.old).length > 0) ||
           (cambios.attributes && Object.keys(cambios.attributes).length > 0)
  })

  // Computed para obtener campos modificados
  const getCamposModificados = computed(() => {
    const cambios = selectedItem.value?.cambios
    if (!cambios) return []

    const campos = new Set()
    if (cambios.old) {
      Object.keys(cambios.old).forEach(k => campos.add(k))
    }
    if (cambios.attributes) {
      Object.keys(cambios.attributes).forEach(k => campos.add(k))
    }
    return Array.from(campos)
  })

  // Formatear nombre de campo
  function formatCampoName(campo) {
    return campo
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
  }

  // Formatear valor de campo
  function formatCampoValue(value) {
    if (value === null || value === undefined) return '(vacio)'
    if (typeof value === 'boolean') return value ? 'Si' : 'No'
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
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

  // Colores y textos de acciones
  function getAccionColor(accion) {
    const colors = {
      created: 'success',
      updated: 'warning',
      deleted: 'error',
    }
    return colors[accion] || 'grey'
  }

  function getAccionIcon(accion) {
    const icons = {
      created: 'mdi-plus-circle-outline',
      updated: 'mdi-pencil-circle-outline',
      deleted: 'mdi-delete-circle-outline',
    }
    return icons[accion] || 'mdi-circle-outline'
  }

  function getAccionText(accion) {
    const texts = {
      created: 'Creado',
      updated: 'Actualizado',
      deleted: 'Eliminado',
    }
    return texts[accion] || accion
  }

  // Color de modulo
  function getModuloColor(modulo) {
    const colors = {
      personal: 'blue',
      proyectos: 'green',
      operaciones: 'orange',
      planillas: 'purple',
      usuarios: 'pink',
    }
    return colors[modulo] || 'grey'
  }

  // Abrir detalle
  async function openDetail(item) {
    selectedItem.value = item
    detailDialog.value = true

    try {
      const detail = await store.fetchById(item.id)
      selectedItem.value = detail
    } catch {
      // Mantener el item original si falla
    }
  }

  // Cargar estadisticas cuando se abre el dialog
  watch(showEstadisticas, async (value) => {
    if (value && !store.estadisticas) {
      await store.fetchEstadisticas()
    }
  })

  // Cargar datos al montar
  onMounted(() => {
    loadData()
  })
</script>

<style scoped>
.font-mono {
  font-family: 'Roboto Mono', monospace;
}
</style>
