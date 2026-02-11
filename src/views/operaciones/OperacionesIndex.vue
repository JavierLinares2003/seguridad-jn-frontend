<template>
  <v-container class="pa-4" fluid>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col>
        <h1 class="text-h4">Centro de Operaciones</h1>
        <p class="text-body-2 text-medium-emphasis">
          Arrastra personal hacia un proyecto para crear una asignación
        </p>
      </v-col>
    </v-row>

    <v-row>
      <!-- PANEL IZQUIERDO: Personal Disponible -->
      <v-col cols="12" md="5">
        <v-card class="h-100" elevation="2" rounded="xl">
          <v-card-title class="bg-primary d-flex align-center">
            <v-icon start>mdi-account-group</v-icon>
            Personal Disponible
            <v-spacer />
            <v-chip color="white" size="small" variant="flat">
              {{ personalFiltrado.length }}
            </v-chip>
          </v-card-title>

          <!-- Filtros de Personal -->
          <v-card-text class="pb-0">
            <v-row dense>
              <v-col cols="12">
                <v-text-field
                  v-model="filtroPersonal"
                  clearable
                  density="compact"
                  hide-details
                  placeholder="Buscar por nombre o DPI..."
                  prepend-inner-icon="mdi-magnify"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="6">
                <v-select
                  v-model="filtroDepartamento"
                  clearable
                  density="compact"
                  hide-details
                  item-title="nombre"
                  item-value="id"
                  :items="departamentos"
                  label="Departamento"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="6">
                <v-select
                  v-model="filtroTipoPersonal"
                  clearable
                  density="compact"
                  hide-details
                  item-title="nombre"
                  item-value="id"
                  :items="tiposPersonal"
                  label="Tipo"
                  variant="outlined"
                />
              </v-col>
            </v-row>
          </v-card-text>

          <!-- Lista de Personal -->
          <v-card-text class="overflow-y-auto" style="max-height: 60vh;">
            <v-progress-linear v-if="loadingPersonal" color="primary" indeterminate />

            <div v-else-if="personalFiltrado.length === 0" class="text-center pa-8">
              <v-icon color="grey-lighten-1" size="64">mdi-account-search</v-icon>
              <p class="text-medium-emphasis mt-2">No se encontró personal</p>
            </div>

            <div v-else class="d-flex flex-column gap-2">
              <v-card
                v-for="persona in personalFiltrado"
                :key="persona.id"
                class="personal-card cursor-grab"
                :class="{ 'dragging': draggedPersonal?.id === persona.id }"
                :draggable="true"
                variant="outlined"
                @dragend="onDragEnd"
                @dragstart="onDragStart($event, persona)"
              >
                <v-card-text class="pa-3">
                  <div class="d-flex align-center">
                    <v-avatar class="mr-3" color="primary" size="40">
                      <span class="text-white font-weight-bold">
                        {{ persona.nombres?.charAt(0) }}{{ persona.apellidos?.charAt(0) }}
                      </span>
                    </v-avatar>
                    <div class="flex-grow-1">
                      <div class="font-weight-medium">
                        {{ persona.nombres }} {{ persona.apellidos }}
                      </div>
                      <div class="text-caption text-medium-emphasis">
                        {{ formatDPI(persona.dpi) }}
                      </div>
                    </div>
                    <div class="text-right">
                      <v-chip
                        v-if="persona.tipo_personal"
                        color="secondary"
                        size="x-small"
                        variant="tonal"
                      >
                        {{ persona.tipo_personal.nombre }}
                      </v-chip>
                      <div class="text-caption text-medium-emphasis mt-1">
                        {{ persona.departamento?.nombre }}
                      </div>
                    </div>
                    <v-icon class="ml-2 drag-handle" color="grey">mdi-drag</v-icon>
                  </div>
                </v-card-text>
              </v-card>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- PANEL DERECHO: Proyectos -->
      <v-col cols="12" md="7">
        <v-card class="h-100" elevation="2" rounded="xl">
          <v-card-title class="bg-secondary d-flex align-center">
            <v-icon start>mdi-briefcase</v-icon>
            Proyectos Activos
            <v-spacer />
            <v-chip color="white" size="small" variant="flat">
              {{ proyectosFiltrados.length }}
            </v-chip>
          </v-card-title>

          <!-- Filtros de Proyectos -->
          <v-card-text class="pb-0">
            <v-row dense>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="filtroProyecto"
                  clearable
                  density="compact"
                  hide-details
                  placeholder="Buscar proyecto..."
                  prepend-inner-icon="mdi-magnify"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="filtroEstadoProyecto"
                  clearable
                  density="compact"
                  hide-details
                  :items="estadosProyecto"
                  label="Estado"
                  variant="outlined"
                />
              </v-col>
            </v-row>
          </v-card-text>

          <!-- Lista de Proyectos (Drop Zones) -->
          <v-card-text class="overflow-y-auto" style="max-height: 60vh;">
            <v-progress-linear v-if="loadingProyectos" color="secondary" indeterminate />

            <div v-else-if="proyectosFiltrados.length === 0" class="text-center pa-8">
              <v-icon color="grey-lighten-1" size="64">mdi-briefcase-search</v-icon>
              <p class="text-medium-emphasis mt-2">No se encontraron proyectos</p>
            </div>

            <div v-else class="d-flex flex-column gap-3">
              <v-card
                v-for="proyecto in proyectosFiltrados"
                :key="proyecto.id"
                class="proyecto-card"
                :class="{
                  'drop-zone-active': isDragging,
                  'drop-zone-hover': dragOverProyecto?.id === proyecto.id
                }"
                variant="outlined"
                @dragleave="onDragLeave"
                @dragover.prevent="onDragOver($event, proyecto)"
                @drop="onDrop($event, proyecto)"
              >
                <v-card-text class="pa-4">
                  <div class="d-flex align-start">
                    <div class="flex-grow-1">
                      <div class="d-flex align-center mb-1">
                        <span class="text-h6 font-weight-bold">{{ proyecto.nombre_proyecto }}</span>
                        <v-chip
                          class="ml-2"
                          :color="getEstadoColor(proyecto.estado_proyecto)"
                          label
                          size="x-small"
                        >
                          {{ proyecto.estado_proyecto }}
                        </v-chip>
                      </div>
                      <div class="text-body-2 text-medium-emphasis mb-2">
                        {{ proyecto.correlativo }} - {{ proyecto.empresa_cliente }}
                      </div>

                      <!-- Indicador de cobertura -->
                      <div v-if="proyecto.estadisticas" class="mt-2">
                        <div class="d-flex align-center justify-space-between mb-1">
                          <span class="text-caption">Cobertura de personal</span>
                          <span class="text-caption font-weight-bold">
                            {{ proyecto.estadisticas.resumen?.total_asignado || 0 }}/{{ proyecto.estadisticas.resumen?.total_requerido || 0 }}
                          </span>
                        </div>
                        <v-progress-linear
                          :color="getColorCobertura(proyecto.estadisticas)"
                          height="6"
                          :model-value="calcularPorcentaje(proyecto.estadisticas)"
                          rounded
                        />
                      </div>

                      <!-- Puestos disponibles -->
                      <div v-if="proyecto.puestosDisponibles?.length > 0" class="mt-3">
                        <div class="text-caption text-medium-emphasis mb-1">Puestos con vacantes:</div>
                        <div class="d-flex flex-wrap gap-1">
                          <v-chip
                            v-for="puesto in proyecto.puestosDisponibles"
                            :key="puesto.configuracion_id"
                            color="warning"
                            size="x-small"
                            variant="tonal"
                          >
                            {{ puesto.nombre_puesto }}: {{ puesto.faltantes }} vacante(s)
                          </v-chip>
                        </div>
                      </div>
                    </div>

                    <!-- Drop indicator -->
                    <div
                      v-if="isDragging"
                      class="drop-indicator ml-4"
                      :class="{ 'active': dragOverProyecto?.id === proyecto.id }"
                    >
                      <v-icon :color="dragOverProyecto?.id === proyecto.id ? 'primary' : 'grey'" size="32">
                        {{ dragOverProyecto?.id === proyecto.id ? 'mdi-account-plus' : 'mdi-arrow-left-bold' }}
                      </v-icon>
                      <div class="text-caption mt-1">
                        {{ dragOverProyecto?.id === proyecto.id ? 'Soltar aquí' : 'Arrastra aquí' }}
                      </div>
                    </div>

                    <!-- Botón ver detalle -->
                    <v-btn
                      v-else
                      icon="mdi-eye"
                      size="small"
                      :to="{ name: 'proyectos-detalle', params: { id: proyecto.id } }"
                      variant="text"
                    />
                  </div>
                </v-card-text>
              </v-card>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Modal de Asignación -->
    <v-dialog v-model="dialogAsignar" max-width="800px" persistent scrollable>
      <v-card rounded="xl">
        <v-card-title class="bg-primary pa-4">
          <v-icon start>mdi-account-plus</v-icon>
          Asignar Personal
          <v-spacer />
          <v-btn density="compact" icon="mdi-close" variant="text" @click="closeAsignarDialog" />
        </v-card-title>

        <v-card-text class="pa-4">
          <v-row>
            <!-- Columna Izquierda: Info del Personal -->
            <v-col cols="12" md="5">
              <v-card class="h-100" rounded="lg" variant="outlined">
                <v-card-title class="text-subtitle-1 bg-grey-lighten-4 py-2">
                  <v-icon size="small" start>mdi-account</v-icon>
                  Datos del Personal
                </v-card-title>
                <v-card-text class="pa-3">
                  <!-- Header con avatar -->
                  <div class="d-flex align-center mb-3">
                    <v-avatar class="mr-3" color="primary" size="56">
                      <span class="text-white text-h6 font-weight-bold">
                        {{ selectedPersonal?.iniciales || (selectedPersonal?.nombres?.charAt(0) + selectedPersonal?.apellidos?.charAt(0)) }}
                      </span>
                    </v-avatar>
                    <div>
                      <div class="text-subtitle-1 font-weight-bold">
                        {{ selectedPersonal?.nombres }} {{ selectedPersonal?.apellidos }}
                      </div>
                      <div class="text-caption text-medium-emphasis">
                        {{ formatDPI(selectedPersonal?.dpi) }}
                      </div>
                      <v-chip
                        class="mt-1"
                        :color="selectedPersonal?.estado === 'activo' ? 'success' : 'warning'"
                        size="x-small"
                      >
                        {{ selectedPersonal?.estado }}
                      </v-chip>
                    </div>
                  </div>

                  <v-divider class="mb-3" />

                  <!-- Datos relevantes -->
                  <div class="d-flex flex-column gap-2">
                    <div class="d-flex justify-space-between">
                      <span class="text-caption text-medium-emphasis">Edad:</span>
                      <span class="text-body-2 font-weight-medium">{{ selectedPersonal?.edad }} años</span>
                    </div>
                    <div class="d-flex justify-space-between">
                      <span class="text-caption text-medium-emphasis">Sexo:</span>
                      <span class="text-body-2 font-weight-medium">{{ selectedPersonal?.sexo?.nombre || 'N/A' }}</span>
                    </div>
                    <div class="d-flex justify-space-between">
                      <span class="text-caption text-medium-emphasis">Altura:</span>
                      <span class="text-body-2 font-weight-medium">{{ selectedPersonal?.altura ? selectedPersonal.altura + ' m' : 'N/A' }}</span>
                    </div>
                    <div class="d-flex justify-space-between">
                      <span class="text-caption text-medium-emphasis">Departamento:</span>
                      <span class="text-body-2 font-weight-medium">{{ selectedPersonal?.departamento?.nombre || 'N/A' }}</span>
                    </div>
                    <div class="d-flex justify-space-between">
                      <span class="text-caption text-medium-emphasis">Puesto actual:</span>
                      <span class="text-body-2 font-weight-medium">{{ selectedPersonal?.puesto || 'N/A' }}</span>
                    </div>
                    <div class="d-flex justify-space-between">
                      <span class="text-caption text-medium-emphasis">Salario base:</span>
                      <span class="text-body-2 font-weight-medium">Q{{ parseFloat(selectedPersonal?.salario_base || 0).toFixed(2) }}</span>
                    </div>
                  </div>

                  <v-divider class="my-3" />

                  <!-- Info adicional -->
                  <div class="d-flex flex-wrap gap-1">
                    <v-chip color="info" size="x-small" variant="tonal">
                      {{ selectedPersonal?.estado_civil?.nombre || 'N/A' }}
                    </v-chip>
                    <v-chip color="error" size="x-small" variant="tonal">
                      {{ selectedPersonal?.tipo_sangre?.nombre || 'N/A' }}
                    </v-chip>
                    <v-chip v-if="selectedPersonal?.sabe_leer" color="success" size="x-small" variant="tonal">
                      Lee
                    </v-chip>
                    <v-chip v-if="selectedPersonal?.sabe_escribir" color="success" size="x-small" variant="tonal">
                      Escribe
                    </v-chip>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Columna Derecha: Formulario de Asignación -->
            <v-col cols="12" md="7">
              <!-- Proyecto destino -->
              <v-alert class="mb-4" color="secondary" density="compact" variant="tonal">
                <div class="d-flex align-center">
                  <v-icon start>mdi-briefcase</v-icon>
                  <div>
                    <strong>{{ selectedProyecto?.nombre_proyecto }}</strong>
                    <div class="text-caption">{{ selectedProyecto?.correlativo }} - {{ selectedProyecto?.empresa_cliente }}</div>
                  </div>
                </div>
              </v-alert>

              <v-form ref="formAsignar" v-model="validAsignar">
                <v-row dense>
                  <!-- Select de Puesto -->
                  <v-col cols="12">
                    <v-select
                      v-model="asignacionData.configuracion_puesto_id"
                      density="comfortable"
                      item-title="displayName"
                      item-value="id"
                      :items="configuracionesProyecto"
                      label="Puesto/Plaza *"
                      :loading="loadingConfiguraciones"
                      :rules="[v => !!v || 'Seleccione un puesto']"
                      variant="outlined"
                      @update:model-value="onPuestoSelect"
                    >
                      <template #item="{ props, item }">
                        <v-list-item v-bind="props">
                          <template #subtitle>
                            Vacantes: {{ item.raw.faltantes || 0 }} de {{ item.raw.cantidad_requerida }}
                          </template>
                          <template #append>
                            <v-chip
                              :color="item.raw.faltantes > 0 ? 'success' : 'error'"
                              size="x-small"
                            >
                              {{ item.raw.faltantes > 0 ? 'Disponible' : 'Completo' }}
                            </v-chip>
                          </template>
                        </v-list-item>
                      </template>
                    </v-select>
                  </v-col>

                  <!-- Validación de requisitos del puesto -->
                  <v-col v-if="selectedConfiguracion" cols="12">
                    <v-card :color="cumpleRequisitos ? 'success' : 'warning'" density="compact" variant="tonal">
                      <v-card-text class="pa-3">
                        <div class="d-flex align-center mb-2">
                          <v-icon class="mr-2" :color="cumpleRequisitos ? 'success' : 'warning'">
                            {{ cumpleRequisitos ? 'mdi-check-circle' : 'mdi-alert-circle' }}
                          </v-icon>
                          <span class="font-weight-bold">
                            {{ cumpleRequisitos ? 'Cumple todos los requisitos' : 'Advertencias de requisitos' }}
                          </span>
                        </div>

                        <div class="d-flex flex-column gap-1 text-caption">
                          <!-- Validación de edad -->
                          <div class="d-flex align-center">
                            <v-icon
                              class="mr-1"
                              :color="validacionRequisitos.edad.cumple ? 'success' : 'error'"
                              size="16"
                            >
                              {{ validacionRequisitos.edad.cumple ? 'mdi-check' : 'mdi-close' }}
                            </v-icon>
                            <span :class="validacionRequisitos.edad.cumple ? 'text-success' : 'text-error'">
                              Edad: {{ selectedPersonal?.edad }} años
                              (Req: {{ selectedConfiguracion.edad_minima }}-{{ selectedConfiguracion.edad_maxima }})
                            </span>
                          </div>

                          <!-- Validación de sexo -->
                          <div v-if="selectedConfiguracion.sexo_id" class="d-flex align-center">
                            <v-icon
                              class="mr-1"
                              :color="validacionRequisitos.sexo.cumple ? 'success' : 'error'"
                              size="16"
                            >
                              {{ validacionRequisitos.sexo.cumple ? 'mdi-check' : 'mdi-close' }}
                            </v-icon>
                            <span :class="validacionRequisitos.sexo.cumple ? 'text-success' : 'text-error'">
                              Sexo: {{ selectedPersonal?.sexo?.nombre || 'N/A' }}
                              (Req: {{ getSexoNombre(selectedConfiguracion.sexo_id) }})
                            </span>
                          </div>

                          <!-- Validación de altura -->
                          <div v-if="selectedConfiguracion.altura_minima" class="d-flex align-center">
                            <v-icon
                              class="mr-1"
                              :color="validacionRequisitos.altura.cumple ? 'success' : 'error'"
                              size="16"
                            >
                              {{ validacionRequisitos.altura.cumple ? 'mdi-check' : 'mdi-close' }}
                            </v-icon>
                            <span :class="validacionRequisitos.altura.cumple ? 'text-success' : 'text-error'">
                              Altura: {{ selectedPersonal?.altura || 'N/A' }} m
                              (Mín: {{ selectedConfiguracion.altura_minima }} m)
                            </span>
                          </div>
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-col>

                  <!-- Select de Turno -->
                  <v-col cols="12" md="6">
                    <v-select
                      v-model="asignacionData.turno_id"
                      density="comfortable"
                      item-title="nombre"
                      item-value="id"
                      :items="turnos"
                      label="Turno *"
                      :rules="[v => !!v || 'Seleccione un turno']"
                      variant="outlined"
                    />
                  </v-col>

                  <!-- Fecha Inicio -->
                  <v-col cols="6" md="3">
                    <v-text-field
                      v-model="asignacionData.fecha_inicio"
                      density="comfortable"
                      label="Fecha Inicio *"
                      :rules="[v => !!v || 'Requerido']"
                      type="date"
                      variant="outlined"
                    />
                  </v-col>

                  <!-- Fecha Fin -->
                  <v-col cols="6" md="3">
                    <v-text-field
                      v-model="asignacionData.fecha_fin"
                      density="comfortable"
                      hint="Vacío = indefinido"
                      label="Fecha Fin"
                      persistent-hint
                      type="date"
                      variant="outlined"
                    />
                  </v-col>

                  <!-- Notas -->
                  <v-col cols="12">
                    <v-textarea
                      v-model="asignacionData.notas"
                      counter="500"
                      density="comfortable"
                      label="Notas (opcional)"
                      rows="2"
                      variant="outlined"
                    />
                  </v-col>
                </v-row>
              </v-form>

              <!-- Warnings adicionales -->
              <v-alert
                v-if="asignacionWarnings.length > 0"
                class="mt-3"
                density="compact"
                type="warning"
                variant="tonal"
              >
                <ul class="mb-0 pl-4">
                  <li v-for="(warn, idx) in asignacionWarnings" :key="idx">{{ warn }}</li>
                </ul>
              </v-alert>
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-chip v-if="!cumpleRequisitos && selectedConfiguracion" color="warning" size="small" variant="tonal">
            <v-icon size="small" start>mdi-alert</v-icon>
            Asignación con advertencias
          </v-chip>
          <v-spacer />
          <v-btn variant="text" @click="closeAsignarDialog">
            Cancelar
          </v-btn>
          <v-btn
            :color="cumpleRequisitos ? 'primary' : 'warning'"
            :loading="saving"
            variant="elevated"
            @click="confirmarAsignacion"
          >
            <v-icon start>mdi-check</v-icon>
            {{ cumpleRequisitos ? 'Confirmar Asignación' : 'Asignar de Todas Formas' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar de confirmación -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="3000">
      {{ snackbarText }}
      <template #actions>
        <v-btn variant="text" @click="snackbar = false">Cerrar</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
  import { computed, onMounted, ref } from 'vue'
  import catalogoService from '@/services/catalogoService'
  import personalService from '@/services/personalService'
  import { useOperacionesStore } from '@/stores/operaciones'
  import { useProyectosStore } from '@/stores/proyectos'
  import { formatDPI } from '@/utils/dpiFormatter'

  const operacionesStore = useOperacionesStore()
  const proyectosStore = useProyectosStore()

  // Estado de carga
  const loadingPersonal = ref(false)
  const loadingProyectos = ref(false)
  const loadingConfiguraciones = ref(false)
  const saving = ref(false)

  // Datos
  const personal = ref([])
  const proyectos = ref([])
  const departamentos = ref([])
  const tiposPersonal = ref([])
  const turnos = ref([])
  const configuracionesProyecto = ref([])

  // Filtros Personal
  const filtroPersonal = ref('')
  const filtroDepartamento = ref(null)
  const filtroTipoPersonal = ref(null)

  // Filtros Proyectos
  const filtroProyecto = ref('')
  const filtroEstadoProyecto = ref('activo')
  const estadosProyecto = [
    { title: 'Activo', value: 'activo' },
    { title: 'Planificación', value: 'planificacion' },
    { title: 'Todos', value: null },
  ]

  // Drag and Drop state
  const isDragging = ref(false)
  const draggedPersonal = ref(null)
  const dragOverProyecto = ref(null)

  // Dialog state
  const dialogAsignar = ref(false)
  const formAsignar = ref(null)
  const validAsignar = ref(false)
  const selectedPersonal = ref(null)
  const selectedProyecto = ref(null)
  const asignacionData = ref({
    configuracion_puesto_id: null,
    turno_id: null,
    fecha_inicio: null,
    fecha_fin: null,
    notas: '',
  })
  const asignacionWarnings = ref([])

  // Computed: Configuración seleccionada
  const selectedConfiguracion = computed(() => {
    if (!asignacionData.value.configuracion_puesto_id) return null
    return configuracionesProyecto.value.find(c => c.id === asignacionData.value.configuracion_puesto_id)
  })

  // Computed: Validación de requisitos
  const validacionRequisitos = computed(() => {
    const config = selectedConfiguracion.value
    const persona = selectedPersonal.value

    if (!config || !persona) {
      return {
        edad: { cumple: true },
        sexo: { cumple: true },
        altura: { cumple: true },
      }
    }

    // Validar edad
    const edadCumple = persona.edad >= (config.edad_minima || 0)
      && persona.edad <= (config.edad_maxima || 100)

    // Validar sexo (si el puesto lo requiere)
    const sexoCumple = !config.sexo_id
      || persona.sexo?.id === config.sexo_id

    // Validar altura (si el puesto lo requiere)
    const alturaPersona = Number.parseFloat(persona.altura) || 0
    const alturaMinima = Number.parseFloat(config.altura_minima) || 0
    const alturaCumple = !alturaMinima || alturaPersona >= alturaMinima

    return {
      edad: { cumple: edadCumple },
      sexo: { cumple: sexoCumple },
      altura: { cumple: alturaCumple },
    }
  })

  // Computed: ¿Cumple todos los requisitos?
  const cumpleRequisitos = computed(() => {
    const v = validacionRequisitos.value
    return v.edad.cumple && v.sexo.cumple && v.altura.cumple
  })

  // Catálogo de sexos para referencia
  const sexosCatalogo = ref([])

  // Función para obtener nombre de sexo por ID
  function getSexoNombre (sexoId) {
    if (!sexoId) return 'Cualquiera'
    const sexo = sexosCatalogo.value.find(s => s.id === sexoId)
    return sexo?.nombre || 'N/A'
  }

  // Snackbar
  const snackbar = ref(false)
  const snackbarText = ref('')
  const snackbarColor = ref('success')

  // Computed: Personal filtrado
  const personalFiltrado = computed(() => {
    let resultado = personal.value

    if (filtroPersonal.value) {
      const busqueda = filtroPersonal.value.toLowerCase()
      resultado = resultado.filter(p =>
        `${p.nombres} ${p.apellidos}`.toLowerCase().includes(busqueda)
        || p.dpi?.includes(busqueda),
      )
    }

    if (filtroDepartamento.value) {
      resultado = resultado.filter(p => p.departamento_id === filtroDepartamento.value)
    }

    if (filtroTipoPersonal.value) {
      resultado = resultado.filter(p => p.tipo_personal_id === filtroTipoPersonal.value)
    }

    return resultado
  })

  // Computed: Proyectos filtrados
  const proyectosFiltrados = computed(() => {
    let resultado = proyectos.value

    if (filtroProyecto.value) {
      const busqueda = filtroProyecto.value.toLowerCase()
      resultado = resultado.filter(p =>
        p.nombre_proyecto?.toLowerCase().includes(busqueda)
        || p.correlativo?.toLowerCase().includes(busqueda)
        || p.empresa_cliente?.toLowerCase().includes(busqueda),
      )
    }

    if (filtroEstadoProyecto.value) {
      resultado = resultado.filter(p => p.estado_proyecto === filtroEstadoProyecto.value)
    }

    return resultado
  })

  // Drag and Drop handlers
  function onDragStart (event, persona) {
    isDragging.value = true
    draggedPersonal.value = persona
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', persona.id.toString())
  }

  function onDragEnd () {
    isDragging.value = false
    draggedPersonal.value = null
    dragOverProyecto.value = null
  }

  function onDragOver (event, proyecto) {
    event.preventDefault()
    dragOverProyecto.value = proyecto
  }

  function onDragLeave () {
    dragOverProyecto.value = null
  }

  function onDrop (event, proyecto) {
    event.preventDefault()

    if (draggedPersonal.value) {
      openAsignarDialog(draggedPersonal.value, proyecto)
    }

    isDragging.value = false
    draggedPersonal.value = null
    dragOverProyecto.value = null
  }

  // Dialog functions
  async function openAsignarDialog (persona, proyecto) {
    selectedPersonal.value = persona
    selectedProyecto.value = proyecto

    // Reset form
    asignacionData.value = {
      configuracion_puesto_id: null,
      turno_id: null,
      fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_fin: null,
      notas: '',
    }
    asignacionWarnings.value = []

    // Cargar configuraciones del proyecto
    await loadConfiguracionesProyecto(proyecto.id)

    dialogAsignar.value = true
  }

  function closeAsignarDialog () {
    dialogAsignar.value = false
    selectedPersonal.value = null
    selectedProyecto.value = null
    asignacionData.value = {
      configuracion_puesto_id: null,
      turno_id: null,
      fecha_inicio: null,
      fecha_fin: null,
      notas: '',
    }
  }

  async function loadConfiguracionesProyecto (proyectoId) {
    loadingConfiguraciones.value = true
    try {
      const response = await proyectosStore.fetchConfiguracionPersonal(proyectoId)

      // Obtener estadísticas para saber vacantes
      const stats = await operacionesStore.fetchEstadisticasProyecto(proyectoId)

      configuracionesProyecto.value = (response || []).map(config => {
        const statPuesto = stats?.puestos?.find(p => p.configuracion_id === config.id)
        return {
          ...config,
          displayName: `${config.tipo_personal?.nombre || 'Puesto'} - ${config.turno?.nombre || 'Sin turno'}`,
          faltantes: statPuesto?.faltantes || config.cantidad_requerida,
          cantidad_asignada: statPuesto?.cantidad_asignada || 0,
        }
      })
    } catch (error) {
      console.error('Error loading configuraciones:', error)
    } finally {
      loadingConfiguraciones.value = false
    }
  }

  function onPuestoSelect (configId) {
    const config = configuracionesProyecto.value.find(c => c.id === configId)
    if (config?.turno_id) {
      asignacionData.value.turno_id = config.turno_id
    }

    // Verificar warnings
    asignacionWarnings.value = []
    if (config && config.faltantes <= 0) {
      asignacionWarnings.value.push('Este puesto ya tiene todas las plazas cubiertas')
    }
  }

  async function confirmarAsignacion () {
    const { valid } = await formAsignar.value.validate()
    if (!valid) return

    saving.value = true
    try {
      const payload = {
        personal_id: selectedPersonal.value.id,
        proyecto_id: selectedProyecto.value.id,
        configuracion_puesto_id: asignacionData.value.configuracion_puesto_id,
        turno_id: asignacionData.value.turno_id,
        fecha_inicio: asignacionData.value.fecha_inicio,
        fecha_fin: asignacionData.value.fecha_fin || null,
        notas: asignacionData.value.notas || null,
      }

      await operacionesStore.asignarPersonal(payload)

      // Recargar datos
      await loadProyectos()

      showSnackbar('Asignación creada correctamente', 'success')
      closeAsignarDialog()
    } catch (error) {
      console.error('Error al asignar:', error)
      showSnackbar(error.apiMessage || 'Error al crear la asignación', 'error')
    } finally {
      saving.value = false
    }
  }

  function showSnackbar (text, color = 'success') {
    snackbarText.value = text
    snackbarColor.value = color
    snackbar.value = true
  }

  // Utility functions
  function getEstadoColor (estado) {
    const colors = {
      planificacion: 'info',
      activo: 'success',
      suspendido: 'warning',
      finalizado: 'grey',
    }
    return colors[estado] || 'grey'
  }

  function calcularPorcentaje (estadisticas) {
    if (!estadisticas?.resumen) return 0
    const { total_asignado, total_requerido } = estadisticas.resumen
    if (!total_requerido) return 0
    return Math.round((total_asignado / total_requerido) * 100)
  }

  function getColorCobertura (estadisticas) {
    const porcentaje = calcularPorcentaje(estadisticas)
    if (porcentaje >= 100) return 'success'
    if (porcentaje >= 70) return 'warning'
    return 'error'
  }

  // Load data
  async function loadPersonal () {
    loadingPersonal.value = true
    try {
      const response = await personalService.getAll({ per_page: 100, estado: 'activo' })
      personal.value = response?.data || response || []
    } catch (error) {
      console.error('Error loading personal:', error)
    } finally {
      loadingPersonal.value = false
    }
  }

  async function loadProyectos () {
    loadingProyectos.value = true
    try {
      await proyectosStore.fetchAll(true)

      // Cargar estadísticas de cada proyecto
      const proyectosConStats = await Promise.all(
        proyectosStore.items.map(async proyecto => {
          try {
            const stats = await operacionesStore.fetchEstadisticasProyecto(proyecto.id)
            return {
              ...proyecto,
              estadisticas: stats,
              puestosDisponibles: stats?.puestos?.filter(p => p.faltantes > 0) || [],
            }
          } catch {
            return { ...proyecto, estadisticas: null, puestosDisponibles: [] }
          }
        }),
      )

      proyectos.value = proyectosConStats
    } catch (error) {
      console.error('Error loading proyectos:', error)
    } finally {
      loadingProyectos.value = false
    }
  }

  async function loadCatalogos () {
    try {
      const [deps, tipos, turnosData, sexos] = await Promise.all([
        catalogoService.get('departamentos'),
        catalogoService.get('tipos-personal'),
        catalogoService.get('turnos'),
        catalogoService.get('sexos'),
      ])
      departamentos.value = deps || []
      tiposPersonal.value = tipos || []
      turnos.value = turnosData || []
      sexosCatalogo.value = sexos || []
    } catch (error) {
      console.error('Error loading catalogos:', error)
    }
  }

  onMounted(async () => {
    await loadCatalogos()
    await Promise.all([loadPersonal(), loadProyectos()])
  })
</script>

<style scoped>
.personal-card {
  transition: all 0.2s ease;
  user-select: none;
}

.personal-card:hover {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.personal-card.dragging {
  opacity: 0.5;
  transform: scale(0.98);
}

.cursor-grab {
  cursor: grab;
}

.cursor-grab:active {
  cursor: grabbing;
}

.drag-handle {
  opacity: 0.5;
}

.personal-card:hover .drag-handle {
  opacity: 1;
}

.proyecto-card {
  transition: all 0.3s ease;
}

.proyecto-card.drop-zone-active {
  border-style: dashed;
  border-width: 2px;
}

.proyecto-card.drop-zone-hover {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.05);
  transform: scale(1.01);
}

.drop-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border-radius: 8px;
  background: rgba(var(--v-theme-surface-variant), 0.5);
  transition: all 0.2s ease;
}

.drop-indicator.active {
  background: rgba(var(--v-theme-primary), 0.1);
}

.gap-1 {
  gap: 4px;
}

.gap-2 {
  gap: 8px;
}

.gap-3 {
  gap: 12px;
}
</style>
