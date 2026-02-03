<template>
  <div class="alertas-cobertura-view">
    <!-- Header -->
    <div class="d-flex align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">Alertas de Cobertura</h1>
        <p class="text-body-2 text-medium-emphasis">Monitoreo de cobertura 24/7 en proyectos activos</p>
      </div>
      <v-spacer />
      <v-chip
        class="mr-2"
        :color="autoRefresh ? 'success' : 'grey'"
        size="small"
        variant="flat"
      >
        <v-icon size="14" start>{{ autoRefresh ? 'mdi-sync' : 'mdi-sync-off' }}</v-icon>
        Auto-actualización {{ autoRefresh ? 'ON' : 'OFF' }}
      </v-chip>
      <v-btn
        color="primary"
        :loading="loading"
        variant="elevated"
        @click="cargarAlertas"
      >
        <v-icon start>mdi-refresh</v-icon>
        Actualizar
      </v-btn>
    </div>

    <!-- Cards de Métricas -->
    <v-row class="mb-6">
      <v-col cols="12" md="3" sm="6">
        <v-card class="h-100" color="error-lighten-5" elevation="2" rounded="xl">
          <v-card-text class="pa-6">
            <div class="d-flex align-center mb-2">
              <v-avatar class="mr-3" color="error" size="48">
                <v-icon color="white" size="28">mdi-alert-circle</v-icon>
              </v-avatar>
              <div>
                <div class="text-h3 font-weight-bold text-error">{{ meta.criticas }}</div>
                <div class="text-caption text-medium-emphasis">Alertas Críticas</div>
              </div>
            </div>
            <v-divider class="my-3" />
            <div class="text-caption">
              <v-icon color="error" size="14">mdi-account-off</v-icon>
              Sin personal asignado
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3" sm="6">
        <v-card class="h-100" color="warning-lighten-5" elevation="2" rounded="xl">
          <v-card-text class="pa-6">
            <div class="d-flex align-center mb-2">
              <v-avatar class="mr-3" color="warning" size="48">
                <v-icon color="white" size="28">mdi-alert</v-icon>
              </v-avatar>
              <div>
                <div class="text-h3 font-weight-bold text-warning">{{ meta.altas }}</div>
                <div class="text-caption text-medium-emphasis">Alertas Altas</div>
              </div>
            </div>
            <v-divider class="my-3" />
            <div class="text-caption">
              <v-icon color="warning" size="14">mdi-account-alert</v-icon>
              Menos del 50% requerido
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3" sm="6">
        <v-card class="h-100" color="orange-lighten-5" elevation="2" rounded="xl">
          <v-card-text class="pa-6">
            <div class="d-flex align-center mb-2">
              <v-avatar class="mr-3" color="orange" size="48">
                <v-icon color="white" size="28">mdi-information</v-icon>
              </v-avatar>
              <div>
                <div class="text-h3 font-weight-bold text-orange">{{ meta.medias }}</div>
                <div class="text-caption text-medium-emphasis">Alertas Medias</div>
              </div>
            </div>
            <v-divider class="my-3" />
            <div class="text-caption">
              <v-icon color="orange" size="14">mdi-account-minus</v-icon>
              Cobertura parcial
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3" sm="6">
        <v-card class="h-100" color="info-lighten-5" elevation="2" rounded="xl">
          <v-card-text class="pa-6">
            <div class="d-flex align-center mb-2">
              <v-avatar class="mr-3" color="info" size="48">
                <v-icon color="white" size="28">mdi-clock-alert</v-icon>
              </v-avatar>
              <div>
                <div class="text-h3 font-weight-bold text-info">{{ meta.proximo_vencimiento }}</div>
                <div class="text-caption text-medium-emphasis">Próximos Vencimientos</div>
              </div>
            </div>
            <v-divider class="my-3" />
            <div class="text-caption">
              <v-icon color="info" size="14">mdi-calendar-clock</v-icon>
              Vencen en 7 días
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Filtros -->
    <v-card class="mb-6" elevation="2" rounded="xl">
      <v-card-text class="pa-4">
        <v-row dense>
          <v-col cols="12" md="3">
            <v-select
              v-model="filtros.severidad"
              clearable
              density="comfortable"
              hide-details
              :items="opcionesSeveridad"
              label="Severidad"
              prepend-inner-icon="mdi-filter"
              variant="outlined"
              @update:model-value="aplicarFiltros"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="filtros.tipo_alerta"
              clearable
              density="comfortable"
              hide-details
              :items="opcionesTipoAlerta"
              label="Tipo de Alerta"
              prepend-inner-icon="mdi-filter-variant"
              variant="outlined"
              @update:model-value="aplicarFiltros"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="busqueda"
              clearable
              density="comfortable"
              hide-details
              label="Buscar proyecto..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
            />
          </v-col>
          <v-col class="d-flex align-center" cols="12" md="3">
            <v-btn
              color="primary"
              variant="text"
              @click="limpiarFiltros"
            >
              <v-icon start>mdi-filter-off</v-icon>
              Limpiar Filtros
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Tabla de Alertas -->
    <v-card elevation="2" rounded="xl">
      <v-card-title class="pa-4 bg-grey-lighten-5">
        <v-icon color="primary" start>mdi-table-alert</v-icon>
        <span class="text-subtitle-1 font-weight-bold">Proyectos con Problemas de Cobertura</span>
        <v-spacer />
        <v-chip color="primary" size="small">
          {{ alertasFiltradas.length }} alertas
        </v-chip>
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-0">
        <v-data-table
          density="comfortable"
          :headers="headers"
          :items="alertasFiltradas"
          :items-per-page="10"
          :loading="loading"
          :search="busqueda"
        >
          <!-- Proyecto -->
          <template #item.proyecto="{ item }">
            <div>
              <div class="font-weight-bold">{{ item.nombre_proyecto }}</div>
              <div class="text-caption text-medium-emphasis">{{ item.proyecto_correlativo }}</div>
              <div class="text-caption">
                <v-icon size="12">mdi-office-building</v-icon>
                {{ item.cliente_nombre }}
              </div>
            </div>
          </template>

          <!-- Puesto -->
          <template #item.puesto="{ item }">
            <div>
              <div class="font-weight-medium">{{ item.nombre_puesto }}</div>
              <div class="text-caption text-medium-emphasis">
                <v-icon size="12">mdi-clock-outline</v-icon>
                {{ item.turno_nombre }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ item.turno_hora_inicio }} - {{ item.turno_hora_fin }}
              </div>
            </div>
          </template>

          <!-- Cobertura -->
          <template #item.cobertura="{ item }">
            <div class="text-center">
              <v-progress-circular
                :color="getColorCobertura(item)"
                :model-value="calcularPorcentajeCobertura(item)"
                :size="60"
                :width="6"
              >
                <span class="text-caption font-weight-bold">
                  {{ item.personal_asignado }}/{{ item.cantidad_requerida }}
                </span>
              </v-progress-circular>
              <div class="text-caption mt-1">
                {{ calcularPorcentajeCobertura(item) }}%
              </div>
            </div>
          </template>

          <!-- Déficit -->
          <template #item.deficit="{ item }">
            <v-chip
              :color="getColorDeficit(item.deficit_personal)"
              size="small"
              variant="flat"
            >
              <v-icon size="14" start>mdi-account-minus</v-icon>
              {{ item.deficit_personal }} faltante{{ item.deficit_personal !== 1 ? 's' : '' }}
            </v-chip>
          </template>

          <!-- Estado -->
          <template #item.estado="{ item }">
            <div class="d-flex flex-column ga-1">
              <v-chip
                :color="getSeveridadColor(item.severidad)"
                size="small"
                variant="flat"
              >
                <v-icon size="14" start>{{ getSeveridadIcon(item.severidad) }}</v-icon>
                {{ getSeveridadLabel(item.severidad) }}
              </v-chip>
              <v-chip
                :color="getTipoAlertaColor(item.tipo_alerta)"
                size="x-small"
                variant="tonal"
              >
                {{ getTipoAlertaLabel(item.tipo_alerta) }}
              </v-chip>
            </div>
          </template>

          <!-- Vencimiento -->
          <template #item.vencimiento="{ item }">
            <div v-if="item.proxima_fecha_vencimiento">
              <v-chip color="info" size="small" variant="tonal">
                <v-icon size="14" start>mdi-calendar-clock</v-icon>
                {{ formatDate(item.proxima_fecha_vencimiento) }}
              </v-chip>
              <div class="text-caption text-medium-emphasis mt-1">
                {{ getDiasRestantes(item.proxima_fecha_vencimiento) }}
              </div>
            </div>
            <span v-else class="text-medium-emphasis">-</span>
          </template>

          <!-- Acciones -->
          <template #item.acciones="{ item }">
            <v-btn
              color="primary"
              size="small"
              variant="elevated"
              @click="asignarPersonal(item)"
            >
              <v-icon size="18" start>mdi-account-plus</v-icon>
              Asignar Personal
            </v-btn>
          </template>

          <!-- No data -->
          <template #no-data>
            <div class="text-center py-10">
              <v-avatar class="mb-3" color="success-lighten-4" size="80">
                <v-icon color="success" size="48">mdi-check-circle</v-icon>
              </v-avatar>
              <p class="text-h6 font-weight-bold mb-1">¡Todo en orden!</p>
              <p class="text-body-2 text-medium-emphasis">No hay alertas de cobertura en este momento</p>
            </div>
          </template>

          <!-- Loading -->
          <template #loading>
            <v-skeleton-loader type="table-row@5" />
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      elevation="8"
      rounded="lg"
    >
      <div class="d-flex align-center">
        <v-icon
          class="mr-2"
          :icon="snackbar.color === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle'"
        />
        {{ snackbar.text }}
      </div>
    </v-snackbar>
  </div>
