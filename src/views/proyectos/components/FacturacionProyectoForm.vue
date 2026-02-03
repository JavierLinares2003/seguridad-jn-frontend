<template>
  <v-card variant="outlined">
    <v-card-text>
      <v-row>
        <!-- Tipo de Documento -->
        <v-col cols="12" md="6">
          <v-select
            v-model="localTipoDocumentoId"
            density="compact"
            :error-messages="errors?.tipo_documento_facturacion_id"
            item-title="nombre"
            item-value="id"
            :items="tiposDocumento"
            label="Tipo de Documento *"
            :loading="loadingCatalogs"
            variant="outlined"
          />
        </v-col>

        <!-- NIT -->
        <v-col cols="12" md="6">
          <v-text-field
            v-model="localNit"
            density="compact"
            :error-messages="errors?.nit_cliente"
            :hint="localNit && !nitValido ? 'Formato inválido' : ''"
            label="NIT *"
            persistent-hint
            variant="outlined"
            @blur="formatNit"
          />
        </v-col>

        <!-- Nombre Facturación -->
        <v-col cols="12">
          <v-text-field
            v-model="localNombre"
            density="compact"
            :error-messages="errors?.nombre_facturacion"
            label="Nombre de Facturación *"
            variant="outlined"
          />
        </v-col>

        <!-- Dirección Facturación -->
        <v-col cols="12">
          <v-textarea
            v-model="localDireccion"
            auto-grow
            density="compact"
            :error-messages="errors?.direccion_facturacion"
            label="Dirección de Facturación *"
            rows="2"
            variant="outlined"
          />
        </v-col>

        <v-col cols="12"><v-divider /></v-col>

        <!-- Periodicidad -->
        <v-col cols="12" md="4">
          <v-select
            v-model="localPeriodicidadId"
            density="compact"
            :error-messages="errors?.periodicidad_pago_id"
            item-title="nombre"
            item-value="id"
            :items="periodicidades"
            label="Periodicidad de Pago *"
            :loading="loadingCatalogs"
            variant="outlined"
          />
        </v-col>

        <!-- Forma de Pago -->
        <v-col cols="12" md="4">
          <v-select
            v-model="localFormaPago"
            density="compact"
            :error-messages="errors?.forma_pago"
            :items="formasPago"
            label="Forma de Pago *"
            variant="outlined"
          />
        </v-col>

        <!-- Dia de Pago -->
        <v-col cols="12" md="4">
          <v-text-field
            v-model.number="localDiaPago"
            density="compact"
            :error-messages="errors?.dia_pago"
            label="Día de Pago (1-31)"
            max="31"
            min="1"
            type="number"
            variant="outlined"
          />
        </v-col>

        <!-- Monto Total -->
        <v-col cols="12" md="6">
          <v-text-field
            v-model.number="localMonto"
            density="compact"
            :error-messages="errors?.monto_proyecto_total"
            label="Monto Total del Proyecto"
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
</template>

<script setup>
  import { computed, onMounted, ref } from 'vue'
  import { CATALOGOS } from '@/services/catalogoService'
  import { useCatalogosStore } from '@/stores/catalogos'

  const props = defineProps({
    tipoDocumentoId: Number,
    nit: String,
    nombre: String,
    direccion: String,
    formaPago: String,
    periodicidadId: Number,
    diaPago: Number,
    monto: Number,
    errors: {
      type: Object,
      default: () => ({}),
    },
  })

  const emit = defineEmits([
    'update:tipoDocumentoId',
    'update:nit',
    'update:nombre',
    'update:direccion',
    'update:formaPago',
    'update:periodicidadId',
    'update:diaPago',
    'update:monto',
  ])

  const catalogosStore = useCatalogosStore()
  const loadingCatalogs = ref(false)

  // Computados con get/set para v-model
  const localTipoDocumentoId = computed({
    get: () => props.tipoDocumentoId,
    set: val => emit('update:tipoDocumentoId', val),
  })

  const localNit = computed({
    get: () => props.nit,
    set: val => emit('update:nit', val),
  })

  const localNombre = computed({
    get: () => props.nombre,
    set: val => emit('update:nombre', val),
  })

  const localDireccion = computed({
    get: () => props.direccion,
    set: val => emit('update:direccion', val),
  })

  const localFormaPago = computed({
    get: () => props.formaPago,
    set: val => emit('update:formaPago', val),
  })

  const localPeriodicidadId = computed({
    get: () => props.periodicidadId,
    set: val => emit('update:periodicidadId', val),
  })

  const localDiaPago = computed({
    get: () => props.diaPago,
    set: val => emit('update:diaPago', val),
  })

  const localMonto = computed({
    get: () => props.monto,
    set: val => emit('update:monto', val),
  })

  // Catálogos
  const tiposDocumento = computed(() => catalogosStore.getCatalogo(CATALOGOS.TIPOS_DOCUMENTOS_FACTURACION))
  const periodicidades = computed(() => catalogosStore.getCatalogo(CATALOGOS.PERIODICIDADES_PAGO)) // Asegurar que coincida con backend

  const formasPago = [
    'Efectivo', 'Cheque', 'Transferencia', 'Depósito',
  ]

  const nitValido = computed(() => {
    // Basic validation, strict regex can be complex for GT NITs
    // return /^[0-9]+-?[0-9kK]$/.test(localNit.value)
    return true
  })

  function formatNit () {
    // Optional formatting logic
  }

  onMounted(async () => {
    loadingCatalogs.value = true
    try {
      await catalogosStore.loadCatalogos([
        CATALOGOS.TIPOS_DOCUMENTOS_FACTURACION,
        CATALOGOS.PERIODICIDADES_PAGO,
      ])
    } finally {
      loadingCatalogs.value = false
    }
  })
</script>
