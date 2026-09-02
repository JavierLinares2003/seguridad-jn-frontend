<template>
  <v-container fluid class="pa-6 bodega-dash">
    <div class="d-flex align-center flex-wrap ga-3 mb-5">
      <div>
        <h1 class="text-h5 font-weight-bold mb-1">Bodega / Inventario</h1>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Stock central, kardex y entregas al personal
        </p>
      </div>
      <v-spacer />
      <v-btn color="primary" variant="tonal" :to="{ name: 'bodega-productos' }">
        <v-icon start>mdi-package-variant</v-icon>
        Productos
      </v-btn>
      <v-btn color="info" variant="tonal" :to="{ name: 'bodega-movimientos' }">
        <v-icon start>mdi-swap-horizontal</v-icon>
        Movimientos
      </v-btn>
      <v-btn color="secondary" variant="tonal" :to="{ name: 'bodega-combos' }">
        <v-icon start>mdi-package-variant-closed</v-icon>
        Combos
      </v-btn>
      <v-btn color="warning" variant="tonal" :to="{ name: 'bodega-proveedores' }">
        <v-icon start>mdi-truck-outline</v-icon>
        Proveedores
      </v-btn>
      <v-btn color="teal" variant="tonal" :to="{ name: 'bodega-compras' }">
        <v-icon start>mdi-file-document-plus-outline</v-icon>
        Compras
      </v-btn>
      <v-btn color="success" variant="elevated" :to="{ name: 'bodega-entregas' }">
        <v-icon start>mdi-account-arrow-right</v-icon>
        Entregar
      </v-btn>
    </div>

    <v-row class="mb-4" dense>
      <v-col v-for="card in resumenCards" :key="card.title" cols="6" sm="4" md>
        <v-card class="pa-3" elevation="2" rounded="lg">
          <div class="text-caption text-medium-emphasis">{{ card.title }}</div>
          <div class="text-h6 font-weight-bold" :class="card.color">{{ card.value }}</div>
        </v-card>
      </v-col>
    </v-row>

    <v-row dense>
      <v-col cols="12" lg="8">
        <v-card elevation="2" rounded="xl">
          <v-card-title class="px-4 py-3 text-subtitle-1 font-weight-bold d-flex align-center">
            Categorías
            <v-spacer />
            <v-btn
              v-if="canManage"
              color="primary"
              size="small"
              variant="tonal"
              @click="abrirCategoria"
            >
              <v-icon start>mdi-plus</v-icon>
              Nueva categoría
            </v-btn>
          </v-card-title>
          <v-card-text class="px-3 pb-3 pt-0">
            <div class="cat-grid">
              <div
                v-for="cat in dashboard?.categorias || []"
                :key="cat.id"
                class="cat-tile"
              >
                <router-link
                  class="cat-tile__link"
                  :to="{ name: 'bodega-productos', query: { categoria_id: cat.id } }"
                >
                  <v-avatar color="primary" size="28" variant="tonal">
                    <v-icon size="16">{{ cat.icono || 'mdi-warehouse' }}</v-icon>
                  </v-avatar>
                  <div class="cat-tile__text">
                    <div class="text-body-2 font-weight-medium text-truncate">{{ cat.nombre }}</div>
                    <div class="text-caption text-medium-emphasis">
                      {{ cat.productos_count }} · {{ cat.existencia_total }} uds
                      <span v-if="cat.stock_bajo_count > 0" class="text-warning"> · {{ cat.stock_bajo_count }} bajo</span>
                    </div>
                  </div>
                </router-link>
                <div v-if="canManage" class="cat-tile__actions">
                  <v-btn
                    color="warning"
                    icon="mdi-pencil-outline"
                    size="x-small"
                    variant="text"
                    @click.stop="abrirEditarCategoria(cat)"
                  />
                  <v-btn
                    color="error"
                    icon="mdi-delete-outline"
                    size="x-small"
                    variant="text"
                    @click.stop="pedirEliminarCategoria(cat)"
                  />
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" lg="4">
        <v-card elevation="2" rounded="xl">
          <v-tabs v-model="panelActividad" class="px-2" color="primary" density="compact">
            <v-tab value="movimientos">Movimientos</v-tab>
            <v-tab value="stock">Stock bajo</v-tab>
            <v-tab value="entregas">Entregas</v-tab>
          </v-tabs>
          <v-window v-model="panelActividad">
            <v-window-item value="movimientos">
              <v-list class="actividad-lista" density="compact">
                <v-list-item v-for="mov in movimientos" :key="mov.id" class="px-3">
                  <v-list-item-title class="text-body-2 text-truncate">
                    {{ mov.variante?.producto?.nombre || 'Producto' }}
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    {{ tipoLabel(mov.tipo) }} · {{ mov.cantidad }} · {{ formatDate(mov.fecha_movimiento) }}
                  </v-list-item-subtitle>
                  <template #append>
                    <v-chip :color="tipoColor(mov.tipo)" size="x-small" variant="flat">
                      {{ mov.existencia_nueva }}
                    </v-chip>
                  </template>
                </v-list-item>
                <v-list-item v-if="!movimientos.length">
                  <v-list-item-title class="text-medium-emphasis">Sin movimientos aún</v-list-item-title>
                </v-list-item>
              </v-list>
              <div class="px-3 pb-3">
                <v-btn size="small" variant="text" :to="{ name: 'bodega-movimientos' }">Ver todos</v-btn>
              </div>
            </v-window-item>
            <v-window-item value="stock">
              <v-list class="actividad-lista" density="compact">
                <v-list-item
                  v-for="item in stockBajo"
                  :key="item.id"
                  class="px-3"
                  :to="{ name: 'bodega-producto-detalle', params: { id: item.producto_id } }"
                >
                  <v-list-item-title class="text-body-2 text-truncate">
                    {{ item.producto?.nombre || 'Producto' }}
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    {{ item.etiqueta }} · mín. {{ item.stock_minimo }}
                  </v-list-item-subtitle>
                  <template #append>
                    <v-chip color="warning" size="x-small" variant="flat">{{ item.existencia }}</v-chip>
                  </template>
                </v-list-item>
                <v-list-item v-if="!stockBajo.length">
                  <v-list-item-title class="text-medium-emphasis">Sin alertas de stock</v-list-item-title>
                </v-list-item>
              </v-list>
              <div class="px-3 pb-3">
                <v-btn size="small" variant="text" :to="{ name: 'bodega-productos', query: { stock_bajo: '1' } }">
                  Ver todos
                </v-btn>
              </div>
            </v-window-item>
            <v-window-item value="entregas">
              <v-list class="actividad-lista" density="compact">
                <v-list-item v-for="ent in entregas" :key="ent.id" class="px-3">
                  <v-list-item-title class="text-body-2 text-truncate">
                    {{ ent.personal?.nombres }} {{ ent.personal?.apellidos }}
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    {{ ent.variante?.producto?.nombre }} · {{ ent.cantidad }}
                  </v-list-item-subtitle>
                </v-list-item>
                <v-list-item v-if="!entregas.length">
                  <v-list-item-title class="text-medium-emphasis">Sin entregas aún</v-list-item-title>
                </v-list-item>
              </v-list>
              <div class="px-3 pb-3">
                <v-btn size="small" variant="text" :to="{ name: 'bodega-entregas' }">Ver todas</v-btn>
              </div>
            </v-window-item>
          </v-window>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="dialogCategoria" max-width="480" persistent>
      <v-card rounded="xl">
        <v-card-title class="pa-4">{{ catEditId ? 'Editar categoría' : 'Nueva categoría' }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="catForm.nombre" class="mb-2" label="Nombre de la categoría *" variant="outlined" />
          <v-text-field
            v-model="catForm.prefijo_correlativo"
            class="mb-4"
            hint="Prefijo de códigos nuevos (UNI, LIB…). Los productos existentes no cambian."
            label="Prefijo"
            maxlength="5"
            persistent-hint
            variant="outlined"
          />
          <div class="text-caption text-medium-emphasis mb-2">Elija un ícono</div>
          <div class="icon-picker">
            <button
              v-for="opcion in iconosCategoria"
              :key="opcion.value"
              class="icon-picker__btn"
              :class="{ 'icon-picker__btn--on': catForm.icono === opcion.value }"
              type="button"
              :title="opcion.label"
              @click="catForm.icono = opcion.value"
            >
              <v-icon :icon="opcion.value" size="22" />
              <span>{{ opcion.label }}</span>
            </button>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="dialogCategoria = false">Cancelar</v-btn>
          <v-btn
            color="primary"
            :disabled="!catForm.nombre"
            :loading="savingCategoria"
            variant="elevated"
            @click="guardarCategoria"
          >
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogEliminar" max-width="420" persistent>
      <v-card rounded="xl">
        <v-card-title class="pa-4">Eliminar categoría</v-card-title>
        <v-card-text>
          ¿Eliminar <strong>{{ categoriaAEliminar?.nombre }}</strong>?
          Esta acción no se puede deshacer.
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn :disabled="eliminandoCategoria" variant="text" @click="dialogEliminar = false">Cancelar</v-btn>
          <v-btn color="error" :loading="eliminandoCategoria" variant="elevated" @click="eliminarCategoria">
            Eliminar
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
  import { format } from 'date-fns'
  import { es } from 'date-fns/locale'
  import bodegaService from '@/services/bodegaService'
  import { useAuthStore } from '@/stores/auth'

  const authStore = useAuthStore()
  const canManage = computed(() => authStore.hasPermission('manage-bodega'))

  const dashboard = ref(null)
  const stockBajo = ref([])
  const loading = ref(false)
  const panelActividad = ref('movimientos')
  const dialogCategoria = ref(false)
  const catEditId = ref(null)
  const savingCategoria = ref(false)
  const dialogEliminar = ref(false)
  const eliminandoCategoria = ref(false)
  const categoriaAEliminar = ref(null)
  const snackbar = reactive({ show: false, text: '', color: 'success' })
  const catForm = reactive({
    nombre: '',
    icono: 'mdi-warehouse',
    prefijo_correlativo: '',
  })

  const iconosCategoria = [
    { value: 'mdi-warehouse', label: 'Bodega' },
    { value: 'mdi-tshirt-crew', label: 'Uniforme' },
    { value: 'mdi-tie', label: 'Admin' },
    { value: 'mdi-shield-account', label: 'Seguridad' },
    { value: 'mdi-pistol', label: 'Armas' },
    { value: 'mdi-radio-handheld', label: 'Radio' },
    { value: 'mdi-flashlight', label: 'Linterna' },
    { value: 'mdi-shoe-formal', label: 'Calzado' },
    { value: 'mdi-weather-pouring', label: 'Lluvia' },
    { value: 'mdi-broom', label: 'Limpieza' },
    { value: 'mdi-wrench', label: 'Taller' },
    { value: 'mdi-bookshelf', label: 'Oficina' },
    { value: 'mdi-medical-bag', label: 'Botiquín' },
    { value: 'mdi-car', label: 'Vehículo' },
    { value: 'mdi-key-variant', label: 'Llaves' },
    { value: 'mdi-package-variant', label: 'General' },
  ]

  const resumenCards = computed(() => {
    const t = dashboard.value?.totales || {}
    return [
      { title: 'Productos', value: t.productos ?? '—', color: 'text-primary' },
      { title: 'Existencia total', value: t.existencia ?? '—', color: 'text-success' },
      { title: 'Stock bajo', value: t.stock_bajo ?? '—', color: 'text-warning' },
      { title: 'Movimientos hoy', value: t.movimientos_hoy ?? '—', color: 'text-info' },
    ]
  })

  const movimientos = computed(() => (dashboard.value?.ultimos_movimientos || []).slice(0, 5))
  const entregas = computed(() => (dashboard.value?.entregas_recientes || []).slice(0, 5))

  function tipoLabel (tipo) {
    return ({ ingreso: 'Ingreso', egreso: 'Egreso', ajuste: 'Ajuste', ajuste_inicial: 'Inicial' })[tipo] || tipo
  }
  function tipoColor (tipo) {
    return ({ ingreso: 'success', egreso: 'error', ajuste: 'warning', ajuste_inicial: 'info' })[tipo] || 'grey'
  }
  function formatDate (date) {
    if (!date) return '-'
    const d = date.includes?.('T') ? new Date(date) : new Date(date + 'T12:00:00')
    return format(d, 'dd/MM/yyyy', { locale: es })
  }

  function prefijoDesdeNombre (nombre) {
    const limpio = String(nombre || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z]/g, '')
    return (limpio.slice(0, 3) || 'CAT').toUpperCase()
  }

  function abrirCategoria () {
    catEditId.value = null
    catForm.nombre = ''
    catForm.icono = 'mdi-warehouse'
    catForm.prefijo_correlativo = ''
    dialogCategoria.value = true
  }

  function abrirEditarCategoria (cat) {
    catEditId.value = cat.id
    catForm.nombre = cat.nombre || ''
    catForm.icono = cat.icono || 'mdi-warehouse'
    catForm.prefijo_correlativo = cat.prefijo_correlativo || ''
    dialogCategoria.value = true
  }

  async function guardarCategoria () {
    if (!catForm.nombre) return
    savingCategoria.value = true
    try {
      const payload = {
        nombre: catForm.nombre,
        prefijo_correlativo: (catForm.prefijo_correlativo || prefijoDesdeNombre(catForm.nombre)).toUpperCase(),
        icono: catForm.icono || 'mdi-warehouse',
      }
      if (catEditId.value) {
        await bodegaService.updateCategoria(catEditId.value, payload)
        snackbar.text = 'Categoría actualizada'
      } else {
        await bodegaService.createCategoria(payload)
        snackbar.text = 'Categoría creada'
      }
      dialogCategoria.value = false
      snackbar.color = 'success'
      snackbar.show = true
      const dash = await bodegaService.getDashboard()
      dashboard.value = dash.data
    } catch (error) {
      snackbar.color = 'error'
      snackbar.text = error.apiMessage || error.response?.data?.message || 'No se pudo guardar la categoría'
      snackbar.show = true
    } finally {
      savingCategoria.value = false
    }
  }

  function pedirEliminarCategoria (cat) {
    categoriaAEliminar.value = cat
    dialogEliminar.value = true
  }

  async function eliminarCategoria () {
    if (!categoriaAEliminar.value) return
    eliminandoCategoria.value = true
    try {
      await bodegaService.deleteCategoria(categoriaAEliminar.value.id)
      dialogEliminar.value = false
      snackbar.color = 'success'
      snackbar.text = 'Categoría eliminada'
      snackbar.show = true
      const dash = await bodegaService.getDashboard()
      dashboard.value = dash.data
    } catch (error) {
      snackbar.color = 'error'
      snackbar.text = error.apiMessage || error.response?.data?.message || 'No se pudo eliminar la categoría'
      snackbar.show = true
    } finally {
      eliminandoCategoria.value = false
    }
  }

  onMounted(async () => {
    loading.value = true
    try {
      const [dash, bajo] = await Promise.all([
        bodegaService.getDashboard(),
        bodegaService.getStockBajo(),
      ])
      dashboard.value = dash.data
      stockBajo.value = (bajo.data || []).slice(0, 5)
    } finally {
      loading.value = false
    }
  })
</script>

<style scoped>
.cat-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
@media (min-width: 960px) {
  .cat-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
.cat-tile {
  display: flex;
  align-items: center;
  min-width: 0;
  padding: 6px 6px 6px 10px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 10px;
}
.cat-tile:hover {
  background: rgba(var(--v-theme-primary), 0.06);
}
.cat-tile__link {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
  color: inherit;
  text-decoration: none;
}
.cat-tile__text {
  min-width: 0;
}
.cat-tile__actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
}
.actividad-lista {
  max-height: 280px;
  overflow-y: auto;
}
.actividad-lista :deep(.v-list-item) {
  min-height: 44px;
}
.icon-picker {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.icon-picker__btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 4px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 10px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 11px;
  line-height: 1.2;
}
.icon-picker__btn--on {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.12);
}
</style>
