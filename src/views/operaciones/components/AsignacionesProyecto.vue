<template>
  <v-card flat>
    <v-card-title class="d-flex align-center px-0">
      <span class="text-h6">Asignaciones de Personal</span>
      <v-spacer />
      <v-btn
        v-if="canManage"
        color="primary"
        prepend-icon="mdi-account-plus"
        variant="elevated"
        @click="openAsignarDialog"
      >
        Asignar Personal
      </v-btn>
    </v-card-title>

    <!-- Resumen de cobertura -->
    <v-row v-if="estadisticas" class="mb-4">
      <v-col cols="12">
        <v-card color="primary" variant="tonal">
          <v-card-text>
            <v-row align="center">
              <v-col cols="auto">
                <v-icon color="primary" size="48">mdi-account-group</v-icon>
              </v-col>
              <v-col>
                <div class="text-h4 font-weight-bold">
                  {{ estadisticas.resumen?.total_asignado || 0 }} / {{ estadisticas.resumen?.total_requerido || 0 }}
                </div>
                <div class="text-body-2">Personal asignado del total requerido</div>
              </v-col>
              <v-col cols="auto">
                <v-progress-circular
                  :color="porcentajeCobertura >= 100 ? 'success' : porcentajeCobertura >= 70 ? 'warning' : 'error'"
                  :model-value="porcentajeCobertura"
                  :size="80"
                  :width="8"
                >
                  <span class="text-h6 font-weight-bold">{{ porcentajeCobertura }}%</span>
                </v-progress-circular>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Desglose por puesto -->
      <v-col v-for="puesto in estadisticas.puestos" :key="puesto.configuracion_id" cols="12" md="4">
        <v-card variant="outlined">
          <v-card-text class="text-center">
            <div class="text-subtitle-2 font-weight-bold">{{ puesto.nombre_puesto }}</div>
            <div class="text-h5 my-2">
              <span :class="puesto.faltantes > 0 ? 'text-warning' : 'text-success'">
                {{ puesto.cantidad_asignada }}
              </span>
              <span class="text-medium-emphasis"> / {{ puesto.cantidad_requerida }}</span>
            </div>
            <v-chip
              :color="puesto.porcentaje_cubierto >= 100 ? 'success' : 'warning'"
              size="small"
            >
              {{ puesto.porcentaje_cubierto.toFixed(0) }}% cubierto
            </v-chip>
            <div v-if="puesto.faltantes > 0" class="text-caption text-warning mt-1">
              Faltan {{ puesto.faltantes }} persona(s)
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Filtros -->
    <v-row class="mb-2" dense>
      <v-col cols="12" md="4">
        <v-select
          v-model="filtroEstado"
          clearable
          density="compact"
          hide-details
          :items="estadosAsignacion"
          label="Estado"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-text-field
          v-model="filtroBusqueda"
          clearable
          density="compact"
          hide-details
          label="Buscar empleado"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
        />
      </v-col>
    </v-row>

    <!-- Tabla de asignaciones -->
    <v-data-table
      :headers="headers"
      hover
      :items="asignacionesFiltradas"
      :items-per-page="10"
      :loading="loading"
    >
      <template #item.personal="{ item }">
        <div>
          <span class="font-weight-medium">{{ item.personal?.nombres }} {{ item.personal?.apellidos }}</span>
          <br>
          <span class="text-caption text-medium-emphasis">{{ formatDPI(item.personal?.dpi) }}</span>
        </div>
      </template>

      <template #item.puesto="{ item }">
        {{ item.configuracionPuesto?.tipo_personal?.nombre || item.configuracionPuesto?.nombre_puesto || 'N/A' }}
      </template>

      <template #item.turno="{ item }">
        {{ item.turno?.nombre || 'N/A' }}
      </template>

      <template #item.fechas="{ item }">
        <div>
          <span>{{ formatDate(item.fecha_inicio) }}</span>
          <span class="text-medium-emphasis"> - </span>
          <span>{{ item.fecha_fin ? formatDate(item.fecha_fin) : 'Indefinido' }}</span>
        </div>
      </template>

      <template #item.estado_asignacion="{ item }">
        <v-chip
          :color="getEstadoColor(item.estado_asignacion)"
          label
          size="small"
        >
          {{ item.estado_asignacion }}
        </v-chip>
      </template>

      <template #item.actions="{ item }">
        <v-menu>
          <template #activator="{ props }">
            <v-btn icon="mdi-dots-vertical" size="small" variant="text" v-bind="props" />
          </template>
          <v-list density="compact">
            <v-list-item
              v-if="item.estado_asignacion === 'activa'"
              prepend-icon="mdi-pause-circle"
              title="Suspender"
              @click="openSuspenderDialog(item)"
            />
            <v-list-item
              v-if="item.estado_asignacion === 'suspendida'"
              prepend-icon="mdi-play-circle"
              title="Reactivar"
              @click="reactivarAsignacion(item)"
            />
            <v-list-item
              v-if="item.estado_asignacion === 'activa'"
              prepend-icon="mdi-check-circle"
              title="Finalizar"
              @click="openFinalizarDialog(item)"
            />
            <v-divider v-if="canDelete" />
            <v-list-item
              v-if="canDelete"
              class="text-error"
              prepend-icon="mdi-delete"
              title="Eliminar"
              @click="confirmDelete(item)"
            />
          </v-list>
        </v-menu>
      </template>

      <template #no-data>
        <div class="text-center pa-8">
          <v-icon class="mb-4" color="grey-lighten-1" size="64">mdi-account-off</v-icon>
          <div class="text-h6 text-medium-emphasis">Sin asignaciones</div>
          <div class="text-body-2 text-medium-emphasis mb-4">
            No hay personal asignado a este proyecto
          </div>
          <v-btn
            v-if="canManage"
            color="primary"
            prepend-icon="mdi-account-plus"
            variant="tonal"
            @click="openAsignarDialog"
          >
            Asignar Personal
          </v-btn>
        </div>
      </template>
    </v-data-table>

    <!-- Dialog Asignar Personal -->
    <AsignarPersonalForm
      v-model="dialogAsignar"
      :proyecto-id="proyectoId"
      @saved="onAsignacionSaved"
    />

    <!-- Dialog Suspender -->
    <v-dialog v-model="dialogSuspender" max-width="500px">
      <v-card rounded="xl">
        <v-card-title class="text-h6">Suspender Asignación</v-card-title>
        <v-card-text>
          <v-textarea
            v-model="motivoSuspension"
            label="Motivo de suspensión *"
            rows="3"
            :rules="[v => !!v || 'El motivo es requerido']"
            variant="outlined"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeSuspenderDialog">Cancelar</v-btn>
          <v-btn
            color="warning"
            :disabled="!motivoSuspension"
            :loading="actionLoading"
            variant="elevated"
            @click="suspenderAsignacion"
          >
            Suspender
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Finalizar -->
    <v-dialog v-model="dialogFinalizar" max-width="500px">
      <v-card rounded="xl">
        <v-card-title class="text-h6">Finalizar Asignación</v-card-title>
        <v-card-text>
          <p class="text-body-2 mb-4">
            ¿Está seguro de finalizar esta asignación? La fecha de fin se establecerá como hoy.
          </p>
          <v-textarea
            v-model="motivoFinalizacion"
            label="Motivo (opcional)"
            rows="2"
            variant="outlined"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeFinalizarDialog">Cancelar</v-btn>
          <v-btn
            color="primary"
            :loading="actionLoading"
            variant="elevated"
            @click="finalizarAsignacion"
          >
            Finalizar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Confirmar Eliminar -->
    <v-dialog v-model="dialogDelete" max-width="400px">
      <v-card rounded="xl">
        <v-card-title class="text-h6">¿Eliminar asignación?</v-card-title>
        <v-card-text>
          Esta acción no se puede deshacer. Solo se puede eliminar si no tiene registros de asistencia.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDelete">Cancelar</v-btn>
          <v-btn color="error" :loading="actionLoading" variant="elevated" @click="deleteItemConfirm">
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
  import { format } from 'date-fns'
  import { es } from 'date-fns/locale'
  import { computed, onMounted, ref, watch } from 'vue'
  import { useAuthStore } from '@/stores/auth'
  import { useOperacionesStore } from '@/stores/operaciones'
  import { formatDPI } from '@/utils/dpiFormatter'
  import AsignarPersonalForm from './AsignarPersonalForm.vue'

  const props = defineProps({
    proyectoId: {
      type: [Number, String],
      required: true,
    },
  })

  const operacionesStore = useOperacionesStore()
  const authStore = useAuthStore()

  // Permisos
  const canManage = computed(() => authStore.hasPermission('manage-operaciones'))
  const canDelete = computed(() => authStore.hasPermission('delete-operaciones'))

  // Estado
  const loading = ref(false)
  const actionLoading = ref(false)
  const asignaciones = ref([])
  const estadisticas = ref(null)

  // Dialogs
  const dialogAsignar = ref(false)
  const dialogSuspender = ref(false)
  const dialogFinalizar = ref(false)
  const dialogDelete = ref(false)

  // Item seleccionado para acciones
  const selectedItem = ref(null)
  const motivoSuspension = ref('')
  const motivoFinalizacion = ref('')

  // Filtros
  const filtroEstado = ref(null)
  const filtroBusqueda = ref('')

  const estadosAsignacion = [
    { title: 'Activa', value: 'activa' },
    { title: 'Suspendida', value: 'suspendida' },
    { title: 'Finalizada', value: 'finalizada' },
  ]

  // Headers tabla
  const headers = computed(() => {
    const baseHeaders = [
      { title: 'Empleado', key: 'personal', sortable: true },
      { title: 'Tipo Personal', key: 'puesto', sortable: true },
      { title: 'Turno', key: 'turno', sortable: true },
      { title: 'Período', key: 'fechas', sortable: true },
      { title: 'Estado', key: 'estado_asignacion', sortable: true },
    ]
    if (canManage.value) {
      baseHeaders.push({ title: '', key: 'actions', sortable: false, width: '50px' })
    }
    return baseHeaders
  })

  // Computed
  const porcentajeCobertura = computed(() => {
    if (!estadisticas.value?.resumen) return 0
    const { total_asignado, total_requerido } = estadisticas.value.resumen
    if (!total_requerido) return 0
    return Math.round((total_asignado / total_requerido) * 100)
  })

  const asignacionesFiltradas = computed(() => {
    let resultado = asignaciones.value

    if (filtroEstado.value) {
      resultado = resultado.filter(a => a.estado_asignacion === filtroEstado.value)
    }

    if (filtroBusqueda.value) {
      const busqueda = filtroBusqueda.value.toLowerCase()
      resultado = resultado.filter(a =>
        `${a.personal?.nombres} ${a.personal?.apellidos}`.toLowerCase().includes(busqueda)
        || a.personal?.dpi?.includes(busqueda),
      )
    }

    return resultado
  })

  // Funciones
  async function loadData () {
    loading.value = true
    try {
      // Cargar asignaciones del proyecto
      operacionesStore.setFilters({ proyecto_id: props.proyectoId })
      await operacionesStore.fetchAsignaciones(true)
      asignaciones.value = operacionesStore.asignaciones

      // Cargar estadísticas
      await operacionesStore.fetchEstadisticasProyecto(props.proyectoId)
      estadisticas.value = operacionesStore.estadisticasProyecto
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      loading.value = false
    }
  }

  function formatDate (date) {
    if (!date) return '-'
    return format(new Date(date), 'dd/MM/yyyy', { locale: es })
  }

  function getEstadoColor (estado) {
    const colors = {
      activa: 'success',
      suspendida: 'warning',
      finalizada: 'grey',
    }
    return colors[estado] || 'grey'
  }

  function openAsignarDialog () {
    dialogAsignar.value = true
  }

  async function onAsignacionSaved () {
    await loadData()
  }

  function openSuspenderDialog (item) {
    selectedItem.value = item
    motivoSuspension.value = ''
    dialogSuspender.value = true
  }

  function closeSuspenderDialog () {
    dialogSuspender.value = false
    selectedItem.value = null
    motivoSuspension.value = ''
  }

  async function suspenderAsignacion () {
    if (!selectedItem.value || !motivoSuspension.value) return

    actionLoading.value = true
    try {
      await operacionesStore.suspenderAsignacion(selectedItem.value.id, motivoSuspension.value)
      await loadData()
      closeSuspenderDialog()
    } catch (error) {
      console.error('Error suspending:', error)
    } finally {
      actionLoading.value = false
    }
  }

  async function reactivarAsignacion (item) {
    actionLoading.value = true
    try {
      await operacionesStore.reactivarAsignacion(item.id)
      await loadData()
    } catch (error) {
      console.error('Error reactivating:', error)
    } finally {
      actionLoading.value = false
    }
  }

  function openFinalizarDialog (item) {
    selectedItem.value = item
    motivoFinalizacion.value = ''
    dialogFinalizar.value = true
  }

  function closeFinalizarDialog () {
    dialogFinalizar.value = false
    selectedItem.value = null
    motivoFinalizacion.value = ''
  }

  async function finalizarAsignacion () {
    if (!selectedItem.value) return

    actionLoading.value = true
    try {
      await operacionesStore.finalizarAsignacion(selectedItem.value.id, motivoFinalizacion.value || null)
      await loadData()
      closeFinalizarDialog()
    } catch (error) {
      console.error('Error finalizing:', error)
    } finally {
      actionLoading.value = false
    }
  }

  function confirmDelete (item) {
    selectedItem.value = item
    dialogDelete.value = true
  }

  function closeDelete () {
    dialogDelete.value = false
    selectedItem.value = null
  }

  async function deleteItemConfirm () {
    if (!selectedItem.value) return

    actionLoading.value = true
    try {
      await operacionesStore.deleteAsignacion(selectedItem.value.id)
      await loadData()
      closeDelete()
    } catch (error) {
      console.error('Error deleting:', error)
    } finally {
      actionLoading.value = false
    }
  }

  // Watchers
  watch(() => props.proyectoId, () => {
    if (props.proyectoId) {
      loadData()
    }
  })

  onMounted(() => {
    if (props.proyectoId) {
      loadData()
    }
  })
</script>
