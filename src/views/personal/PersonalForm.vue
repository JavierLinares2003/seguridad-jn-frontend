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
              <v-row class="pt-2">
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="nombres"
                    color="primary"
                    :error-messages="errors.nombres"
                    label="Nombres *"
                    rounded="lg"
                    variant="outlined"
                    @blur="validateField('nombres')"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="apellidos"
                    color="primary"
                    :error-messages="errors.apellidos"
                    label="Apellidos *"
                    rounded="lg"
                    variant="outlined"
                    @blur="validateField('apellidos')"
                  />
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    color="primary"
                    :error-messages="errors.dpi"
                    label="DPI *"
                    maxlength="15"
                    :model-value="dpiDisplay"
                    placeholder="0000-00000-0000"
                    rounded="lg"
                    variant="outlined"
                    @blur="validateField('dpi')"
                    @update:model-value="onDpiInput"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="nit"
                    color="primary"
                    :error-messages="errors.nit"
                    label="NIT"
                    rounded="lg"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="numero_igss"
                    color="primary"
                    :error-messages="errors.numero_igss"
                    label="Número IGSS"
                    rounded="lg"
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
                <v-col cols="12" md="9">
                  <v-textarea
                    v-model="observacion_recontratacion"
                    auto-grow
                    label="Observación de recontratación / ingreso"
                    placeholder="Visible junto al tipo de sangre para RRHH y operaciones"
                    rows="1"
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
                    label="Peso (lb)"
                    min="0"
                    placeholder="150"
                    step="0.1"
                    type="number"
                    variant="outlined"
                  />
                </v-col>

                <!-- Habilidades y alergias -->
                <v-col cols="12">
                  <div class="d-flex flex-wrap ga-4">
                    <v-checkbox
                      v-model="sabe_leer"
                      hide-details
                      label="Sabe leer"
                    />
                    <v-checkbox
                      v-model="sabe_escribir"
                      hide-details
                      label="Sabe escribir"
                    />
                    <v-checkbox
                      v-model="sabe_usar_computadora"
                      hide-details
                      label="Sabe usar computadora"
                    />
                    <v-checkbox
                      v-model="es_alergico"
                      hide-details
                      label="¿Es alérgico?"
                    />
                  </div>
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
                    label="Email"
                    type="email"
                    variant="outlined"
                    @blur="validateField('email')"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    :error-messages="errors.telefono"
                    label="Teléfono (llamadas) *"
                    maxlength="9"
                    :model-value="telefonoDisplay"
                    placeholder="0000-0000"
                    variant="outlined"
                    @update:model-value="onTelefonoInput"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    :error-messages="errors.telefono_whatsapp"
                    label="WhatsApp"
                    maxlength="9"
                    :model-value="telefonoWhatsappDisplay"
                    placeholder="0000-0000"
                    variant="outlined"
                    @update:model-value="onTelefonoWhatsappInput"
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

                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="fecha_inicio"
                    :error-messages="errors.fecha_inicio"
                    label="Fecha de Ingreso *"
                    type="date"
                    variant="outlined"
                    prepend-inner-icon="mdi-calendar"
                  />
                </v-col>
                <v-col v-if="isEditing" cols="12" md="4">
                  <v-text-field
                    :model-value="fecha_ingreso_original"
                    disabled
                    label="Ingreso original (no se pisa)"
                    type="date"
                    variant="outlined"
                  />
                </v-col>
                <v-col v-if="isEditing" cols="12" md="4">
                  <v-text-field
                    v-model="fecha_reingreso"
                    clearable
                    label="Fecha de reingreso"
                    type="date"
                    variant="outlined"
                  />
                </v-col>

                <v-col cols="12" md="4">
                  <v-select
                    v-model="nivel_estudio_id"
                    clearable
                    item-title="nombre"
                    item-value="id"
                    :items="nivelesEstudio"
                    label="Nivel de Estudio"
                    :loading="catalogosLoading"
                    variant="outlined"
                  />
                </v-col>

                <v-col cols="12">
                  <div class="d-flex flex-wrap ga-4">
                    <v-checkbox
                      v-model="tiene_igss"
                      hide-details
                      label="Afiliado IGSS"
                    />
                    <v-checkbox
                      v-model="tiene_prestaciones"
                      hide-details
                      label="Tiene Prestaciones"
                    />
                    <v-checkbox
                      v-model="tiene_bono14"
                      hide-details
                      label="Tiene Bono 14"
                    />
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- Información Bancaria (solo si tipo de pago es Transferencia) -->
          <v-expand-transition>
            <v-card v-if="esTipoTransferencia" class="mb-4">
              <v-card-title>
                <v-icon start>mdi-bank</v-icon>
                Información Bancaria
              </v-card-title>
              <v-card-text>
                <v-alert class="mb-4" density="compact" type="info" variant="tonal">
                  Los datos bancarios son necesarios para realizar el pago por depósito o transferencia.
                </v-alert>
                <v-row>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="banco"
                      :error-messages="errors.banco"
                      label="Banco *"
                      placeholder="Ej: Banco Industrial, Banrural, etc."
                      variant="outlined"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-select
                      v-model="tipo_cuenta"
                      :error-messages="errors.tipo_cuenta"
                      :items="tiposCuenta"
                      label="Tipo de Cuenta *"
                      variant="outlined"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="nombre_cuenta"
                      :error-messages="errors.nombre_cuenta"
                      label="Nombre de Cuenta *"
                      placeholder="Nombre del titular de la cuenta"
                      variant="outlined"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="numero_cuenta"
                      :error-messages="errors.numero_cuenta"
                      label="Número de Cuenta *"
                      placeholder="Ingrese el número de cuenta"
                      variant="outlined"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="confirmar_numero_cuenta"
                      :error-messages="errors.confirmar_numero_cuenta"
                      label="Confirmar Número de Cuenta *"
                      placeholder="Confirme el número de cuenta"
                      variant="outlined"
                    />
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-expand-transition>
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

          <!-- Tallas -->
          <v-card class="mb-4">
            <v-card-title>
              <v-icon start>mdi-tshirt-crew</v-icon>
              Tallas de uniforme
            </v-card-title>
            <v-card-text>
              <v-row dense>
                <v-col cols="6">
                  <v-text-field v-model="talla_camisa" density="compact" label="Camisa" variant="outlined" />
                </v-col>
                <v-col cols="6">
                  <v-text-field v-model="talla_pantalon" density="compact" label="Pantalón" variant="outlined" />
                </v-col>
                <v-col cols="6">
                  <v-text-field v-model="talla_zapato" density="compact" label="Calzado" variant="outlined" />
                </v-col>
                <v-col cols="6">
                  <v-text-field v-model="talla_chaleco" density="compact" label="Chaleco" variant="outlined" />
                </v-col>
                <v-col cols="6">
                  <v-text-field v-model="talla_gorra" density="compact" label="Gorra" variant="outlined" />
                </v-col>
              </v-row>
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
  const nivelesEstudio = computed(() => catalogosStore.getCatalogo(CATALOGOS.NIVELES_ESTUDIO))

  // Detectar si el tipo de pago seleccionado es Transferencia
  const esTipoTransferencia = computed(() => {
    const tipoPago = tiposPago.value.find(t => t.id === tipo_pago_id.value)
    return tipoPago?.nombre?.toLowerCase().includes('transferencia') || false
  })

  const tiposCuenta = ['Ahorro', 'Corriente', 'Monetaria']

  // Ref para componente DireccionForm
  const direccionFormRef = ref(null)

  // Estados
  const estadosPersonal = [
    { text: 'Activo', value: 'activo' },
    { text: 'Inactivo', value: 'inactivo' },
    { text: 'Suspendido', value: 'suspendido' },
    { text: 'No Contratar', value: 'no_contratar' },
    { text: 'Extrero', value: 'extrero' },
    { text: 'Pre-alta', value: 'pre_alta' },
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
    email: yup.string().nullable().email('Email inválido'),
    telefono: yup
      .string()
      .required('El teléfono es requerido')
      .matches(/^\d{8}$/, 'El teléfono debe tener 8 dígitos'),
    telefono_whatsapp: yup
      .string()
      .nullable()
      .transform(v => v === '' ? null : v)
      .matches(/^\d{8}$/, 'El WhatsApp debe tener 8 dígitos'),
    fecha_nacimiento: yup.string().required('La fecha de nacimiento es requerida'),
    sexo_id: yup.number().required('El sexo es requerido'),
    estado_civil_id: yup.number().required('El estado civil es requerido'),
    altura: yup.number().required('La altura es requerida').min(0.5, 'Altura mínima 0.5m').max(2.5, 'Altura máxima 2.5m'),
    peso: yup.number().nullable().min(50, 'Peso mínimo 50 lb').max(400, 'Peso máximo 400 lb'),
    direccion_completa: yup.string().required('La dirección es requerida'),
    zona: yup.number().nullable().min(0, 'Mínimo zona 0').max(25, 'Máximo zona 25'),
    departamento_id: yup.number().required('El departamento es requerido'),
    puesto: yup.string().required('El puesto es requerido'),
    tipo_contratacion_id: yup.number().required('El tipo de contratación es requerido'),
    tipo_pago_id: yup.number().required('El tipo de pago es requerido'),
    salario_base: yup.number().required('El salario base es requerido').min(0, 'El salario debe ser mayor a 0'),
    fecha_inicio: yup.string().required('La fecha de inicio es requerida'),
    nivel_estudio_id: yup.number().nullable(),
    tiene_igss: yup.boolean(),
    tiene_prestaciones: yup.boolean(),
    tiene_bono14: yup.boolean(),
    banco: yup.string().nullable(),
    tipo_cuenta: yup.string().nullable(),
    nombre_cuenta: yup.string().nullable(),
    numero_cuenta: yup.string().nullable(),
    confirmar_numero_cuenta: yup.string().nullable()
      .oneOf([yup.ref('numero_cuenta'), null], 'Los números de cuenta no coinciden'),
    es_alergico: yup.boolean(),
    alergias: yup.string().when('es_alergico', {
      is: true,
      then: schema => schema.required('Describa las alergias'),
      otherwise: schema => schema.nullable(),
    }),
  })

  const { handleSubmit, errors, meta, validateField, setValues, resetForm, setFieldError } = useForm({
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
  const { value: telefono_whatsapp } = useField('telefono_whatsapp')
  const { value: fecha_nacimiento } = useField('fecha_nacimiento')
  const { value: sexo_id } = useField('sexo_id')
  const { value: estado_civil_id } = useField('estado_civil_id')
  const { value: tipo_sangre_id } = useField('tipo_sangre_id')
  const { value: altura } = useField('altura')
  const { value: peso } = useField('peso')
  const { value: sabe_leer } = useField('sabe_leer', undefined, { initialValue: true })
  const { value: sabe_escribir } = useField('sabe_escribir', undefined, { initialValue: true })
  const { value: sabe_usar_computadora } = useField('sabe_usar_computadora', undefined, { initialValue: false })
  const { value: direccion_completa } = useField('direccion_completa')
  const { value: departamento_geografico_id } = useField('departamento_geografico_id')
  const { value: municipio_id } = useField('municipio_id')
  const { value: zona } = useField('zona')
  const { value: departamento_id } = useField('departamento_id')
  const { value: puesto } = useField('puesto')
  const { value: tipo_contratacion_id } = useField('tipo_contratacion_id')
  const { value: tipo_pago_id } = useField('tipo_pago_id')
  const { value: salario_base } = useField('salario_base')
  const { value: fecha_inicio } = useField('fecha_inicio')
  const { value: banco } = useField('banco')
  const { value: tipo_cuenta } = useField('tipo_cuenta')
  const { value: nombre_cuenta } = useField('nombre_cuenta')
  const { value: numero_cuenta } = useField('numero_cuenta')
  const { value: confirmar_numero_cuenta } = useField('confirmar_numero_cuenta')
  const { value: estado } = useField('estado', undefined, { initialValue: 'activo' })
  const { value: observaciones } = useField('observaciones')
  const { value: observacion_recontratacion } = useField('observacion_recontratacion')
  const { value: fecha_ingreso_original } = useField('fecha_ingreso_original')
  const { value: fecha_reingreso } = useField('fecha_reingreso')
  const { value: talla_camisa } = useField('talla_camisa')
  const { value: talla_pantalon } = useField('talla_pantalon')
  const { value: talla_zapato } = useField('talla_zapato')
  const { value: talla_chaleco } = useField('talla_chaleco')
  const { value: talla_gorra } = useField('talla_gorra')
  const { value: nivel_estudio_id } = useField('nivel_estudio_id')
  const { value: tiene_igss } = useField('tiene_igss', undefined, { initialValue: false })
  const { value: tiene_prestaciones } = useField('tiene_prestaciones', undefined, { initialValue: false })
  const { value: tiene_bono14 } = useField('tiene_bono14', undefined, { initialValue: false })
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
  const telefonoWhatsappDisplay = computed(() => formatPhoneInput(telefono_whatsapp.value))

  function onTelefonoInput(value) {
    telefono.value = cleanPhone(value)
  }

  function onTelefonoWhatsappInput(value) {
    telefono_whatsapp.value = cleanPhone(value)
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
      await Promise.all([
        catalogosStore.loadCatalogo(CATALOGOS.SEXOS, { params: { contexto: 'personal' } }),
        catalogosStore.loadCatalogos([
          CATALOGOS.ESTADOS_CIVILES,
          CATALOGOS.TIPOS_SANGRE,
          CATALOGOS.DEPARTAMENTOS,
          CATALOGOS.TIPOS_CONTRATACION,
          CATALOGOS.TIPOS_PAGO,
          CATALOGOS.NIVELES_ESTUDIO,
        ]),
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
        // Datos bancarios
        banco: data.banco || '',
        tipo_cuenta: data.tipo_cuenta || '',
        numero_cuenta: data.numero_cuenta || '',
        confirmar_numero_cuenta: data.numero_cuenta || '',
        // Nuevos campos
        nivel_estudio_id: data.nivel_estudio?.id || data.nivel_estudio_id || null,
        tiene_igss: !!data.tiene_igss,
        tiene_prestaciones: !!data.tiene_prestaciones,
        tiene_bono14: !!data.tiene_bono14,
        // Booleanos
        es_alergico: !!data.es_alergico,
        sabe_leer: data.sabe_leer !== false, // default true
        sabe_escribir: data.sabe_escribir !== false, // default true
        sabe_usar_computadora: !!data.sabe_usar_computadora,
        observacion_recontratacion: data.observacion_recontratacion || '',
        fecha_ingreso_original: data.fecha_ingreso_original || data.fecha_inicio || '',
        fecha_reingreso: data.fecha_reingreso || '',
        talla_camisa: data.tallas?.talla_camisa || '',
        talla_pantalon: data.tallas?.talla_pantalon || '',
        talla_zapato: data.tallas?.talla_zapato || '',
        talla_chaleco: data.tallas?.talla_chaleco || '',
        talla_gorra: data.tallas?.talla_gorra || '',
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
    // Validar campos bancarios si es transferencia
    if (esTipoTransferencia.value) {
      let bancarioValido = true
      const camposBancarios = {
        banco: 'El banco es requerido',
        tipo_cuenta: 'El tipo de cuenta es requerido',
        nombre_cuenta: 'El nombre de la cuenta es requerido',
        numero_cuenta: 'El número de cuenta es requerido',
        confirmar_numero_cuenta: 'Confirme el número de cuenta',
      }
      for (const [campo, mensaje] of Object.entries(camposBancarios)) {
        if (!values[campo]?.trim()) {
          setFieldError(campo, mensaje)
          bancarioValido = false
        }
      }
      if (values.numero_cuenta && values.confirmar_numero_cuenta && values.numero_cuenta !== values.confirmar_numero_cuenta) {
        setFieldError('confirmar_numero_cuenta', 'Los números de cuenta no coinciden')
        bancarioValido = false
      }
      if (!bancarioValido) return
    }

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

      // Limpiar campo de confirmación (no se envía al backend)
      delete data.confirmar_numero_cuenta

      // Si no es transferencia, limpiar datos bancarios
      if (!esTipoTransferencia.value) {
        data.banco = null
        data.tipo_cuenta = null
        data.nombre_cuenta = null
        data.numero_cuenta = null
      }

      // No enviar relaciones anidadas (tienen sus propios endpoints)
      delete data.redes_sociales
      delete data.familiares
      delete data.referencias_laborales

      data.tallas = {
        talla_camisa: data.talla_camisa || null,
        talla_pantalon: data.talla_pantalon || null,
        talla_zapato: data.talla_zapato || null,
        talla_chaleco: data.talla_chaleco || null,
        talla_gorra: data.talla_gorra || null,
      }
      delete data.talla_camisa
      delete data.talla_pantalon
      delete data.talla_zapato
      delete data.talla_chaleco
      delete data.talla_gorra
      if (isEditing.value) {
        delete data.fecha_ingreso_original
      }

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
    } catch (err) {
      const backendErrors = err.response?.data?.errors
      if (backendErrors) {
        Object.entries(backendErrors).forEach(([campo, mensajes]) => {
          setFieldError(campo, mensajes[0])
        })
      }
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
