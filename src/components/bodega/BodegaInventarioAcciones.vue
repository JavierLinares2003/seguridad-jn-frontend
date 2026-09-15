<template>
  <div>
    <v-dialog v-model="dialogUsado" max-width="520" persistent>
      <v-card rounded="xl">
        <v-card-title class="pa-4">Ingresar artículos usados</v-card-title>
        <v-card-text>
          <p class="text-body-2 text-medium-emphasis mb-4">
            Para usados en buen estado (por ejemplo entrega de Contabilidad) que no tienen factura de compra.
            Entran al inventario activo como <strong>usado</strong>.
          </p>
          <v-autocomplete
            v-if="!productoFijo"
            v-model="usado.producto_id"
            class="mb-2"
            :items="productos"
            item-title="nombre"
            item-value="id"
            label="Producto *"
            :loading="loadingProductos"
            variant="outlined"
            @update:model-value="onProductoUsado"
          />
          <div v-else class="mb-3 text-body-2">
            {{ productoFijo.nombre }}
          </div>
          <v-select
            v-if="variantesReferencia.length > 1"
            v-model="usado.variante_id"
            class="mb-2"
            :items="variantesReferencia"
            item-title="etiqueta"
            item-value="id"
            label="Talla / variante"
            variant="outlined"
          />
          <v-text-field
            v-model.number="usado.cantidad"
            class="mb-2"
            label="Cantidad *"
            min="1"
            type="number"
            variant="outlined"
          />
          <v-textarea
            v-model="usado.observaciones"
            label="Observaciones"
            placeholder="Ej. Entrega de Contabilidad, usados en buen estado"
            rows="2"
            variant="outlined"
          />
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="dialogUsado = false">Cancelar</v-btn>
          <v-btn
            color="primary"
            :disabled="!puedeIngresarUsado"
            :loading="saving"
            variant="elevated"
            @click="guardarUsado"
          >
            Ingresar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogBaja" max-width="520" persistent>
      <v-card rounded="xl">
        <v-card-title class="pa-4">Dar de baja</v-card-title>
        <v-card-text>
          <p class="text-body-2 text-medium-emphasis mb-4">
            El artículo sale del inventario activo y pasa a
            <strong>Artículos de baja</strong> (uniformes deteriorados, estufas que no sirven, botas rotas, etc.).
          </p>
          <v-autocomplete
            v-if="!productoFijo"
            v-model="baja.producto_id"
            class="mb-2"
            :items="productos"
            item-title="nombre"
            item-value="id"
            label="Producto *"
            :loading="loadingProductos"
            variant="outlined"
            @update:model-value="onProductoBaja"
          />
          <div v-else class="mb-3 text-body-2">
            {{ productoFijo.nombre }}
          </div>
          <v-select
            v-model="baja.variante_id"
            class="mb-2"
            :items="variantesConStock"
            item-title="label"
            item-value="id"
            label="Variante *"
            no-data-text="No hay existencias activas para dar de baja"
            variant="outlined"
          />
          <v-text-field
            v-model.number="baja.cantidad"
            class="mb-2"
            :error="!!bajaError"
            :error-messages="bajaError"
            label="Cantidad *"
            min="1"
            type="number"
            variant="outlined"
          />
          <v-textarea
            v-model="baja.observaciones"
            label="Motivo *"
            placeholder="Ej. Uniforme deteriorado por desgaste"
            rows="2"
            variant="outlined"
          />
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="dialogBaja = false">Cancelar</v-btn>
          <v-btn
            color="error"
            :disabled="!!bajaError || !puedeDarBaja"
            :loading="saving"
            variant="elevated"
            @click="guardarBaja"
          >
            Dar de baja
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
  import { computed, reactive, ref } from 'vue'
  import bodegaService from '@/services/bodegaService'

  const props = defineProps({
    producto: { type: Object, default: null },
  })

  const emit = defineEmits(['done', 'error'])

  const dialogUsado = ref(false)
  const dialogBaja = ref(false)
  const saving = ref(false)
  const loadingProductos = ref(false)
  const productos = ref([])
  const productoSel = ref(null)

  const usado = reactive({
    producto_id: null,
    variante_id: null,
    cantidad: 1,
    observaciones: '',
  })
  const baja = reactive({
    producto_id: null,
    variante_id: null,
    cantidad: 1,
    observaciones: '',
  })

  const productoFijo = computed(() => props.producto || null)

  const variantesProducto = computed(() => productoSel.value?.variantes || productoFijo.value?.variantes || [])

  const variantesReferencia = computed(() => {
    const seen = new Map()
    for (const v of variantesProducto.value) {
      const key = `${v.talla || ''}|${v.genero || ''}`
      if (!seen.has(key)) seen.set(key, v)
    }
    return [...seen.values()]
  })

  const variantesConStock = computed(() =>
    variantesProducto.value
      .filter(v => Number(v.existencia) > 0)
      .map(v => ({
        ...v,
        label: `${v.etiqueta || 'Única'} · stock ${v.existencia}`,
      })),
  )

  const varianteBajaSel = computed(() =>
    variantesProducto.value.find(v => v.id === baja.variante_id),
  )

  const puedeIngresarUsado = computed(() => {
    const productoId = productoFijo.value?.id || usado.producto_id
    return !!productoId && Number(usado.cantidad) > 0
  })

  const bajaError = computed(() => {
    const stock = Number(varianteBajaSel.value?.existencia ?? 0)
    const cant = Number(baja.cantidad || 0)
    if (!baja.variante_id || !cant) return ''
    if (cant > stock) return `Solo hay ${stock} en inventario activo.`
    return ''
  })

  const puedeDarBaja = computed(() => {
    const productoId = productoFijo.value?.id || baja.producto_id
    return !!productoId && !!baja.variante_id && Number(baja.cantidad) > 0 && !!String(baja.observaciones || '').trim()
  })

  async function asegurarProductos () {
    if (productoFijo.value || productos.value.length) return
    loadingProductos.value = true
    try {
      const res = await bodegaService.getProductos({ per_page: 500 })
      productos.value = res.data?.data || res.data || []
    } finally {
      loadingProductos.value = false
    }
  }

  function onProductoUsado (id) {
    productoSel.value = productos.value.find(p => p.id === id) || null
    usado.variante_id = variantesReferencia.value[0]?.id || null
  }

  function onProductoBaja (id) {
    productoSel.value = productos.value.find(p => p.id === id) || null
    baja.variante_id = variantesConStock.value[0]?.id || null
    baja.cantidad = 1
  }

  async function abrirIngresoUsado (producto = null) {
    await asegurarProductos()
    usado.producto_id = producto?.id || productoFijo.value?.id || null
    usado.variante_id = null
    usado.cantidad = 1
    usado.observaciones = ''
    productoSel.value = producto || productoFijo.value || productos.value.find(p => p.id === usado.producto_id) || null
    if (productoSel.value) usado.variante_id = variantesReferencia.value[0]?.id || null
    dialogUsado.value = true
  }

  async function abrirDarBaja (producto = null, variante = null) {
    await asegurarProductos()
    baja.producto_id = producto?.id || productoFijo.value?.id || null
    baja.observaciones = ''
    productoSel.value = producto || productoFijo.value || productos.value.find(p => p.id === baja.producto_id) || null
    baja.variante_id = variante?.id || variantesConStock.value[0]?.id || null
    baja.cantidad = 1
    dialogBaja.value = true
  }

  async function guardarUsado () {
    const productoId = productoFijo.value?.id || usado.producto_id
    if (!productoId) return
    saving.value = true
    try {
      await bodegaService.ingresarUsados(productoId, {
        variante_id: usado.variante_id || undefined,
        cantidad: usado.cantidad,
        observaciones: usado.observaciones || undefined,
      })
      dialogUsado.value = false
      emit('done', 'usados')
    } catch (e) {
      emit('error', e.apiMessage || e.response?.data?.message || 'No se pudieron ingresar los usados')
    } finally {
      saving.value = false
    }
  }

  async function guardarBaja () {
    const productoId = productoFijo.value?.id || baja.producto_id
    if (!productoId || bajaError.value) return
    saving.value = true
    try {
      await bodegaService.darBajaProducto(productoId, {
        variante_id: baja.variante_id,
        cantidad: baja.cantidad,
        observaciones: baja.observaciones,
      })
      dialogBaja.value = false
      emit('done', 'baja')
    } catch (e) {
      emit('error', e.apiMessage || e.response?.data?.message || 'No se pudo dar de baja')
    } finally {
      saving.value = false
    }
  }

  defineExpose({ abrirIngresoUsado, abrirDarBaja })
</script>
