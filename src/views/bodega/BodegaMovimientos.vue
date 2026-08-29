<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center flex-wrap ga-3 mb-4">
      <v-btn icon="mdi-arrow-left" variant="text" :to="{ name: 'bodega' }" />
      <div>
        <h1 class="text-h5 font-weight-bold mb-0">Kardex / Movimientos</h1>
        <p class="text-caption text-medium-emphasis mb-0">
          Historial de stock. Las compras con factura cargan inventario; las entregas a personal salen por Entregas.
        </p>
      </div>
      <v-spacer />
      <v-btn
        v-if="canManage"
        color="warning"
        variant="elevated"
        @click="abrirAjuste"
      >
        <v-icon start>mdi-tune</v-icon>
        Ajuste de inventario
      </v-btn>
    </div>

    <v-alert
      class="mb-4"
      density="compact"
      type="info"
      variant="tonal"
    >
      Para cargar inventario usa
      <router-link class="font-weight-medium" :to="{ name: 'bodega-compras' }">Compras</router-link>
      (factura). Las salidas a personal van en
      <router-link class="font-weight-medium" :to="{ name: 'bodega-entregas' }">Entregas</router-link>.
      Aquí solo consultas el kardex o corriges existencias con un ajuste.
    </v-alert>

    <v-card class="mb-4" elevation="2" rounded="xl">
      <v-card-text class="pa-4">
        <v-row dense>
          <v-col cols="12" md="3">
            <v-select
              v-model="filtros.tipo"
              clearable
              density="compact"
              :items="tipos"
              label="Tipo"
              variant="outlined"
              @update:model-value="cargar"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field v-model="filtros.fecha_desde" density="compact" label="Desde" type="date" variant="outlined" @update:model-value="cargar" />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field v-model="filtros.fecha_hasta" density="compact" label="Hasta" type="date" variant="outlined" @update:model-value="cargar" />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="filtros.search"
              density="compact"
              label="Buscar producto"
              variant="outlined"
              @keyup.enter="cargar"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card elevation="2" rounded="xl">
      <v-data-table :headers="headers" :items="items" :loading="loading" :items-per-page="25">
        <template #item.tipo="{ item }">
          <v-chip :color="tipoColor(item.tipo)" size="small" variant="flat">{{ tipoLabel(item.tipo) }}</v-chip>
        </template>
        <template #item.producto="{ item }">
          {{ item.variante?.producto?.nombre }}
          <div class="text-caption text-medium-emphasis">{{ item.variante?.etiqueta }}</div>
        </template>
        <template #item.personal="{ item }">
          <span v-if="item.personal">{{ item.personal.nombres }} {{ item.personal.apellidos }}</span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>
        <template #item.referencia="{ item }">
          <span v-if="item.referencia">{{ item.referencia }}</span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>
        <template #item.stock="{ item }">
          {{ item.existencia_anterior }} → {{ item.existencia_nueva }}
        </template>
        <template #item.fecha_movimiento="{ item }">
          {{ formatDate(item.fecha_movimiento) }}
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialog" max-width="520" persistent>
      <v-card rounded="xl">
        <v-card-title class="pa-4">Ajuste de inventario</v-card-title>
        <v-card-text>
          <p class="text-body-2 text-medium-emphasis mb-4">
            Corrige la existencia al valor real (conteo físico, merma, error de captura). No uses esto para compras ni entregas.
          </p>
          <v-autocomplete
            v-model="productoId"
            class="mb-2"
            clearable
            item-title="nombre"
            item-value="id"
            :items="productosOpts"
            :loading="loadingProductos"
            label="Producto *"
            no-data-text="Escribe para buscar producto"
            placeholder="Buscar producto..."
            variant="outlined"
            @update:model-value="onProductoChange"
            @update:search="buscarProducto"
          />
          <v-select
            v-model="form.variante_id"
            class="mb-2"
            :disabled="!productoId"
            item-title="etiqueta"
            item-value="id"
            :items="variantesOpts"
            :label="productoId ? 'Variante *' : 'Primero elige un producto'"
            no-data-text="Este producto no tiene variantes"
            variant="outlined"
          />
          <v-alert
            v-if="varianteSeleccionada"
            class="mb-3"
            density="compact"
            type="info"
            variant="tonal"
          >
            Existencia actual: <strong>{{ stockActual }}</strong>
          </v-alert>
          <v-text-field
            v-model.number="form.cantidad"
            class="mb-2"
            :error="!!ajusteError"
            :error-messages="ajusteError"
            label="Existencia correcta *"
            min="0"
            type="number"
            variant="outlined"
          />
          <v-text-field v-model="form.fecha_movimiento" class="mb-2" label="Fecha" type="date" variant="outlined" />
          <v-textarea v-model="form.observaciones" label="Motivo del ajuste *" rows="2" variant="outlined" />
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">Cancelar</v-btn>
          <v-btn
            color="warning"
            :disabled="!!ajusteError || !form.variante_id || form.cantidad === null || form.cantidad === '' || !form.observaciones?.trim()"
            :loading="saving"
            variant="elevated"
            @click="guardar"
          >
            Guardar ajuste
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
  import { computed, onMounted, reactive, ref, watch } from 'vue'
  import { format } from 'date-fns'
  import { es } from 'date-fns/locale'
  import bodegaService from '@/services/bodegaService'
  import { useAuthStore } from '@/stores/auth'

  const authStore = useAuthStore()
  const canManage = computed(() => authStore.hasPermission('manage-bodega'))

  const loading = ref(false)
  const saving = ref(false)
  const loadingProductos = ref(false)
  const items = ref([])
  const dialog = ref(false)
  const productosOpts = ref([])
  const variantesOpts = ref([])
  const productoId = ref(null)

  const filtros = reactive({ tipo: null, fecha_desde: null, fecha_hasta: null, search: '' })
  const form = reactive({
    tipo: 'ajuste',
    variante_id: null,
    cantidad: 0,
    fecha_movimiento: localDate(),
    observaciones: '',
  })

  const tipos = [
    { title: 'Ingreso', value: 'ingreso' },
    { title: 'Egreso', value: 'egreso' },
    { title: 'Ajuste', value: 'ajuste' },
    { title: 'Inicial', value: 'ajuste_inicial' },
  ]

  const headers = [
    { title: 'Tipo', key: 'tipo' },
    { title: 'Producto', key: 'producto' },
    { title: 'Cant.', key: 'cantidad' },
    { title: 'Stock', key: 'stock' },
    { title: 'Personal', key: 'personal' },
    { title: 'Ref.', key: 'referencia' },
    { title: 'Fecha', key: 'fecha_movimiento' },
  ]

  const varianteSeleccionada = computed(() =>
    variantesOpts.value.find(v => v.id === form.variante_id) || null
  )

  const stockActual = computed(() => Number(varianteSeleccionada.value?.existencia ?? 0))

  const ajusteError = computed(() => {
    if (form.variante_id == null) return ''
    if (form.cantidad === null || form.cantidad === '' || Number.isNaN(Number(form.cantidad))) {
      return 'Indica la existencia correcta.'
    }
    const objetivo = Number(form.cantidad)
    if (objetivo < 0) return 'La existencia no puede ser negativa.'
    if (objetivo === stockActual.value) return 'La existencia correcta es igual a la actual; no hay ajuste.'
    return ''
  })

  function localDate () {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  function tipoLabel (tipo) {
    return ({ ingreso: 'Ingreso', egreso: 'Egreso', ajuste: 'Ajuste', ajuste_inicial: 'Inicial' })[tipo] || tipo
  }

  function tipoColor (tipo) {
    return ({ ingreso: 'success', egreso: 'error', ajuste: 'warning', ajuste_inicial: 'info' })[tipo] || 'grey'
  }

  function formatDate (date) {
    if (!date) return '—'
    const d = String(date).includes('T') ? new Date(date) : new Date(date + 'T12:00:00')
    if (Number.isNaN(d.getTime())) return date
    return format(d, 'dd/MM/yyyy', { locale: es })
  }

  async function cargar () {
    loading.value = true
    try {
      const params = { ...filtros }
      Object.keys(params).forEach(k => { if (!params[k]) delete params[k] })
      const res = await bodegaService.getMovimientos(params)
      items.value = res.data?.data || res.data || []
    } finally {
      loading.value = false
    }
  }

  let searchProductoTimer = null
  function buscarProducto (q) {
    clearTimeout(searchProductoTimer)
    searchProductoTimer = setTimeout(async () => {
      const term = (q || '').trim()
      loadingProductos.value = true
      try {
        const params = { per_page: 50 }
        if (term) params.search = term
        const res = await bodegaService.getProductos(params)
        productosOpts.value = res.data?.data || res.data || []
      } finally {
        loadingProductos.value = false
      }
    }, 300)
  }

  async function abrirAjuste () {
    form.tipo = 'ajuste'
    form.variante_id = null
    form.cantidad = 0
    form.fecha_movimiento = localDate()
    form.observaciones = ''
    productoId.value = null
    variantesOpts.value = []
    dialog.value = true
    loadingProductos.value = true
    try {
      const res = await bodegaService.getProductos({ per_page: 50 })
      productosOpts.value = res.data?.data || res.data || []
    } finally {
      loadingProductos.value = false
    }
  }

  async function onProductoChange (id) {
    form.variante_id = null
    form.cantidad = 0
    if (!id) {
      variantesOpts.value = []
      return
    }
    const res = await bodegaService.getProducto(id)
    const prod = res.data?.producto || res.data
    variantesOpts.value = (prod?.variantes || []).map(v => ({
      ...v,
      etiqueta: `${v.etiqueta} (stock ${v.existencia})`,
    }))
    if (variantesOpts.value.length === 1) {
      form.variante_id = variantesOpts.value[0].id
    }
  }

  watch(() => form.variante_id, (id) => {
    if (!id) return
    form.cantidad = stockActual.value
  })

  async function guardar () {
    if (!form.variante_id || ajusteError.value) return
    if (!form.observaciones?.trim()) {
      alert('Indica el motivo del ajuste.')
      return
    }
    saving.value = true
    try {
      await bodegaService.createMovimiento({
        tipo: 'ajuste',
        variante_id: form.variante_id,
        cantidad: Number(form.cantidad),
        fecha_movimiento: form.fecha_movimiento,
        observaciones: form.observaciones.trim(),
      })
      dialog.value = false
      await cargar()
    } catch (e) {
      alert(e.apiMessage || 'Error al guardar')
    } finally {
      saving.value = false
    }
  }

  onMounted(cargar)
</script>
