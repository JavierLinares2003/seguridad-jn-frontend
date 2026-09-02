<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center flex-wrap ga-3 mb-4">
      <v-btn icon="mdi-arrow-left" variant="text" :to="{ name: 'bodega' }" />
      <div>
        <h1 class="text-h5 font-weight-bold mb-0">Productos de bodega</h1>
        <p class="text-caption text-medium-emphasis mb-0">Catálogo con tallas, condición y existencia</p>
      </div>
      <v-spacer />
      <v-btn
        v-if="canManage"
        color="primary"
        variant="elevated"
        @click="abrirCrear"
      >
        <v-icon start>mdi-plus</v-icon>
        Nuevo producto
      </v-btn>
    </div>

    <v-card class="mb-4" elevation="2" rounded="xl">
      <v-card-text class="pa-4">
        <v-row dense>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="filtros.search"
              clearable
              density="compact"
              label="Buscar"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              @keyup.enter="cargar"
              @click:clear="cargar"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model="filtros.categoria_id"
              clearable
              density="compact"
              item-title="nombre"
              item-value="id"
              :items="categorias"
              label="Categoría"
              variant="outlined"
              @update:model-value="cargar"
            />
          </v-col>
          <v-col cols="6" md="2">
            <v-switch
              v-model="filtros.stock_bajo"
              color="warning"
              density="compact"
              label="Stock bajo"
              hide-details
              @update:model-value="cargar"
            />
          </v-col>
          <v-col cols="6" md="2">
            <v-btn block color="secondary" variant="tonal" @click="cargar">Filtrar</v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card elevation="2" rounded="xl">
      <v-data-table
        :headers="headers"
        :items="productos"
        :loading="loading"
        :items-per-page="20"
      >
        <template #item.codigo="{ item }">
          <span class="font-weight-medium">{{ item.codigo || '—' }}</span>
        </template>
        <template #item.precio_venta="{ item }">
          <span v-if="item.precio_venta">Q{{ Number(item.precio_venta).toFixed(2) }}</span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>
        <template #item.categoria="{ item }">
          <v-chip size="small" variant="tonal">{{ item.categoria?.nombre }}</v-chip>
        </template>
        <template #item.existencia_total="{ item }">
          <span class="font-weight-bold">{{ item.existencia_total }}</span>
        </template>
        <template #item.variantes="{ item }">
          {{ item.variantes?.length || 0 }}
        </template>
        <template #item.es_uniforme="{ item }">
          <v-icon v-if="item.es_uniforme" color="info">mdi-tshirt-crew</v-icon>
          <span v-else class="text-medium-emphasis">—</span>
        </template>
        <template #item.acciones="{ item }">
          <div class="d-flex justify-end ga-1">
            <v-tooltip location="top" text="Ver detalle">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  color="info"
                  icon="mdi-eye-outline"
                  size="small"
                  variant="tonal"
                  :to="{ name: 'bodega-producto-detalle', params: { id: item.id } }"
                />
              </template>
            </v-tooltip>
            <v-tooltip v-if="canManage" location="top" text="Editar">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  color="warning"
                  icon="mdi-pencil-outline"
                  size="small"
                  variant="tonal"
                  @click="abrirEditar(item)"
                />
              </template>
            </v-tooltip>
            <v-tooltip v-if="canManage" location="top" text="Eliminar">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  color="error"
                  icon="mdi-delete-outline"
                  size="small"
                  variant="tonal"
                  @click="confirmarEliminar(item)"
                />
              </template>
            </v-tooltip>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialogCrear" max-width="560" persistent>
      <v-card rounded="xl">
        <v-card-title class="pa-4">{{ editId ? 'Editar producto' : 'Nuevo producto' }}</v-card-title>
        <v-card-text>
          <v-select
            v-model="form.categoria_id"
            class="mb-2"
            item-title="nombre"
            item-value="id"
            :items="categorias"
            label="Categoría *"
            variant="outlined"
          />
          <v-text-field
            class="mb-2"
            disabled
            :hint="editId ? 'El código no se cambia al editar.' : 'Se genera al guardar (UNI-0001, ACC-0001…)'"
            label="Código"
            :model-value="editCodigo || 'Automático'"
            persistent-hint
            variant="outlined"
          />
          <v-text-field v-model="form.nombre" class="mb-2" label="Nombre *" variant="outlined" />
          <v-text-field
            v-model.number="form.precio_venta"
            class="mb-2"
            hint="Lo que se cobra si se entrega nuevo."
            label="Precio Q"
            min="0"
            persistent-hint
            step="0.01"
            type="number"
            variant="outlined"
          />
          <v-text-field
            v-if="!editId"
            v-model.number="form.existencia_inicial"
            class="mb-3"
            label="Existencia inicial"
            type="number"
            variant="outlined"
          />

          <div class="text-subtitle-2 font-weight-bold mb-2">Cómo se entrega</div>
          <v-checkbox
            v-model="form.es_uniforme"
            color="info"
            hide-details
            label="Es uniforme (se puede descontar en planilla)"
          />
          <v-checkbox
            v-model="form.usa_talla"
            class="mt-1"
            color="primary"
            hide-details
            label="Tiene tallas (S, M, L, 34, 41…)"
          />
          <p class="text-caption text-medium-emphasis ml-8 mb-1">
            Camisa, pantalón, botas. Después agregás cada talla en el producto. Cincho o gorgorito no lo necesitan.
          </p>
          <v-checkbox
            v-model="form.usa_condicion"
            color="primary"
            hide-details
            label="Se entrega nuevo o usado"
          />
          <p class="text-caption text-medium-emphasis ml-8 mb-2">
            Activá esto si el mismo artículo puede salir nuevo o de segunda. Así se cobra un precio u otro.
          </p>
          <v-text-field
            v-if="form.usa_condicion"
            v-model.number="form.precio_usado"
            class="mb-2"
            hint="Si lo dejás vacío y es uniforme, el usado se cobra al 50% del precio nuevo."
            label="Precio usado Q"
            min="0"
            persistent-hint
            step="0.01"
            type="number"
            variant="outlined"
          />
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="dialogCrear = false">Cancelar</v-btn>
          <v-btn color="primary" :loading="saving" variant="elevated" @click="guardarProducto">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogEliminar" max-width="460">
      <v-card rounded="xl">
        <v-card-title class="pa-4">Eliminar producto</v-card-title>
        <v-card-text>
          ¿Desactivar <strong>{{ productoEliminar?.nombre }}</strong>?
          Dejará de aparecer en el catálogo. El kardex y las boletas se conservan.
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="dialogEliminar = false">Cancelar</v-btn>
          <v-btn color="error" :loading="saving" variant="elevated" @click="eliminarProducto">Desactivar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3500">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
  import { computed, onMounted, reactive, ref, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import bodegaService from '@/services/bodegaService'
  import { useAuthStore } from '@/stores/auth'

  const route = useRoute()
  const authStore = useAuthStore()
  const canManage = computed(() => authStore.hasPermission('manage-bodega'))

  const loading = ref(false)
  const saving = ref(false)
  const productos = ref([])
  const categorias = ref([])
  const dialogCrear = ref(false)
  const dialogEliminar = ref(false)
  const editId = ref(null)
  const editCodigo = ref('')
  const productoEliminar = ref(null)
  const snackbar = reactive({ show: false, text: '', color: 'success' })
  const filtros = reactive({
    search: '',
    categoria_id: route.query.categoria_id ? Number(route.query.categoria_id) : null,
    stock_bajo: route.query.stock_bajo === '1',
  })
  const form = reactive({
    categoria_id: null,
    nombre: '',
    precio_venta: null,
    precio_usado: null,
    existencia_inicial: 0,
    es_uniforme: false,
    usa_talla: false,
    usa_condicion: false,
  })

  const headers = [
    { title: 'Código', key: 'codigo' },
    { title: 'Producto', key: 'nombre' },
    { title: 'Categoría', key: 'categoria' },
    { title: 'Precio', key: 'precio_venta' },
    { title: 'Existencia', key: 'existencia_total' },
    { title: 'Variantes', key: 'variantes' },
    { title: 'Uniforme', key: 'es_uniforme' },
    { title: '', key: 'acciones', sortable: false, width: '148px', align: 'end' },
  ]

  async function cargar () {
    loading.value = true
    try {
      const params = {}
      if (filtros.search) params.search = filtros.search
      if (filtros.categoria_id) params.categoria_id = filtros.categoria_id
      if (filtros.stock_bajo) params.stock_bajo = 1
      const res = await bodegaService.getProductos(params)
      productos.value = res.data?.data || res.data || []
    } finally {
      loading.value = false
    }
  }

  function abrirCrear () {
    editId.value = null
    editCodigo.value = ''
    form.categoria_id = filtros.categoria_id
    form.nombre = ''
    form.precio_venta = null
    form.precio_usado = null
    form.existencia_inicial = 0
    form.es_uniforme = false
    form.usa_talla = false
    form.usa_condicion = false
    dialogCrear.value = true
  }

  function abrirEditar (item) {
    editId.value = item.id
    editCodigo.value = item.codigo || ''
    form.categoria_id = item.categoria_id
    form.nombre = item.nombre
    form.precio_venta = item.precio_venta != null ? Number(item.precio_venta) : null
    form.precio_usado = item.precio_usado != null ? Number(item.precio_usado) : null
    form.es_uniforme = !!item.es_uniforme
    form.usa_talla = !!item.usa_talla
    form.usa_condicion = !!item.usa_condicion
    dialogCrear.value = true
  }

  function confirmarEliminar (item) {
    productoEliminar.value = item
    dialogEliminar.value = true
  }

  async function guardarProducto () {
    if (!form.categoria_id || !form.nombre) return
    saving.value = true
    try {
      const payload = {
        categoria_id: form.categoria_id,
        nombre: form.nombre,
        precio_venta: form.precio_venta || null,
        precio_usado: form.usa_condicion ? (form.precio_usado || null) : null,
        es_uniforme: form.es_uniforme,
        usa_talla: form.usa_talla,
        usa_condicion: form.usa_condicion,
      }
      if (editId.value) {
        await bodegaService.updateProducto(editId.value, payload)
        snackbar.text = 'Producto actualizado.'
      } else {
        await bodegaService.createProducto({
          ...payload,
          variantes: [{
            existencia_inicial: form.existencia_inicial || 0,
            stock_minimo: 1,
          }],
        })
        snackbar.text = 'Producto creado.'
      }
      snackbar.color = 'success'
      snackbar.show = true
      dialogCrear.value = false
      await cargar()
    } catch (e) {
      snackbar.color = 'error'
      snackbar.text = e.apiMessage || e.response?.data?.message || 'No se pudo guardar el producto'
      snackbar.show = true
    } finally {
      saving.value = false
    }
  }

  async function eliminarProducto () {
    if (!productoEliminar.value) return
    saving.value = true
    try {
      await bodegaService.deleteProducto(productoEliminar.value.id)
      dialogEliminar.value = false
      snackbar.color = 'success'
      snackbar.text = 'Producto desactivado.'
      snackbar.show = true
      await cargar()
    } catch (e) {
      snackbar.color = 'error'
      snackbar.text = e.apiMessage || e.response?.data?.message || 'No se pudo eliminar el producto'
      snackbar.show = true
    } finally {
      saving.value = false
    }
  }

  watch(() => route.query.categoria_id, val => {
    filtros.categoria_id = val ? Number(val) : null
    cargar()
  })

  onMounted(async () => {
    const cats = await bodegaService.getCategorias()
    categorias.value = cats.data || []
    await cargar()
  })
</script>
