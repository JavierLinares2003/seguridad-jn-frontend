<template>
  <v-container class="pa-4" fluid>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col>
        <h1 class="text-h4">Control de Asistencia</h1>
        <p class="text-body-2 text-medium-emphasis">
          Registre la asistencia diaria del personal asignado
        </p>
      </v-col>
    </v-row>

    <!-- Filtros -->
    <v-card class="mb-4" elevation="2" rounded="xl">
      <v-card-text>
        <v-row align="center">
          <!-- Selector de Proyecto -->
          <v-col cols="12" md="4">
            <v-select
              v-model="selectedProyecto"
              density="comfortable"
              item-title="nombre_proyecto"
              item-value="id"
              :items="proyectos"
              label="Proyecto"
              :loading="loadingProyectos"
              prepend-inner-icon="mdi-briefcase"
              variant="outlined"
              @update:model-value="onProyectoChange"
            >
              <template #item="{ props, item }">
                <v-list-item v-bind="props">
                  <template #subtitle>
                    {{ item.raw.correlativo }}
                  </template>
                </v-list-item>
              </template>
            </v-select>
          </v-col>

          <!-- Date Picker -->
          <v-col cols="12" md="3">
            <v-text-field
              v-model="selectedDate"
              density="comfortable"
              label="Fecha"
              prepend-inner-icon="mdi-calendar"
              type="date"
              variant="outlined"
              @update:model-value="onDateChange"
            />
          </v-col>

          <!-- Botón Cargar -->
          <v-col cols="12" md="2">
            <v-btn
              block
              color="primary"
              :disabled="selectedProyecto === null || !selectedDate"
              :loading="loading"
              variant="elevated"
              @click="cargarAsistencia"
            >
              <v-icon start>mdi-magnify</v-icon>
              Cargar
            </v-btn>
          </v-col>

          <v-spacer />

          <!-- Botón Generar Descansos -->
          <v-col class="text-right" cols="12" md="3">
            <v-btn
              color="secondary"
              :disabled="!selectedProyecto"
              variant="tonal"
              @click="dialogDescansos = true"
            >
              <v-icon start>mdi-calendar-refresh</v-icon>
              Generar Descansos
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Resumen del día -->
    <v-row v-if="asistenciaData.length > 0" class="mb-4">
      <v-col cols="6" sm="3">
        <v-card color="success" variant="tonal">
          <v-card-text class="text-center">
            <div class="text-h4 font-weight-bold">{{ resumenDia.presentes }}</div>
            <div class="text-caption">Presentes</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card color="info" variant="tonal">
          <v-card-text class="text-center">
            <div class="text-h4 font-weight-bold">{{ resumenDia.descansos }}</div>
            <div class="text-caption">Descansos</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card color="warning" variant="tonal">
          <v-card-text class="text-center">
            <div class="text-h4 font-weight-bold">{{ resumenDia.tardanzas }}</div>
            <div class="text-caption">Tardanzas</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card color="purple" variant="tonal">
          <v-card-text class="text-center">
            <div class="text-h4 font-weight-bold">{{ resumenDia.reemplazos }}</div>
            <div class="text-caption">Reemplazos</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Tabla de Asistencia -->
    <v-card elevation="2" rounded="xl">
      <v-card-title class="d-flex align-center">
        <v-icon start>mdi-clipboard-check</v-icon>
        Registro de Asistencia
        <v-chip v-if="selectedDate" class="ml-2" color="primary" size="small">
          {{ formatDateDisplay(selectedDate) }}
        </v-chip>
        <v-spacer />
        <v-btn
          v-if="asistenciaData.length > 0 && hasChanges"
          color="success"
          :loading="saving"
          variant="elevated"
          @click="guardarAsistencia"
        >
          <v-icon start>mdi-content-save</v-icon>
          Guardar Cambios
        </v-btn>
      </v-card-title>

      <v-card-text class="pa-0">
        <v-data-table
          class="asistencia-table"
          density="comfortable"
          :headers="headers"
          :items="asistenciaData"
          :items-per-page="-1"
          :loading="loading"
        >
          <!-- Personal -->
          <template #item.personal="{ item }">
            <div class="d-flex align-center py-2">
              <v-avatar class="mr-3" color="primary" size="36">
                <span class="text-white text-caption font-weight-bold">
                  {{ getInitials(item.asignacion?.personal) }}
                </span>
              </v-avatar>
              <div>
                <div class="font-weight-medium">
                  {{ item.asignacion?.personal?.nombres }} {{ item.asignacion?.personal?.apellidos }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ item.asignacion?.personal?.dpi }}
                </div>
              </div>
            </div>
          </template>

          <!-- Tipo Personal -->
          <template #item.tipo_personal="{ item }">
            <span class="text-body-2">{{ item.asignacion?.tipo_personal || item.asignacion?.puesto || 'N/A' }}</span>
          </template>

          <!-- Turno -->
          <template #item.turno="{ item }">
            <v-chip color="secondary" size="small" variant="tonal">
              {{ item.asignacion?.turno?.nombre || 'N/A' }}
            </v-chip>
          </template>

          <!-- Estado (Radio buttons) -->
          <template #item.estado="{ item }">
            <v-btn-toggle
              v-model="item.estadoLocal"
              color="primary"
              density="compact"
              mandatory
              @update:model-value="onEstadoChange(item)"
            >
              <v-btn :color="item.estadoLocal === 'presente' ? 'success' : ''" size="small" value="presente">
                <v-icon size="small">mdi-check</v-icon>
                <v-tooltip activator="parent">Presente</v-tooltip>
              </v-btn>
              <v-btn :color="item.estadoLocal === 'descanso' ? 'info' : ''" size="small" value="descanso">
                <v-icon size="small">mdi-sleep</v-icon>
                <v-tooltip activator="parent">Descanso</v-tooltip>
              </v-btn>
              <v-btn :color="item.estadoLocal === 'reemplazo' ? 'purple' : ''" size="small" value="reemplazo">
                <v-icon size="small">mdi-account-switch</v-icon>
                <v-tooltip activator="parent">Reemplazo</v-tooltip>
              </v-btn>
            </v-btn-toggle>

            <!-- Indicador de descanso automático -->
            <v-chip
              v-if="item.descansoAutomatico"
              class="ml-2"
              color="info"
              size="x-small"
              variant="outlined"
            >
              Auto
            </v-chip>
          </template>

          <!-- Hora Entrada -->
          <template #item.hora_entrada="{ item }">
            <v-text-field
              v-model="item.horaEntradaLocal"
              density="compact"
              :disabled="item.estadoLocal !== 'presente'"
              hide-details
              style="max-width: 120px;"
              type="time"
              variant="outlined"
              @update:model-value="markChanged(item)"
            />
          </template>

          <!-- Hora Salida -->
          <template #item.hora_salida="{ item }">
            <v-text-field
              v-model="item.horaSalidaLocal"
              density="compact"
              :disabled="item.estadoLocal !== 'presente'"
              hide-details
              style="max-width: 120px;"
              type="time"
              variant="outlined"
              @update:model-value="markChanged(item)"
            />
          </template>

          <!-- Tardanza -->
          <template #item.tardanza="{ item }">
            <div class="d-flex align-center">
              <v-checkbox
                v-model="item.llegoTardeLocal"
                density="compact"
                :disabled="item.estadoLocal !== 'presente'"
                hide-details
                @update:model-value="markChanged(item)"
              />
              <v-text-field
                v-if="item.llegoTardeLocal"
                v-model.number="item.minutosRetrasoLocal"
                density="compact"
                hide-details
                min="1"
                style="max-width: 80px;"
                suffix="min"
                type="number"
                variant="outlined"
                @update:model-value="markChanged(item)"
              />
            </div>
          </template>

          <!-- Reemplazo info -->
          <template #item.reemplazo="{ item }">
            <div v-if="item.estadoLocal === 'reemplazo'">
              <v-btn
                color="purple"
                size="small"
                variant="tonal"
                @click="openReemplazoDialog(item)"
              >
                <v-icon size="small" start>mdi-account-switch</v-icon>
                {{ item.reemplazoLocal ? 'Cambiar' : 'Seleccionar' }}
              </v-btn>
              <div v-if="item.reemplazoLocal" class="text-caption mt-1">
                {{ item.reemplazoLocal.nombres }} {{ item.reemplazoLocal.apellidos }}
              </div>
            </div>
            <span v-else class="text-medium-emphasis">-</span>
          </template>

          <!-- Observaciones -->
          <template #item.observaciones="{ item }">
            <v-text-field
              v-model="item.observacionesLocal"
              density="compact"
              hide-details
              placeholder="Observaciones..."
              style="min-width: 150px;"
              variant="outlined"
              @update:model-value="markChanged(item)"
            />
          </template>

          <!-- Estado indicador -->
          <template #item.status="{ item }">
            <v-icon
              v-if="item.changed"
              color="warning"
              size="small"
            >
              mdi-circle
            </v-icon>
            <v-icon
              v-else-if="item.asistencia?.id"
              color="success"
              size="small"
            >
              mdi-check-circle
            </v-icon>
            <v-icon
              v-else
              color="grey"
              size="small"
            >
              mdi-circle-outline
            </v-icon>
          </template>

          <!-- Acciones -->
          <template #item.acciones="{ item }">
            <v-menu>
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-dots-vertical"
                  size="small"
                  variant="text"
                />
              </template>
              <v-list density="compact">
                <v-list-item @click="abrirTransacciones(item)">
                  <template #prepend>
                    <v-icon size="20">mdi-cash-minus</v-icon>
                  </template>
                  <v-list-item-title>Registrar Transacción</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </template>

          <!-- No data -->
          <template #no-data>
            <div class="text-center pa-8">
              <v-icon class="mb-4" color="grey-lighten-1" size="64">mdi-clipboard-text-clock</v-icon>
              <div class="text-h6 text-medium-emphasis">Sin datos de asistencia</div>
              <div class="text-body-2 text-medium-emphasis">
                Seleccione un proyecto y una fecha para cargar la asistencia
              </div>
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Dialog Seleccionar Reemplazo -->
    <v-dialog v-model="dialogReemplazo" max-width="600px">
      <v-card rounded="xl">
        <v-card-title class="bg-purple pa-4">
          <v-icon color="white" start>mdi-account-switch</v-icon>
          <span class="text-white">Seleccionar Reemplazo</span>
        </v-card-title>

        <v-card-text class="pa-4">
          <v-text-field
            v-model="filtroReemplazo"
            class="mb-4"
            clearable
            density="compact"
            label="Buscar personal"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
          />

          <v-text-field
            v-model="motivoReemplazo"
            class="mb-4"
            density="comfortable"
            label="Motivo del reemplazo *"
            variant="outlined"
          />

          <v-list v-if="reemplazosDisponiblesFiltrados.length > 0" class="border rounded" density="compact">
            <v-list-item
              v-for="persona in reemplazosDisponiblesFiltrados"
              :key="persona.id"
              :value="persona.id"
              @click="selectReemplazo(persona)"
            >
              <template #prepend>
                <v-avatar color="secondary" size="36">
                  <span class="text-white text-caption">
                    {{ persona.nombres?.charAt(0) }}{{ persona.apellidos?.charAt(0) }}
                  </span>
                </v-avatar>
              </template>
              <v-list-item-title>{{ persona.nombres }} {{ persona.apellidos }}</v-list-item-title>
              <v-list-item-subtitle>{{ persona.dpi }}</v-list-item-subtitle>
              <template #append>
                <v-icon v-if="selectedReemplazoItem?.reemplazoLocal?.id === persona.id" color="success">
                  mdi-check-circle
                </v-icon>
              </template>
            </v-list-item>
          </v-list>

          <v-alert v-else density="compact" type="info" variant="tonal">
            No hay personal disponible para reemplazo en esta fecha
          </v-alert>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="closeReemplazoDialog">Cancelar</v-btn>
          <v-btn
            color="purple"
            :disabled="!selectedReemplazoItem?.reemplazoLocal || !motivoReemplazo"
            variant="elevated"
            @click="confirmarReemplazo"
          >
            Confirmar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Generar Descansos -->
    <v-dialog v-model="dialogDescansos" max-width="400px">
      <v-card rounded="xl">
        <v-card-title class="bg-secondary pa-4">
          <v-icon color="white" start>mdi-calendar-refresh</v-icon>
          <span class="text-white">Generar Descansos Automáticos</span>
        </v-card-title>

        <v-card-text class="pa-4">
          <p class="text-body-2 mb-4">
            Genere los descansos programados para el rango de fechas seleccionado.
          </p>

          <v-text-field
            v-model="descansoFechaInicio"
            class="mb-3"
            density="comfortable"
            label="Fecha Inicio"
            type="date"
            variant="outlined"
          />

          <v-text-field
            v-model="descansoFechaFin"
            density="comfortable"
            label="Fecha Fin"
            type="date"
            variant="outlined"
          />
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="dialogDescansos = false">Cancelar</v-btn>
          <v-btn
            color="secondary"
            :disabled="!descansoFechaInicio || !descansoFechaFin"
            :loading="generandoDescansos"
            variant="elevated"
            @click="ejecutarGenerarDescansos"
          >
            Generar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Transacciones -->
    <v-dialog v-model="dialogTransaccion" max-width="900" persistent>
      <v-card rounded="xl">
        <v-card-title class="bg-primary pa-4">
          <v-icon color="white" start>mdi-cash-minus</v-icon>
          <span class="text-white">Registrar Transacción</span>
          <v-spacer />
          <v-btn color="white" icon="mdi-close" variant="text" @click="dialogTransaccion = false" />
        </v-card-title>
        <v-card-text class="pa-6">
          <TransaccionesPersonal
            v-if="selectedPersonalItem"
            :asistencia-id="selectedPersonalItem.asistencia?.id"
            :personal-id="selectedPersonalItem.asignacion?.personal?.id"
            @saved="onTransaccionSaved"
          />
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="3000">
      {{ snackbarText }}
      <template #actions>
        <v-btn variant="text" @click="snackbar = false">Cerrar</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
  import { format } from 'date-fns'
  import { es } from 'date-fns/locale'
  import { computed, onMounted, ref } from 'vue'
  import TransaccionesPersonal from '@/components/personal/TransaccionesPersonal.vue'
  import { useOperacionesStore } from '@/stores/operaciones'
  import { useProyectosStore } from '@/stores/proyectos'

  const operacionesStore = useOperacionesStore()
  const proyectosStore = useProyectosStore()

  // Estado
  const loading = ref(false)
  const saving = ref(false)
  const loadingProyectos = ref(false)
  const generandoDescansos = ref(false)

  // Datos
  const proyectos = ref([])
  const selectedProyecto = ref(null)
  const selectedDate = ref(new Date().toISOString().split('T')[0])
  const asistenciaData = ref([])

  // Dialogs
  const dialogReemplazo = ref(false)
  const dialogDescansos = ref(false)
  const selectedReemplazoItem = ref(null)
  const filtroReemplazo = ref('')
  const motivoReemplazo = ref('')

  // Dialog transacciones
  const dialogTransaccion = ref(false)
  const selectedPersonalItem = ref(null)

  // Descansos
  const descansoFechaInicio = ref(null)
  const descansoFechaFin = ref(null)

  // Snackbar
  const snackbar = ref(false)
  const snackbarText = ref('')
  const snackbarColor = ref('success')

  // Headers de la tabla
  const headers = [
    { title: 'Personal', key: 'personal', sortable: true, width: '200px' },
    { title: 'Tipo Personal', key: 'tipo_personal', sortable: true },
    { title: 'Turno', key: 'turno', sortable: true },
    { title: 'Estado', key: 'estado', sortable: false, width: '180px' },
    { title: 'Entrada', key: 'hora_entrada', sortable: false, width: '130px' },
    { title: 'Salida', key: 'hora_salida', sortable: false, width: '130px' },
    { title: 'Tardanza', key: 'tardanza', sortable: false, width: '140px' },
    { title: 'Reemplazo', key: 'reemplazo', sortable: false, width: '150px' },
    { title: 'Observaciones', key: 'observaciones', sortable: false },
    { title: '', key: 'status', sortable: false, width: '40px' },
    { title: '', key: 'acciones', sortable: false, width: '60px' },
  ]

  // Computed
  const hasChanges = computed(() => {
    return asistenciaData.value.some(item => item.changed)
  })

  const resumenDia = computed(() => {
    const data = asistenciaData.value
    return {
      presentes: data.filter(i => i.estadoLocal === 'presente').length,
      descansos: data.filter(i => i.estadoLocal === 'descanso').length,
      tardanzas: data.filter(i => i.llegoTardeLocal).length,
      reemplazos: data.filter(i => i.estadoLocal === 'reemplazo').length,
    }
  })

  const reemplazosDisponiblesFiltrados = computed(() => {
    let resultado = operacionesStore.reemplazosDisponibles || []

    if (filtroReemplazo.value) {
      const busqueda = filtroReemplazo.value.toLowerCase()
      resultado = resultado.filter(p =>
        `${p.nombres} ${p.apellidos}`.toLowerCase().includes(busqueda)
        || p.dpi?.includes(busqueda),
      )
    }

    return resultado
  })

  // Funciones
  async function loadProyectos () {
    loadingProyectos.value = true
    try {
      await proyectosStore.fetchAll(true)
      proyectos.value = [
        { id: 0, nombre_proyecto: 'Sin Asignación', estado_proyecto: 'activo' },
        ...proyectosStore.items.filter(p => ['activo', 'planificacion'].includes(p.estado_proyecto)),
      ]
    } catch (error) {
      console.error('Error loading proyectos:', error)
    } finally {
      loadingProyectos.value = false
    }
  }

  function onProyectoChange () {
    asistenciaData.value = []
  }

  function onDateChange () {
    asistenciaData.value = []
  }

  async function cargarAsistencia () {
    if (selectedProyecto.value === null || !selectedDate.value) return

    loading.value = true
    try {
      const response = await operacionesStore.fetchAsistenciaPorFecha(selectedDate.value, selectedProyecto.value)

      // Mapear datos para la tabla
      asistenciaData.value = (response || []).map(item => ({
        ...item,
        tipo_personal: item.asignacion?.tipo_personal,
        // Estado local para edición
        estadoLocal: determinarEstado(item.asistencia),
        horaEntradaLocal: item.asistencia?.hora_entrada || '',
        horaSalidaLocal: item.asistencia?.hora_salida || '',
        llegoTardeLocal: item.asistencia?.llego_tarde || false,
        minutosRetrasoLocal: item.asistencia?.minutos_retraso || 0,
        observacionesLocal: item.asistencia?.observaciones || '',
        reemplazoLocal: item.asistencia?.personal_reemplazo || null,
        motivoReemplazoLocal: item.asistencia?.motivo_reemplazo || '',
        descansoAutomatico: item.asistencia?.descanso_automatico || false,
        changed: false,
      }))
    } catch (error) {
      console.error('Error cargando asistencia:', error)
      showSnackbar('Error al cargar la asistencia', 'error')
    } finally {
      loading.value = false
    }
  }

  function determinarEstado (asistencia) {
    if (!asistencia || asistencia.estado === 'sin_registro') return 'presente'
    if (asistencia.es_descanso) return 'descanso'
    if (asistencia.fue_reemplazado) return 'reemplazo'
    return 'presente'
  }

  function onEstadoChange (item) {
    item.changed = true

    // Reset campos según estado
    if (item.estadoLocal === 'descanso') {
      item.horaEntradaLocal = ''
      item.horaSalidaLocal = ''
      item.llegoTardeLocal = false
      item.minutosRetrasoLocal = 0
      item.reemplazoLocal = null
      item.motivoReemplazoLocal = ''
    } else if (item.estadoLocal === 'reemplazo') {
      item.horaEntradaLocal = ''
      item.horaSalidaLocal = ''
      item.llegoTardeLocal = false
      item.minutosRetrasoLocal = 0
    } else {
      item.reemplazoLocal = null
      item.motivoReemplazoLocal = ''
    }
  }

  function markChanged (item) {
    item.changed = true
  }

  async function openReemplazoDialog (item) {
    selectedReemplazoItem.value = item
    motivoReemplazo.value = item.motivoReemplazoLocal || ''
    filtroReemplazo.value = ''

    // Cargar reemplazos disponibles
    try {
      await operacionesStore.fetchReemplazosDisponibles(selectedDate.value)
    } catch (error) {
      console.error('Error cargando reemplazos:', error)
    }

    dialogReemplazo.value = true
  }

  function selectReemplazo (persona) {
    if (selectedReemplazoItem.value) {
      selectedReemplazoItem.value.reemplazoLocal = persona
    }
  }

  function confirmarReemplazo () {
    if (selectedReemplazoItem.value) {
      selectedReemplazoItem.value.motivoReemplazoLocal = motivoReemplazo.value
      selectedReemplazoItem.value.changed = true
    }
    closeReemplazoDialog()
  }

  function closeReemplazoDialog () {
    dialogReemplazo.value = false
    selectedReemplazoItem.value = null
    motivoReemplazo.value = ''
  }

  async function guardarAsistencia () {
    const itemsToSave = asistenciaData.value.filter(item => item.changed)

    if (itemsToSave.length === 0) {
      showSnackbar('No hay cambios para guardar', 'info')
      return
    }

    saving.value = true
    try {
      const asistencias = itemsToSave.map(item => {
        const registro = {
          personal_asignado_id: item.asignacion.id,
          fecha_asistencia: selectedDate.value,
        }

        if (item.estadoLocal === 'descanso') {
          registro.es_descanso = true
        } else if (item.estadoLocal === 'reemplazo') {
          registro.fue_reemplazado = true
          registro.personal_reemplazo_id = item.reemplazoLocal?.id
          registro.motivo_reemplazo = item.motivoReemplazoLocal
        } else {
          registro.hora_entrada = item.horaEntradaLocal || null
          registro.hora_salida = item.horaSalidaLocal || null
          registro.llego_tarde = item.llegoTardeLocal
          registro.minutos_retraso = item.llegoTardeLocal ? item.minutosRetrasoLocal : 0
        }

        registro.observaciones = item.observacionesLocal || null

        return registro
      })

      await operacionesStore.registrarAsistencia(asistencias)

      // Marcar como guardado
      for (const item of itemsToSave) {
        item.changed = false
      }

      showSnackbar('Asistencia guardada correctamente', 'success')

      // Recargar datos
      await cargarAsistencia()
    } catch (error) {
      console.error('Error guardando asistencia:', error)
      showSnackbar(error.apiMessage || 'Error al guardar la asistencia', 'error')
    } finally {
      saving.value = false
    }
  }

  async function ejecutarGenerarDescansos () {
    if (!descansoFechaInicio.value || !descansoFechaFin.value) return

    generandoDescansos.value = true
    try {
      await operacionesStore.generarDescansos(descansoFechaInicio.value, descansoFechaFin.value)
      showSnackbar('Descansos generados correctamente', 'success')
      dialogDescansos.value = false

      // Recargar asistencia si hay fecha seleccionada
      if (selectedProyecto.value && selectedDate.value) {
        await cargarAsistencia()
      }
    } catch (error) {
      console.error('Error generando descansos:', error)
      showSnackbar(error.apiMessage || 'Error al generar descansos', 'error')
    } finally {
      generandoDescansos.value = false
    }
  }

  function getInitials (personal) {
    if (!personal) return '?'
    return `${personal.nombres?.charAt(0) || ''}${personal.apellidos?.charAt(0) || ''}`
  }

  function formatDateDisplay (date) {
    if (!date) return ''
    return format(new Date(date + 'T12:00:00'), 'EEEE d \'de\' MMMM, yyyy', { locale: es })
  }

  function showSnackbar (text, color = 'success') {
    snackbarText.value = text
    snackbarColor.value = color
    snackbar.value = true
  }

  function abrirTransacciones (item) {
    selectedPersonalItem.value = item
    dialogTransaccion.value = true
  }

  function onTransaccionSaved () {
    dialogTransaccion.value = false
    selectedPersonalItem.value = null
    showSnackbar('Transacción registrada exitosamente', 'success')
  }

  onMounted(async () => {
    await loadProyectos()

    // Inicializar fechas de descansos
    const today = new Date()
    descansoFechaInicio.value = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
    descansoFechaFin.value = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]
  })
</script>

<style scoped>
.asistencia-table :deep(.v-data-table__tr:hover) {
  background-color: rgba(var(--v-theme-primary), 0.04);
}

.asistencia-table :deep(th) {
  background-color: rgb(var(--v-theme-surface)) !important;
  font-weight: 600 !important;
}
</style>