</template>

<script setup>
  import { differenceInDays, format } from 'date-fns'
  import { es } from 'date-fns/locale'
  import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import operacionesService from '@/services/operacionesService'

  const router = useRouter()

  // Estado
  const loading = ref(false)
  const alertas = ref([])
  const autoRefresh = ref(true)
  let refreshInterval = null

  // Métricas
  const meta = reactive({
    total: 0,
    criticas: 0,
    altas: 0,
    medias: 0,
    bajas: 0,
    sin_cobertura: 0,
    cobertura_parcial: 0,
    proximo_vencimiento: 0,
  })

  // Filtros
  const filtros = reactive({
    severidad: null,
    tipo_alerta: null,
  })

  const busqueda = ref('')

  // Opciones de filtros
  const opcionesSeveridad = [
    { title: '🔴 Crítica', value: 'critica' },
    { title: '🟡 Alta', value: 'alta' },
    { title: '🟠 Media', value: 'media' },
    { title: '🟢 Baja', value: 'baja' },
  ]

  const opcionesTipoAlerta = [
    { title: 'Sin Cobertura', value: 'sin_cobertura' },
    { title: 'Cobertura Parcial', value: 'cobertura_parcial' },
    { title: 'Próximo Vencimiento', value: 'proximo_vencimiento' },
  ]

  // Snackbar
  const snackbar = reactive({
    show: false,
    text: '',
    color: 'success',
  })

  // Headers de la tabla
  const headers = [
    { title: 'Proyecto', key: 'proyecto', sortable: true, width: '250px' },
    { title: 'Puesto / Turno', key: 'puesto', sortable: true, width: '200px' },
    { title: 'Cobertura', key: 'cobertura', sortable: false, align: 'center', width: '120px' },
    { title: 'Déficit', key: 'deficit', sortable: true, align: 'center', width: '140px' },
    { title: 'Estado', key: 'estado', sortable: true, width: '160px' },
    { title: 'Vencimiento', key: 'vencimiento', sortable: true, width: '150px' },
    { title: 'Acciones', key: 'acciones', sortable: false, align: 'center', width: '180px' },
  ]

  // Computed
  const alertasFiltradas = computed(() => {
    return alertas.value
  })

  // Funciones
  async function cargarAlertas () {
    loading.value = true
    try {
      const params = {}

      if (filtros.severidad) {
        params.severidad = filtros.severidad
      }

      if (filtros.tipo_alerta) {
        params.tipo_alerta = filtros.tipo_alerta
      }

      const response = await operacionesService.getAlertasCobertura(params)

      alertas.value = response.data || []

      // Actualizar métricas
      if (response.meta) {
        Object.assign(meta, response.meta)
      }
    } catch (error) {
      console.error('Error cargando alertas:', error)
      showSnackbar('Error al cargar las alertas de cobertura', 'error')
    } finally {
      loading.value = false
    }
  }

  function aplicarFiltros () {
    cargarAlertas()
  }

  function limpiarFiltros () {
    filtros.severidad = null
    filtros.tipo_alerta = null
    busqueda.value = ''
    cargarAlertas()
  }

  function calcularPorcentajeCobertura (item) {
    if (!item.cantidad_requerida || item.cantidad_requerida === 0) return 0
    return Math.round((item.personal_asignado / item.cantidad_requerida) * 100)
  }

  function getColorCobertura (item) {
    const porcentaje = calcularPorcentajeCobertura(item)
    if (porcentaje === 0) return 'error'
    if (porcentaje < 50) return 'warning'
    if (porcentaje < 100) return 'orange'
    return 'success'
  }

  function getColorDeficit (deficit) {
    if (deficit >= 3) return 'error'
    if (deficit >= 2) return 'warning'
    return 'orange'
  }

  function getSeveridadColor (severidad) {
    const colores = {
      critica: 'error',
      alta: 'warning',
      media: 'orange',
      baja: 'info',
    }
    return colores[severidad] || 'grey'
  }

  function getSeveridadIcon (severidad) {
    const iconos = {
      critica: 'mdi-alert-circle',
      alta: 'mdi-alert',
      media: 'mdi-information',
      baja: 'mdi-check-circle',
    }
    return iconos[severidad] || 'mdi-help-circle'
  }

  function getSeveridadLabel (severidad) {
    const labels = {
      critica: 'CRÍTICA',
      alta: 'ALTA',
      media: 'MEDIA',
      baja: 'BAJA',
    }
    return labels[severidad] || severidad
  }

  function getTipoAlertaColor (tipo) {
    const colores = {
      sin_cobertura: 'error',
      cobertura_parcial: 'warning',
      proximo_vencimiento: 'info',
    }
    return colores[tipo] || 'grey'
  }

  function getTipoAlertaLabel (tipo) {
    const labels = {
      sin_cobertura: 'Sin Cobertura',
      cobertura_parcial: 'Cobertura Parcial',
      proximo_vencimiento: 'Próximo Vencimiento',
    }
    return labels[tipo] || tipo
  }

  function formatDate (date) {
    if (!date) return '-'
    return format(new Date(date + 'T12:00:00'), 'dd/MM/yyyy', { locale: es })
  }

  function getDiasRestantes (fecha) {
    if (!fecha) return ''
    const dias = differenceInDays(new Date(fecha + 'T12:00:00'), new Date())
    if (dias === 0) return 'Hoy'
    if (dias === 1) return 'Mañana'
    if (dias < 0) return 'Vencido'
    return `En ${dias} días`
  }

  function asignarPersonal (item) {
    // Navegar a la vista de asignaciones con el proyecto y puesto pre-seleccionados
    router.push({
      name: 'operaciones-asignaciones',
      query: {
        proyecto_id: item.proyecto_id,
        configuracion_puesto_id: item.configuracion_puesto_id,
        action: 'create',
      },
    })
  }

  function showSnackbar (text, color = 'success') {
    snackbar.text = text
    snackbar.color = color
    snackbar.show = true
  }

  function iniciarAutoRefresh () {
    if (refreshInterval) {
      clearInterval(refreshInterval)
    }

    if (autoRefresh.value) {
      // Actualizar cada 5 minutos (300000 ms)
      refreshInterval = setInterval(() => {
        cargarAlertas()
      }, 300_000)
    }
  }

  onMounted(() => {
    cargarAlertas()
    iniciarAutoRefresh()
  })

  onUnmounted(() => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
    }
  })
</script>

<style scoped>
.alertas-cobertura-view {
  padding: 24px;
}
</style>
