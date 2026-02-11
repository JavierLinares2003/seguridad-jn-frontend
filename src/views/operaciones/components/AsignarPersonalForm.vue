<template>
  <v-dialog v-model="dialogVisible" max-width="900px" persistent scrollable>
    <v-card rounded="xl">
      <v-card-title class="pa-4 bg-primary">
        <v-icon start>mdi-account-plus</v-icon>
        Asignar Personal al Proyecto
      </v-card-title>

      <v-card-text class="pa-4">
        <v-form ref="form" v-model="valid">
          <v-row>
            <!-- SECCIÓN 1: Selección de Proyecto y Puesto -->
            <v-col cols="12">
              <div class="text-caption text-medium-emphasis mb-2 font-weight-bold">
                PROYECTO Y PUESTO
              </div>
            </v-col>

            <!-- Select Proyecto (solo si no viene predefinido) -->
            <v-col v-if="!proyectoIdProp" cols="12" md="6">
              <v-autocomplete
                v-model="formData.proyecto_id"
                density="comfortable"
                item-title="nombre_proyecto"
                item-value="id"
                :items="proyectos"
                label="Proyecto *"
                :loading="loadingProyectos"
                :rules="[v => !!v || 'Seleccione un proyecto']"
                variant="outlined"
                @update:model-value="onProyectoChange"
              >
                <template #item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template #subtitle>
                      {{ item.raw.correlativo }} - {{ item.raw.empresa_cliente }}
                    </template>
                  </v-list-item>
                </template>
              </v-autocomplete>
            </v-col>

            <!-- Select Configuración de Puesto -->
            <v-col cols="12" :md="proyectoIdProp ? 6 : 6">
              <v-select
                v-model="formData.configuracion_puesto_id"
                density="comfortable"
                :disabled="!formData.proyecto_id"
                item-title="displayName"
                item-value="id"
                :items="configuracionesPuesto"
                label="Puesto/Plaza *"
                :loading="loadingConfiguraciones"
                :rules="[v => !!v || 'Seleccione un puesto']"
                variant="outlined"
                @update:model-value="onPuestoChange"
              >
                <template #item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template #subtitle>
                      <span>{{ item.raw.cantidad_requerida }} plazas</span>
                      <span v-if="item.raw.turno"> | Turno: {{ item.raw.turno.nombre }}</span>
                    </template>
                    <template #append>
                      <v-chip
                        v-if="item.raw.cobertura"
                        :color="item.raw.cobertura.porcentaje < 100 ? 'warning' : 'success'"
                        size="x-small"
                      >
                        {{ item.raw.cobertura.asignados }}/{{ item.raw.cobertura.requeridos }}
                      </v-chip>
                    </template>
                  </v-list-item>
                </template>
              </v-select>
            </v-col>

            <!-- Select Turno -->
            <v-col cols="12" md="6">
              <v-select
                v-model="formData.turno_id"
                density="comfortable"
                item-title="nombre"
                item-value="id"
                :items="turnos"
                label="Turno *"
                :loading="loadingTurnos"
                :rules="[v => !!v || 'Seleccione un turno']"
                variant="outlined"
              />
            </v-col>

            <!-- SECCIÓN 2: Fechas -->
            <v-col cols="12">
              <v-divider class="my-2" />
              <div class="text-caption text-medium-emphasis mb-2 font-weight-bold">
                PERÍODO DE ASIGNACIÓN
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.fecha_inicio"
                density="comfortable"
                label="Fecha Inicio *"
                :rules="[v => !!v || 'Requerido']"
                type="date"
                variant="outlined"
                @update:model-value="onFechaChange"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.fecha_fin"
                density="comfortable"
                hint="Dejar vacío para asignación indefinida"
                label="Fecha Fin (opcional)"
                persistent-hint
                :rules="[
                  v => !v || !formData.fecha_inicio || v >= formData.fecha_inicio || 'Debe ser posterior a fecha inicio'
                ]"
                type="date"
                variant="outlined"
                @update:model-value="onFechaChange"
              />
            </v-col>

            <!-- SECCIÓN 3: Búsqueda de Personal -->
            <v-col cols="12">
              <v-divider class="my-2" />
              <div class="text-caption text-medium-emphasis mb-2 font-weight-bold d-flex align-center">
                SELECCIONAR PERSONAL
                <v-spacer />
                <v-btn
                  color="primary"
                  :disabled="!formData.fecha_inicio"
                  :loading="loadingPersonal"
                  size="small"
                  variant="tonal"
                  @click="buscarPersonalDisponible"
                >
                  <v-icon start>mdi-magnify</v-icon>
                  Buscar Disponibles
                </v-btn>
              </div>
            </v-col>

            <!-- Filtros de búsqueda -->
            <v-col cols="12">
              <v-expand-transition>
                <v-row v-if="formData.fecha_inicio" dense>
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model="filtroPersonal"
                      clearable
                      density="compact"
                      hide-details
                      label="Buscar por nombre/DPI"
                      prepend-inner-icon="mdi-magnify"
                      variant="outlined"
                    />
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-switch
                      v-model="soloDisponibles"
                      color="primary"
                      density="compact"
                      hide-details
                      label="Solo disponibles"
                    />
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-switch
                      v-model="soloCumpleRequisitos"
                      color="primary"
                      density="compact"
                      hide-details
                      label="Solo cumple requisitos"
                    />
                  </v-col>
                </v-row>
              </v-expand-transition>
            </v-col>

            <!-- Tabla de Personal Disponible -->
            <v-col cols="12">
              <v-card class="mt-2" variant="outlined">
                <v-data-table
                  v-model="selectedPersonal"
                  class="elevation-0"
                  density="compact"
                  :headers="headersPersonal"
                  item-value="id"
                  :items="personalFiltrado"
                  :items-per-page="5"
                  :loading="loadingPersonal"
                  select-strategy="single"
                  show-select
                >
                  <template #item.nombre_completo="{ item }">
                    <div>
                      <span class="font-weight-medium">{{ item.nombres }} {{ item.apellidos }}</span>
                      <br>
                      <span class="text-caption text-medium-emphasis">{{ formatDPI(item.dpi) }}</span>
                    </div>
                  </template>

                  <template #item.datos="{ item }">
                    <div class="text-caption">
                      <div>Edad: {{ item.edad }} años</div>
                      <div v-if="item.altura">Altura: {{ item.altura }}m</div>
                      <div v-if="item.sexo">{{ item.sexo.nombre }}</div>
                    </div>
                  </template>

                  <template #item.disponibilidad="{ item }">
                    <div v-if="item.disponibilidad?.cumple_requisitos">
                      <!-- Chip principal de cumplimiento -->
                      <v-chip
                        class="mb-2"
                        :color="item.disponibilidad.cumple_requisitos.cumple ? 'success' : 'warning'"
                        size="small"
                      >
                        <v-icon size="16" start>
                          {{ item.disponibilidad.cumple_requisitos.cumple ? 'mdi-check-circle' : 'mdi-alert' }}
                        </v-icon>
                        {{ item.disponibilidad.cumple_requisitos.cumple ? 'Cumple' : 'No Cumple' }}
                      </v-chip>

                      <!-- Detalles de validación -->
                      <div v-if="item.disponibilidad.cumple_requisitos.detalles" class="text-caption mt-1">
                        <!-- Edad -->
                        <div v-if="item.disponibilidad.cumple_requisitos.detalles.edad" class="d-flex align-center mb-1">
                          <v-icon
                            class="mr-1"
                            :color="item.disponibilidad.cumple_requisitos.detalles.edad.cumple ? 'success' : 'error'"
                            size="14"
                          >
                            {{ item.disponibilidad.cumple_requisitos.detalles.edad.cumple ? 'mdi-check' : 'mdi-close' }}
                          </v-icon>
                          <span :class="item.disponibilidad.cumple_requisitos.detalles.edad.cumple ? 'text-success' : 'text-error'">
                            Edad: {{ item.disponibilidad.cumple_requisitos.detalles.edad.valor_personal }} años
                            ({{ item.disponibilidad.cumple_requisitos.detalles.edad.minimo_requerido }}-{{ item.disponibilidad.cumple_requisitos.detalles.edad.maximo_requerido }})
                          </span>
                        </div>

                        <!-- Sexo -->
                        <div v-if="item.disponibilidad.cumple_requisitos.detalles.sexo" class="d-flex align-center mb-1">
                          <v-icon
                            class="mr-1"
                            :color="item.disponibilidad.cumple_requisitos.detalles.sexo.cumple ? 'success' : 'error'"
                            size="14"
                          >
                            {{ item.disponibilidad.cumple_requisitos.detalles.sexo.cumple ? 'mdi-check' : 'mdi-close' }}
                          </v-icon>
                          <span :class="item.disponibilidad.cumple_requisitos.detalles.sexo.cumple ? 'text-success' : 'text-error'">
                            Sexo: {{ item.disponibilidad.cumple_requisitos.detalles.sexo.valor_personal }}
                            (Req: {{ item.disponibilidad.cumple_requisitos.detalles.sexo.requerido }})
                          </span>
                        </div>

                        <!-- Altura -->
                        <div v-if="item.disponibilidad.cumple_requisitos.detalles.altura" class="d-flex align-center mb-1">
                          <v-icon
                            class="mr-1"
                            :color="item.disponibilidad.cumple_requisitos.detalles.altura.cumple ? 'success' : 'error'"
                            size="14"
                          >
                            {{ item.disponibilidad.cumple_requisitos.detalles.altura.cumple ? 'mdi-check' : 'mdi-close' }}
                          </v-icon>
                          <span :class="item.disponibilidad.cumple_requisitos.detalles.altura.cumple ? 'text-success' : 'text-error'">
                            Altura: {{ item.disponibilidad.cumple_requisitos.detalles.altura.valor_personal || 'N/A' }} m
                            (Mín: {{ item.disponibilidad.cumple_requisitos.detalles.altura.minimo_requerido }} m)
                          </span>
                        </div>

                        <!-- Información del puesto -->
                        <v-divider class="my-1" />
                        <div v-if="item.disponibilidad.cumple_requisitos.detalles.puesto" class="text-medium-emphasis">
                          <div><strong>Puesto:</strong> {{ item.disponibilidad.cumple_requisitos.detalles.puesto.nombre }}</div>
                          <div><strong>Turno:</strong> {{ item.disponibilidad.cumple_requisitos.detalles.puesto.turno }}</div>
                          <div><strong>Salario:</strong> Q{{ item.disponibilidad.cumple_requisitos.detalles.puesto.salario_base }}</div>
                        </div>
                      </div>

                      <!-- Errores si no cumple -->
                      <v-alert
                        v-if="!item.disponibilidad.cumple_requisitos.cumple && item.disponibilidad.cumple_requisitos.errores?.length"
                        class="mt-2"
                        density="compact"
                        type="warning"
                        variant="tonal"
                      >
                        <div class="text-caption">
                          <div v-for="(err, idx) in item.disponibilidad.cumple_requisitos.errores" :key="idx">
                            • {{ err }}
                          </div>
                        </div>
                      </v-alert>
                    </div>
                    <div v-else class="text-caption text-medium-emphasis">
                      Sin información de requisitos
                    </div>
                  </template>

                  <template #no-data>
                    <div class="text-center pa-4 text-medium-emphasis">
                      <v-icon class="mb-2" size="48">mdi-account-search</v-icon>
                      <div v-if="!formData.fecha_inicio">
                        Seleccione una fecha de inicio para buscar personal disponible
                      </div>
                      <div v-else-if="personalDisponible.length === 0">
                        Haga clic en "Buscar Disponibles" para cargar el personal
                      </div>
                      <div v-else>
                        No se encontró personal con los filtros aplicados
                      </div>
                    </div>
                  </template>
                </v-data-table>
              </v-card>

              <!-- Validación de selección -->
              <v-input
                class="mt-2"
                :model-value="formData.personal_id"
                :rules="[v => !!v || 'Debe seleccionar un empleado']"
              />
            </v-col>

            <!-- SECCIÓN 4: Alertas y Warnings -->
            <v-col v-if="warnings.length > 0" cols="12">
              <v-alert
                class="mb-0"
                density="compact"
                type="warning"
                variant="tonal"
              >
                <div class="text-subtitle-2 font-weight-bold mb-1">Advertencias:</div>
                <ul class="mb-0 pl-4">
                  <li v-for="(warn, idx) in warnings" :key="idx">{{ warn }}</li>
                </ul>
              </v-alert>
            </v-col>

            <!-- Conflictos detectados -->
            <v-col v-if="conflictos.length > 0" cols="12">
              <v-alert
                class="mb-0"
                density="compact"
                type="error"
                variant="tonal"
              >
                <div class="text-subtitle-2 font-weight-bold mb-1">Conflictos detectados:</div>
                <ul class="mb-0 pl-4">
                  <li v-for="(conflicto, idx) in conflictos" :key="idx">{{ conflicto }}</li>
                </ul>
              </v-alert>
            </v-col>

            <!-- SECCIÓN 5: Notas -->
            <v-col cols="12">
              <v-divider class="my-2" />
              <v-textarea
                v-model="formData.notas"
                auto-grow
                counter="500"
                density="comfortable"
                label="Notas (opcional)"
                rows="2"
                :rules="[v => !v || v.length <= 500 || 'Máximo 500 caracteres']"
                variant="outlined"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="closeDialog">
          Cancelar
        </v-btn>
        <v-btn
          color="primary"
          :disabled="conflictos.length > 0"
          :loading="saving"
          variant="elevated"
          @click="save"
        >
          <v-icon start>mdi-content-save</v-icon>
          Guardar Asignación
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Dialog de Confirmación para Advertencias -->
  <v-dialog v-model="showConfirmDialog" max-width="500px" persistent>
    <v-card>
      <v-card-title class="bg-warning text-white">
        <v-icon start>mdi-alert</v-icon>
        Confirmar Asignación con Advertencias
      </v-card-title>

      <v-card-text class="pa-4">
        <v-alert class="mb-3" type="warning" variant="tonal">
          El personal seleccionado <strong>NO cumple</strong> con todos los requisitos del puesto.
        </v-alert>

        <div class="text-subtitle-2 font-weight-bold mb-2">Advertencias:</div>
        <ul class="mb-3">
          <li v-for="(warning, idx) in confirmWarnings" :key="idx" class="text-error">
            {{ warning }}
          </li>
        </ul>

        <v-alert density="compact" type="info" variant="tonal">
          ¿Desea continuar con la asignación de todas formas? Las advertencias se guardarán en las notas.
        </v-alert>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="cancelConfirm">
          Cancelar
        </v-btn>
        <v-btn
          color="warning"
          :loading="saving"
          variant="elevated"
          @click="confirmSave"
        >
          <v-icon start>mdi-alert-circle-check</v-icon>
          Sí, Asignar de Todas Formas
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import catalogoService from '@/services/catalogoService'
  import { useOperacionesStore } from '@/stores/operaciones'
  import { useProyectosStore } from '@/stores/proyectos'
  import { formatDPI } from '@/utils/dpiFormatter'

  const props = defineProps({
    modelValue: {
      type: Boolean,
      default: false,
    },
    proyectoId: {
      type: [Number, String],
      default: null,
    },
  })

  const emit = defineEmits(['update:modelValue', 'saved'])

  const operacionesStore = useOperacionesStore()
  const proyectosStore = useProyectosStore()

  // Dialog visibility
  const dialogVisible = computed({
    get: () => props.modelValue,
    set: val => emit('update:modelValue', val),
  })

  // Refs
  const form = ref(null)
  const valid = ref(false)
  const saving = ref(false)

  // Data sources
  const proyectos = ref([])
  const configuracionesPuesto = ref([])
  const turnos = ref([])
  const personalDisponible = ref([])

  // Loading states
  const loadingProyectos = ref(false)
  const loadingConfiguraciones = ref(false)
  const loadingTurnos = ref(false)
  const loadingPersonal = ref(false)

  // Computed prop for proyecto ID
  const proyectoIdProp = computed(() => props.proyectoId)

  // Form data
  const defaultFormData = {
    personal_id: null,
    proyecto_id: null,
    configuracion_puesto_id: null,
    turno_id: null,
    fecha_inicio: null,
    fecha_fin: null,
    notas: '',
  }
  const formData = ref({ ...defaultFormData })

  // Selection state
  const selectedPersonal = ref([])

  // Filtros de búsqueda
  const filtroPersonal = ref('')
  const soloDisponibles = ref(true)
  const soloCumpleRequisitos = ref(true)

  // Warnings y conflictos
  const warnings = ref([])
  const conflictos = ref([])

  // Confirmation dialog
  const showConfirmDialog = ref(false)
  const confirmWarnings = ref([])
  const forceAssignment = ref(false)

  // Headers para tabla de personal
  const headersPersonal = [
    { title: 'Empleado', key: 'nombre_completo', sortable: true },
    { title: 'Datos', key: 'datos', sortable: false },
    { title: 'Departamento', key: 'departamento.nombre', sortable: true },
    { title: 'Disponibilidad', key: 'disponibilidad', sortable: false },
  ]

  // Computed: Personal filtrado
  const personalFiltrado = computed(() => {
    let resultado = personalDisponible.value

    // Filtro por texto
    if (filtroPersonal.value) {
      const busqueda = filtroPersonal.value.toLowerCase()
      resultado = resultado.filter(p =>
        `${p.nombres} ${p.apellidos}`.toLowerCase().includes(busqueda)
        || p.dpi?.includes(busqueda),
      )
    }

    // Filtro solo disponibles (sin conflictos de fechas)
    if (soloDisponibles.value) {
      resultado = resultado.filter(p => !p.disponibilidad?.conflicto_fechas)
    }

    // Filtro solo cumple requisitos
    if (soloCumpleRequisitos.value) {
      resultado = resultado.filter(p => p.disponibilidad?.cumple_requisitos?.cumple !== false)
    }

    return resultado
  })

  // Watch: Sincronizar selección con formData
  watch(selectedPersonal, newVal => {
    formData.value.personal_id = newVal.length > 0 ? newVal[0] : null
    validarConflictos()
  })

  // Watch: Proyecto ID prop
  watch(() => props.proyectoId, newVal => {
    if (newVal) {
      formData.value.proyecto_id = Number(newVal)
      loadConfiguracionesPuesto(newVal)
    }
  }, { immediate: true })

  // Watch: Dialog visibility
  watch(dialogVisible, visible => {
    if (visible) {
      initForm()
    }
  })

  // Funciones
  async function initForm () {
    // Reset form
    formData.value = { ...defaultFormData }
    selectedPersonal.value = []
    personalDisponible.value = []
    warnings.value = []
    conflictos.value = []

    // Si viene proyecto predefinido
    if (props.proyectoId) {
      formData.value.proyecto_id = Number(props.proyectoId)
    }

    // Cargar datos iniciales
    await Promise.all([
      loadTurnos(),
      props.proyectoId ? loadConfiguracionesPuesto(props.proyectoId) : loadProyectos(),
    ])
  }

  async function loadProyectos () {
    loadingProyectos.value = true
    try {
      await proyectosStore.fetchAll(true)
      proyectos.value = proyectosStore.items.filter(p => p.estado_proyecto === 'activo')
    } catch (error) {
      console.error('Error loading proyectos:', error)
    } finally {
      loadingProyectos.value = false
    }
  }

  async function loadConfiguracionesPuesto (proyectoId) {
    if (!proyectoId) return

    loadingConfiguraciones.value = true
    try {
      const response = await proyectosStore.fetchConfiguracionPersonal(proyectoId)
      configuracionesPuesto.value = (response || []).map(config => ({
        ...config,
        displayName: `${config.tipo_personal?.nombre || 'Puesto'} - ${config.turno?.nombre || 'Sin turno'}`,
      }))
    } catch (error) {
      console.error('Error loading configuraciones:', error)
    } finally {
      loadingConfiguraciones.value = false
    }
  }

  async function loadTurnos () {
    loadingTurnos.value = true
    try {
      const response = await catalogoService.get('turnos')
      turnos.value = response || []
    } catch (error) {
      console.error('Error loading turnos:', error)
    } finally {
      loadingTurnos.value = false
    }
  }

  async function buscarPersonalDisponible () {
    if (!formData.value.fecha_inicio) return

    loadingPersonal.value = true
    try {
      const params = {
        fecha_inicio: formData.value.fecha_inicio,
        fecha_fin: formData.value.fecha_fin || undefined,
        configuracion_puesto_id: formData.value.configuracion_puesto_id || undefined,
      }

      const response = await operacionesStore.fetchPersonalDisponible(params)
      personalDisponible.value = response || []
    } catch (error) {
      console.error('Error buscando personal:', error)
    } finally {
      loadingPersonal.value = false
    }
  }

  function onProyectoChange (proyectoId) {
    formData.value.configuracion_puesto_id = null
    configuracionesPuesto.value = []
    if (proyectoId) {
      loadConfiguracionesPuesto(proyectoId)
    }
  }

  function onPuestoChange (configId) {
    // Autoseleccionar turno del puesto si está definido
    const config = configuracionesPuesto.value.find(c => c.id === configId)
    if (config?.turno_id) {
      formData.value.turno_id = config.turno_id
    }

    // Revalidar requisitos si hay personal cargado
    if (personalDisponible.value.length > 0) {
      buscarPersonalDisponible()
    }
  }

  function onFechaChange () {
    validarConflictos()
    // Limpiar personal disponible para forzar nueva búsqueda
    if (personalDisponible.value.length > 0) {
      personalDisponible.value = []
      selectedPersonal.value = []
    }
  }

  function validarConflictos () {
    conflictos.value = []
    warnings.value = []

    if (!formData.value.personal_id) return

    const empleado = personalDisponible.value.find(p => p.id === formData.value.personal_id)
    if (!empleado) return

    // Verificar si cumple requisitos
    if (empleado.disponibilidad?.cumple_requisitos?.cumple === false) {
      warnings.value = empleado.disponibilidad.cumple_requisitos.errores || ['El empleado no cumple todos los requisitos del puesto']
    }

    // Verificar conflictos de fechas (asignaciones existentes)
    if (empleado.disponibilidad?.conflicto_fechas) {
      conflictos.value.push('El empleado ya tiene una asignación activa en las fechas seleccionadas')
    }
  }

  function closeDialog () {
    dialogVisible.value = false
    setTimeout(() => {
      formData.value = { ...defaultFormData }
      selectedPersonal.value = []
      personalDisponible.value = []
      warnings.value = []
      conflictos.value = []
      if (form.value) form.value.resetValidation()
    }, 300)
  }

  async function save () {
    const { valid } = await form.value.validate()
    if (!valid) return

    if (conflictos.value.length > 0) return

    saving.value = true
    try {
      const payload = {
        personal_id: formData.value.personal_id,
        proyecto_id: formData.value.proyecto_id,
        configuracion_puesto_id: formData.value.configuracion_puesto_id,
        turno_id: formData.value.turno_id,
        fecha_inicio: formData.value.fecha_inicio,
        fecha_fin: formData.value.fecha_fin || null,
        notas: formData.value.notas || null,
        force_assignment: forceAssignment.value,
      }

      await operacionesStore.asignarPersonal(payload)

      emit('saved')
      closeDialog()

      // Reset force flag
      forceAssignment.value = false
    } catch (error) {
      console.error('Error al guardar asignación:', error)

      // Si el backend requiere confirmación, mostrar diálogo
      if (error.response?.data?.requiere_confirmacion) {
        confirmWarnings.value = error.response.data.errores || []
        showConfirmDialog.value = true
      }
    } finally {
      saving.value = false
    }
  }

  function confirmSave () {
    forceAssignment.value = true
    showConfirmDialog.value = false
    save()
  }

  function cancelConfirm () {
    showConfirmDialog.value = false
    confirmWarnings.value = []
    forceAssignment.value = false
  }

  onMounted(() => {
    if (dialogVisible.value) {
      initForm()
    }
  })
</script>
