<template>
  <v-container fluid>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col>
        <v-btn icon="mdi-arrow-left" variant="text" @click="goBack" />
        <span class="text-h4 ml-2">{{ isEditing ? 'Editar' : 'Nuevo' }} Proyecto</span>
      </v-col>
    </v-row>

    <v-form @submit.prevent="onSubmit">
      <v-row>
        <!-- Columna Principal -->
        <v-col cols="12" lg="8">
          <v-card class="mb-4" elevation="2" rounded="xl">
            <v-tabs v-model="activeTab" color="primary">
              <v-tab value="general">Información General</v-tab>
              <v-tab value="ubicacion">Ubicación</v-tab>
              <v-tab value="facturacion">Facturación</v-tab>
            </v-tabs>
            <v-divider />

            <v-card-text class="pa-5">
              <v-window v-model="activeTab">
                <!-- TAB: Información General -->
                <v-window-item value="general">
                  <v-row>
                    <!-- Tipo de Proyecto -->
                    <v-col cols="12" md="6">
                      <v-select
                        v-model="tipo_proyecto_id"
                        density="comfortable"
                        :error-messages="errors.tipo_proyecto_id"
                        item-title="nombre"
                        item-value="id"
                        :items="tiposProyecto"
                        label="Tipo de Proyecto *"
                        :loading="catalogosLoading"
                        variant="outlined"
                      />
                    </v-col>

                    <!-- Correlativo (Readonly) -->
                    <v-col cols="12" md="6">
                      <v-text-field
                        density="comfortable"
                        hint="Generado automáticamente al guardar"
                        label="Correlativo"
                        :model-value="correlativoDisplay"
                        persistent-hint
                        readonly
                        variant="outlined"
                      >
                        <template #prepend-inner>
                          <v-icon color="grey">mdi-pound</v-icon>
                        </template>
                      </v-text-field>
                    </v-col>

                    <!-- Nombre del Proyecto -->
                    <v-col cols="12">
                      <v-text-field
                        v-model="nombre_proyecto"
                        density="comfortable"
                        :error-messages="errors.nombre_proyecto"
                        label="Nombre del Proyecto *"
                        variant="outlined"
                        @blur="validateField('nombre_proyecto')"
                      />
                    </v-col>

                    <!-- Empresa Cliente -->
                    <v-col cols="12">
                      <v-text-field
                        v-model="empresa_cliente"
                        density="comfortable"
                        :error-messages="errors.empresa_cliente"
                        label="Empresa Cliente *"
                        prepend-inner-icon="mdi-domain"
                        variant="outlined"
                      />
                    </v-col>

                    <!-- Descripción -->
                    <v-col cols="12">
                      <v-textarea
                        v-model="descripcion"
                        auto-grow
                        density="comfortable"
                        :error-messages="errors.descripcion"
                        label="Descripción"
                        rows="3"
                        variant="outlined"
                      />
                    </v-col>
                  </v-row>

                  <v-row>
                    <v-col cols="12">
                      <h3 class="text-h6 mb-3">Planificación</h3>
                      <v-divider class="mb-4" />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="fecha_inicio_estimada"
                        density="comfortable"
                        :error-messages="errors.fecha_inicio_estimada"
                        label="Fecha Inicio Estimada"
                        type="date"
                        variant="outlined"
                      />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="fecha_fin_estimada"
                        density="comfortable"
                        :error-messages="errors.fecha_fin_estimada"
                        label="Fecha Fin Estimada"
                        type="date"
                        variant="outlined"
                      />
                    </v-col>

                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="fecha_inicio_real"
                        density="comfortable"
                        :error-messages="errors.fecha_inicio_real"
                        label="Fecha Inicio Real"
                        type="date"
                        variant="outlined"
                      />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="fecha_fin_real"
                        density="comfortable"
                        :error-messages="errors.fecha_fin_real"
                        label="Fecha Fin Real"
                        type="date"
                        variant="outlined"
                      />
                    </v-col>
                  </v-row>
                </v-window-item>

                <!-- TAB: Ubicación -->
                <v-window-item value="ubicacion">
                  <UbicacionProyectoForm
                    v-model:departamento-geografico-id="ubicacion_departamento_geo_id"
                    v-model:direccion="ubicacion_direccion_completa"
                    v-model:municipio-id="ubicacion_municipio_id"
                    v-model:zona="ubicacion_zona"
                    :errors="{
                      departamento_geografico_id: errors.ubicacion_departamento_geo_id,
                      municipio_id: errors.ubicacion_municipio_id,
                      zona: errors.ubicacion_zona,
                      direccion: errors.ubicacion_direccion_completa
                    }"
                  />
                </v-window-item>

                <!-- TAB: Facturación -->
                <v-window-item value="facturacion">
                  <FacturacionProyectoForm
                    v-model:dia-pago="facturacion_dia_pago"
                    v-model:direccion="facturacion_direccion"
                    v-model:forma-pago="facturacion_forma_pago"
                    v-model:monto="facturacion_monto"
                    v-model:nit="facturacion_nit"
                    v-model:nombre="facturacion_nombre"
                    v-model:periodicidad-id="facturacion_periodicidad_id"
                    v-model:tipo-documento-id="facturacion_tipo_documento_id"
                    :errors="{
                      tipo_documento_facturacion_id: errors.facturacion_tipo_documento_id,
                      nit_cliente: errors.facturacion_nit,
                      nombre_facturacion: errors.facturacion_nombre,
                      direccion_facturacion: errors.facturacion_direccion,
                      forma_pago: errors.facturacion_forma_pago,
                      periodicidad_pago_id: errors.facturacion_periodicidad_id,
                      dia_pago: errors.facturacion_dia_pago,
                      monto_proyecto_total: errors.facturacion_monto
                    }"
                  />
                </v-window-item>
              </v-window>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Columna Lateral -->
        <v-col cols="12" lg="4">
          <!-- Estado -->
          <v-card class="mb-4" elevation="2" rounded="xl">
            <v-card-title class="d-flex align-center py-3 px-4">
              <v-icon color="primary" start>mdi-toggle-switch</v-icon>
              Estado
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-5">
              <v-select
                v-model="estado_proyecto"
                density="comfortable"
                hide-details="auto"
                item-title="text"
                item-value="value"
                :items="estadosProyecto"
                label="Estado del Proyecto"
                variant="outlined"
              >
                <template #selection="{ item }">
                  <v-chip :color="getEstadoColor(item.value)" label size="small">
                    {{ item.title }}
                  </v-chip>
                </template>
              </v-select>
            </v-card-text>
          </v-card>

          <!-- Info Adicional / Metadatos -->
          <v-card v-if="isEditing" elevation="2" rounded="xl">
            <v-card-title class="d-flex align-center py-3 px-4">
              <v-icon color="grey" start>mdi-information-outline</v-icon>
              Información de Registro
            </v-card-title>
            <v-divider />
            <v-list density="compact">
              <v-list-item>
                <template #prepend><v-icon color="grey" size="small">mdi-calendar-plus</v-icon></template>
                <v-list-item-title class="text-caption">Creado el</v-list-item-title>
                <v-list-item-subtitle>{{ formatDate(store.currentItem?.created_at) }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend><v-icon color="grey" size="small">mdi-calendar-edit</v-icon></template>
                <v-list-item-title class="text-caption">Actualizado el</v-list-item-title>
                <v-list-item-subtitle>{{ formatDate(store.currentItem?.updated_at) }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>

      <!-- Botones de Acción -->
      <v-row class="mt-4">
        <v-col class="d-flex justify-end ga-4">
          <v-btn rounded="lg" size="large" variant="tonal" @click="goBack">
            Cancelar
          </v-btn>
          <v-btn
            color="primary"
            :disabled="!meta.valid"
            elevation="2"
            :loading="store.saving"
            rounded="lg"
            size="large"
            type="submit"
          >
            <v-icon start>mdi-content-save</v-icon>
            {{ isEditing ? 'Actualizar' : 'Guardar' }}
          </v-btn>
        </v-col>
      </v-row>
    </v-form>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
  import { format } from 'date-fns'
  import { es } from 'date-fns/locale'
  import { useField, useForm } from 'vee-validate'
  import { computed, onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import * as yup from 'yup'
  import { CATALOGOS } from '@/services/catalogoService'
  import { useCatalogosStore } from '@/stores/catalogos'
  import { useProyectosStore } from '@/stores/proyectos'

  import FacturacionProyectoForm from './components/FacturacionProyectoForm.vue'
  // Componentes propios
  import UbicacionProyectoForm from './components/UbicacionProyectoForm.vue'

  const route = useRoute()
  const router = useRouter()
  const store = useProyectosStore()
  const catalogosStore = useCatalogosStore()

  // Props
  const isEditing = computed(() => !!route.params.id)

  // Tab activo
  const activeTab = ref('general')

  // Catálogos
  const catalogosLoading = ref(true)
  const tiposProyecto = computed(() => catalogosStore.getCatalogo(CATALOGOS.TIPOS_PROYECTO))

  // Estados
  const estadosProyecto = [
    { text: 'Planificación', value: 'planificacion' },
    { text: 'Activo', value: 'activo' },
    { text: 'Suspendido', value: 'suspendido' },
    { text: 'Finalizado', value: 'finalizado' },
  ]

  // Snackbar
  const snackbar = ref({ show: false, text: '', color: 'success' })

  // Validación
  const validationSchema = yup.object({
    tipo_proyecto_id: yup.number().required('El tipo de proyecto es requerido'),
    nombre_proyecto: yup.string().required('El nombre del proyecto es requerido').max(255),
    empresa_cliente: yup.string().required('La empresa cliente es requerida').max(200),
    fecha_inicio_estimada: yup.date().nullable(),
    fecha_fin_estimada: yup.date().nullable().min(
      yup.ref('fecha_inicio_estimada'),
      'La fecha fin debe ser posterior a la fecha de inicio',
    ),
    fecha_inicio_real: yup.date().nullable(),
    fecha_fin_real: yup.date().nullable().min(
      yup.ref('fecha_inicio_real'),
      'La fecha fin real debe ser posterior a la fecha de inicio real',
    ),
    estado_proyecto: yup.string().nullable(),

    // Ubicación Validation
    ubicacion_departamento_geo_id: yup.number().required('El departamento es requerido'),
    ubicacion_municipio_id: yup.number().required('El municipio es requerido'),
    ubicacion_direccion_completa: yup.string().required('La dirección es requerida'),
    ubicacion_zona: yup.number().nullable(),

    // Facturación Validation
    facturacion_tipo_documento_id: yup.number().required('Tipo de documento es requerido'),
    facturacion_nit: yup.string().required('NIT es requerido'),
    facturacion_nombre: yup.string().required('Nombre facturación es requerido'),
    facturacion_direccion: yup.string().required('Dirección facturación es requerida'),
    facturacion_forma_pago: yup.string().required('Forma de pago es requerida'),
    facturacion_periodicidad_id: yup.number().required('Periodicidad es requerida'),
    facturacion_dia_pago: yup.number().nullable().min(1).max(31),
    facturacion_monto: yup.number().nullable().min(0),
  })

  const { handleSubmit, errors, meta, validateField, setValues, resetForm } = useForm({
    validationSchema,
    initialValues: {
      estado_proyecto: 'planificacion',
    },
  })

  // Campos: General
  const { value: tipo_proyecto_id } = useField('tipo_proyecto_id')
  const { value: nombre_proyecto } = useField('nombre_proyecto')
  const { value: empresa_cliente } = useField('empresa_cliente')
  const { value: descripcion } = useField('descripcion')
  const { value: fecha_inicio_estimada } = useField('fecha_inicio_estimada')
  const { value: fecha_fin_estimada } = useField('fecha_fin_estimada')
  const { value: fecha_inicio_real } = useField('fecha_inicio_real')
  const { value: fecha_fin_real } = useField('fecha_fin_real')
  const { value: estado_proyecto } = useField('estado_proyecto')
  const { value: correlativo } = useField('correlativo')

  // Campos: Ubicación
  const { value: ubicacion_departamento_geo_id } = useField('ubicacion_departamento_geo_id')
  const { value: ubicacion_municipio_id } = useField('ubicacion_municipio_id')
  const { value: ubicacion_zona } = useField('ubicacion_zona')
  const { value: ubicacion_direccion_completa } = useField('ubicacion_direccion_completa')

  // Campos: Facturación
  const { value: facturacion_tipo_documento_id } = useField('facturacion_tipo_documento_id')
  const { value: facturacion_nit } = useField('facturacion_nit')
  const { value: facturacion_nombre } = useField('facturacion_nombre')
  const { value: facturacion_direccion } = useField('facturacion_direccion')
  const { value: facturacion_forma_pago } = useField('facturacion_forma_pago')
  const { value: facturacion_periodicidad_id } = useField('facturacion_periodicidad_id')
  const { value: facturacion_dia_pago } = useField('facturacion_dia_pago')
  const { value: facturacion_monto } = useField('facturacion_monto')

  // Correlativo Display
  const correlativoDisplay = computed(() => {
    if (isEditing.value) {
      return correlativo.value || 'Sin asignar'
    }
    return 'Generado automáticamente'
  })

  // Cargar catálogos
  async function loadCatalogos () {
    catalogosLoading.value = true
    try {
      await catalogosStore.loadCatalogos([CATALOGOS.TIPOS_PROYECTO])
    } finally {
      catalogosLoading.value = false
    }
  }

  // Cargar datos
  async function loadProyecto () {
    if (!route.params.id) return

    try {
      const data = await store.fetchById(route.params.id)

      // Helper para convertir fechas ISO a formato yyyy-MM-dd
      const formatDateForInput = isoDate => {
        if (!isoDate) return null
        // Extraer solo la parte de la fecha (yyyy-MM-dd) del ISO string
        return isoDate.split('T')[0]
      }

      // Mapear datos anidados a forma plana para el formulario
      const ubicacion = data.ubicacion || {}
      const facturacion = data.facturacion || {}

      const flatData = {
        ...data,

        // Convertir fechas a formato yyyy-MM-dd
        fecha_inicio_estimada: formatDateForInput(data.fecha_inicio_estimada),
        fecha_fin_estimada: formatDateForInput(data.fecha_fin_estimada),
        fecha_inicio_real: formatDateForInput(data.fecha_inicio_real),
        fecha_fin_real: formatDateForInput(data.fecha_fin_real),

        // Ubicación
        ubicacion_departamento_geo_id: ubicacion.departamento_geo_id,
        ubicacion_municipio_id: ubicacion.municipio_id,
        ubicacion_zona: ubicacion.zona,
        ubicacion_direccion_completa: ubicacion.direccion_completa,

        // Facturación
        facturacion_tipo_documento_id: facturacion.tipo_documento_facturacion_id,
        facturacion_nit: facturacion.nit_cliente,
        facturacion_nombre: facturacion.nombre_facturacion,
        facturacion_direccion: facturacion.direccion_facturacion,
        facturacion_forma_pago: facturacion.forma_pago,
        facturacion_periodicidad_id: facturacion.periodicidad_pago_id,
        facturacion_dia_pago: facturacion.dia_pago,
        facturacion_monto: facturacion.monto_proyecto_total,
      }

      setValues(flatData)
    } catch (error) {
      console.error(error)
      snackbar.value = { show: true, text: 'Error al cargar proyecto', color: 'error' }
    }
  }

  // Submit
  const onSubmit = handleSubmit(async values => {
    try {
      // Reconstruir estructura anidada
      const payload = {
        ...values,
        ubicacion: {
          departamento_geo_id: values.ubicacion_departamento_geo_id,
          municipio_id: values.ubicacion_municipio_id,
          zona: values.ubicacion_zona,
          direccion_completa: values.ubicacion_direccion_completa,
        },
        facturacion: {
          tipo_documento_facturacion_id: values.facturacion_tipo_documento_id,
          nit_cliente: values.facturacion_nit,
          nombre_facturacion: values.facturacion_nombre,
          direccion_facturacion: values.facturacion_direccion,
          forma_pago: values.facturacion_forma_pago,
          periodicidad_pago_id: values.facturacion_periodicidad_id,
          dia_pago: values.facturacion_dia_pago,
          monto_proyecto_total: values.facturacion_monto,
          moneda: 'GTQ',
        },
      }

      // Limpiar campos planos
      delete payload.ubicacion_departamento_geo_id
      delete payload.ubicacion_municipio_id
      delete payload.ubicacion_zona
      delete payload.ubicacion_direccion_completa

      delete payload.facturacion_tipo_documento_id
      delete payload.facturacion_nit
      delete payload.facturacion_nombre
      delete payload.facturacion_direccion
      delete payload.facturacion_forma_pago
      delete payload.facturacion_periodicidad_id
      delete payload.facturacion_dia_pago
      delete payload.facturacion_monto

      await (isEditing.value ? store.update(route.params.id, payload) : store.create(payload))

      snackbar.value = {
        show: true,
        text: isEditing.value ? 'Proyecto actualizado' : 'Proyecto creado',
        color: 'success',
      }

      setTimeout(() => {
        router.push({ name: 'proyectos' })
      }, 1500)
    } catch {
      snackbar.value = {
        show: true,
        text: store.error || 'Error al guardar',
        color: 'error',
      }
    }
  })

  // Color del estado
  function getEstadoColor (estado) {
    const colors = {
      planificacion: 'info',
      activo: 'success',
      suspendido: 'warning',
      finalizado: 'grey',
    }
    return colors[estado] || 'grey'
  }

  // Format Date
  function formatDate (date) {
    if (!date) return '-'
    return format(new Date(date), 'dd/MM/yyyy HH:mm')
  }

  // Back
  function goBack () {
    router.back()
  }

  onMounted(async () => {
    await loadCatalogos()
    if (isEditing.value) {
      await loadProyecto()
    }
  })
</script>
