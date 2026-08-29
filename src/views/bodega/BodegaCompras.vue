<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center flex-wrap ga-3 mb-4">
      <v-btn icon="mdi-arrow-left" variant="text" :to="{ name: 'bodega' }" />
      <div>
        <h1 class="text-h5 font-weight-bold mb-0">Compras</h1>
        <p class="text-caption text-medium-emphasis mb-0">
          Pedido y cotización → se aprueba → anticipo 50% (ya se pagó) → se recibe → saldo 50%. La factura sigue cargando inventario.
        </p>
      </div>
      <v-spacer />
      <v-btn
        v-if="canManage"
        class="mr-2"
        color="secondary"
        variant="tonal"
        @click="dialogSolicitud = true"
      >
        <v-icon start>mdi-clipboard-plus</v-icon>
        Nueva solicitud
      </v-btn>
      <v-btn
        v-if="canManage"
        color="primary"
        variant="elevated"
        @click="abrirCrear"
      >
        <v-icon start>mdi-file-document-plus</v-icon>
        Registrar factura
      </v-btn>
    </div>

    <v-card class="mb-4" elevation="2" rounded="xl">
      <v-card-title class="text-subtitle-1">Flujo de solicitud (marcar “ya se pagó” para saltar)</v-card-title>
      <v-data-table :headers="headersSolicitud" :items="solicitudes" :loading="loadingSolicitudes" density="compact" :items-per-page="10">
        <template #item.estado="{ item }">
          <v-chip color="primary" size="small" variant="tonal">{{ item.estado }}</v-chip>
        </template>
        <template #item.total_estimado="{ item }">Q{{ Number(item.total_estimado || 0).toFixed(2) }}</template>
        <template #item.acciones="{ item }">
          <v-btn v-if="canManage && item.estado === 'solicitud'" size="x-small" variant="tonal" @click="avanzar(item, 'cotizacion')">Cotización</v-btn>
          <v-btn v-if="canManage && ['solicitud', 'cotizacion'].includes(item.estado)" size="x-small" class="ml-1" color="success" variant="tonal" @click="avanzar(item, 'aprobar')">Aprobar</v-btn>
          <v-btn v-if="canManage && ['aprobada'].includes(item.estado)" size="x-small" class="ml-1" color="warning" variant="tonal" @click="avanzar(item, 'anticipo')">50% pagado</v-btn>
          <v-btn v-if="canManage && ['anticipo_pagado'].includes(item.estado)" size="x-small" class="ml-1" color="info" variant="tonal" @click="avanzar(item, 'recibir')">Recibido</v-btn>
          <v-btn v-if="canManage && ['recibida'].includes(item.estado)" size="x-small" class="ml-1" color="success" variant="tonal" @click="avanzar(item, 'saldo')">Saldo pagado</v-btn>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialogSolicitud" max-width="560">
      <v-card rounded="xl">
        <v-card-title>Nueva solicitud / cotización</v-card-title>
        <v-card-text>
          <v-textarea v-model="solicitudForm.observaciones" class="mb-2" label="Qué se pide / cotización" rows="2" variant="outlined" />
          <v-text-field v-model="solicitudForm.items[0].descripcion" class="mb-2" label="Ítem *" variant="outlined" />
          <v-row dense>
            <v-col cols="6"><v-text-field v-model.number="solicitudForm.items[0].cantidad" label="Cantidad" type="number" variant="outlined" /></v-col>
            <v-col cols="6"><v-text-field v-model.number="solicitudForm.items[0].precio_estimado" label="Precio est." prefix="Q" type="number" variant="outlined" /></v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialogSolicitud = false">Cancelar</v-btn>
          <v-btn color="primary" :loading="savingSolicitud" @click="guardarSolicitud">Crear</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-card class="mb-4" elevation="2" rounded="xl">
      <v-card-text class="pa-4">
        <v-row dense>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="filtros.search"
              clearable
              density="compact"
              label="Buscar serie, factura o proveedor"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              @keyup.enter="cargar"
              @click:clear="cargar"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="filtros.fecha_desde"
              density="compact"
              label="Desde"
              type="date"
              variant="outlined"
              @update:model-value="cargar"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="filtros.fecha_hasta"
              density="compact"
              label="Hasta"
              type="date"
              variant="outlined"
              @update:model-value="cargar"
            />
          </v-col>
          <v-col cols="12" md="2" class="d-flex align-center">
            <v-btn color="primary" variant="tonal" block @click="cargar">Filtrar</v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card elevation="2" rounded="xl">
      <v-data-table :headers="headers" :items="items" :loading="loading" :items-per-page="20">
        <template #item.fecha_factura="{ item }">
          {{ formatDate(item.fecha_factura) }}
        </template>
        <template #item.proveedor="{ item }">
          <span class="font-weight-medium">{{ item.proveedor?.codigo || '—' }}</span>
          <div class="text-caption text-medium-emphasis">{{ item.proveedor?.nombre }}</div>
        </template>
        <template #item.documento="{ item }">
          {{ item.documento || item.numero_factura }}
        </template>
        <template #item.items="{ item }">
          {{ item.items_count ?? item.items?.length ?? 0 }} producto(s)
          <div class="text-caption text-medium-emphasis">{{ resumenItems(item) }}</div>
        </template>
        <template #item.total="{ item }">
          Q{{ formatMoney(item.total) }}
        </template>
        <template #item.acciones="{ item }">
          <v-btn color="info" size="small" variant="tonal" @click="verDetalle(item)">
            Ver
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialogCrear" max-width="920" persistent scrollable>
      <v-card rounded="xl">
        <v-card-title class="bg-primary pa-4 text-white">
          Registrar factura de compra
        </v-card-title>
        <v-card-text class="pa-6">
          <v-alert class="mb-4" density="compact" type="info" variant="tonal">
            Sube el PDF de la factura para rellenar proveedor, fecha, serie, número y productos. Revisa antes de grabar: al guardar se suma el stock.
          </v-alert>

          <v-row dense class="mb-4">
            <v-col cols="12" md="8">
              <v-file-input
                v-model="pdfFile"
                accept="application/pdf,.pdf"
                clearable
                density="compact"
                label="PDF de la factura"
                prepend-icon="mdi-file-pdf-box"
                show-size
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="4" class="d-flex align-center">
              <v-btn
                block
                color="secondary"
                :disabled="!pdfFile"
                :loading="leyendoPdf"
                variant="elevated"
                @click="leerPdf"
              >
                <v-icon start>mdi-text-box-search</v-icon>
                Leer datos
              </v-btn>
            </v-col>
          </v-row>

          <v-alert
            v-if="pdfAvisos.length"
            class="mb-4"
            density="compact"
            type="warning"
            variant="tonal"
          >
            <div v-for="(aviso, i) in pdfAvisos" :key="i">{{ aviso }}</div>
          </v-alert>

          <v-row dense>
            <v-col cols="12" md="6">
              <v-autocomplete
                v-model="form.proveedor_id"
                :item-title="proveedorLabel"
                item-value="id"
                :items="proveedores"
                label="Proveedor *"
                no-data-text="No hay proveedores"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.fecha_factura"
                label="Fecha de factura *"
                type="date"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field v-model="form.serie" label="Serie" variant="outlined" />
            </v-col>
            <v-col cols="12" md="8">
              <v-text-field v-model="form.numero_factura" label="Número de factura *" variant="outlined" />
            </v-col>
          </v-row>

          <div class="text-subtitle-2 font-weight-bold mt-4 mb-2">Productos comprados</div>
          <v-row dense class="mb-2">
            <v-col cols="12" md="5">
              <v-autocomplete
                v-model="draft.producto_id"
                :item-title="productoLabel"
                item-value="id"
                :items="productosOpts"
                :loading="loadingProductos"
                label="Producto"
                no-data-text="Escribe para buscar"
                placeholder="Código o nombre..."
                variant="outlined"
                density="compact"
                @update:model-value="onDraftProducto"
                @update:search="buscarProducto"
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-select
                v-model="draft.variante_id"
                density="compact"
                :disabled="!draft.producto_id"
                item-title="etiqueta"
                item-value="id"
                :items="draftVariantes"
                label="Variante / talla"
                variant="outlined"
                @update:model-value="onDraftVariante"
              />
            </v-col>
            <v-col cols="6" md="2">
              <v-text-field
                v-model.number="draft.cantidad"
                density="compact"
                label="Cant."
                min="1"
                type="number"
                variant="outlined"
              />
            </v-col>
            <v-col cols="6" md="2">
              <v-text-field
                v-model.number="draft.precio_unitario"
                density="compact"
                label="Precio Q"
                min="0"
                step="0.01"
                type="number"
                variant="outlined"
              />
            </v-col>
          </v-row>
          <div class="d-flex mb-3">
            <v-spacer />
            <v-btn color="secondary" variant="tonal" @click="agregarItem">
              <v-icon start>mdi-plus</v-icon>
              Agregar a la factura
            </v-btn>
          </div>

          <v-alert v-if="itemError" class="mb-3" density="compact" type="warning" variant="tonal">
            {{ itemError }}
          </v-alert>

          <v-table v-if="form.items.length" density="compact">
            <thead>
              <tr>
                <th>Producto</th>
                <th class="text-right">Cant.</th>
                <th class="text-right">Precio</th>
                <th class="text-right">Subtotal</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <tr v-for="(it, idx) in form.items" :key="idx">
                <td>
                  {{ it.nombre }}
                  <div class="text-caption text-medium-emphasis">{{ it.etiqueta }}</div>
                </td>
                <td class="text-right">{{ it.cantidad }}</td>
                <td class="text-right">Q{{ formatMoney(it.precio_unitario) }}</td>
                <td class="text-right">Q{{ formatMoney(it.cantidad * it.precio_unitario) }}</td>
                <td class="text-right">
                  <v-btn icon="mdi-delete" size="x-small" variant="text" @click="quitarItem(idx)" />
                </td>
              </tr>
            </tbody>
          </v-table>
          <p v-else class="text-caption text-medium-emphasis mb-0">
            Agrega al menos un producto comprado.
          </p>

          <div class="d-flex align-center mt-4">
            <span class="text-subtitle-1 font-weight-bold">Total factura</span>
            <v-spacer />
            <div class="text-right">
              <div class="text-h6 font-weight-bold">Q{{ formatMoney(totalFactura) }}</div>
              <div v-if="totalPdf != null" class="text-caption text-medium-emphasis">
                Total en PDF: Q{{ formatMoney(totalPdf) }}
              </div>
            </div>
          </div>

          <v-alert
            v-if="itemsSinMatch.length"
            class="mt-4"
            density="compact"
            type="warning"
            variant="tonal"
          >
            No se encontraron en bodega:
            <ul class="mt-1 mb-0 pl-4">
              <li v-for="(it, i) in itemsSinMatch" :key="i">
                {{ it.descripcion }} · {{ it.cantidad }} × Q{{ formatMoney(it.precio_unitario) }}
              </li>
            </ul>
            Agrégalos a mano con el buscador de productos.
          </v-alert>

          <v-textarea
            v-model="form.observaciones"
            class="mt-4"
            label="Observaciones"
            rows="2"
            variant="outlined"
          />
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="dialogCrear = false">Cancelar</v-btn>
          <v-btn
            color="primary"
            :disabled="!puedeGuardar"
            :loading="saving"
            variant="elevated"
            @click="guardar"
          >
            Grabar y cargar inventario
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogDetalle" max-width="720" scrollable>
      <v-card v-if="detalle" rounded="xl">
        <v-card-title class="pa-4">
          Factura {{ detalle.documento || detalle.numero_factura }}
        </v-card-title>
        <v-card-text class="pa-4 pt-0">
          <v-row dense class="mb-4">
            <v-col cols="6">
              <div class="text-caption text-medium-emphasis">Código proveedor</div>
              <div class="font-weight-medium">{{ detalle.proveedor?.codigo || '—' }}</div>
              <div>{{ detalle.proveedor?.nombre }}</div>
            </v-col>
            <v-col cols="6">
              <div class="text-caption text-medium-emphasis">Fecha</div>
              <div>{{ formatDate(detalle.fecha_factura) }}</div>
            </v-col>
            <v-col cols="6">
              <div class="text-caption text-medium-emphasis">Serie</div>
              <div>{{ detalle.serie || '—' }}</div>
            </v-col>
            <v-col cols="6">
              <div class="text-caption text-medium-emphasis">Factura</div>
              <div>{{ detalle.numero_factura }}</div>
            </v-col>
          </v-row>

          <v-table density="compact">
            <thead>
              <tr>
                <th>Producto</th>
                <th class="text-right">Cant.</th>
                <th class="text-right">Precio</th>
                <th class="text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="it in detalle.items || []" :key="it.id">
                <td>
                  {{ it.variante?.producto?.codigo }} {{ it.variante?.producto?.nombre }}
                  <div class="text-caption text-medium-emphasis">{{ it.variante?.etiqueta }}</div>
                </td>
                <td class="text-right">{{ it.cantidad }}</td>
                <td class="text-right">Q{{ formatMoney(it.precio_unitario) }}</td>
                <td class="text-right">Q{{ formatMoney(it.subtotal) }}</td>
              </tr>
            </tbody>
          </v-table>

          <div class="d-flex align-center mt-4">
            <span class="font-weight-bold">Total factura</span>
            <v-spacer />
            <span class="text-h6 font-weight-bold">Q{{ formatMoney(detalle.total) }}</span>
          </div>
          <p v-if="detalle.observaciones" class="text-body-2 mt-3 mb-0">{{ detalle.observaciones }}</p>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="dialogDetalle = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="4000">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
  import { computed, onMounted, reactive, ref } from 'vue'
  import { format } from 'date-fns'
  import { es } from 'date-fns/locale'
  import bodegaService from '@/services/bodegaService'
  import { useAuthStore } from '@/stores/auth'

  const authStore = useAuthStore()
  const canManage = computed(() => authStore.hasPermission('manage-bodega'))

  const loading = ref(false)
  const loadingSolicitudes = ref(false)
  const savingSolicitud = ref(false)
  const solicitudes = ref([])
  const dialogSolicitud = ref(false)
  const solicitudForm = reactive({
    observaciones: '',
    items: [{ descripcion: '', cantidad: 1, precio_estimado: 0 }],
  })
  const headersSolicitud = [
    { title: 'Código', key: 'codigo' },
    { title: 'Estado', key: 'estado' },
    { title: 'Estimado', key: 'total_estimado' },
    { title: '', key: 'acciones', sortable: false },
  ]
  const saving = ref(false)
  const loadingProductos = ref(false)
  const items = ref([])
  const proveedores = ref([])
  const productosOpts = ref([])
  const draftVariantes = ref([])
  const dialogCrear = ref(false)
  const dialogDetalle = ref(false)
  const detalle = ref(null)
  const itemError = ref('')
  const pdfFile = ref(null)
  const leyendoPdf = ref(false)
  const pdfAvisos = ref([])
  const itemsSinMatch = ref([])
  const totalPdf = ref(null)
  const snackbar = reactive({ show: false, text: '', color: 'success' })
  const filtros = reactive({ search: '', fecha_desde: '', fecha_hasta: '' })

  const form = reactive({
    proveedor_id: null,
    fecha_factura: localDate(),
    serie: '',
    numero_factura: '',
    observaciones: '',
    items: [],
  })

  const draft = reactive({
    producto_id: null,
    variante_id: null,
    cantidad: 1,
    precio_unitario: 0,
    nombre: '',
  })

  const headers = [
    { title: 'Fecha', key: 'fecha_factura', width: '110px' },
    { title: 'Proveedor', key: 'proveedor' },
    { title: 'Serie / Factura', key: 'documento' },
    { title: 'Productos', key: 'items', sortable: false },
    { title: 'Total', key: 'total', align: 'end' },
    { title: '', key: 'acciones', sortable: false, width: '90px' },
  ]

  const totalFactura = computed(() =>
    form.items.reduce((sum, it) => sum + Number(it.cantidad || 0) * Number(it.precio_unitario || 0), 0)
  )

  const puedeGuardar = computed(() =>
    !!form.proveedor_id && !!form.numero_factura?.trim() && form.items.length > 0
  )

  function localDate () {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  function formatDate (date) {
    if (!date) return '—'
    const d = String(date).includes('T') ? new Date(date) : new Date(date + 'T12:00:00')
    if (Number.isNaN(d.getTime())) return date
    return format(d, 'dd/MM/yyyy', { locale: es })
  }

  function formatMoney (n) {
    return Number(n || 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  function proveedorLabel (p) {
    return [p.codigo, p.nombre].filter(Boolean).join(' · ')
  }

  function productoLabel (p) {
    return [p.codigo, p.nombre].filter(Boolean).join(' · ')
  }

  function resumenItems (factura) {
    const list = factura.items || []
    return list.slice(0, 3).map(i => i.variante?.producto?.nombre).filter(Boolean).join(', ')
      + (list.length > 3 ? '…' : '')
  }

  async function cargar () {
    loading.value = true
    try {
      const res = await bodegaService.getCompras({
        per_page: 50,
        search: filtros.search || undefined,
        fecha_desde: filtros.fecha_desde || undefined,
        fecha_hasta: filtros.fecha_hasta || undefined,
      })
      items.value = res.data?.data || res.data || []
    } finally {
      loading.value = false
    }
  }

  async function cargarProveedores () {
    const res = await bodegaService.getProveedores()
    proveedores.value = res.data || []
  }

  async function cargarProductosOpts (search = '') {
    loadingProductos.value = true
    try {
      const params = { per_page: 50 }
      if (search) params.search = search
      const res = await bodegaService.getProductos(params)
      productosOpts.value = res.data?.data || res.data || []
    } finally {
      loadingProductos.value = false
    }
  }

  let searchProductoTimer = null
  function buscarProducto (q) {
    clearTimeout(searchProductoTimer)
    searchProductoTimer = setTimeout(() => {
      cargarProductosOpts((q || '').trim())
    }, 300)
  }

  async function onDraftProducto (id) {
    draft.variante_id = null
    draftVariantes.value = []
    draft.nombre = ''
    draft.precio_unitario = 0
    if (!id) return
    const prod = productosOpts.value.find(p => p.id === id)
    draft.nombre = prod?.nombre || ''
    const res = await bodegaService.getProducto(id)
    const full = res.data?.producto || res.data
    draft.nombre = full?.nombre || draft.nombre
    draftVariantes.value = (full?.variantes || []).map(v => ({
      ...v,
      etiqueta: v.etiqueta || 'Única',
    }))
    if (draftVariantes.value.length === 1) {
      draft.variante_id = draftVariantes.value[0].id
      onDraftVariante(draft.variante_id)
    }
  }

  function onDraftVariante (id) {
    const variante = draftVariantes.value.find(v => v.id === id)
    if (variante) {
      draft.precio_unitario = Number(variante.precio_sugerido || 0)
    }
  }

  function agregarItem () {
    itemError.value = ''
    if (!draft.variante_id || !draft.cantidad || draft.cantidad < 1) {
      itemError.value = 'Elige producto, variante y cantidad.'
      return
    }
    const variante = draftVariantes.value.find(v => v.id === draft.variante_id)
    const prod = productosOpts.value.find(p => p.id === draft.producto_id)
    form.items.push({
      variante_id: draft.variante_id,
      cantidad: Number(draft.cantidad),
      precio_unitario: Number(draft.precio_unitario || 0),
      nombre: [prod?.codigo, draft.nombre || prod?.nombre].filter(Boolean).join(' · '),
      etiqueta: variante?.etiqueta || '',
    })
    draft.producto_id = null
    draft.variante_id = null
    draft.cantidad = 1
    draft.precio_unitario = 0
    draft.nombre = ''
    draftVariantes.value = []
  }

  function quitarItem (idx) {
    form.items.splice(idx, 1)
  }

  function abrirCrear () {
    form.proveedor_id = null
    form.fecha_factura = localDate()
    form.serie = ''
    form.numero_factura = ''
    form.observaciones = ''
    form.items = []
    itemError.value = ''
    pdfFile.value = null
    pdfAvisos.value = []
    itemsSinMatch.value = []
    totalPdf.value = null
    dialogCrear.value = true
    cargarProductosOpts()
  }

  function archivoPdf (valor) {
    if (!valor) return null
    return Array.isArray(valor) ? valor[0] : valor
  }

  async function leerPdf () {
    const file = archivoPdf(pdfFile.value)
    if (!file) return
    leyendoPdf.value = true
    pdfAvisos.value = []
    itemsSinMatch.value = []
    try {
      const res = await bodegaService.leerFacturaPdf(file)
      const data = res.data || {}
      if (data.proveedor_id) form.proveedor_id = data.proveedor_id
      if (data.fecha_factura) form.fecha_factura = data.fecha_factura
      if (data.serie) form.serie = data.serie
      if (data.numero_factura) form.numero_factura = data.numero_factura
      totalPdf.value = data.total_pdf ?? null
      if (Array.isArray(data.items) && data.items.length) {
        form.items = data.items.map(it => ({
          variante_id: it.variante_id,
          cantidad: Number(it.cantidad),
          precio_unitario: Number(it.precio_unitario || 0),
          nombre: it.nombre,
          etiqueta: it.etiqueta || '',
        }))
      }
      itemsSinMatch.value = data.items_sin_match || []
      pdfAvisos.value = data.advertencias || []
      if (data.proveedor_nombre && !data.proveedor_id) {
        pdfAvisos.value = [
          `Proveedor en el PDF: ${data.proveedor_nombre}. Elígelo en la lista si ya está dado de alta.`,
          ...pdfAvisos.value,
        ]
      }
      snackbar.text = res.message || 'Datos leídos. Revisa el formulario.'
      snackbar.color = 'success'
      snackbar.show = true
    } catch (e) {
      snackbar.text = e.response?.data?.message || 'No se pudieron leer los datos del PDF.'
      snackbar.color = 'error'
      snackbar.show = true
    } finally {
      leyendoPdf.value = false
    }
  }

  async function guardar () {
    if (!puedeGuardar.value) return
    saving.value = true
    try {
      const res = await bodegaService.createCompra({
        proveedor_id: form.proveedor_id,
        fecha_factura: form.fecha_factura,
        serie: form.serie || null,
        numero_factura: form.numero_factura.trim(),
        observaciones: form.observaciones || null,
        items: form.items.map(it => ({
          variante_id: it.variante_id,
          cantidad: it.cantidad,
          precio_unitario: it.precio_unitario,
        })),
      })
      snackbar.text = res.message || 'Factura registrada. Inventario actualizado.'
      snackbar.color = 'success'
      snackbar.show = true
      dialogCrear.value = false
      await cargar()
    } catch (e) {
      snackbar.text = e.response?.data?.message || 'No se pudo registrar la factura.'
      snackbar.color = 'error'
      snackbar.show = true
    } finally {
      saving.value = false
    }
  }

  async function verDetalle (item) {
    const res = await bodegaService.getCompra(item.id)
    detalle.value = res.data || item
    dialogDetalle.value = true
  }

  async function cargarSolicitudes () {
    loadingSolicitudes.value = true
    try {
      const res = await bodegaService.getSolicitudesCompra({ per_page: 30 })
      solicitudes.value = res.data?.data || res.data || []
    } finally {
      loadingSolicitudes.value = false
    }
  }

  async function guardarSolicitud () {
    if (!solicitudForm.items[0].descripcion) return
    savingSolicitud.value = true
    try {
      await bodegaService.crearSolicitudCompra({ ...solicitudForm })
      dialogSolicitud.value = false
      solicitudForm.observaciones = ''
      solicitudForm.items = [{ descripcion: '', cantidad: 1, precio_estimado: 0 }]
      await cargarSolicitudes()
    } finally {
      savingSolicitud.value = false
    }
  }

  async function avanzar (item, accion) {
    await bodegaService.avanzarSolicitudCompra(item.id, accion)
    await cargarSolicitudes()
  }

  onMounted(() => {
    cargar()
    cargarProveedores()
    cargarSolicitudes()
  })
</script>
