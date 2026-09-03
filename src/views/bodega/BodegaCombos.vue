<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center flex-wrap ga-3 mb-4">
      <v-btn icon="mdi-arrow-left" variant="text" :to="{ name: 'bodega' }" />
      <div>
        <h1 class="text-h5 font-weight-bold mb-0">Combos / kits prearmados</h1>
        <p class="text-caption text-medium-emphasis mb-0">
          Plantillas listas (Kit agente / administración) o arma un combo desde cero. En la entrega solo se elige talla y condición.
        </p>
      </div>
      <v-spacer />
      <v-btn
        v-if="canManage"
        color="primary"
        variant="elevated"
        @click="abrirCrear"
      >
        <v-icon start>mdi-plus</v-icon>
        Nuevo combo
      </v-btn>
    </div>

    <v-card elevation="2" rounded="xl">
      <v-data-table :headers="headers" :items="kits" :loading="loading" :items-per-page="20">
        <template #item.codigo="{ item }">
          <span class="font-weight-medium">{{ item.codigo || '—' }}</span>
        </template>
        <template #item.precio="{ item }">
          <span v-if="precioKit(item)">Q{{ Number(precioKit(item)).toFixed(2) }}</span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>
        <template #item.items="{ item }">
          {{ item.items?.length || 0 }} producto(s)
          <div class="text-caption text-medium-emphasis">
            {{ resumenItems(item) }}
          </div>
        </template>
        <template #item.activo="{ item }">
          <v-chip :color="item.activo ? 'success' : 'grey'" size="small" variant="tonal">
            {{ item.activo ? 'Activo' : 'Inactivo' }}
          </v-chip>
        </template>
        <template #item.acciones="{ item }">
          <v-btn
            v-if="canManage"
            color="info"
            icon="mdi-pencil"
            size="small"
            variant="tonal"
            @click="abrirEditar(item)"
          />
          <v-btn
            v-if="canManage && item.activo"
            class="ml-1"
            color="error"
            icon="mdi-close"
            size="small"
            variant="tonal"
            @click="desactivar(item)"
          />
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialog" max-width="800" persistent scrollable>
      <v-card rounded="xl">
        <v-card-title class="pa-4">{{ editId ? 'Editar combo' : 'Nuevo combo' }}</v-card-title>
        <v-card-text class="pa-6">
          <v-text-field v-model="form.nombre" class="mb-2" label="Nombre *" variant="outlined" />
          <v-text-field
            class="mb-2"
            :model-value="editId ? (form.codigo || '—') : 'Se asigna al guardar (KIT-0001)'"
            hint="El código lo genera el sistema"
            label="Código"
            persistent-hint
            readonly
            variant="outlined"
          />
          <v-textarea v-model="form.observaciones" class="mb-4" label="Observaciones" rows="2" variant="outlined" />

          <div class="text-subtitle-2 font-weight-bold mb-2">Productos del combo</div>
          <p class="text-caption text-medium-emphasis mb-2">
            El precio es de cada producto (unidad). Al entregar el combo se usa ese precio por ítem.
          </p>
          <v-row dense class="mb-2">
            <v-col cols="12" md="5">
              <v-autocomplete
                v-model="draft.producto_id"
                clearable
                density="compact"
                :item-title="productoLabel"
                item-value="id"
                :items="productosOpts"
                :loading="loadingProductos"
                label="Producto"
                placeholder="Buscar..."
                variant="outlined"
                @update:model-value="sugerirPrecioDraft"
                @update:search="buscarProducto"
              />
            </v-col>
            <v-col cols="4" md="2">
              <v-text-field v-model.number="draft.cantidad" density="compact" label="Cant." min="1" type="number" variant="outlined" />
            </v-col>
            <v-col cols="8" md="3">
              <v-text-field
                v-model.number="draft.precio"
                density="compact"
                label="Precio Q"
                min="0"
                step="0.01"
                type="number"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="2" class="d-flex align-center">
              <v-btn block color="secondary" variant="tonal" @click="agregarItem">Agregar</v-btn>
            </v-col>
          </v-row>

          <v-alert v-if="itemError" class="mb-3" density="compact" type="warning" variant="tonal">{{ itemError }}</v-alert>

          <v-table v-if="form.items.length" density="compact">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cant.</th>
                <th>Precio Q</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <tr v-for="(it, idx) in form.items" :key="it.producto_id">
                <td>{{ it.nombre }}</td>
                <td>
                  <v-text-field
                    v-model.number="it.cantidad"
                    density="compact"
                    hide-details
                    min="1"
                    style="max-width: 90px"
                    type="number"
                    variant="outlined"
                  />
                </td>
                <td>
                  <v-text-field
                    v-model.number="it.precio"
                    density="compact"
                    hide-details
                    min="0"
                    step="0.01"
                    style="max-width: 120px"
                    type="number"
                    variant="outlined"
                  />
                </td>
                <td>
                  <v-btn color="error" icon="mdi-delete" size="small" variant="text" @click="form.items.splice(idx, 1)" />
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">Cancelar</v-btn>
          <v-btn color="primary" :disabled="!puedeGuardar" :loading="saving" variant="elevated" @click="guardar">
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3500">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
  import { computed, onMounted, reactive, ref } from 'vue'
  import bodegaService from '@/services/bodegaService'
  import { useAuthStore } from '@/stores/auth'

  const authStore = useAuthStore()
  const canManage = computed(() => authStore.hasPermission('manage-bodega'))

  const loading = ref(false)
  const saving = ref(false)
  const loadingProductos = ref(false)
  const kits = ref([])
  const productosOpts = ref([])
  const dialog = ref(false)
  const editId = ref(null)
  const itemError = ref('')
  const snackbar = reactive({ show: false, text: '', color: 'success' })
  const form = reactive({
    nombre: '',
    codigo: '',
    observaciones: '',
    items: [],
  })
  const draft = reactive({ producto_id: null, cantidad: 1, precio: null })

  const headers = [
    { title: 'Nombre', key: 'nombre' },
    { title: 'Código', key: 'codigo' },
    { title: 'Precio', key: 'precio' },
    { title: 'Ítems', key: 'items', sortable: false },
    { title: 'Estado', key: 'activo' },
    { title: '', key: 'acciones', sortable: false, width: '120px' },
  ]

  const puedeGuardar = computed(() => !!form.nombre && form.items.length > 0)

  function productoLabel (p) {
    return [p.codigo, p.nombre].filter(Boolean).join(' · ')
  }

  function resumenItems (kit) {
    return (kit.items || []).map(i => i.producto?.nombre).filter(Boolean).slice(0, 4).join(', ')
  }

  function precioKit (kit) {
    const suma = (kit.items || []).reduce((s, i) => {
      const p = Number(i.precio)
      if (!p) return s
      return s + p * (Number(i.cantidad) || 0)
    }, 0)
    return suma > 0 ? suma : Number(kit.precio) || 0
  }

  function precioProducto (prod) {
    const n = Number(prod?.precio_venta)
    return n > 0 ? n : null
  }

  function sugerirPrecioDraft (productoId) {
    const prod = productosOpts.value.find(p => p.id === productoId)
    draft.precio = precioProducto(prod)
  }

  async function cargar () {
    loading.value = true
    try {
      const res = await bodegaService.getKits({ incluir_inactivos: 1 })
      kits.value = res.data || []
    } finally {
      loading.value = false
    }
  }

  let searchTimer = null
  function buscarProducto (q) {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => cargarProductos((q || '').trim()), 300)
  }

  async function cargarProductos (search = '') {
    loadingProductos.value = true
    try {
      const res = await bodegaService.getProductos({ per_page: 50, para_kit: 1, search })
      productosOpts.value = res.data?.data || res.data || []
    } finally {
      loadingProductos.value = false
    }
  }

  function abrirCrear () {
    editId.value = null
    form.nombre = ''
    form.codigo = ''
    form.observaciones = ''
    form.items = []
    draft.producto_id = null
    draft.cantidad = 1
    draft.precio = null
    itemError.value = ''
    dialog.value = true
    cargarProductos()
  }

  function abrirEditar (kit) {
    editId.value = kit.id
    form.nombre = kit.nombre
    form.codigo = kit.codigo || ''
    form.observaciones = kit.observaciones || ''
    form.items = (kit.items || []).map(i => ({
      producto_id: i.producto_id,
      cantidad: i.cantidad,
      precio: i.precio != null ? Number(i.precio) : precioProducto(i.producto),
      nombre: i.producto?.nombre || 'Producto',
    }))
    draft.producto_id = null
    draft.cantidad = 1
    draft.precio = null
    itemError.value = ''
    dialog.value = true
    cargarProductos()
  }

  function agregarItem () {
    itemError.value = ''
    const prod = productosOpts.value.find(p => p.id === draft.producto_id)
    if (!prod) {
      itemError.value = 'Selecciona un producto.'
      return
    }
    const cantidad = Number(draft.cantidad) || 0
    if (cantidad < 1) {
      itemError.value = 'La cantidad debe ser al menos 1.'
      return
    }
    const ya = form.items.find(i => i.producto_id === prod.id)
    if (ya) {
      ya.cantidad += cantidad
      if (draft.precio != null && draft.precio !== '') {
        ya.precio = Number(draft.precio)
      }
    } else {
      form.items.push({
        producto_id: prod.id,
        cantidad,
        precio: draft.precio === '' || draft.precio == null ? precioProducto(prod) : Number(draft.precio),
        nombre: productoLabel(prod),
      })
    }
    draft.producto_id = null
    draft.cantidad = 1
    draft.precio = null
  }

  async function guardar () {
    if (!puedeGuardar.value) return
    saving.value = true
    try {
      const payload = {
        nombre: form.nombre,
        observaciones: form.observaciones || null,
        items: form.items.map(i => ({
          producto_id: i.producto_id,
          cantidad: Number(i.cantidad) || 1,
          precio: i.precio === '' || i.precio == null ? null : Number(i.precio),
        })),
      }
      if (editId.value) {
        await bodegaService.updateKit(editId.value, payload)
      } else {
        await bodegaService.createKit(payload)
      }
      dialog.value = false
      await cargar()
      snackbar.color = 'success'
      snackbar.text = 'Combo guardado.'
      snackbar.show = true
    } catch (e) {
      snackbar.color = 'error'
      snackbar.text = e.apiMessage || 'No se pudo guardar el combo'
      snackbar.show = true
    } finally {
      saving.value = false
    }
  }

  async function desactivar (kit) {
    if (!confirm(`¿Desactivar el combo "${kit.nombre}"?`)) return
    try {
      await bodegaService.deleteKit(kit.id)
      await cargar()
    } catch (e) {
      snackbar.color = 'error'
      snackbar.text = e.apiMessage || 'No se pudo desactivar'
      snackbar.show = true
    }
  }

  onMounted(cargar)
</script>
