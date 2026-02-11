<template>
  <v-container fluid>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col>
        <v-btn icon="mdi-arrow-left" variant="text" @click="goBack" />
        <span class="text-h4 ml-2">{{ isEditing ? 'Editar' : 'Nuevo' }} Personal</span>
      </v-col>
    </v-row>

    <v-form @submit.prevent="onSubmit">
      <v-row>
        <!-- Columna Principal -->
        <v-col cols="12" lg="8">
          <!-- Información Personal -->
          <v-card class="mb-4">
            <v-card-title>
              <v-icon start>mdi-account</v-icon>
              Información Personal
            </v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="nombres"
                    :error-messages="errors.nombres"
                    label="Nombres *"
                    variant="outlined"
                    @blur="validateField('nombres')"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="apellidos"
                    :error-messages="errors.apellidos"
                    label="Apellidos *"
                    variant="outlined"
                    @blur="validateField('apellidos')"
                  />
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    :error-messages="errors.dpi"
                    label="DPI *"
                    maxlength="15"
                    :model-value="dpiDisplay"
                    placeholder="0000-00000-0000"
                    variant="outlined"
                    @blur="validateField('dpi')"
                    @update:model-value="onDpiInput"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="nit"
                    :error-messages="errors.nit"
                    label="NIT"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="numero_igss"
                    :error-messages="errors.numero_igss"
                    label="Número IGSS"
                    variant="outlined"
                  />
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="fecha_nacimiento"
                    :error-messages="errors.fecha_nacimiento"
                    label="Fecha de Nacimiento *"
                    type="date"
                    variant="outlined"
                    @change="calcularEdad"
                  />
                </v-col>
                <v-col cols="12" md="2">
                  <v-text-field
                    bg-color="grey-lighten-4"
                    label="Edad"
                    :model-value="edad"
                    readonly
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="3">
                  <v-select
                    v-model="sexo_id"
                    :error-messages="errors.sexo_id"
                    item-title="nombre"
                    item-value="id"
                    :items="sexos"
                    label="Sexo *"
                    :loading="catalogosLoading"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="3">
                  <v-select
                    v-model="estado_civil_id"
                    :error-messages="errors.estado_civil_id"
                    item-title="nombre"
                    item-value="id"
                    :items="estadosCiviles"
                    label="Estado Civil *"
                    :loading="catalogosLoading"
                    variant="outlined"
                  />
                </v-col>

                <v-col cols="12" md="3">
                  <v-select
                    v-model="tipo_sangre_id"
                    clearable
                    item-title="nombre"
                    item-value="id"
                    :items="tiposSangre"
                    label="Tipo de Sangre"
                    :loading="catalogosLoading"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="3">
                  <v-text-field
                    v-model.number="altura"
                    :error-messages="errors.altura"
                    label="Altura (m) *"
                    max="3"
                    min="0"
                    placeholder="1.70"
                    step="0.01"
                    type="number"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="3">
                  <v-text-field
                    v-model.number="peso"
                    :error-messages="errors.peso"
                    label="Peso (lb) *"
                    min="0"
                    placeholder="150"
                    step="0.1"
                    type="number"
                    variant="outlined"
                  />
                </v-col>

                <!-- Habilidades de lectura y escritura -->
                <v-col cols="12" md="3">
                  <v-checkbox
                    v-model="sabe_leer"
                    hide-details
                    label="Sabe leer"
                  />
                </v-col>
                <v-col cols="12" md="3">
                  <v-checkbox
                    v-model="sabe_escribir"
                    hide-details
                    label="Sabe escribir"
                  />
                </v-col>

                <!-- Alergias -->
                <v-col cols="12">
                  <v-checkbox
                    v-model="es_alergico"
                    hide-details
                    label="¿Es alérgico?"
                  />
                </v-col>
                <v-col v-if="es_alergico" cols="12">
                  <v-textarea
                    v-model="alergias"
                    :error-messages="errors.alergias"
                    label="Descripción de Alergias *"
                    rows="2"
                    variant="outlined"
                  />
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- Contacto -->
          <v-card class="mb-4">
            <v-card-title>
              <v-icon start>mdi-phone</v-icon>
              Información de Contacto
            </v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="email"
                    :error-messages="errors.email"
                    label="Email *"
                    type="email"
                    variant="outlined"
                    @blur="validateField('email')"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    :error-messages="errors.telefono"
                    label="Teléfono *"
                    maxlength="9"
                    :model-value="telefonoDisplay"
                    placeholder="0000-0000"
                    variant="outlined"
                    @update:model-value="onTelefonoInput"
                  />
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- Dirección -->
          <DireccionForm
            ref="direccionFormRef"
            v-model:departamento-geografico-id="departamento_geografico_id"
            v-model:direccion="direccion_completa"
            v-model:municipio-id="municipio_id"
            v-model:zona="zona"
            class="mb-4"
            :errors="{
              departamento_geografico_id: errors.departamento_geografico_id,
              municipio_id: errors.municipio_id,
              zona: errors.zona,
              direccion: errors.direccion_completa,
            }"
          />

          <!-- Información Laboral -->
          <v-card class="mb-4">
            <v-card-title>
              <v-icon start>mdi-briefcase</v-icon>
              Información Laboral
            </v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="departamento_id"
                    :error-messages="errors.departamento_id"
                    item-title="nombre"
                    item-value="id"
                    :items="departamentos"
                    label="Departamento Empresa *"
                    :loading="catalogosLoading"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="puesto"
                    :error-messages="errors.puesto"
                    label="Puesto *"
                    placeholder="Ej: Agente de Seguridad"
                    variant="outlined"
                  />
                </v-col>

                <v-col cols="12" md="4">
                  <v-select
                    v-model="tipo_contratacion_id"
                    :error-messages="errors.tipo_contratacion_id"
                    item-title="nombre"
                    item-value="id"
                    :items="tiposContratacion"
                    label="Tipo de Contratación *"
                    :loading="catalogosLoading"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-select
                    v-model="tipo_pago_id"
                    :error-messages="errors.tipo_pago_id"
                    item-title="nombre"
                    item-value="id"
                    :items="tiposPago"
                    label="Tipo de Pago *"
                    :loading="catalogosLoading"
                    variant="outlined"
                  />
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    v-model.number="salario_base"
                    :error-messages="errors.salario_base"
                    label="Salario Base *"
                    min="0"
                    prefix="Q"
                    step="0.01"
                    type="number"
                    variant="outlined"
                  />
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Columna Lateral -->
        <v-col cols="12" lg="4">
          <!-- Foto -->
          <v-card v-if="false" class="mb-4">
            <v-card-title>
              <v-icon start>mdi-camera</v-icon>
              Fotografía
            </v-card-title>
            <v-card-text class="text-center">
              <v-avatar class="mb-4" size="150">
                <v-img v-if="fotoPreview" :src="fotoPreview" />
                <v-icon v-else color="grey" size="80">mdi-account</v-icon>
              </v-avatar>
              <v-file-input
                v-model="fotoFile"
                accept="image/*"
                density="compact"
                label="Seleccionar foto"
                prepend-icon="mdi-camera"
                variant="outlined"
                @update:model-value="onFotoChange"
              />
              <v-btn
                v-if="isEditing && fotoFile && fotoFile.length > 0"
                block
                class="mt-2"
                color="primary"
                :loading="uploadingFoto"
                size="small"
                variant="tonal"
                @click="uploadFotoOnly"
              >
                <v-icon start>mdi-upload</v-icon>
                Subir Foto
              </v-btn>
            </v-card-text>
          </v-card>

          <!-- Estado -->
          <v-card class="mb-4">
            <v-card-title>
              <v-icon start>mdi-toggle-switch</v-icon>
              Estado
            </v-card-title>
            <v-card-text>
              <v-select
                v-model="estado"
                item-title="text"
                item-value="value"
                :items="estadosPersonal"
                label="Estado"
                variant="outlined"
              />
            </v-card-text>
          </v-card>

          <!-- Observaciones -->
          <v-card>
            <v-card-title>
              <v-icon start>mdi-note-text</v-icon>
              Observaciones
            </v-card-title>
            <v-card-text>
              <v-textarea
                v-model="observaciones"
                label="Observaciones"
                rows="4"
                variant="outlined"
              />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Botones de Acción -->
      <v-row class="mt-4">
        <v-col>
          <v-btn size="large" variant="outlined" @click="goBack">
            Cancelar
          </v-btn>
          <v-btn
            class="ml-4"
            color="primary"
            :disabled="!meta.valid"
            :loading="store.saving"
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
  import { useField, useForm } from 'vee-validate'
  import { computed, onMounted, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import * as yup from 'yup'
  import DireccionForm from '@/components/forms/DireccionForm.vue'
  import { CATALOGOS } from '@/services/catalogoService'
  import { useCatalogosStore } from '@/stores/catalogos'
  import { usePersonalStore } from '@/stores/personal'
  import { cleanDPI, formatDPIInput } from '@/utils/dpiFormatter'
  import { cleanPhone, formatPhoneInput } from '@/utils/phoneFormatter'

  const route = useRoute()
  const router = useRouter()
  const store = usePersonalStore()
  const catalogosStore = useCatalogosStore()

  // Props
  const isEditing = computed(() => !!route.params.id)

  // Catálogos
  const catalogosLoading = ref(true)
  const sexos = computed(() => catalogosStore.getCatalogo(CATALOGOS.SEXOS))
  const estadosCiviles = computed(() => catalogosStore.getCatalogo(CATALOGOS.ESTADOS_CIVILES))
  const tiposSangre = computed(() => catalogosStore.getCatalogo(CATALOGOS.TIPOS_SANGRE))
  const departamentos = computed(() => catalogosStore.getCatalogo(CATALOGOS.DEPARTAMENTOS))
  const tiposContratacion = computed(() => catalogosStore.getCatalogo(CATALOGOS.TIPOS_CONTRATACION))
  const tiposPago = computed(() => catalogosStore.getCatalogo(CATALOGOS.TIPOS_PAGO))

  // Ref para componente DireccionForm
  const direccionFormRef = ref(null)

  // Estados
  const estadosPersonal = [
    { text: 'Activo', value: 'activo' },
    { text: 'Inactivo', value: 'inactivo' },
    { text: 'Suspendido', value: 'suspendido' },
  ]

  // Foto
  const fotoFile = ref(null)
  const fotoPreview = ref(null)
  const uploadingFoto = ref(false)

  // Snackbar
  const snackbar = ref({ show: false, text: '', color: 'success' })

  // Validación con Yup
  const validationSchema = yup.object({
    nombres: yup.string().required('Los nombres son requeridos'),
    apellidos: yup.string().required('Los apellidos son requeridos'),
    dpi: yup
      .string()
      .required('El DPI es requerido')
      .matches(/^\d{13}$/, 'El DPI debe tener 13 dígitos'),
    email: yup.string().required('El email es requerido').email('Email inválido'),
    telefono: yup
      .string()
      .required('El teléfono es requerido')
      .matches(/^\d{8}$/, 'El teléfono debe tener 8 dígitos'),
    fecha_nacimiento: yup.string().required('La fecha de nacimiento es requerida'),
    sexo_id: yup.number().required('El sexo es requerido'),
    estado_civil_id: yup.number().required('El estado civil es requerido'),
    altura: yup.number().required('La altura es requerida').min(0.5, 'Altura mínima 0.5m').max(2.5, 'Altura máxima 2.5m'),
    peso: yup.number().required('El peso es requerido').min(50, 'Peso mínimo 50 lb').max(400, 'Peso máximo 400 lb'),
    direccion_completa: yup.string().required('La dirección es requerida'),
    zona: yup.number().nullable().min(1, 'Mínimo zona 1').max(25, 'Máximo zona 25'),
    departamento_id: yup.number().required('El departamento es requerido'),
    puesto: yup.string().required('El puesto es requerido'),
    tipo_contratacion_id: yup.number().required('El tipo de contratación es requerido'),
    tipo_pago_id: yup.number().required('El tipo de pago es requerido'),
    salario_base: yup.number().required('El salario base es requerido').min(0, 'El salario debe ser mayor a 0'),
    es_alergico: yup.boolean(),
    alergias: yup.string().when('es_alergico', {
      is: true,
      then: schema => schema.required('Describa las alergias'),
      otherwise: schema => schema.nullable(),
    }),
  })

  const { handleSubmit, errors, meta, validateField, setValues, resetForm } = useForm({
    validationSchema,
  })

  // Campos del formulario
  const { value: nombres } = useField('nombres')
  const { value: apellidos } = useField('apellidos')
  const { value: dpi } = useField('dpi')
  const { value: nit } = useField('nit')
  const { value: numero_igss } = useField('numero_igss')
  const { value: email } = useField('email')
  const { value: telefono } = useField('telefono')
  const { value: fecha_nacimiento } = useField('fecha_nacimiento')
  const { value: sexo_id } = useField('sexo_id')
  const { value: estado_civil_id } = useField('estado_civil_id')
  const { value: tipo_sangre_id } = useField('tipo_sangre_id')
  const { value: altura } = useField('altura')
  const { value: peso } = useField('peso')
  const { value: sabe_leer } = useField('sabe_leer', undefined, { initialValue: true })
  const { value: sabe_escribir } = useField('sabe_escribir', undefined, { initialValue: true })
  const { value: direccion_completa } = useField('direccion_completa')
  const { value: departamento_geografico_id } = useField('departamento_geografico_id')
  const { value: municipio_id } = useField('municipio_id')
  const { value: zona } = useField('zona')
  const { value: departamento_id } = useField('departamento_id')
  const { value: puesto } = useField('puesto')
  const { value: tipo_contratacion_id } = useField('tipo_contratacion_id')
  const { value: tipo_pago_id } = useField('tipo_pago_id')
  const { value: salario_base } = useField('salario_base')
  const { value: estado } = useField('estado', undefined, { initialValue: 'activo' })
  const { value: observaciones } = useField('observaciones')
  const { value: es_alergico } = useField('es_alergico', undefined, { initialValue: false })
  const { value: alergias } = useField('alergias')

  // DPI formateado para visualizacion
  const dpiDisplay = computed(() => formatDPIInput(dpi.value))

  // Handler para input de DPI
  function onDpiInput(value) {
    // Guardar solo los digitos
    dpi.value = cleanDPI(value)
  }

  // Telefono formateado para visualizacion
  const telefonoDisplay = computed(() => formatPhoneInput(telefono.value))

  // Handler para input de telefono
  function onTelefonoInput(value) {
    // Guardar solo los digitos
    telefono.value = cleanPhone(value)
  }

  // Edad calculada
  const edad = ref(null)

  function calcularEdad () {
    if (!fecha_nacimiento.value) {
      edad.value = null
      return
    }
    const hoy = new Date()
    const nacimiento = new Date(fecha_nacimiento.value)
    let edadCalculada = hoy.getFullYear() - nacimiento.getFullYear()
    const mes = hoy.getMonth() - nacimiento.getMonth()
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edadCalculada--
    }
    edad.value = edadCalculada
  }

  // Cambio de foto
  function onFotoChange (files) {
    if (files && files.length > 0) {
      const file = files[0]
      fotoPreview.value = URL.createObjectURL(file)
    } else {
      fotoPreview.value = null
    }
  }

  // Subir solo la foto (sin actualizar todo el formulario)
  async function uploadFotoOnly () {
    if (!fotoFile.value || fotoFile.value.length === 0) return

    uploadingFoto.value = true
    try {
      await store.uploadFoto(route.params.id, fotoFile.value[0])
      snackbar.value = {
        show: true,
        text: 'Foto actualizada exitosamente',
        color: 'success',
      }
      // Recargar datos para obtener la nueva URL
      await loadPersonal()
    } catch {
      snackbar.value = {
        show: true,
        text: 'Error al subir la foto',
        color: 'error',
      }
    } finally {
      uploadingFoto.value = false
    }
  }

  // Cargar catálogos
  async function loadCatalogos () {
    catalogosLoading.value = true
    try {
      await catalogosStore.loadCatalogos([
        CATALOGOS.SEXOS,
        CATALOGOS.ESTADOS_CIVILES,
        CATALOGOS.TIPOS_SANGRE,
        CATALOGOS.DEPARTAMENTOS,
        CATALOGOS.TIPOS_CONTRATACION,
        CATALOGOS.TIPOS_PAGO,
      ])
    } finally {
      catalogosLoading.value = false
    }
  }

  // Cargar datos para edición
  async function loadPersonal () {
    if (!route.params.id) return

    try {
      const data = await store.fetchById(route.params.id)

      // Extraer datos de dirección si viene como objeto
      const direccionData = data.direccion || {}

      // Extraer IDs de objetos anidados de catálogos
      const formData = {
        ...data,
        // Catálogos - extraer solo el ID
        sexo_id: data.sexo?.id || data.sexo_id,
        estado_civil_id: data.estado_civil?.id || data.estado_civil_id,
        tipo_sangre_id: data.tipo_sangre?.id || data.tipo_sangre_id,
        departamento_id: data.departamento?.id || data.departamento_id,
        tipo_contratacion_id: data.tipo_contratacion?.id || data.tipo_contratacion_id,
        tipo_pago_id: data.tipo_pago?.id || data.tipo_pago_id,
        // Booleanos
        es_alergico: !!data.es_alergico,
        sabe_leer: data.sabe_leer !== false, // default true
        sabe_escribir: data.sabe_escribir !== false, // default true
        // Mapear campos de dirección
        direccion_completa: direccionData.direccion_completa || data.direccion_completa || '',
        departamento_geografico_id: direccionData.departamento_geografico?.id || direccionData.departamento_geografico_id || direccionData.departamento_geo_id || data.departamento_geografico_id,
        municipio_id: direccionData.municipio?.id || direccionData.municipio_id || data.municipio_id,
        zona: direccionData.zona || data.zona,
      }

      setValues(formData)
      edad.value = data.edad
      fotoPreview.value = data.foto_url
    } catch {
      snackbar.value = { show: true, text: 'Error al cargar datos', color: 'error' }
    }
  }

  // Enviar formulario
  const onSubmit = handleSubmit(async values => {
    try {
      const data = { ...values }

      // Limpiar alergias si no es alérgico
      if (!data.es_alergico) {
        data.alergias = null
      }
      delete data.es_alergico

      // Estructurar dirección como espera el API
      data.direccion = {
        direccion_completa: data.direccion_completa,
        departamento_geo_id: data.departamento_geografico_id,
        municipio_id: data.municipio_id,
        zona: data.zona,
      }
      // Limpiar campos individuales ya que van dentro de direccion
      delete data.direccion_completa
      delete data.departamento_geografico_id
      delete data.municipio_id
      delete data.zona

      // No enviar relaciones anidadas (tienen sus propios endpoints)
      delete data.redes_sociales
      delete data.familiares
      delete data.referencias_laborales

      let result
      result = await (isEditing.value ? store.update(route.params.id, data) : store.create(data))

      snackbar.value = {
        show: true,
        text: isEditing.value ? 'Personal actualizado' : 'Personal creado',
        color: 'success',
      }

      setTimeout(() => {
        router.push({ name: 'personal' })
      }, 1500)
    } catch {
      snackbar.value = {
        show: true,
        text: store.error || 'Error al guardar',
        color: 'error',
      }
    }
  })

  // Volver atrás
  function goBack () {
    router.back()
  }

  // Inicializar
  onMounted(async () => {
    await loadCatalogos()
    if (isEditing.value) {
      await loadPersonal()
    }
  })

  // Watch para calcular edad cuando cambia fecha
  watch(fecha_nacimiento, calcularEdad)

  // Watch para limpiar alergias cuando es_alergico es false
  watch(es_alergico, newValue => {
    if (!newValue) {
      alergias.value = null
    }
  })
</script>
