<template>
  <v-card variant="outlined">
    <v-card-text>
      <v-row>
        <!-- Tipo de Documento -->
        <v-col cols="12" md="6">
          <v-select
            v-model="localTipoDocumentoId"
            color="primary"
            density="compact"
            :error-messages="errors?.tipo_documento_facturacion_id"
            item-title="nombre"
            item-value="id"
            :items="tiposDocumento"
            label="Tipo de Documento *"
            :loading="loadingCatalogs"
            rounded="lg"
            variant="outlined"
          />
        </v-col>

        <!-- NIT -->
        <v-col cols="12" md="6">
          <v-text-field
            v-model="localNit"
            color="primary"
            density="compact"
            :error-messages="errors?.nit_cliente"
            :hint="localNit && !nitValido ? 'Formato inválido' : ''"
            label="NIT *"
            persistent-hint
            rounded="lg"
            variant="outlined"
            @blur="formatNit"
          />
        </v-col>

        <!-- Nombre Facturación -->
        <v-col cols="12">
          <v-text-field
            v-model="localNombre"
            color="primary"
            density="compact"
            :error-messages="errors?.nombre_facturacion"
            label="Nombre de Facturación *"
            rounded="lg"
            variant="outlined"
          />
        </v-col>

        <!-- Dirección Facturación -->
        <v-col cols="12">
          <v-textarea
            v-model="localDireccion"
            auto-grow
            color="primary"
            density="compact"
            :error-messages="errors?.direccion_facturacion"
            label="Dirección de Facturación *"
            rounded="lg"
            rows="2"
            variant="outlined"
          />
        </v-col>

        <v-col cols="12"><v-divider /></v-col>

        <!-- Periodicidad -->
        <v-col cols="12" md="4">
          <v-select
            v-model="localPeriodicidadId"
            color="primary"
            density="compact"
            :error-messages="errors?.periodicidad_pago_id"
            item-title="nombre"
            item-value="id"
            :items="periodicidades"
            label="Periodicidad de Pago *"
            :loading="loadingCatalogs"
            rounded="lg"
            variant="outlined"
          />
        </v-col>

        <!-- Forma de Pago -->
        <v-col cols="12" md="4">
          <v-select
            v-model="localFormaPago"
            color="primary"
            density="compact"
            :error-messages="errors?.forma_pago"
            :items="formasPago"
            label="Forma de Pago *"
            rounded="lg"
            variant="outlined"
          />
        </v-col>

        <!-- Dia de Pago -->
        <v-col cols="12" md="4">
          <v-text-field
            v-model.number="localDiaPago"
            color="primary"
            density="compact"
            :error-messages="errors?.dia_pago"
            label="Día de Pago (1-31)"
            max="31"
            min="1"
            rounded="lg"
            type="number"
            variant="outlined"
          />
        </v-col>

        <!-- Monto Total (calculado automáticamente) -->
        <v-col cols="12" md="6">
          <div class="text-caption text-medium-emphasis">Monto Total del Proyecto</div>
          <div class="text-body-1 font-weight-bold text-success">
            Q {{ monto != null ? Number(monto).toFixed(2) : '0.00' }}
          </div>
          <div class="text-caption text-disabled">Calculado automáticamente según configuración de personal</div>
        </v-col>

        <v-col cols="12"><v-divider /></v-col>

        <!-- Impuesto -->
        <v-col cols="12">
          <div class="text-caption text-medium-emphasis font-weight-bold mb-2">IMPUESTO</div>
        </v-col>

        <v-col cols="12" md="6">
          <v-switch
            v-model="localAplicaImpuesto"
            color="primary"
            density="compact"
            hide-details
            label="Aplica Impuesto (IVA u otro)"
          />
        </v-col>

        <v-col v-if="localAplicaImpuesto" cols="12" md="6">
          <v-text-field
            v-model.number="localPorcentajeImpuesto"
            color="primary"
            density="compact"
            :error-messages="errors?.porcentaje_impuesto"
            label="Porcentaje de Impuesto *"
            min="0"
            max="100"
            rounded="lg"
            step="0.01"
            suffix="%"
            type="number"
            variant="outlined"
          />
        </v-col>

        <template v-if="localAplicaImpuesto">
          <v-col cols="12" md="6">
            <div class="text-caption text-medium-emphasis">Monto Impuesto</div>
            <div class="text-body-1 font-weight-bold text-warning">
              Q {{ montoImpuesto != null ? Number(montoImpuesto).toFixed(2) : '0.00' }}
            </div>
          </v-col>
          <v-col cols="12" md="6">
            <div class="text-caption text-medium-emphasis">Monto Total con Impuesto</div>
            <div class="text-body-1 font-weight-bold text-primary">
              Q {{ montoTotalConImpuesto != null ? Number(montoTotalConImpuesto).toFixed(2) : '0.00' }}
            </div>
          </v-col>
        </template>
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
    aplicaImpuesto: Boolean,
    porcentajeImpuesto: Number,
    montoImpuesto: Number,
    montoTotalConImpuesto: Number,
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
    'update:aplicaImpuesto',
    'update:porcentajeImpuesto',
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

  const localAplicaImpuesto = computed({
    get: () => props.aplicaImpuesto,
    set: val => emit('update:aplicaImpuesto', val),
  })

  const localPorcentajeImpuesto = computed({
    get: () => props.porcentajeImpuesto,
    set: val => emit('update:porcentajeImpuesto', val),
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
