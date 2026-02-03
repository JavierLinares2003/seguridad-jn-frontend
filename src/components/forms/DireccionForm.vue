<template>
  <v-card variant="outlined">
    <v-card-title v-if="showTitle" class="text-subtitle-1">
      <v-icon size="small" start>mdi-map-marker</v-icon>
      {{ title }}
    </v-card-title>

    <v-card-text :class="{ 'pt-4': !showTitle }">
      <v-row>
        <!-- Departamento -->
        <v-col cols="12" :md="colSize">
          <v-select
            v-model="localDepartamentoId"
            clearable
            density="compact"
            :error-messages="errors?.departamento_geografico_id"
            item-title="nombre"
            item-value="id"
            :items="departamentos"
            label="Departamento *"
            :loading="loadingDepartamentos"
            variant="outlined"
            @update:model-value="onDepartamentoChange"
          >
            <template #prepend-inner>
              <v-icon size="small">mdi-map</v-icon>
            </template>
          </v-select>
        </v-col>

        <!-- Municipio -->
        <v-col cols="12" :md="colSize">
          <v-select
            v-model="localMunicipioId"
            clearable
            density="compact"
            :disabled="!localDepartamentoId"
            :error-messages="errors?.municipio_id"
            item-title="nombre"
            item-value="id"
            :items="municipios"
            label="Municipio *"
            :loading="loadingMunicipios"
            variant="outlined"
            @update:model-value="emitUpdate"
          >
            <template #prepend-inner>
              <v-icon size="small">mdi-city</v-icon>
            </template>
            <template #no-data>
              <div class="pa-3 text-center text-grey">
                {{ !localDepartamentoId ? 'Seleccione un departamento' : 'No hay municipios' }}
              </div>
            </template>
          </v-select>
        </v-col>

        <!-- Zona -->
        <v-col cols="12" :md="zonaColSize">
          <v-text-field
            v-model.number="localZona"
            density="compact"
            :error-messages="errors?.zona"
            label="Zona"
            :max="25"
            :min="1"
            type="number"
            variant="outlined"
            @update:model-value="emitUpdate"
          >
            <template #prepend-inner>
              <v-icon size="small">mdi-numeric</v-icon>
            </template>
          </v-text-field>
        </v-col>

        <!-- Dirección -->
        <v-col cols="12">
          <v-textarea
            v-model="localDireccion"
            auto-grow
            density="compact"
            :error-messages="errors?.direccion"
            label="Dirección completa *"
            :placeholder="placeholderDireccion"
            rows="2"
            variant="outlined"
            @update:model-value="emitUpdate"
          >
            <template #prepend-inner>
              <v-icon size="small">mdi-home</v-icon>
            </template>
          </v-textarea>
        </v-col>

        <!-- Ejemplo visual -->
        <v-col v-if="showExample && direccionCompleta" cols="12">
          <v-alert
            density="compact"
            icon="mdi-information"
            type="info"
            variant="tonal"
          >
            <span class="text-caption">
              <strong>Dirección formateada:</strong><br>
              {{ direccionCompleta }}
            </span>
          </v-alert>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import { CATALOGOS } from '@/services/catalogoService'
  import { useCatalogosStore } from '@/stores/catalogos'

  const props = defineProps({
    // v-model values
    departamentoGeograficoId: {
      type: [Number, null],
      default: null,
    },
    municipioId: {
      type: [Number, null],
      default: null,
    },
    zona: {
      type: [Number, null],
      default: null,
    },
    direccion: {
      type: String,
      default: '',
    },
    // Errores de validación
    errors: {
      type: Object,
      default: () => ({}),
    },
    // Opciones de visualización
    showTitle: {
      type: Boolean,
      default: true,
    },
    title: {
      type: String,
      default: 'Dirección',
    },
    showExample: {
      type: Boolean,
      default: true,
    },
    // Tamaño de columnas
    colSize: {
      type: [Number, String],
      default: 4,
    },
    zonaColSize: {
      type: [Number, String],
      default: 4,
    },
  })

  const emit = defineEmits([
    'update:departamentoGeograficoId',
    'update:municipioId',
    'update:zona',
    'update:direccion',
    'change',
  ])

  const catalogosStore = useCatalogosStore()

  // Estado local
  const localDepartamentoId = ref(props.departamentoGeograficoId)
  const localMunicipioId = ref(props.municipioId)
  const localZona = ref(props.zona)
  const localDireccion = ref(props.direccion)

  // Loading states
  const loadingDepartamentos = ref(false)
  const loadingMunicipios = ref(false)

  // Municipios cargados
  const municipios = ref([])

  // Departamentos del store
  const departamentos = computed(() =>
    catalogosStore.getCatalogo(CATALOGOS.DEPARTAMENTOS_GEOGRAFICOS),
  )

  // Placeholder dinámico
  const placeholderDireccion = computed(() => {
    return '3 Calle 5-42, Colonia Las Américas...'
  })

  // Dirección completa formateada
  const direccionCompleta = computed(() => {
    const parts = []

    if (localDireccion.value) {
      parts.push(localDireccion.value)
    }

    if (localZona.value) {
      parts.push(`Zona ${localZona.value}`)
    }

    const municipioNombre = municipios.value.find(m => m.id === localMunicipioId.value)?.nombre
    if (municipioNombre) {
      parts.push(municipioNombre)
    }

    const departamentoNombre = departamentos.value.find(d => d.id === localDepartamentoId.value)?.nombre
    if (departamentoNombre) {
      parts.push(departamentoNombre)
    }

    return parts.length > 0 ? parts.join(', ') : ''
  })

  // Cargar departamentos
  async function loadDepartamentos () {
    loadingDepartamentos.value = true
    try {
      await catalogosStore.loadCatalogo(CATALOGOS.DEPARTAMENTOS_GEOGRAFICOS)
    } finally {
      loadingDepartamentos.value = false
    }
  }

  // Cargar municipios por departamento
  async function loadMunicipios (departamentoId) {
    if (!departamentoId) {
      municipios.value = []
      return
    }

    loadingMunicipios.value = true
    try {
      municipios.value = await catalogosStore.loadMunicipios(departamentoId)
    } finally {
      loadingMunicipios.value = false
    }
  }

  // Cuando cambia el departamento
  async function onDepartamentoChange (value) {
    localMunicipioId.value = null
    emit('update:departamentoGeograficoId', value)
    emit('update:municipioId', null)

    if (value) {
      await loadMunicipios(value)
    } else {
      municipios.value = []
    }

    emitChange()
  }

  // Emitir actualizaciones
  function emitUpdate () {
    emit('update:departamentoGeograficoId', localDepartamentoId.value)
    emit('update:municipioId', localMunicipioId.value)
    emit('update:zona', localZona.value)
    emit('update:direccion', localDireccion.value)
    emitChange()
  }

  // Emitir evento change con todos los valores
  function emitChange () {
    emit('change', {
      departamento_geografico_id: localDepartamentoId.value,
      municipio_id: localMunicipioId.value,
      zona: localZona.value,
      direccion: localDireccion.value,
      direccion_completa: direccionCompleta.value,
    })
  }

  // Watchers para sincronizar props con estado local
  watch(() => props.departamentoGeograficoId, async newVal => {
    if (newVal !== localDepartamentoId.value) {
      localDepartamentoId.value = newVal
      if (newVal) {
        await loadMunicipios(newVal)
      }
    }
  })

  watch(() => props.municipioId, newVal => {
    if (newVal !== localMunicipioId.value) {
      localMunicipioId.value = newVal
    }
  })

  watch(() => props.zona, newVal => {
    if (newVal !== localZona.value) {
      localZona.value = newVal
    }
  })

  watch(() => props.direccion, newVal => {
    if (newVal !== localDireccion.value) {
      localDireccion.value = newVal
    }
  })

  // Inicializar
  onMounted(async () => {
    await loadDepartamentos()

    // Si ya hay un departamento seleccionado, cargar sus municipios
    if (props.departamentoGeograficoId) {
      await loadMunicipios(props.departamentoGeograficoId)
    }
  })

  // Exponer método para obtener dirección formateada
  defineExpose({
    direccionCompleta,
    getDireccionData: () => ({
      departamento_geografico_id: localDepartamentoId.value,
      municipio_id: localMunicipioId.value,
      zona: localZona.value,
      direccion: localDireccion.value,
      direccion_completa: direccionCompleta.value,
    }),
  })
</script>
