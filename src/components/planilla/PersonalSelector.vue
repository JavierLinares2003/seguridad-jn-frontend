<template>
  <div>
    <!-- Encabezado con contador y botón limpiar -->
    <div class="d-flex align-center justify-space-between mb-3">
      <div class="d-flex align-center ga-2">
        <v-icon color="primary">mdi-account-group</v-icon>
        <span class="text-subtitle-1 font-weight-medium">Personal a incluir</span>
        <v-chip v-if="selectedCount > 0" color="primary" size="small">
          {{ selectedCount }} seleccionado{{ selectedCount !== 1 ? 's' : '' }}
        </v-chip>
      </div>
      <v-btn
        v-if="selectedCount > 0"
        color="error"
        density="comfortable"
        size="small"
        variant="text"
        @click="clearAll"
      >
        Deseleccionar todos
      </v-btn>
    </div>

    <!-- Placeholder cuando faltan fechas -->
    <v-card
      v-if="!datesReady"
      border
      class="d-flex flex-column align-center justify-center pa-8 ga-2 text-medium-emphasis"
      flat
      rounded="lg"
    >
      <v-icon size="40">mdi-calendar-alert</v-icon>
      <span class="text-body-2">Ingresa las fechas de inicio y fin para ver el personal disponible</span>
    </v-card>

    <!-- Contenido cuando las fechas están listas -->
    <template v-else>
      <!-- Chips de seleccionados (siempre visibles sin importar el filtro) -->
      <div v-if="selectedCount > 0" class="d-flex flex-wrap ga-1 mb-3">
        <v-chip
          v-for="p in visibleChips"
          :key="p.id"
          closable
          color="primary"
          size="small"
          variant="tonal"
          @click:close="removeSelected(p.id)"
        >
          {{ p.apellidos }}, {{ p.nombres }}
        </v-chip>
        <v-chip
          v-if="selectedCount > MAX_CHIPS"
          color="primary"
          size="small"
          variant="outlined"
        >
          +{{ selectedCount - MAX_CHIPS }} más
        </v-chip>
      </div>

      <!-- Búsqueda por nombre o DPI -->
      <v-text-field
        v-model="searchQuery"
        class="mb-2"
        clearable
        density="compact"
        hide-details
        label="Buscar por nombre o DPI..."
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
      />

      <!-- Lista con scroll infinito -->
      <v-card border flat rounded="lg">
        <div ref="listContainer" class="personal-scroll">
          <!-- Cargando por primera vez -->
          <div
            v-if="loading && items.length === 0"
            class="d-flex flex-column align-center justify-center pa-8 ga-2"
          >
            <v-progress-circular color="primary" indeterminate />
            <span class="text-body-2 text-medium-emphasis">Cargando personal disponible...</span>
          </div>

          <!-- Sin resultados -->
          <div
            v-else-if="!loading && items.length === 0"
            class="d-flex flex-column align-center pa-8 ga-2 text-medium-emphasis"
          >
            <v-icon size="40">mdi-account-check-outline</v-icon>
            <span class="text-body-2">Todo el personal ya tiene planilla en este período</span>
          </div>

          <!-- Lista de empleados -->
          <v-list v-else density="compact" lines="two">
            <v-list-item
              v-for="person in items"
              :key="person.id"
              :active="isSelected(person.id)"
              active-color="primary"
              rounded="0"
              @click="toggle(person)"
            >
              <template #prepend>
                <v-checkbox-btn
                  :model-value="isSelected(person.id)"
                  color="primary"
                  @click.stop
                  @update:model-value="toggle(person)"
                />
              </template>
              <v-list-item-title class="text-body-2 font-weight-medium">
                {{ person.apellidos }}, {{ person.nombres }}
              </v-list-item-title>
              <v-list-item-subtitle class="d-flex align-center flex-wrap ga-1 mt-1">
                <span v-if="person.dpi" class="text-caption mr-1">DPI: {{ person.dpi }}</span>
                <v-chip
                  :color="person.tiene_igss ? 'success' : 'grey'"
                  :variant="person.tiene_igss ? 'tonal' : 'outlined'"
                  density="compact"
                  size="x-small"
                >
                  <v-icon size="10" start>{{ person.tiene_igss ? 'mdi-check' : 'mdi-close' }}</v-icon>
                  IGSS
                </v-chip>
                <v-chip
                  :color="person.tiene_prestaciones ? 'success' : 'grey'"
                  :variant="person.tiene_prestaciones ? 'tonal' : 'outlined'"
                  density="compact"
                  size="x-small"
                >
                  <v-icon size="10" start>{{ person.tiene_prestaciones ? 'mdi-check' : 'mdi-close' }}</v-icon>
                  Prestaciones
                </v-chip>
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>

          <!-- Sentinel para IntersectionObserver + indicador de carga -->
          <div ref="sentinel" class="sentinel-area py-3 text-center">
            <v-progress-circular
              v-if="loadingMore"
              color="primary"
              indeterminate
              size="20"
              width="2"
            />
            <span
              v-else-if="!hasMore && items.length > 0"
              class="text-caption text-medium-emphasis"
            >
              {{ items.length }} de {{ totalItems }} empleados disponibles
            </span>
          </div>
        </div>
      </v-card>

      <!-- Nota informativa -->
      <div class="d-flex align-center ga-1 mt-2 text-caption text-medium-emphasis">
        <v-icon size="14">mdi-information-outline</v-icon>
        Sin selección, se incluirá todo el personal disponible en este período
      </div>
    </template>
  </div>
