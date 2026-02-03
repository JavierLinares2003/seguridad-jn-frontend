<template>
  <div class="planillas-list">
    <!-- Header -->
    <div class="d-flex align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">Planillas</h1>
        <p class="text-body-2 text-medium-emphasis">Gestión de planillas de pago</p>
      </div>
      <v-spacer />
      <v-btn
        color="primary"
        variant="elevated"
        @click="$router.push('/operaciones/planillas/generar')"
      >
        <v-icon start>mdi-plus</v-icon>
        Nueva Planilla
      </v-btn>
    </div>

    <!-- Filtros -->
    <v-card class="mb-6" elevation="2" rounded="xl">
      <v-card-text class="pa-4">
        <v-row dense>
          <v-col cols="12" md="3">
            <v-select
              v-model="filtros.estado_planilla"
              clearable
              density="comfortable"
              hide-details
              :items="opcionesEstado"
              label="Estado"
              prepend-inner-icon="mdi-filter"
              variant="outlined"
              @update:model-value="aplicarFiltros"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="filtros.periodo_inicio"
              clearable
              density="comfortable"
              hide-details
              label="Desde"
              prepend-inner-icon="mdi-calendar-start"
              type="date"
              variant="outlined"
              @update:model-value="aplicarFiltros"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="filtros.periodo_fin"
              clearable
              density="comfortable"
              hide-details
              label="Hasta"
              prepend-inner-icon="mdi-calendar-end"
              type="date"
              variant="outlined"
              @update:model-value="aplicarFiltros"
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

    <!-- Tabla de Planillas -->
    <v-card elevation="2" rounded="xl">
      <v-card-title class="pa-4 bg-grey-lighten-5">
        <v-icon color="primary" start>mdi-file-document-multiple</v-icon>
        <span class="text-subtitle-1 font-weight-bold">Listado de Planillas</span>
        <v-spacer />
        <v-chip color="primary" size="small">
          {{ meta.total }} planillas
        </v-chip>
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-0">
        <v-data-table
          density="comfortable"
          :headers="headers"
          :items="planillas"
          :items-per-page="meta.per_page"
          :loading="loading"
        >
          <!-- Nombre -->
          <template #item.nombre="{ item }">
            <div>
              <div class="font-weight-bold">{{ item.nombre_planilla }}</div>
              <div class="text-caption text-medium-emphasis">
                ID: {{ item.id }}
              </div>
            </div>
          </template>

          <!-- Período -->
          <template #item.periodo="{ item }">
            <div>
              <div>{{ formatDate(item.periodo_inicio) }}</div>
              <div class="text-caption">a {{ formatDate(item.periodo_fin) }}</div>
            </div>
          </template>

          <!-- Totales -->
          <template #item.total_devengado="{ item }">
            <span class="text-success font-weight-medium">
              {{ formatCurrency(item.total_devengado) }}
            </span>
          </template>

          <template #item.total_descuentos="{ item }">
            <span class="text-error font-weight-medium">
              {{ formatCurrency(item.total_descuentos) }}
            </span>
          </template>

          <template #item.total_neto="{ item }">
            <span class="text-primary font-weight-bold">
              {{ formatCurrency(item.total_neto) }}
            </span>
          </template>

          <!-- Estado -->
          <template #item.estado="{ item }">
            <v-chip
              :color="getEstadoColor(item.estado_planilla)"
              size="small"
              variant="flat"
            >
              <v-icon size="14" start>{{ getEstadoIcon(item.estado_planilla) }}</v-icon>
              {{ getEstadoLabel(item.estado_planilla) }}
            </v-chip>
          </template>

          <!-- Acciones -->
          <template #item.acciones="{ item }">
            <div class="d-flex ga-1">
              <v-btn
                color="primary"
                icon="mdi-eye"
                size="small"
                variant="text"
                @click="verDetalle(item.id)"
              >
                <v-icon>mdi-eye</v-icon>
                <v-tooltip activator="parent" location="top">Ver Detalle</v-tooltip>
              </v-btn>

              <v-btn
                v-if="item.estado_planilla === 'borrador'"
                color="success"
                icon="mdi-check"
                size="small"
                variant="text"
                @click="aprobarPlanilla(item)"
              >
                <v-icon>mdi-check</v-icon>
                <v-tooltip activator="parent" location="top">Aprobar</v-tooltip>
              </v-btn>

              <v-menu>
                <template #activator="{ props }">
                  <v-btn
                    icon="mdi-dots-vertical"
                    size="small"
                    variant="text"
                    v-bind="props"
                  >
                    <v-icon>mdi-dots-vertical</v-icon>
                  </v-btn>
                </template>
                <v-list density="compact">
                  <v-list-item
                    @click="exportarPlanilla(item.id, 'excel')"
                  >
                    <template #prepend>
                      <v-icon>mdi-file-excel</v-icon>
                    </template>
                    <v-list-item-title>Exportar Excel</v-list-item-title>
                  </v-list-item>
                  <v-list-item
                    @click="exportarPlanilla(item.id, 'pdf')"
                  >
                    <template #prepend>
                      <v-icon>mdi-file-pdf-box</v-icon>
                    </template>
                    <v-list-item-title>Exportar PDF</v-list-item-title>
                  </v-list-item>
                  <v-divider v-if="item.estado_planilla === 'aprobada'" />
                  <v-list-item
                    v-if="item.estado_planilla === 'aprobada'"
                    @click="marcarPagada(item)"
                  >
                    <template #prepend>
                      <v-icon color="success">mdi-cash-check</v-icon>
                    </template>
                    <v-list-item-title>Marcar como Pagada</v-list-item-title>
                  </v-list-item>
                  <v-divider v-if="item.estado_planilla === 'borrador'" />
                  <v-list-item
                    v-if="item.estado_planilla === 'borrador'"
                    @click="mostrarDialogoCancelar(item)"
                  >
                    <template #prepend>
                      <v-icon color="error">mdi-cancel</v-icon>
                    </template>
                    <v-list-item-title>Cancelar Planilla</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>
          </template>

          <!-- Loading -->
          <template #loading>
            <v-skeleton-loader type="table-row@5" />
          </template>

          <!-- No data -->
          <template #no-data>
            <div class="text-center py-10">
              <v-avatar class="mb-3" color="grey-lighten-3" size="80">
                <v-icon color="grey" size="48">mdi-file-document-outline</v-icon>
              </v-avatar>
              <p class="text-h6 font-weight-bold mb-1">No hay planillas</p>
              <p class="text-body-2 text-medium-emphasis mb-4">Genera tu primera planilla</p>
              <v-btn
                color="primary"
                variant="elevated"
                @click="$router.push('/operaciones/planillas/generar')"
              >
                <v-icon start>mdi-plus</v-icon>
                Nueva Planilla
              </v-btn>
            </div>
          </template>
        </v-data-table>

        <!-- Paginación -->
        <div v-if="meta.total > meta.per_page" class="pa-4">
          <v-pagination
            v-model="meta.current_page"
            :length="meta.last_page"
            @update:model-value="cargarPlanillas"
          />
        </div>
      </v-card-text>
    </v-card>

    <!-- Dialog Cancelar -->
    <v-dialog v-model="dialogCancelar" max-width="500">
      <v-card rounded="xl">
        <v-card-title class="pa-4 bg-error-lighten-5">
          <v-icon color="error" start>mdi-cancel</v-icon>
          <span class="text-error">Cancelar Planilla</span>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-6">
          <p class="mb-4">¿Estás seguro de cancelar esta planilla?</p>
          <v-textarea
            v-model="motivoCancelacion"
            hint="Opcional"
            label="Motivo de cancelación"
            persistent-hint
            rows="3"
            variant="outlined"
          />
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn
            variant="text"
            @click="dialogCancelar = false"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="error"
            :loading="loading"
            variant="elevated"
            @click="confirmarCancelar"
          >
            Confirmar Cancelación
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
  import { format } from 'date-fns'
  import { es } from 'date-fns/locale'
  import { onMounted, reactive, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { usePlanillaStore } from '@/stores/planilla'

  const router = useRouter()
  const planillaStore = usePlanillaStore()

  // Estado
  const loading = ref(false)
  const planillas = ref([])
  const dialogCancelar = ref(false)
  const planillaSeleccionada = ref(null)
  const motivoCancelacion = ref('')

  // Filtros
  const filtros = reactive({
    estado_planilla: null,
    periodo_inicio: null,
    periodo_fin: null,
  })

  // Meta paginación
  const meta = reactive({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  })

  // Opciones
  const opcionesEstado = [
    { title: 'Borrador', value: 'borrador' },
    { title: 'En Revisión', value: 'revision' },
    { title: 'Aprobada', value: 'aprobada' },
    { title: 'Pagada', value: 'pagada' },
    { title: 'Cancelada', value: 'cancelada' },
  ]

  // Snackbar
  const snackbar = reactive({
    show: false,
    text: '',
    color: 'success',
  })

  // Headers
  const headers = [
    { title: 'Nombre', key: 'nombre', sortable: true },
    { title: 'Período', key: 'periodo', sortable: true },
    { title: 'Devengado', key: 'total_devengado', sortable: true, align: 'end' },
    { title: 'Descuentos', key: 'total_descuentos', sortable: true, align: 'end' },
    { title: 'Neto', key: 'total_neto', sortable: true, align: 'end' },
    { title: 'Estado', key: 'estado', sortable: true },
    { title: 'Acciones', key: 'acciones', sortable: false, align: 'center', width: '150px' },
  ]

  // Funciones
  async function cargarPlanillas () {
    loading.value = true
    try {
      const params = {
        page: meta.current_page,
        per_page: meta.per_page,
        ...filtros,
      }

      const response = await planillaStore.fetchPlanillas(params)
      planillas.value = response.data || []

      if (response.meta) {
        Object.assign(meta, response.meta)
      }
    } catch {
      showSnackbar('Error al cargar planillas', 'error')
    } finally {
      loading.value = false
    }
  }

  function aplicarFiltros () {
    meta.current_page = 1
    cargarPlanillas()
  }

  function limpiarFiltros () {
    filtros.estado_planilla = null
    filtros.periodo_inicio = null
    filtros.periodo_fin = null
    cargarPlanillas()
  }

  function verDetalle (id) {
    router.push(`/operaciones/planillas/${id}`)
  }

  async function aprobarPlanilla (planilla) {
    if (!confirm(`¿Aprobar planilla "${planilla.nombre_planilla}"? Esto marcará las transacciones como aplicadas.`)) {
      return
    }

    loading.value = true
    try {
      await planillaStore.aprobarPlanilla(planilla.id)
      showSnackbar('Planilla aprobada exitosamente', 'success')
      cargarPlanillas()
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Error al aprobar planilla', 'error')
    } finally {
      loading.value = false
    }
  }

  async function marcarPagada (planilla) {
    if (!confirm(`¿Marcar planilla "${planilla.nombre_planilla}" como pagada?`)) {
      return
    }

    loading.value = true
    try {
      await planillaStore.marcarPagada(planilla.id)
      showSnackbar('Planilla marcada como pagada', 'success')
      cargarPlanillas()
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Error al marcar como pagada', 'error')
    } finally {
      loading.value = false
    }
  }

  function mostrarDialogoCancelar (planilla) {
    planillaSeleccionada.value = planilla
    motivoCancelacion.value = ''
    dialogCancelar.value = true
  }

  async function confirmarCancelar () {
    if (!planillaSeleccionada.value) return

    loading.value = true
    try {
      await planillaStore.cancelarPlanilla(planillaSeleccionada.value.id, motivoCancelacion.value)
      showSnackbar('Planilla cancelada', 'success')
      dialogCancelar.value = false
      cargarPlanillas()
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Error al cancelar planilla', 'error')
    } finally {
      loading.value = false
    }
  }

  async function exportarPlanilla (id, formato) {
    try {
      await planillaStore.exportarPlanilla(id, formato)
      showSnackbar(`Exportando planilla a ${formato.toUpperCase()}...`, 'info')
    } catch {
      showSnackbar('Error al exportar planilla', 'error')
    }
  }

  function getEstadoColor (estado) {
    const colores = {
      borrador: 'grey',
      revision: 'info',
      aprobada: 'success',
      pagada: 'primary',
      cancelada: 'error',
    }
    return colores[estado] || 'grey'
  }

  function getEstadoIcon (estado) {
    const iconos = {
      borrador: 'mdi-file-edit',
      revision: 'mdi-eye',
      aprobada: 'mdi-check-circle',
      pagada: 'mdi-cash-check',
      cancelada: 'mdi-cancel',
    }
    return iconos[estado] || 'mdi-file'
  }

  function getEstadoLabel (estado) {
    const labels = {
      borrador: 'Borrador',
      revision: 'En Revisión',
      aprobada: 'Aprobada',
      pagada: 'Pagada',
      cancelada: 'Cancelada',
    }
    return labels[estado] || estado
  }

  function formatDate (date) {
    if (!date) return '-'
    return format(new Date(date + 'T12:00:00'), 'dd/MM/yyyy', { locale: es })
  }

  function formatCurrency (value) {
    if (!value) return 'Q0.00'
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
    }).format(value)
  }

  function showSnackbar (text, color = 'success') {
    snackbar.text = text
    snackbar.color = color
    snackbar.show = true
  }

  onMounted(() => {
    cargarPlanillas()
  })
</script>

<style scoped>
.planillas-list {
  padding: 24px;
}
</style>
