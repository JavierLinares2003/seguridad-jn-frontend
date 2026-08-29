<template>
  <div>
    <v-alert
      v-if="alertaLiquidacion"
      class="mb-4"
      type="warning"
      variant="tonal"
    >
      Está {{ estadoPersonal }} y tiene boletas sin devolver.
      No se debería pagar hasta confirmar devolución o descuento del uniforme/equipo.
    </v-alert>

    <div class="text-body-2 text-medium-emphasis mb-4">
      La boleta es la guía: qué se le entregó y qué debe devolver al salir de la empresa.
    </div>

    <v-data-table
      density="comfortable"
      :headers="headers"
      :items="entregas"
      :loading="loading"
      :items-per-page="10"
    >
      <template #item.fecha_entrega="{ item }">
        {{ formatDate(item.fecha_entrega) }}
      </template>
      <template #item.numero_boleta="{ item }">
        <span class="font-weight-bold">{{ item.numero_boleta || '—' }}</span>
      </template>
      <template #item.tipo="{ item }">
        <v-chip size="small" variant="tonal">{{ tipoLabel(item.tipo) }}</v-chip>
      </template>
      <template #item.items="{ item }">
        <div v-for="it in item.items || []" :key="it.id" class="text-caption">
          {{ it.cantidad }} {{ it.variante?.producto?.nombre }}
          <span v-if="it.cantidad_pendiente > 0 && it.cantidad_devuelta" class="text-warning">
            (pend. {{ it.cantidad_pendiente }})
          </span>
        </div>
      </template>
      <template #item.estado="{ item }">
        <v-chip :color="item.devuelta_at ? 'success' : 'warning'" size="small" variant="flat">
          {{ item.devuelta_at ? 'Devuelto' : 'En su poder' }}
        </v-chip>
      </template>
      <template #item.acciones="{ item }">
        <v-btn color="secondary" size="small" variant="tonal" @click="abrirVistaPrevia(item)">
          Boleta
        </v-btn>
        <v-btn
          v-if="canManage && !item.devuelta_at"
          class="ml-1"
          color="primary"
          size="small"
          variant="tonal"
          :loading="devolviendoId === item.id"
          @click="devolver(item)"
        >
          Devolver
        </v-btn>
      </template>
      <template #no-data>
        Sin boletas de bodega para esta persona.
      </template>
    </v-data-table>

    <v-dialog v-model="dialogBoleta" max-width="960" scrollable @update:model-value="onCerrarVistaPrevia">
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon class="mr-2" color="secondary">mdi-file-eye-outline</v-icon>
          Vista previa · Boleta {{ previewNumero }}
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" @click="cerrarVistaPrevia" />
        </v-card-title>
        <v-card-text class="pa-0">
          <div v-if="loadingBoleta" class="text-center pa-12">
            <v-progress-circular color="primary" indeterminate size="40" />
            <div class="text-body-2 mt-3">Generando boleta…</div>
          </div>
          <iframe
            v-else-if="previewUrl"
            class="boleta-preview"
            :src="previewUrl"
            title="Vista previa de boleta"
          />
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-btn color="secondary" :disabled="!previewUrl" variant="tonal" @click="descargarPreview">
            <v-icon start>mdi-download</v-icon>
            Descargar
          </v-btn>
          <v-btn color="primary" :disabled="!previewUrl" variant="tonal" @click="imprimirPreview">
            <v-icon start>mdi-printer</v-icon>
            Imprimir
          </v-btn>
          <v-spacer />
          <v-btn variant="text" @click="cerrarVistaPrevia">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
  import { computed, onMounted, onUnmounted, ref } from 'vue'
  import bodegaService from '@/services/bodegaService'
  import { useAuthStore } from '@/stores/auth'

  const props = defineProps({
    personalId: { type: Number, required: true },
    estadoPersonal: { type: String, default: '' },
    pendienteLiquidacion: { type: Boolean, default: false },
  })

  const emit = defineEmits(['error', 'updated'])

  const authStore = useAuthStore()
  const canManage = computed(() => authStore.hasPermission('manage-bodega'))
  const alertaLiquidacion = computed(() => !!props.pendienteLiquidacion)

  const loading = ref(false)
  const entregas = ref([])
  const devolviendoId = ref(null)
  const dialogBoleta = ref(false)
  const loadingBoleta = ref(false)
  const previewUrl = ref('')
  const previewNumero = ref('')

  const headers = [
    { title: 'Fecha', key: 'fecha_entrega' },
    { title: 'Boleta', key: 'numero_boleta' },
    { title: 'Tipo', key: 'tipo' },
    { title: 'Ítems', key: 'items', sortable: false },
    { title: 'Estado', key: 'estado', sortable: false },
    { title: '', key: 'acciones', sortable: false, width: '220px' },
  ]

  function tipoLabel (tipo) {
    return { kit: 'Kit', reposicion: 'Reposición', simple: 'Simple' }[tipo] || tipo
  }

  function formatDate (date) {
    if (!date) return '—'
    const d = String(date).includes('T') ? new Date(date) : new Date(date + 'T12:00:00')
    if (Number.isNaN(d.getTime())) return date
    return d.toLocaleDateString('es-GT')
  }

  async function cargar () {
    if (!props.personalId) return
    loading.value = true
    try {
      const res = await bodegaService.getEntregas({ personal_id: props.personalId, per_page: 50 })
      const rows = res.data?.data || res.data || []
      entregas.value = Array.isArray(rows) ? rows : []
    } catch (e) {
      entregas.value = []
      emit('error', e.apiMessage || 'No se pudieron cargar las boletas')
    } finally {
      loading.value = false
    }
  }

  function revocarPreview () {
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value)
      previewUrl.value = ''
    }
  }

  function cerrarVistaPrevia () {
    dialogBoleta.value = false
    revocarPreview()
  }

  function onCerrarVistaPrevia (abierto) {
    if (!abierto) revocarPreview()
  }

  async function abrirVistaPrevia (item) {
    if (!item?.id) return
    previewNumero.value = item.numero_boleta || String(item.id)
    dialogBoleta.value = true
    loadingBoleta.value = true
    revocarPreview()
    try {
      const control = item.devuelta_at ? 'entrada' : 'salida'
      const response = await bodegaService.downloadBoleta(item.id, { control })
      const blob = new Blob([response.data], { type: 'application/pdf' })
      previewUrl.value = URL.createObjectURL(blob)
    } catch (e) {
      dialogBoleta.value = false
      emit('error', e.apiMessage || 'No se pudo generar la boleta')
    } finally {
      loadingBoleta.value = false
    }
  }

  function descargarPreview () {
    if (!previewUrl.value) return
    const link = document.createElement('a')
    link.href = previewUrl.value
    link.download = `BOLETA-BODEGA-${previewNumero.value}.pdf`
    link.click()
  }

  function imprimirPreview () {
    if (!previewUrl.value) return
    window.open(previewUrl.value, '_blank', 'noopener')
  }

  async function devolver (item) {
    if (!confirm(`¿Registrar devolución de la boleta ${item.numero_boleta || item.id}?`)) return
    devolviendoId.value = item.id
    try {
      await bodegaService.devolverEntrega(item.id)
      await cargar()
      emit('updated')
    } catch (e) {
      emit('error', e.apiMessage || 'No se pudo registrar la devolución')
    } finally {
      devolviendoId.value = null
    }
  }

  onMounted(cargar)
  onUnmounted(revocarPreview)
</script>

<style scoped>
.boleta-preview {
  width: 100%;
  height: min(78vh, 820px);
  border: 0;
  background: #fff;
}
</style>
