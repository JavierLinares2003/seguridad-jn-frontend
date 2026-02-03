<template>
  <div>
    <!-- Formulario de Nueva Transacción -->
    <v-card v-if="!readonly" class="mb-6" elevation="2" rounded="xl">
      <v-card-title class="d-flex align-center bg-grey-lighten-5 py-4 px-6">
        <v-icon color="primary" start>mdi-cash-plus</v-icon>
        <span class="text-subtitle-1 font-weight-bold">Registrar Transacción</span>
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-6">
        <v-form ref="formRef" @submit.prevent="guardarTransaccion">
          <v-row>
            <v-col cols="12" md="6">
              <v-select
                v-model="form.tipo_transaccion"
                density="comfortable"
                :error-messages="errors.tipo_transaccion"
                item-title="title"
                item-value="value"
                :items="tiposTransaccion"
                label="Tipo de Transacción *"
                prepend-inner-icon="mdi-tag"
                variant="outlined"
              >
                <template #item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template #prepend>
                      <v-icon :color="item.raw.color">{{ item.raw.icon }}</v-icon>
                    </template>
                  </v-list-item>
                </template>
              </v-select>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="form.monto"
                density="comfortable"
                :error-messages="errors.monto"
                label="Monto *"
                min="0.01"
                prefix="Q"
                prepend-inner-icon="mdi-currency-usd"
                step="0.01"
                type="number"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="form.descripcion"
                counter="1000"
                density="comfortable"
                :error-messages="errors.descripcion"
                label="Descripción *"
                placeholder="Describa el motivo de la transacción..."
                prepend-inner-icon="mdi-text"
                rows="3"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.fecha_transaccion"
                density="comfortable"
                :error-messages="errors.fecha_transaccion"
                label="Fecha de Transacción"
                prepend-inner-icon="mdi-calendar"
                type="date"
                variant="outlined"
              />
            </v-col>

            <v-col v-if="asistenciaId" cols="12">
              <v-alert density="compact" type="info" variant="tonal">
                <v-icon start>mdi-link-variant</v-icon>
                Esta transacción se vinculará a la asistencia del día
              </v-alert>
            </v-col>
          </v-row>

          <v-alert
            v-if="errorMessage"
            class="mt-4"
            closable
            density="compact"
            type="error"
            variant="tonal"
            @click:close="errorMessage = null"
          >
            {{ errorMessage }}
          </v-alert>

          <div class="d-flex justify-end mt-4 ga-2">
            <v-btn
              variant="text"
              @click="resetForm"
            >
              Limpiar
            </v-btn>
            <v-btn
              color="primary"
              :loading="saving"
              type="submit"
              variant="elevated"
            >
              <v-icon start>mdi-content-save</v-icon>
              Guardar Transacción
            </v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>

    <!-- Filtros -->
    <v-card class="mb-4" elevation="2" rounded="xl">
      <v-card-text class="pa-4">
        <v-row align="center">
          <v-col cols="12" md="4">
            <v-select
              v-model="filtros.tipo"
              clearable
              density="compact"
              item-title="title"
              item-value="value"
              :items="[{ value: null, title: 'Todos los tipos' }, ...tiposTransaccion]"
              label="Filtrar por tipo"
              variant="outlined"
              @update:model-value="cargarTransacciones"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="filtros.fecha_desde"
              density="compact"
              label="Desde"
              type="date"
              variant="outlined"
              @update:model-value="cargarTransacciones"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="filtros.fecha_hasta"
              density="compact"
              label="Hasta"
              type="date"
              variant="outlined"
              @update:model-value="cargarTransacciones"
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-btn
              block
              color="secondary"
              variant="tonal"
              @click="limpiarFiltros"
            >
              <v-icon start>mdi-filter-off</v-icon>
              Limpiar
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Tabla de Transacciones -->
    <v-card elevation="2" rounded="xl">
      <v-card-title class="d-flex align-center py-4 px-6">
        <v-icon color="primary" start>mdi-cash-multiple</v-icon>
        <span class="text-subtitle-1 font-weight-bold">Historial de Transacciones</span>
        <v-spacer />
        <v-chip v-if="transacciones.length > 0" color="primary" size="small">
          {{ transacciones.length }} registros
        </v-chip>
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-0">
        <v-data-table
          density="comfortable"
          :headers="headers"
          :items="transacciones"
          :items-per-page="10"
          :loading="loading"
        >
          <!-- Tipo -->
          <template #item.tipo="{ item }">
            <v-chip
              :color="getTipoColor(item.tipo_transaccion)"
              label
              size="small"
              variant="tonal"
            >
              <v-icon size="14" start>{{ getTipoIcon(item.tipo_transaccion) }}</v-icon>
              {{ getTipoLabel(item.tipo_transaccion) }}
            </v-chip>
          </template>

          <!-- Monto -->
          <template #item.monto="{ item }">
            <span class="font-weight-bold" :class="item.es_descuento ? 'text-error' : 'text-success'">
              {{ item.es_descuento ? '-' : '+' }}Q{{ formatNumber(item.monto) }}
            </span>
          </template>

          <!-- Fecha -->
          <template #item.fecha="{ item }">
            {{ formatDate(item.fecha_transaccion) }}
          </template>

          <!-- Estado -->
          <template #item.estado="{ item }">
            <v-chip
              :color="getEstadoColor(item.estado_transaccion)"
              size="small"
              variant="flat"
            >
              {{ getEstadoLabel(item.estado_transaccion) }}
            </v-chip>
          </template>

          <!-- Acciones -->
          <template #item.acciones="{ item }">
            <div class="d-flex ga-1">
              <v-tooltip location="top" text="Ver detalles">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    color="info"
                    icon="mdi-eye"
                    size="small"
                    variant="tonal"
                    @click="verDetalle(item)"
                  />
                </template>
              </v-tooltip>
              <v-tooltip v-if="item.estado_transaccion === 'pendiente' && !readonly" location="top" text="Cancelar">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    color="error"
                    icon="mdi-close-circle"
                    size="small"
                    variant="tonal"
                    @click="cancelarTransaccion(item)"
                  />
                </template>
              </v-tooltip>
            </div>
          </template>

          <!-- No data -->
          <template #no-data>
            <div class="text-center py-10">
              <v-avatar class="mb-3" color="grey-lighten-3" size="64">
                <v-icon color="grey-lighten-1" size="36">mdi-cash-multiple</v-icon>
              </v-avatar>
              <p class="text-body-1 text-medium-emphasis mb-0">No hay transacciones registradas</p>
            </div>
          </template>

          <!-- Loading -->
          <template #loading>
            <v-skeleton-loader type="table-row@5" />
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Dialog Detalle -->
    <v-dialog v-model="dialogDetalle" max-width="600">
      <v-card v-if="transaccionSeleccionada" rounded="xl">
        <v-card-title class="bg-primary pa-4">
          <v-icon color="white" start>mdi-information</v-icon>
          <span class="text-white">Detalle de Transacción</span>
        </v-card-title>
        <v-card-text class="pa-6">
          <v-list density="compact">
            <v-list-item>
              <v-list-item-subtitle class="text-caption">Tipo</v-list-item-subtitle>
              <v-list-item-title>
                <v-chip :color="getTipoColor(transaccionSeleccionada.tipo_transaccion)" size="small" variant="tonal">
                  {{ getTipoLabel(transaccionSeleccionada.tipo_transaccion) }}
                </v-chip>
              </v-list-item-title>
            </v-list-item>
            <v-divider />
            <v-list-item>
              <v-list-item-subtitle class="text-caption">Monto</v-list-item-subtitle>
              <v-list-item-title class="text-h6 font-weight-bold">
                Q{{ formatNumber(transaccionSeleccionada.monto) }}
              </v-list-item-title>
            </v-list-item>
            <v-divider />
            <v-list-item>
              <v-list-item-subtitle class="text-caption">Descripción</v-list-item-subtitle>
              <v-list-item-title>{{ transaccionSeleccionada.descripcion }}</v-list-item-title>
            </v-list-item>
            <v-divider />
            <v-list-item>
              <v-list-item-subtitle class="text-caption">Fecha</v-list-item-subtitle>
              <v-list-item-title>{{ formatDate(transaccionSeleccionada.fecha_transaccion) }}</v-list-item-title>
            </v-list-item>
            <v-divider />
            <v-list-item>
              <v-list-item-subtitle class="text-caption">Estado</v-list-item-subtitle>
              <v-list-item-title>
                <v-chip :color="getEstadoColor(transaccionSeleccionada.estado_transaccion)" size="small">
                  {{ getEstadoLabel(transaccionSeleccionada.estado_transaccion) }}
                </v-chip>
              </v-list-item-title>
            </v-list-item>
            <v-divider />
            <v-list-item>
              <v-list-item-subtitle class="text-caption">Registrado por</v-list-item-subtitle>
              <v-list-item-title>{{ transaccionSeleccionada.registrado_por?.name || 'N/A' }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="dialogDetalle = false">Cerrar</v-btn>
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
  import operacionesService from '@/services/operacionesService'

  const props = defineProps({
    personalId: {
      type: Number,
      required: true,
    },
    asistenciaId: {
      type: Number,
      default: null,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
  })

  const emit = defineEmits(['saved', 'error'])

  // Estado
  const loading = ref(false)
  const saving = ref(false)
  const transacciones = ref([])
  const formRef = ref(null)
  const dialogDetalle = ref(false)
  const transaccionSeleccionada = ref(null)

  // Formulario
  const form = reactive({
    tipo_transaccion: null,
    monto: null,
    descripcion: '',
    fecha_transaccion: new Date().toISOString().split('T')[0],
  })

  const errors = reactive({
    tipo_transaccion: [],
    monto: [],
    descripcion: [],
    fecha_transaccion: [],
  })

  const errorMessage = ref(null)

  // Filtros
  const filtros = reactive({
    tipo: null,
    fecha_desde: null,
    fecha_hasta: null,
  })

  // Snackbar
  const snackbar = reactive({
    show: false,
    text: '',
    color: 'success',
  })

  // Tipos de transacción
  const tiposTransaccion = [
    { value: 'multa', title: 'Multa', icon: 'mdi-alert-circle', color: 'error' },
    { value: 'uniforme', title: 'Uniforme', icon: 'mdi-tshirt-crew', color: 'info' },
    { value: 'anticipo', title: 'Anticipo', icon: 'mdi-cash-fast', color: 'warning' },
    { value: 'abono_prestamo', title: 'Abono a Préstamo', icon: 'mdi-cash-check', color: 'success' },
    { value: 'antecedentes', title: 'Antecedentes', icon: 'mdi-file-document', color: 'secondary' },
    { value: 'otro_descuento', title: 'Otro Descuento', icon: 'mdi-cash-minus', color: 'grey' },
  ]

  // Headers de la tabla
  const headers = [
    { title: 'Tipo', key: 'tipo', sortable: true },
    { title: 'Monto', key: 'monto', sortable: true },
    { title: 'Descripción', key: 'descripcion', sortable: false },
    { title: 'Fecha', key: 'fecha', sortable: true },
    { title: 'Estado', key: 'estado', sortable: true },
    { title: 'Acciones', key: 'acciones', sortable: false, align: 'center', width: '120px' },
  ]

  // Funciones
  async function cargarTransacciones () {
    loading.value = true
    try {
      const params = {
        personal_id: props.personalId,
        ...filtros,
      }

      const response = await operacionesService.getTransacciones(params)
      transacciones.value = response.data || []
    } catch (error) {
      console.error('Error cargando transacciones:', error)
      showSnackbar('Error al cargar las transacciones', 'error')
    } finally {
      loading.value = false
    }
  }

  async function guardarTransaccion () {
    // Limpiar errores
    for (const key of Object.keys(errors)) errors[key] = []
    errorMessage.value = null

    // Validaciones
    if (!form.tipo_transaccion) {
      errors.tipo_transaccion = ['El tipo de transacción es requerido']
      return
    }
    if (!form.monto || form.monto <= 0) {
      errors.monto = ['El monto debe ser mayor a 0']
      return
    }
    if (!form.descripcion || form.descripcion.length < 10) {
      errors.descripcion = ['La descripción debe tener al menos 10 caracteres']
      return
    }

    saving.value = true
    try {
      const data = {
        personal_id: props.personalId,
        asistencia_id: props.asistenciaId,
        tipo_transaccion: form.tipo_transaccion,
        monto: form.monto,
        descripcion: form.descripcion,
        fecha_transaccion: form.fecha_transaccion,
        es_descuento: true, // Por defecto es descuento
      }

      await operacionesService.crearTransaccion(data)

      showSnackbar('Transacción registrada exitosamente', 'success')
      resetForm()
      await cargarTransacciones()
      emit('saved')
    } catch (error) {
      console.error('Error guardando transacción:', error)

      if (error.apiErrors) {
        for (const key of Object.keys(error.apiErrors)) {
          if (errors[key] !== undefined) {
            errors[key] = error.apiErrors[key]
          }
        }
      }

      errorMessage.value = error.apiMessage || 'Error al guardar la transacción'
      emit('error', errorMessage.value)
    } finally {
      saving.value = false
    }
  }

  function resetForm () {
    form.tipo_transaccion = null
    form.monto = null
    form.descripcion = ''
    form.fecha_transaccion = new Date().toISOString().split('T')[0]
    for (const key of Object.keys(errors)) errors[key] = []
    errorMessage.value = null
  }

  function limpiarFiltros () {
    filtros.tipo = null
    filtros.fecha_desde = null
    filtros.fecha_hasta = null
    cargarTransacciones()
  }

  function verDetalle (transaccion) {
    transaccionSeleccionada.value = transaccion
    dialogDetalle.value = true
  }

  async function cancelarTransaccion (transaccion) {
    if (!confirm('¿Está seguro de cancelar esta transacción?')) return

    try {
      await operacionesService.cancelarTransaccion(transaccion.id)
      showSnackbar('Transacción cancelada exitosamente', 'success')
      await cargarTransacciones()
    } catch (error) {
      console.error('Error cancelando transacción:', error)
      showSnackbar(error.apiMessage || 'Error al cancelar la transacción', 'error')
    }
  }

  function getTipoLabel (tipo) {
    return tiposTransaccion.find(t => t.value === tipo)?.title || tipo
  }

  function getTipoIcon (tipo) {
    return tiposTransaccion.find(t => t.value === tipo)?.icon || 'mdi-cash'
  }

  function getTipoColor (tipo) {
    return tiposTransaccion.find(t => t.value === tipo)?.color || 'grey'
  }

  function getEstadoLabel (estado) {
    const labels = {
      pendiente: 'Pendiente',
      aplicado: 'Aplicado',
      cancelado: 'Cancelado',
    }
    return labels[estado] || estado
  }

  function getEstadoColor (estado) {
    const colors = {
      pendiente: 'warning',
      aplicado: 'success',
      cancelado: 'error',
    }
    return colors[estado] || 'grey'
  }

  function formatNumber (value) {
    return new Intl.NumberFormat('es-GT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  function formatDate (date) {
    if (!date) return '-'
    // Si ya viene con hora (ISO), usarlo directo
    if (date.includes('T')) {
      return format(new Date(date), 'dd/MM/yyyy', { locale: es })
    }
    // Si es solo fecha YYYY-MM-DD, agregar hora media para evitar cambios por zona horaria
    return format(new Date(date + 'T12:00:00'), 'dd/MM/yyyy', { locale: es })
  }

  function showSnackbar (text, color = 'success') {
    snackbar.text = text
    snackbar.color = color
    snackbar.show = true
  }

  onMounted(() => {
    cargarTransacciones()
  })
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>
