<template>
  <div class="planilla-generar">
    <!-- Header -->
    <div class="d-flex align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">Generar Planilla</h1>
        <p class="text-body-2 text-medium-emphasis">Crear nueva planilla de pago para el personal</p>
      </div>
      <v-spacer />
      <v-btn
        color="primary"
        variant="text"
        @click="$router.push('/operaciones/planillas')"
      >
        <v-icon start>mdi-arrow-left</v-icon>
        Volver a Planillas
      </v-btn>
    </div>

    <!-- Formulario -->
    <v-card class="mb-6" elevation="2" rounded="xl">
      <v-card-title class="pa-4 bg-primary">
        <v-icon color="white" start>mdi-calendar-range</v-icon>
        <span class="text-white">Configuración de Planilla</span>
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-6">
        <v-form ref="form" v-model="valid" @submit.prevent="generarPlanilla">
          <v-row>
            <!-- Período Inicio -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.periodo_inicio"
                density="comfortable"
                label="Fecha de Inicio"
                prepend-inner-icon="mdi-calendar-start"
                required
                :rules="[rules.required]"
                type="date"
                variant="outlined"
              />
            </v-col>

            <!-- Período Fin -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.periodo_fin"
                density="comfortable"
                label="Fecha de Fin"
                prepend-inner-icon="mdi-calendar-end"
                required
                :rules="[rules.required, rules.fechaFin]"
                type="date"
                variant="outlined"
              />
            </v-col>

            <!-- Proyecto (Opcional) -->
            <v-col cols="12" md="6">
              <v-autocomplete
                v-model="formData.proyecto_id"
                clearable
                density="comfortable"
                hint="Dejar vacío para incluir todo el personal"
                item-title="nombre_proyecto"
                item-value="id"
                :items="proyectos"
                label="Proyecto (Opcional)"
                persistent-hint
                prepend-inner-icon="mdi-briefcase"
                variant="outlined"
              />
            </v-col>

            <!-- Observaciones -->
            <v-col cols="12">
              <v-textarea
                v-model="formData.observaciones"
                counter="1000"
                density="comfortable"
                label="Observaciones"
                prepend-inner-icon="mdi-note-text"
                rows="3"
                :rules="[rules.maxLength(1000)]"
                variant="outlined"
              />
            </v-col>
          </v-row>

          <!-- Botones -->
          <div class="d-flex justify-end ga-2 mt-4">
            <v-btn
              variant="text"
              @click="resetForm"
            >
              Limpiar
            </v-btn>
            <v-btn
              color="primary"
              :disabled="!valid"
              :loading="loading"
              type="submit"
              variant="elevated"
            >
              <v-icon start>mdi-calculator</v-icon>
              Generar Planilla
            </v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>

    <!-- Preview de Planilla Generada -->
    <v-card v-if="planillaGenerada" elevation="2" rounded="xl">
      <v-card-title class="pa-4 bg-success-lighten-5">
        <v-icon color="success" start>mdi-check-circle</v-icon>
        <span class="text-success">Planilla Generada Exitosamente</span>
        <v-spacer />
        <v-chip color="success" size="small">
          {{ planillaGenerada.estado_label }}
        </v-chip>
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-6">
        <!-- Resumen -->
        <v-row class="mb-4">
          <v-col cols="12" md="4">
            <div class="text-caption text-medium-emphasis">Período</div>
            <div class="text-h6">
              {{ formatDate(planillaGenerada.periodo_inicio) }} - {{ formatDate(planillaGenerada.periodo_fin) }}
            </div>
          </v-col>
          <v-col cols="12" md="4">
            <div class="text-caption text-medium-emphasis">Total Empleados</div>
            <div class="text-h6">{{ planillaGenerada.detalles?.length || 0 }}</div>
          </v-col>
          <v-col cols="12" md="4">
            <div class="text-caption text-medium-emphasis">Estado</div>
            <div class="text-h6">{{ planillaGenerada.estado_label }}</div>
          </v-col>
        </v-row>

        <!-- Totales -->
        <v-row class="mb-4">
          <v-col cols="12" md="4">
            <v-card color="success-lighten-5" rounded="lg">
              <v-card-text class="pa-4">
                <div class="text-caption text-medium-emphasis">Total Devengado</div>
                <div class="text-h5 text-success font-weight-bold">
                  {{ formatCurrency(planillaGenerada.total_devengado) }}
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card color="error-lighten-5" rounded="lg">
              <v-card-text class="pa-4">
                <div class="text-caption text-medium-emphasis">Total Descuentos</div>
                <div class="text-h5 text-error font-weight-bold">
                  {{ formatCurrency(planillaGenerada.total_descuentos) }}
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card color="primary-lighten-5" rounded="lg">
              <v-card-text class="pa-4">
                <div class="text-caption text-medium-emphasis">Total Neto</div>
                <div class="text-h5 text-primary font-weight-bold">
                  {{ formatCurrency(planillaGenerada.total_neto) }}
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Tabla de Detalles -->
        <v-data-table
          density="comfortable"
          :headers="headers"
          :items="planillaGenerada.detalles || []"
          :items-per-page="10"
        >
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

          <template #item.dias_trabajados="{ item }">
            <v-chip color="info" size="small">
              {{ item.dias_trabajados }} días
            </v-chip>
          </template>

          <template #item.salario_devengado="{ item }">
            <span class="text-success font-weight-bold">
              {{ formatCurrency(item.salario_devengado) }}
            </span>
          </template>

          <template #item.total_descuentos="{ item }">
            <span class="text-error font-weight-bold">
              {{ formatCurrency(item.total_descuentos) }}
            </span>
          </template>

          <template #item.salario_neto="{ item }">
            <span class="text-primary font-weight-bold">
              {{ formatCurrency(item.salario_neto) }}
            </span>
          </template>
        </v-data-table>

        <!-- Acciones -->
        <div class="d-flex justify-end ga-2 mt-6">
          <v-btn
            variant="text"
            @click="generarOtra"
          >
            Generar Otra Planilla
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            @click="verDetalle"
          >
            <v-icon start>mdi-eye</v-icon>
            Ver Detalle Completo
          </v-btn>
        </div>
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
  import { format } from 'date-fns'
  import { es } from 'date-fns/locale'
  import { onMounted, reactive, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import proyectoService from '@/services/proyectoService'
  import { usePlanillaStore } from '@/stores/planilla'
  import { formatDPI } from '@/utils/dpiFormatter'

  const router = useRouter()
  const planillaStore = usePlanillaStore()

  // Estado
  const form = ref(null)
  const valid = ref(false)
  const loading = ref(false)
  const proyectos = ref([])
  const planillaGenerada = ref(null)

  // Formulario
  const formData = reactive({
    periodo_inicio: '',
    periodo_fin: '',
    proyecto_id: null,
    observaciones: '',
  })

  // Snackbar
  const snackbar = reactive({
    show: false,
    text: '',
    color: 'success',
  })

  // Headers de tabla
  const headers = [
    { title: 'Personal', key: 'personal', sortable: true },
    { title: 'Días Trabajados', key: 'dias_trabajados', sortable: true, align: 'center' },
    { title: 'Devengado', key: 'salario_devengado', sortable: true, align: 'end' },
    { title: 'Descuentos', key: 'total_descuentos', sortable: true, align: 'end' },
    { title: 'Neto', key: 'salario_neto', sortable: true, align: 'end' },
  ]

  // Reglas de validación
  const rules = {
    required: v => !!v || 'Campo requerido',
    fechaFin: v => {
      if (!v || !formData.periodo_inicio) return true
      return new Date(v) > new Date(formData.periodo_inicio)
        || 'La fecha de fin debe ser posterior a la fecha de inicio'
    },
    maxLength: max => v => !v || v.length <= max || `Máximo ${max} caracteres`,
  }

  // Funciones
  async function cargarProyectos () {
    try {
      const response = await proyectoService.getProyectos({ estado: 'activo' })
      proyectos.value = response.data || []
    } catch (error) {
      console.error('Error cargando proyectos:', error)
    }
  }

  async function generarPlanilla () {
    if (!form.value.validate()) return

    loading.value = true
    try {
      const response = await planillaStore.generarPlanilla(formData)
      planillaGenerada.value = response.data
      showSnackbar('Planilla generada exitosamente', 'success')
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Error al generar planilla', 'error')
    } finally {
      loading.value = false
    }
  }

  function resetForm () {
    formData.periodo_inicio = ''
    formData.periodo_fin = ''
    formData.proyecto_id = null
    formData.observaciones = ''
    form.value?.reset()
  }

  function generarOtra () {
    planillaGenerada.value = null
    resetForm()
  }

  function verDetalle () {
    if (planillaGenerada.value) {
      router.push(`/operaciones/planillas/${planillaGenerada.value.id}`)
    }
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
    cargarProyectos()
  })
</script>

<style scoped>
.planilla-generar {
  padding: 24px;
}
</style>
