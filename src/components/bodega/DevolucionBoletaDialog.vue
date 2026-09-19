<template>
  <v-dialog :model-value="modelValue" max-width="720" persistent scrollable @update:model-value="emit('update:modelValue', $event)">
    <v-card rounded="xl">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon class="mr-2" color="primary">mdi-package-down</v-icon>
        Devolución · Boleta {{ entrega?.numero_boleta || entrega?.id }}
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" @click="cerrar" />
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-6">
        <v-alert class="mb-4" density="compact" type="info" variant="tonal">
          Marque lo que sí devuelven. Lo que no entreguen se puede descontar en planilla al dar de baja.
        </v-alert>

        <v-table density="compact">
          <thead>
            <tr>
              <th>Ítem</th>
              <th class="text-center">Pend.</th>
              <th>Devuelve</th>
              <th>No entrega</th>
              <th>Precio Q</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in lineas" :key="row.item_id">
              <td>
                <div class="font-weight-medium">{{ row.nombre }}</div>
                <div class="text-caption text-medium-emphasis">{{ row.etiqueta }}</div>
              </td>
              <td class="text-center">{{ row.pendiente }}</td>
              <td style="max-width: 90px;">
                <v-text-field
                  v-model.number="row.devolver"
                  density="compact"
                  hide-details
                  min="0"
                  :max="row.pendiente"
                  type="number"
                  variant="outlined"
                  @update:model-value="onDevolver(row)"
                />
              </td>
              <td style="max-width: 90px;">
                <v-text-field
                  v-model.number="row.no_devuelve"
                  density="compact"
                  hide-details
                  min="0"
                  :max="row.pendiente"
                  type="number"
                  variant="outlined"
                  @update:model-value="onNoDevuelve(row)"
                />
              </td>
              <td style="max-width: 110px;">
                <v-text-field
                  v-model.number="row.precio_unitario"
                  density="compact"
                  hide-details
                  min="0"
                  prefix="Q"
                  step="0.01"
                  type="number"
                  variant="outlined"
                />
              </td>
            </tr>
          </tbody>
        </v-table>

        <div v-if="montoFaltante > 0" class="d-flex align-center mt-4 mb-2">
          <span class="text-subtitle-2">A descontar por lo no entregado</span>
          <v-spacer />
          <span class="text-h6 text-error">Q{{ formatMoney(montoFaltante) }}</span>
        </div>

        <v-switch
          v-model="descontar"
          class="mt-2"
          color="error"
          density="compact"
          :disabled="montoFaltante <= 0"
          hide-details
          label="Descontar en planilla lo que no entregaron"
        />

        <v-row v-if="descontar && montoFaltante > 0" class="mt-2" dense>
          <v-col cols="12" md="6">
            <v-text-field
              v-model.number="cuotas"
              density="compact"
              label="Número de cuotas"
              min="1"
              type="number"
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="fechaInicio"
              density="compact"
              label="Fecha del primer descuento"
              type="date"
              variant="outlined"
            />
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions class="pa-4">
        <v-btn variant="text" @click="cerrar">Cancelar</v-btn>
        <v-spacer />
        <v-btn color="primary" :disabled="!puedeGuardar" :loading="saving" variant="elevated" @click="guardar">
          Registrar devolución
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'
  import bodegaService from '@/services/bodegaService'

  const props = defineProps({
    modelValue: { type: Boolean, default: false },
    entrega: { type: Object, default: null },
  })

  const emit = defineEmits(['update:modelValue', 'done', 'error'])

  const saving = ref(false)
  const lineas = ref([])
  const descontar = ref(true)
  const cuotas = ref(1)
  const fechaInicio = ref(localDate())

  function localDate () {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  function formatMoney (n) {
    return Number(n || 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  function pendienteItem (it) {
    if (it.cantidad_pendiente != null) return Number(it.cantidad_pendiente)
    return Math.max(0, Number(it.cantidad || 0) - Number(it.cantidad_devuelta || 0) - Number(it.cantidad_no_devuelta || 0))
  }

  function armarLineas (entrega) {
    return (entrega?.items || [])
      .map((it) => {
        const pend = pendienteItem(it)
        return {
          item_id: it.id,
          nombre: it.variante?.producto?.nombre || 'Ítem',
          etiqueta: it.variante?.etiqueta || '',
          pendiente: pend,
          devolver: pend,
          no_devuelve: 0,
          precio_unitario: Number(it.precio_unitario || 0),
        }
      })
      .filter((row) => row.pendiente > 0)
  }

  watch(
    () => [props.modelValue, props.entrega],
    ([abierto, entrega]) => {
      if (abierto && entrega) {
        lineas.value = armarLineas(entrega)
        descontar.value = true
        cuotas.value = 1
        fechaInicio.value = localDate()
      }
    },
    { immediate: true },
  )

  const montoFaltante = computed(() =>
    lineas.value.reduce((sum, row) => sum + (Number(row.no_devuelve) || 0) * (Number(row.precio_unitario) || 0), 0)
  )

  const puedeGuardar = computed(() => {
    const total = lineas.value.reduce(
      (sum, row) => sum + (Number(row.devolver) || 0) + (Number(row.no_devuelve) || 0),
      0,
    )
    if (total <= 0) return false
    if (descontar.value && montoFaltante.value > 0 && (!cuotas.value || cuotas.value < 1)) return false
    return true
  })

  function onDevolver (row) {
    const max = row.pendiente
    row.devolver = Math.max(0, Math.min(max, Number(row.devolver) || 0))
    row.no_devuelve = Math.max(0, Math.min(max - row.devolver, Number(row.no_devuelve) || 0))
  }

  function onNoDevuelve (row) {
    const max = row.pendiente
    row.no_devuelve = Math.max(0, Math.min(max, Number(row.no_devuelve) || 0))
    row.devolver = Math.max(0, Math.min(max - row.no_devuelve, Number(row.devolver) || 0))
  }

  function cerrar () {
    emit('update:modelValue', false)
  }

  async function guardar () {
    if (!props.entrega?.id || !puedeGuardar.value) return
    saving.value = true
    try {
      const items = lineas.value
        .filter((row) => Number(row.devolver) > 0)
        .map((row) => ({ item_id: row.item_id, cantidad: Number(row.devolver) }))
      const noDevueltos = lineas.value
        .filter((row) => Number(row.no_devuelve) > 0)
        .map((row) => ({
          item_id: row.item_id,
          cantidad: Number(row.no_devuelve),
          precio_unitario: Number(row.precio_unitario) || 0,
        }))

      const res = await bodegaService.devolverEntrega(props.entrega.id, {
        items,
        no_devueltos: noDevueltos,
        descontar_faltantes: descontar.value && montoFaltante.value > 0,
        cuotas_totales: Number(cuotas.value) || 1,
        fecha_inicio: fechaInicio.value,
      })
      emit('done', res)
      cerrar()
    } catch (e) {
      emit('error', e.apiMessage || 'No se pudo registrar la devolución')
    } finally {
      saving.value = false
    }
  }
</script>
