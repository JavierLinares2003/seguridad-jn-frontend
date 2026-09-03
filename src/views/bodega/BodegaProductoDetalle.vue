<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center flex-wrap ga-3 mb-4">
      <v-btn icon="mdi-arrow-left" variant="text" :to="{ name: 'bodega-productos' }" />
      <div>
        <h1 class="text-h5 font-weight-bold mb-0">{{ producto?.nombre || 'Producto' }}</h1>
        <p class="text-caption text-medium-emphasis mb-0">
          <span v-if="producto?.codigo" class="font-weight-medium">{{ producto.codigo }} · </span>
          {{ producto?.categoria?.nombre }} · Existencia total: {{ producto?.existencia_total ?? 0 }}
        </p>
      </div>
      <v-spacer />
      <v-btn
        v-if="canManage"
        color="warning"
        variant="tonal"
        @click="abrirEditar"
      >
        <v-icon start>mdi-pencil-outline</v-icon>
        Editar
      </v-btn>
      <v-btn
        v-if="canManage"
        class="ml-2"
        color="error"
        variant="tonal"
        @click="dialogEliminar = true"
      >
        <v-icon start>mdi-delete-outline</v-icon>
        Eliminar
      </v-btn>
      <v-btn
        v-if="canManage"
        class="ml-2"
        color="teal"
        variant="tonal"
        :to="{ name: 'bodega-compras' }"
      >
        <v-icon start>mdi-file-document-plus-outline</v-icon>
        Registrar compra
      </v-btn>
      <v-chip v-if="producto?.codigo" class="mr-2" color="secondary" variant="tonal">{{ producto.codigo }}</v-chip>
      <v-chip v-if="producto?.precio_venta" class="mr-2" color="success" variant="tonal">
        Precio Q{{ Number(producto.precio_venta).toFixed(2) }}
      </v-chip>
      <v-chip v-if="producto?.es_uniforme" color="info" variant="flat">Uniforme</v-chip>
    </div>

    <v-row>
      <v-col cols="12" md="7">
        <v-card elevation="2" rounded="xl">
          <v-card-title class="px-6 pt-5">Variantes / tallas</v-card-title>
          <v-data-table
            density="comfortable"
            :headers="headersVar"
            :items="producto?.variantes || []"
            :items-per-page="50"
          >
            <template #item.etiqueta="{ item }">{{ item.etiqueta }}</template>
            <template #item.sku="{ item }">{{ item.sku || '—' }}</template>
            <template #item.precio_sugerido="{ item }">
              <span v-if="item.precio_sugerido">Q{{ Number(item.precio_sugerido).toFixed(2) }}</span>
              <span v-else class="text-medium-emphasis">—</span>
            </template>
            <template #item.existencia="{ item }">
              <span :class="item.stock_bajo ? 'text-warning font-weight-bold' : 'font-weight-bold'">
                {{ item.existencia }}
              </span>
            </template>
            <template #item.acciones="{ item }">
              <v-btn
                v-if="canManage"
                color="error"
                size="small"
                variant="tonal"
                @click="abrirSalida(item)"
              >
                Salida
              </v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
      <v-col cols="12" md="5">
        <v-card elevation="2" rounded="xl">
          <v-card-title class="px-6 pt-5">Últimos movimientos</v-card-title>
          <v-list density="compact">
            <v-list-item v-for="mov in movimientos" :key="mov.id">
              <v-list-item-title class="text-body-2">
                {{ tipoLabel(mov.tipo) }} · {{ mov.cantidad }}
                <span v-if="mov.personal"> → {{ mov.personal.nombres }} {{ mov.personal.apellidos }}</span>
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ formatDate(mov.fecha_movimiento) }} · stock {{ mov.existencia_anterior }} → {{ mov.existencia_nueva }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="dialogMov" max-width="460" persistent>
      <v-card rounded="xl">
        <v-card-title class="pa-4">Salida de inventario</v-card-title>
        <v-card-text>
          <v-alert class="mb-4" density="compact" type="info" variant="tonal">
            Si sale para un agente o admin, usa
            <router-link class="font-weight-medium" :to="{ name: 'bodega-entregas' }">Entregas</router-link>
            (queda boleta). Aquí es merma, daño, baja o una salida suelta.
          </v-alert>
          <div class="mb-3 text-body-2">{{ varianteSel?.etiqueta }} · stock {{ varianteSel?.existencia }}</div>
          <v-select
            v-model="movForm.motivo"
            class="mb-2"
            :items="motivosSalida"
            label="Motivo *"
            variant="outlined"
          />
          <v-text-field
            v-model.number="movForm.cantidad"
            :error="!!stockError"
            :error-messages="stockError"
            label="Cantidad *"
            min="1"
            type="number"
            variant="outlined"
          />
          <v-textarea v-model="movForm.observaciones" label="Observaciones" rows="2" variant="outlined" />
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="dialogMov = false">Cancelar</v-btn>
          <v-btn
            color="primary"
            :disabled="!!stockError || !movForm.cantidad || !movForm.motivo"
            :loading="saving"
            variant="elevated"
            @click="guardarMovimiento"
          >
            Dar salida
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogEditar" max-width="560" persistent>
      <v-card rounded="xl">
        <v-card-title class="pa-4">Editar producto</v-card-title>
        <v-card-text>
          <v-text-field v-model="editForm.nombre" class="mb-2" label="Nombre *" variant="outlined" />
          <div class="d-flex flex-wrap ga-2 mb-2">
            <v-checkbox
              v-model="editForm.entrega_nuevo"
              color="primary"
              hide-details
              label="Nuevo"
            />
            <v-checkbox
              v-model="editForm.entrega_usado"
              color="primary"
              hide-details
              label="Usado"
            />
          </div>
          <v-text-field
            v-model.number="editForm.precio_venta"
            class="mb-2"
            label="Precio Q"
            min="0"
            step="0.01"
            type="number"
            variant="outlined"
          />
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="dialogEditar = false">Cancelar</v-btn>
          <v-btn color="primary" :loading="saving" variant="elevated" @click="guardarEdicion">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogEliminar" max-width="460">
      <v-card rounded="xl">
        <v-card-title class="pa-4">Eliminar producto</v-card-title>
        <v-card-text>
          ¿Desactivar <strong>{{ producto?.nombre }}</strong>? Dejará de aparecer en el catálogo.
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="dialogEliminar = false">Cancelar</v-btn>
          <v-btn color="error" :loading="saving" variant="elevated" @click="eliminarProducto">Desactivar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
  import { computed, onMounted, reactive, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { format } from 'date-fns'
  import { es } from 'date-fns/locale'
  import bodegaService from '@/services/bodegaService'
  import { useAuthStore } from '@/stores/auth'

  const route = useRoute()
  const router = useRouter()
  const authStore = useAuthStore()
  const canManage = computed(() => authStore.hasPermission('manage-bodega'))

  const producto = ref(null)
  const movimientos = ref([])
  const dialogMov = ref(false)
  const dialogEditar = ref(false)
  const dialogEliminar = ref(false)
  const saving = ref(false)
  const varianteSel = ref(null)
  const movForm = reactive({ tipo: 'egreso', cantidad: 1, observaciones: '', motivo: null })
  const editForm = reactive({
    nombre: '',
    precio_venta: null,
    entrega_nuevo: true,
    entrega_usado: false,
    es_uniforme: false,
    usa_talla: false,
  })

  const motivosSalida = [
    { title: 'Merma / daño', value: 'merma' },
    { title: 'Baja / descarte', value: 'baja' },
    { title: 'Devolución a proveedor', value: 'devolucion_proveedor' },
    { title: 'Uso interno', value: 'uso_interno' },
    { title: 'Otro', value: 'otro' },
  ]

  const headersVar = [
    { title: 'Variante', key: 'etiqueta' },
    { title: 'SKU', key: 'sku' },
    { title: 'Precio sug.', key: 'precio_sugerido' },
    { title: 'Existencia', key: 'existencia' },
    { title: 'Mínimo', key: 'stock_minimo' },
    { title: '', key: 'acciones', sortable: false },
  ]

  const stockError = computed(() => {
    const stock = Number(varianteSel.value?.existencia ?? 0)
    const cant = Number(movForm.cantidad || 0)
    if (!cant) return ''
    if (stock <= 0) return `Sin stock disponible (existencia: ${stock}). Primero registra una factura de compra.`
    if (cant > stock) return `Stock insuficiente. Disponible: ${stock}, solicitado: ${cant}.`
    return ''
  })

  function tipoLabel (tipo) {
    return ({ ingreso: 'Ingreso', egreso: 'Egreso', ajuste: 'Ajuste', ajuste_inicial: 'Inicial' })[tipo] || tipo
  }

  function formatDate (date) {
    if (!date) return '—'
    const d = String(date).includes('T') ? new Date(date) : new Date(date + 'T12:00:00')
    if (Number.isNaN(d.getTime())) return date
    return format(d, 'dd/MM/yyyy', { locale: es })
  }

  async function cargar () {
    const res = await bodegaService.getProducto(route.params.id)
    producto.value = res.data?.producto || res.data
    movimientos.value = res.data?.movimientos || []
  }

  function abrirSalida (variante) {
    varianteSel.value = variante
    movForm.tipo = 'egreso'
    movForm.cantidad = 1
    movForm.observaciones = ''
    movForm.motivo = null
    dialogMov.value = true
  }

  async function guardarMovimiento () {
    if (stockError.value) {
      alert(stockError.value)
      return
    }
    saving.value = true
    try {
      const motivoLabel = motivosSalida.find(m => m.value === movForm.motivo)?.title || movForm.motivo
      await bodegaService.createMovimiento({
        variante_id: varianteSel.value.id,
        tipo: 'egreso',
        cantidad: movForm.cantidad,
        referencia: movForm.motivo ? `SALIDA-${movForm.motivo}` : undefined,
        observaciones: [motivoLabel, movForm.observaciones].filter(Boolean).join('. ') || undefined,
      })
      dialogMov.value = false
      await cargar()
    } catch (e) {
      alert(e.apiMessage || 'No se pudo registrar la salida')
    } finally {
      saving.value = false
    }
  }

  function abrirEditar () {
    const p = producto.value
    if (!p) return
    const condiciones = (p.variantes || []).map(v => v.condicion)
    editForm.nombre = p.nombre
    editForm.precio_venta = p.precio_venta != null ? Number(p.precio_venta) : null
    editForm.entrega_nuevo = condiciones.includes('nuevo') || !p.usa_condicion
    editForm.entrega_usado = condiciones.includes('usado') || !!p.usa_condicion
    if (!editForm.entrega_nuevo && !editForm.entrega_usado) {
      editForm.entrega_nuevo = true
    }
    editForm.es_uniforme = !!p.es_uniforme
    editForm.usa_talla = !!p.usa_talla
    dialogEditar.value = true
  }

  async function guardarEdicion () {
    if (!editForm.nombre) return
    if (!editForm.entrega_nuevo && !editForm.entrega_usado) {
      alert('Marca si el producto es nuevo, usado o ambos.')
      return
    }
    saving.value = true
    try {
      await bodegaService.updateProducto(producto.value.id, {
        nombre: editForm.nombre,
        precio_venta: editForm.precio_venta || null,
        precio_usado: null,
        es_uniforme: editForm.es_uniforme,
        usa_talla: editForm.usa_talla,
        usa_condicion: !!editForm.entrega_usado,
      })
      dialogEditar.value = false
      await cargar()
    } catch (e) {
      alert(e.apiMessage || 'No se pudo guardar')
    } finally {
      saving.value = false
    }
  }

  async function eliminarProducto () {
    saving.value = true
    try {
      await bodegaService.deleteProducto(producto.value.id)
      await router.push({ name: 'bodega-productos' })
    } catch (e) {
      alert(e.apiMessage || 'No se pudo eliminar')
    } finally {
      saving.value = false
    }
  }

  onMounted(cargar)
</script>