</template>

<script setup>
  import { computed, nextTick, onUnmounted, reactive, ref, watch } from 'vue'
  import personalService from '@/services/personalService'

  const props = defineProps({
    periodoInicio: { type: String, default: '' },
    periodoFin: { type: String, default: '' },
  })

  const emit = defineEmits(['update:modelValue'])

  const MAX_CHIPS = 5

  // Estado de la lista
  const items = ref([])
  const loading = ref(false)
  const loadingMore = ref(false)
  const page = ref(1)
  const hasMore = ref(true)
  const totalItems = ref(0)

  // Filtro
  const searchQuery = ref('')

  // Selección persistente - Map reactivo que no se limpia al buscar
  const selectedMap = reactive(new Map())

  // DOM refs
  const sentinel = ref(null)
  const listContainer = ref(null)

  // Internos
  let observer = null
  let searchTimer = null

  // --- Computed ---
  const datesReady = computed(() => !!props.periodoInicio && !!props.periodoFin)
  const selectedCount = computed(() => selectedMap.size)
  const selectedList = computed(() => Array.from(selectedMap.values()))
  const visibleChips = computed(() => selectedList.value.slice(0, MAX_CHIPS))

  // --- Extracción de respuesta API (compatible con múltiples formatos Laravel) ---
  function extractItems (response) {
    const data = response?.data || response
    if (Array.isArray(data?.data)) return data.data
    if (Array.isArray(data)) return data
    return []
  }

  function extractPagination (response) {
    if (response?.current_page !== undefined)
      return { page: response.current_page, lastPage: response.last_page || 1, total: response.total || 0 }
    if (response?.meta)
      return { page: response.meta.current_page || 1, lastPage: response.meta.last_page || 1, total: response.meta.total || 0 }
    const data = response?.data || response
    if (data?.meta)
      return { page: data.meta.current_page || 1, lastPage: data.meta.last_page || 1, total: data.meta.total || 0 }
    if (data?.current_page !== undefined)
      return { page: data.current_page, lastPage: data.last_page || 1, total: data.total || 0 }
    return null
  }

  // --- Carga de datos ---
  async function loadPersonal (reset = false) {
    if (!datesReady.value) return

    if (reset) {
      page.value = 1
      items.value = []
      hasMore.value = true
    }
    if (!hasMore.value) return
    if (reset ? loading.value : loadingMore.value) return

    reset ? (loading.value = true) : (loadingMore.value = true)

    try {
      const params = {
        page: page.value,
        per_page: 15,
        estado: 'activo',
        periodo_inicio: props.periodoInicio,
        periodo_fin: props.periodoFin,
        directorio: 1,
      }
      if (searchQuery.value?.trim()) params.buscar = searchQuery.value.trim()

      const response = await personalService.getAll(params)
      const newItems = extractItems(response)
      const pag = extractPagination(response)

      items.value = reset ? newItems : [...items.value, ...newItems]

      if (pag) {
        totalItems.value = pag.total
        hasMore.value = pag.page < pag.lastPage
      } else {
        hasMore.value = false
      }
    } catch {
      hasMore.value = false
    } finally {
      loading.value = false
      loadingMore.value = false
    }
  }

  // Montar/desmontar observer cuando el contenedor aparece al llenarse las fechas
  function setupObserver () {
    if (observer) {
      observer.disconnect()
      observer = null
    }
    nextTick(() => {
      if (sentinel.value && listContainer.value) {
        observer = new IntersectionObserver(
          entries => {
            if (entries[0].isIntersecting && !loadingMore.value && !loading.value && hasMore.value) {
              page.value++
              loadPersonal()
            }
          },
          { root: listContainer.value, threshold: 0.1 },
        )
        observer.observe(sentinel.value)
      }
    })
  }

  // Cuando ambas fechas están listas → cargar lista y limpiar selección previa
  watch(
    [() => props.periodoInicio, () => props.periodoFin],
    ([inicio, fin]) => {
      if (inicio && fin) {
        selectedMap.clear()
        emit('update:modelValue', [])
        searchQuery.value = ''
        loadPersonal(true).then(() => setupObserver())
      } else {
        items.value = []
      }
    },
  )

  // Debounce al buscar — NO toca selectedMap
  watch(searchQuery, () => {
    if (!datesReady.value) return
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => loadPersonal(true), 400)
  })

  // --- Manejo de selección ---
  function isSelected (id) {
    return selectedMap.has(id)
  }

  function toggle (person) {
    if (selectedMap.has(person.id)) {
      selectedMap.delete(person.id)
    } else {
      selectedMap.set(person.id, person)
    }
    emit('update:modelValue', Array.from(selectedMap.keys()))
  }

  function removeSelected (id) {
    selectedMap.delete(id)
    emit('update:modelValue', Array.from(selectedMap.keys()))
  }

  function clearAll () {
    selectedMap.clear()
    emit('update:modelValue', [])
  }

  onUnmounted(() => {
    observer?.disconnect()
    clearTimeout(searchTimer)
  })
</script>

<style scoped>
.personal-scroll {
  max-height: 360px;
  overflow-y: auto;
}

.sentinel-area {
  min-height: 40px;
}
</style>
