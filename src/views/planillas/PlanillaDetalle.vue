<template>
  <div class="planilla-detalle">
    <!-- Loading -->
    <div v-if="loading" class="text-center py-10">
      <v-progress-circular color="primary" indeterminate size="64" />
      <p class="mt-4">Cargando planilla...</p>
    </div>

    <!-- Contenido -->
    <div v-else-if="planilla">
      <!-- Header -->
      <div class="d-flex align-center mb-6">
        <v-btn
          icon="mdi-arrow-left"
          variant="text"
          @click="$router.push('/operaciones/planillas')"
        />
        <div class="ml-3">
          <h1 class="text-h4 font-weight-bold mb-1">{{ planilla.nombre_planilla }}</h1>
          <p class="text-body-2 text-medium-emphasis">
            Período: {{ formatDate(planilla.periodo_inicio) }} - {{ formatDate(planilla.periodo_fin) }}
          </p>
        </div>
        <v-spacer />
        <v-chip
          :color="getEstadoColor(planilla.estado_planilla)"
          size="large"
          variant="flat"
        >
          <v-icon start>{{ getEstadoIcon(planilla.estado_planilla) }}</v-icon>
          {{ getEstadoLabel(planilla.estado_planilla) }}
        </v-chip>
      </div>

      <!-- Cards de Resumen -->
      <v-row class="mb-6">
        <v-col cols="12" md="3">
          <v-card color="info-lighten-5" elevation="2" rounded="xl">
            <v-card-text class="pa-4">
              <div class="d-flex align-center mb-2">
                <v-avatar class="mr-3" color="info" size="48">
                  <v-icon color="white" size="28">mdi-account-group</v-icon>
                </v-avatar>
                <div>
                  <div class="text-h4 font-weight-bold text-info">
                    {{ planilla.detalles?.length || 0 }}
                  </div>
                  <div class="text-caption text-medium-emphasis">Empleados</div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="3">
          <v-card color="success-lighten-5" elevation="2" rounded="xl">
            <v-card-text class="pa-4">
              <div class="d-flex align-center mb-2">
                <v-avatar class="mr-3" color="success" size="48">
                  <v-icon color="white" size="28">mdi-cash-plus</v-icon>
                </v-avatar>
                <div>
                  <div class="text-h5 font-weight-bold text-success">
                    {{ formatCurrency(planilla.total_devengado) }}
                  </div>
                  <div class="text-caption text-medium-emphasis">Total Devengado</div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="3">
          <v-card color="error-lighten-5" elevation="2" rounded="xl">
            <v-card-text class="pa-4">
              <div class="d-flex align-center mb-2">
                <v-avatar class="mr-3" color="error" size="48">
                  <v-icon color="white" size="28">mdi-cash-minus</v-icon>
                </v-avatar>
                <div>
                  <div class="text-h5 font-weight-bold text-error">
                    {{ formatCurrency(planilla.total_descuentos) }}
                  </div>
                  <div class="text-caption text-medium-emphasis">Total Descuentos</div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="3">
          <v-card color="primary-lighten-5" elevation="2" rounded="xl">
            <v-card-text class="pa-4">
              <div class="d-flex align-center mb-2">
                <v-avatar class="mr-3" color="primary" size="48">
                  <v-icon color="white" size="28">mdi-cash-check</v-icon>
                </v-avatar>
                <div>
                  <div class="text-h5 font-weight-bold text-primary">
                    {{ formatCurrency(planilla.total_neto) }}
                  </div>
                  <div class="text-caption text-medium-emphasis">Total Neto</div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Acciones -->
      <v-card class="mb-6" elevation="2" rounded="xl">
        <v-card-text class="pa-4">
          <div class="d-flex ga-2 flex-wrap">
            <v-btn
              v-if="planilla.estado_planilla === 'borrador'"
              color="success"
              :loading="loadingAction"
              variant="elevated"
              @click="aprobar"
            >
              <v-icon start>mdi-check-circle</v-icon>
              Aprobar Planilla
            </v-btn>

            <v-btn
              v-if="planilla.estado_planilla === 'aprobada'"
              color="primary"
              :loading="loadingAction"
              variant="elevated"
              @click="marcarPagada"
            >
              <v-icon start>mdi-cash-check</v-icon>
              Marcar como Pagada
            </v-btn>

            <v-btn
              color="success"
              variant="outlined"
              @click="exportar('excel')"
            >
              <v-icon start>mdi-file-excel</v-icon>
              Exportar Excel
            </v-btn>

            <!-- Exportar PDF - Oculto temporalmente -->
            <!--
            <v-btn
              color="error"
              variant="outlined"
              @click="exportar('pdf')"
            >
              <v-icon start>mdi-file-pdf-box</v-icon>
              Exportar PDF
            </v-btn>
            -->

            <v-spacer />

            <v-btn
              v-if="planilla.estado_planilla === 'borrador'"
              color="error"
              variant="text"
              @click="dialogCancelar = true"
            >
              <v-icon start>mdi-cancel</v-icon>
              Cancelar Planilla
            </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <!-- Tabla de Detalle -->
      <v-card elevation="2" rounded="xl">
        <v-card-title class="pa-4 bg-grey-lighten-5">
          <v-icon color="primary" start>mdi-table</v-icon>
          <span class="text-subtitle-1 font-weight-bold">Detalle por Personal</span>
          <v-spacer />
          <v-text-field
            v-model="busqueda"
            clearable
            density="compact"
            hide-details
            label="Buscar"
            prepend-inner-icon="mdi-magnify"
            single-line
            style="max-width: 300px"
            variant="outlined"
          />
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-0">
          <v-data-table
            density="comfortable"
            :headers="headers"
            :items="planilla.detalles || []"
            :items-per-page="15"
            :search="busqueda"
          >
            <!-- Personal -->
            <template #item.personal="{ item }">
              <div>
                <div class="font-weight-bold">
                  {{ item.personal?.nombres }} {{ item.personal?.apellidos }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  DPI: {{ formatDPI(item.personal?.dpi) }}
                </div>
              </div>
            </template>

            <!-- Proyecto -->
            <template #item.proyecto="{ item }">
              <div v-if="item.proyecto">
                <div class="font-weight-medium">{{ item.proyecto.nombre_proyecto }}</div>
                <div class="text-caption text-medium-emphasis">
                  {{ item.proyecto.empresa_cliente }}
                </div>
              </div>
              <span v-else class="text-medium-emphasis">-</span>
            </template>

            <!-- Días trabajados -->
            <template #item.dias_trabajados="{ item }">
              <v-chip color="info" size="small">
                {{ item.dias_trabajados }} días
              </v-chip>
            </template>

            <!-- Horas -->
            <template #item.horas_trabajadas="{ item }">
              <span class="font-weight-medium">{{ item.horas_trabajadas }} hrs</span>
            </template>

            <!-- Devengado -->
            <template #item.salario_devengado="{ item }">
              <span class="text-success font-weight-bold">
                {{ formatCurrency(item.salario_devengado) }}
              </span>
            </template>

            <!-- Descuentos (Expandible) -->
            <template #item.descuentos="{ item }">
              <v-menu>
                <template #activator="{ props }">
                  <v-chip
                    v-bind="props"
                    color="error"
                    size="small"
                    variant="flat"
                  >
                    {{ formatCurrency(item.total_descuentos) }}
                    <v-icon end size="14">mdi-chevron-down</v-icon>
                  </v-chip>
                </template>
                <v-card min-width="250">
                  <v-list density="compact">
                    <v-list-subheader>Desglose de Descuentos</v-list-subheader>
                    <v-list-item v-if="item.descuento_multas > 0">
                      <v-list-item-title>Multas</v-list-item-title>
                      <template #append>
                        <span class="text-error">{{ formatCurrency(item.descuento_multas) }}</span>
                      </template>
                    </v-list-item>
                    <v-list-item v-if="item.descuento_uniformes > 0">
                      <v-list-item-title>Uniformes</v-list-item-title>
                      <template #append>
                        <span class="text-error">{{ formatCurrency(item.descuento_uniformes) }}</span>
                      </template>
                    </v-list-item>
                    <v-list-item v-if="item.descuento_anticipos > 0">
                      <v-list-item-title>Anticipos</v-list-item-title>
                      <template #append>
                        <span class="text-error">{{ formatCurrency(item.descuento_anticipos) }}</span>
                      </template>
                    </v-list-item>
                    <v-list-item v-if="item.descuento_prestamos > 0">
                      <v-list-item-title>Préstamos</v-list-item-title>
                      <template #append>
                        <span class="text-error">{{ formatCurrency(item.descuento_prestamos) }}</span>
                      </template>
                    </v-list-item>
                    <v-list-item v-if="item.descuento_antecedentes > 0">
                      <v-list-item-title>Antecedentes</v-list-item-title>
                      <template #append>
                        <span class="text-error">{{ formatCurrency(item.descuento_antecedentes) }}</span>
                      </template>
                    </v-list-item>
                    <v-list-item v-if="item.otros_descuentos > 0">
                      <v-list-item-title>Otros</v-list-item-title>
                      <template #append>
                        <span class="text-error">{{ formatCurrency(item.otros_descuentos) }}</span>
                      </template>
                    </v-list-item>
                    <v-divider v-if="item.total_descuentos > 0" />
                    <v-list-item v-if="item.total_descuentos === 0">
                      <v-list-item-title class="text-medium-emphasis">Sin descuentos</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-card>
              </v-menu>
            </template>

            <!-- Neto -->
            <template #item.salario_neto="{ item }">
              <span class="text-primary font-weight-bold text-h6">
                {{ formatCurrency(item.salario_neto) }}
              </span>
            </template>

            <!-- Acciones -->
            <template #item.acciones="{ item }">
              <v-btn
                color="primary"
                density="comfortable"
                icon="mdi-eye"
                size="small"
                variant="text"
                @click="verHistorial(item)"
              />
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>

      <!-- Información Adicional -->
      <v-row v-if="planilla.observaciones || planilla.aprobado_por" class="mt-6">
        <v-col cols="12" md="6">
          <v-card v-if="planilla.observaciones" elevation="2" rounded="xl">
            <v-card-title class="pa-4">
              <v-icon start>mdi-note-text</v-icon>
              Observaciones
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-4">
              {{ planilla.observaciones }}
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="6">
          <v-card v-if="planilla.aprobado_por" elevation="2" rounded="xl">
            <v-card-title class="pa-4">
              <v-icon start>mdi-account-check</v-icon>
              Información de Aprobación
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-4">
              <div class="mb-2">
                <span class="text-caption text-medium-emphasis">Aprobado por:</span>
                <div class="font-weight-bold">{{ planilla.aprobado_por.name }}</div>
              </div>
              <div>
                <span class="text-caption text-medium-emphasis">Fecha:</span>
                <div class="font-weight-bold">{{ formatDateTime(planilla.fecha_aprobacion) }}</div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

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
          <v-btn variant="text" @click="dialogCancelar = false">Cancelar</v-btn>
          <v-btn
            color="error"
            :loading="loadingAction"
            variant="elevated"
            @click="cancelar"
          >
            Confirmar Cancelación
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Historial -->
    <v-dialog v-model="dialogHistorial" max-width="900" scrollable>
      <v-card rounded="xl">
        <v-card-title class="pa-4 bg-primary-lighten-5">
          <div class="d-flex align-center">
            <v-icon color="primary" start>mdi-history</v-icon>
            <div>
              <span class="text-primary font-weight-bold">Historial de {{ historialPersonalNombre }}</span>
            </div>
            <v-spacer />
            <v-btn icon="mdi-close" size="small" variant="text" @click="dialogHistorial = false" />
          </div>
        </v-card-title>
        <v-divider />

        <v-card-text class="pa-4">
          <!-- Loading -->
          <div v-if="loadingHistorial" class="text-center py-8">
            <v-progress-circular color="primary" indeterminate size="48" />
            <p class="mt-3 text-medium-emphasis">Cargando historial...</p>
          </div>

          <template v-else-if="historialData">
            <!-- Resumen -->
            <v-row class="mb-4">
              <v-col cols="6" sm="4" md="2">
                <div class="text-center">
                  <div class="text-h5 font-weight-bold text-info">
                    {{ historialData.resumen?.dias_trabajados || 0 }}
                  </div>
                  <div class="text-caption text-medium-emphasis">Días Trabajados</div>
                </div>
              </v-col>
              <v-col cols="6" sm="4" md="2">
                <div class="text-center">
                  <div class="text-h5 font-weight-bold text-error">
                    {{ historialData.resumen?.dias_ausente || 0 }}
                  </div>
                  <div class="text-caption text-medium-emphasis">Días Ausente</div>
                </div>
              </v-col>
              <v-col cols="6" sm="4" md="2">
                <div class="text-center">
                  <div class="text-h5 font-weight-bold text-warning">
                    {{ historialData.resumen?.dias_descanso || 0 }}
                  </div>
                  <div class="text-caption text-medium-emphasis">Días Descanso</div>
                </div>
              </v-col>
              <v-col cols="6" sm="4" md="3">
                <div class="text-center">
                  <div class="text-h6 font-weight-bold text-success">
                    {{ formatCurrency(historialData.resumen?.total_ingresos) }}
                  </div>
                  <div class="text-caption text-medium-emphasis">Ingresos</div>
                </div>
              </v-col>
              <v-col cols="6" sm="4" md="3">
                <div class="text-center">
                  <div class="text-h6 font-weight-bold text-error">
                    {{ formatCurrency(historialData.resumen?.total_descuentos) }}
                  </div>
                  <div class="text-caption text-medium-emphasis">Descuentos</div>
                </div>
              </v-col>
            </v-row>

            <v-divider class="mb-4" />

            <!-- Filtro tipo -->
            <div class="d-flex align-center mb-4">
              <v-btn-toggle
                v-model="tipoHistorial"
                color="primary"
                density="compact"
                mandatory
                rounded="lg"
                variant="outlined"
                @update:model-value="cargarHistorial(historialPersonalId)"
              >
                <v-btn value="todos">Todos</v-btn>
                <v-btn value="asistencia">Asistencias</v-btn>
                <v-btn value="transaccion">Transacciones</v-btn>
              </v-btn-toggle>
            </div>

            <!-- Lista de historial -->
            <v-list v-if="historialData.data?.length" density="compact" lines="three">
              <template v-for="(registro, idx) in historialData.data" :key="idx">
                <v-list-item>
                  <template #prepend>
                    <v-avatar :color="getTipoHistorialColor(registro.tipo)" size="36">
                      <v-icon color="white" size="20">{{ getTipoHistorialIcon(registro.tipo) }}</v-icon>
                    </v-avatar>
                  </template>
                  <v-list-item-title class="font-weight-medium">
                    {{ registro.tipo === 'transaccion' ? registro.tipo_label : getTipoHistorialLabel(registro.tipo) }}
                    <v-chip
                      v-if="registro.estado && registro.tipo !== 'transaccion'"
                      class="ml-2"
                      :color="getEstadoAsistenciaColor(registro.estado)"
                      size="x-small"
                      variant="flat"
                    >
                      {{ registro.estado }}
                    </v-chip>
                    <span v-if="registro.registrado_por" class="text-caption text-medium-emphasis font-weight-regular ml-1">
                      — {{ registro.registrado_por.name }}
                    </span>
                  </v-list-item-title>
                  <v-list-item-subtitle v-if="registro.descripcion">
                    {{ registro.descripcion }}
                  </v-list-item-subtitle>
                  <v-list-item-subtitle class="text-caption">
                    {{ formatDate(registro.fecha) }}
                    <span v-if="registro.hora_entrada"> | {{ registro.hora_entrada }} - {{ registro.hora_salida || '...' }}</span>
                  </v-list-item-subtitle>
                  <template #append>
                    <span
                      v-if="registro.monto != null"
                      class="font-weight-bold"
                      :class="registro.tipo === 'transaccion' ? 'text-error' : (Number(registro.monto) >= 0 ? 'text-success' : 'text-error')"
                    >
                      {{ formatCurrency(Math.abs(registro.monto)) }}
                    </span>
                  </template>
                </v-list-item>
                <v-divider v-if="idx < historialData.data.length - 1" />
              </template>
            </v-list>

            <div v-else class="text-center py-6 text-medium-emphasis">
              <v-icon class="mb-2" size="48">mdi-history</v-icon>
              <p>No se encontraron registros</p>
            </div>
          </template>
        </v-card-text>
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
  import { useRoute, useRouter } from 'vue-router'
  import { usePlanillaStore } from '@/stores/planilla'
  import planillaService from '@/services/planillaService'
  import { formatDPI } from '@/utils/dpiFormatter'

  const route = useRoute()
  const router = useRouter()
  const planillaStore = usePlanillaStore()

  // Estado
  const loading = ref(false)
  const loadingAction = ref(false)
  const planilla = ref(null)
  const busqueda = ref('')
  const dialogCancelar = ref(false)
  const motivoCancelacion = ref('')
  const dialogHistorial = ref(false)
  const historialData = ref(null)
  const loadingHistorial = ref(false)
  const tipoHistorial = ref('todos')
  const historialPersonalNombre = ref('')
  const historialPersonalId = ref(null)

  // Snackbar
  const snackbar = reactive({
    show: false,
    text: '',
    color: 'success',
  })

  // Headers
  const headers = [
    { title: 'Personal', key: 'personal', sortable: true },
    { title: 'Proyecto', key: 'proyecto', sortable: true },
    { title: 'Días', key: 'dias_trabajados', sortable: true, align: 'center' },
    { title: 'Horas', key: 'horas_trabajadas', sortable: true, align: 'center' },
    { title: 'Devengado', key: 'salario_devengado', sortable: true, align: 'end' },
    { title: 'Descuentos', key: 'descuentos', sortable: false, align: 'center' },
    { title: 'Neto', key: 'salario_neto', sortable: true, align: 'end' },
    { title: '', key: 'acciones', sortable: false, width: '60px', align: 'center' },
  ]

  // Funciones
  async function cargarPlanilla () {
    loading.value = true
    try {
      const response = await planillaStore.fetchPlanilla(route.params.id)
      planilla.value = response.data
    } catch {
      showSnackbar('Error al cargar planilla', 'error')
      router.push('/operaciones/planillas')
    } finally {
      loading.value = false
    }
  }

  async function aprobar () {
    if (!confirm('¿Aprobar esta planilla? Esto marcará las transacciones como aplicadas.')) {
      return
    }

    loadingAction.value = true
    try {
      const response = await planillaStore.aprobarPlanilla(route.params.id)
      planilla.value = response.data
      showSnackbar('Planilla aprobada exitosamente', 'success')
    } catch (error) {
      showSnackbar(error.apiMessage || 'Error al aprobar planilla', 'error')
    } finally {
      loadingAction.value = false
    }
  }

  async function marcarPagada () {
    if (!confirm('¿Marcar esta planilla como pagada?')) {
      return
    }

    loadingAction.value = true
    try {
      const response = await planillaStore.marcarPagada(route.params.id)
      planilla.value = response.data
      showSnackbar('Planilla marcada como pagada', 'success')
    } catch (error) {
      showSnackbar(error.apiMessage || 'Error al marcar como pagada', 'error')
    } finally {
      loadingAction.value = false
    }
  }

  async function cancelar () {
    loadingAction.value = true
    try {
      const response = await planillaStore.cancelarPlanilla(route.params.id, motivoCancelacion.value)
      planilla.value = response.data
      dialogCancelar.value = false
      showSnackbar('Planilla cancelada', 'success')
    } catch (error) {
      showSnackbar(error.apiMessage || 'Error al cancelar planilla', 'error')
    } finally {
      loadingAction.value = false
    }
  }

  async function exportar (formato) {
    try {
      await planillaStore.exportarPlanilla(route.params.id, formato)
      showSnackbar(`Exportando planilla a ${formato.toUpperCase()}...`, 'info')
    } catch {
      showSnackbar('Error al exportar planilla', 'error')
    }
  }

  async function verHistorial (item) {
    const personal = item.personal
    historialPersonalNombre.value = personal
      ? `${personal.nombres} ${personal.apellidos}`
      : 'Empleado'
    historialPersonalId.value = personal?.id || item.personal_id
    tipoHistorial.value = 'todos'
    dialogHistorial.value = true
    await cargarHistorial(historialPersonalId.value)
  }

  async function cargarHistorial (personalId) {
    loadingHistorial.value = true
    historialData.value = null
    try {
      const params = {
        planilla_id: route.params.id,
      }
      if (tipoHistorial.value !== 'todos') {
        params.tipo = tipoHistorial.value
      }
      const response = await planillaService.getHistorialPersonal(personalId, params)
      // Response: { success, data: [...items], resumen: {...}, meta: {...} }
      historialData.value = response
    } catch {
      showSnackbar('Error al cargar historial del personal', 'error')
    } finally {
      loadingHistorial.value = false
    }
  }

  function getTipoHistorialLabel (tipo) {
    const labels = {
      asistencia: 'Asistencia',
      transaccion: 'Transacción',
      descuento: 'Descuento',
      ingreso: 'Ingreso',
    }
    return labels[tipo] || tipo
  }

  function getTipoHistorialColor (tipo) {
    const colores = {
      asistencia: 'info',
      transaccion: 'warning',
      descuento: 'error',
      ingreso: 'success',
    }
    return colores[tipo] || 'grey'
  }

  function getTipoHistorialIcon (tipo) {
    const iconos = {
      asistencia: 'mdi-clock-outline',
      transaccion: 'mdi-cash-sync',
      descuento: 'mdi-cash-minus',
      ingreso: 'mdi-cash-plus',
    }
    return iconos[tipo] || 'mdi-file-document'
  }

  function getEstadoAsistenciaColor (estado) {
    const colores = {
      presente: 'success',
      ausente: 'error',
      tardanza: 'warning',
      descanso: 'grey',
      permiso: 'info',
    }
    return colores[estado] || 'grey'
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
    const d = date.includes('T') ? new Date(date) : new Date(date + 'T12:00:00')
    return format(d, 'dd/MM/yyyy', { locale: es })
  }

  function formatDateTime (datetime) {
    if (!datetime) return '-'
    return format(new Date(datetime), 'dd/MM/yyyy \'a las\' HH:mm', { locale: es })
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
    cargarPlanilla()
  })
</script>

<style scoped>
.planilla-detalle {
  padding: 24px;
}
</style>
