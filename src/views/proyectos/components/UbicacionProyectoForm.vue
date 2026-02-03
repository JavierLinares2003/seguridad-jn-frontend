<template>
  <div class="ubicacion-proyecto-form">
    <DireccionForm
      v-model:departamento-geografico-id="localDepartamentoId"
      v-model:direccion="localDireccion"
      v-model:municipio-id="localMunicipioId"
      v-model:zona="localZona"
      col-size="6"
      :errors="errors"
      :show-title="false"
      title="Ubicación del Proyecto"
      zona-col-size="12"
      @change="emitChange"
    />
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import DireccionForm from '@/components/forms/DireccionForm.vue'

  const props = defineProps({
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
    errors: {
      type: Object,
      default: () => ({}),
    },
  })

  const emit = defineEmits([
    'update:departamentoGeograficoId',
    'update:municipioId',
    'update:zona',
    'update:direccion',
  ])

  const localDepartamentoId = computed({
    get: () => props.departamentoGeograficoId,
    set: val => emit('update:departamentoGeograficoId', val),
  })

  const localMunicipioId = computed({
    get: () => props.municipioId,
    set: val => emit('update:municipioId', val),
  })

  const localZona = computed({
    get: () => props.zona,
    set: val => emit('update:zona', val),
  })

  const localDireccion = computed({
    get: () => props.direccion,
    set: val => emit('update:direccion', val),
  })

  function emitChange (data) {
  // Can re-emit or just rely on v-models
  }
</script>
