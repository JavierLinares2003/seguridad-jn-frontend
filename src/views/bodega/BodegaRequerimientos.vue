<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center flex-wrap ga-3 mb-4">
      <v-btn icon="mdi-arrow-left" variant="text" :to="{ name: 'bodega' }" />
      <div>
        <h1 class="text-h5 font-weight-bold mb-0">Requerimientos del proyecto</h1>
        <p class="text-caption text-medium-emphasis mb-0">
          Marca el equipo que pide el puesto y la cantidad. Queda guardado en ese proyecto.
        </p>
      </div>
    </div>

    <v-card elevation="2" rounded="xl">
      <v-card-text class="pa-6">
        <v-autocomplete
          v-model="proyectoId"
          class="mb-4"
          clearable
          density="comfortable"
          item-title="etiqueta"
          item-value="id"
          :items="proyectos"
          label="Proyecto *"
          :loading="loading"
          no-data-text="No hay proyectos activos"
          variant="outlined"
          @update:model-value="cargarItems"
        />

        <v-row v-if="proyectoId">
          <v-col cols="12" md="6">
            <div v-for="item in izquierda" :key="item.clave" class="d-flex align-center ga-3 mb-2">
              <v-checkbox
                v-model="item.requerido"
                class="flex-grow-1"
                density="compact"
                hide-details
                :label="item.nombre"
                @update:model-value="(valor) => alMarcar(item, valor)"
              />
              <v-text-field
                v-model.number="item.cantidad"
                density="compact"
                hide-details
                label="Cant."
                max="999"
                min="0"
                style="max-width: 90px"
                type="number"
                variant="outlined"
                @update:model-value="(valor) => alCantidad(item, valor)"
              />
            </div>
          </v-col>
          <v-col cols="12" md="6">
            <div v-for="item in derecha" :key="item.clave" class="d-flex align-center ga-3 mb-2">
              <v-checkbox
                v-model="item.requerido"
                class="flex-grow-1"
                density="compact"
                hide-details
                :label="item.nombre"
                @update:model-value="(valor) => alMarcar(item, valor)"
              />
              <v-text-field
                v-model.number="item.cantidad"
                density="compact"
                hide-details
                label="Cant."
                max="999"
                min="0"
                style="max-width: 90px"
                type="number"
                variant="outlined"
                @update:model-value="(valor) => alCantidad(item, valor)"
              />
            </div>
          </v-col>
        </v-row>
        <v-alert v-else density="compact" type="info" variant="tonal">
          Elige el proyecto para asignarle estufa, radios, armas y el resto del requerimiento.
        </v-alert>
        <v-alert v-if="ultimaDevolucion" class="mt-4" density="compact" type="success" variant="tonal">
          Última devolución {{ ultimaDevolucion.fecha }} · {{ ultimaDevolucion.nombres }}
        </v-alert>
      </v-card-text>
      <v-card-actions v-if="proyectoId" class="pa-4">
        <v-spacer />
        <v-btn
          color="primary"
          :disabled="!canManage"
          :loading="saving"
          variant="elevated"
          @click="guardar"
        >
          Guardar requerimientos
        </v-btn>
        <v-btn
          class="ml-2"
          color="secondary"
          :disabled="!canManage"
          variant="tonal"
          @click="abrirDevolucion"
        >
          Devolución / entrada
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-dialog v-model="dialogDevolucion" max-width="720" persistent>
      <v-card rounded="xl">
        <v-card-title class="pa-4 text-h6">Devolución / entrada al cancelar el proyecto</v-card-title>
        <v-card-text>
          <p class="text-body-2 text-medium-emphasis mb-3">
            Marca junto a cada requerimiento si lo devuelven o no. Abajo escribe los agentes o extreros que entregan.
          </p>
          <v-text-field v-model="devolucion.fecha" class="mb-2" label="Fecha" type="date" variant="outlined" />
          <v-textarea
            v-model="devolucion.nombres"
            class="mb-4"
            label="Nombres de agentes o extreros *"
            rows="2"
            variant="outlined"
          />
          <div v-for="item in devolucion.items" :key="item.clave" class="d-flex align-center justify-space-between mb-1">
            <span>{{ item.nombre }} <span class="text-caption text-medium-emphasis">· pedido {{ item.cantidad }}</span></span>
            <v-switch
              v-model="item.devuelto"
              color="primary"
              density="compact"
              hide-details
              :label="item.devuelto ? 'Sí se devuelve' : 'No se devuelve'"
            />
          </div>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="dialogDevolucion = false">Cancelar</v-btn>
          <v-btn color="primary" :loading="guardandoDevolucion" variant="elevated" @click="guardarDevolucion">
            Registrar devolución
          </v-btn>
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
  import bodegaService from '@/services/bodegaService'
  import { useAuthStore } from '@/stores/auth'

  const authStore = useAuthStore()
  const canManage = computed(() => authStore.hasPermission('manage-bodega'))

  const loading = ref(false)
  const saving = ref(false)
  const proyectoId = ref(null)
  const proyectos = ref([])
  const items = ref([])
  const devoluciones = ref([])
  const dialogDevolucion = ref(false)
  const guardandoDevolucion = ref(false)
  const devolucion = reactive({ fecha: hoy(), nombres: '', items: [] })
  const snackbar = reactive({ show: false, text: '', color: 'success' })

  const izquierda = computed(() => items.value.filter(item => item.columna === 'izq'))
  const derecha = computed(() => items.value.filter(item => item.columna === 'der'))
  const ultimaDevolucion = computed(() => {
    const ultima = devoluciones.value[0]
    if (!ultima) return null
    const fecha = String(ultima.fecha || '').slice(0, 10)
    return { fecha, nombres: ultima.nombres }
  })

  function hoy () {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  function alMarcar (item, valor) {
    item.requerido = !!valor
    if (item.requerido && Number(item.cantidad) < 1) item.cantidad = 1
    if (!item.requerido) item.cantidad = 0
  }

  function alCantidad (item, valor) {
    const cantidad = Number(valor) || 0
    item.cantidad = cantidad
    item.requerido = cantidad > 0
  }

  async function cargarItems () {
    if (!proyectoId.value) {
      items.value = []
      devoluciones.value = []
      return
    }
    loading.value = true
    try {
      const res = await bodegaService.getRequerimientosProyecto(proyectoId.value)
      items.value = res.data?.items || []
      devoluciones.value = res.data?.devoluciones || []
    } catch (error) {
      snackbar.color = 'error'
      snackbar.text = error.apiMessage || 'No se pudieron cargar los requerimientos'
      snackbar.show = true
    } finally {
      loading.value = false
    }
  }

  async function guardar () {
    if (!canManage.value || !proyectoId.value) return
    saving.value = true
    try {
      const res = await bodegaService.guardarRequerimientosProyecto({
        proyecto_id: proyectoId.value,
        items: items.value.map(item => ({
          clave: item.clave,
          cantidad: Number(item.cantidad) || 0,
          requerido: !!item.requerido,
        })),
      })
      items.value = res.data?.items || items.value
      devoluciones.value = res.data?.devoluciones || devoluciones.value
      snackbar.color = 'success'
      snackbar.text = 'Requerimientos guardados en el proyecto.'
      snackbar.show = true
    } catch (error) {
      snackbar.color = 'error'
      snackbar.text = error.apiMessage || error.response?.data?.message || 'No se pudo guardar'
      snackbar.show = true
    } finally {
      saving.value = false
    }
  }

  function abrirDevolucion () {
    const pedidos = items.value.filter(item => item.requerido || Number(item.cantidad) > 0)
    const base = pedidos.length ? pedidos : items.value
    devolucion.fecha = hoy()
    devolucion.nombres = ''
    devolucion.items = base.map(item => ({
      clave: item.clave,
      nombre: item.nombre,
      cantidad: item.cantidad,
      devuelto: true,
    }))
    dialogDevolucion.value = true
  }

  async function guardarDevolucion () {
    if (!devolucion.nombres.trim()) {
      snackbar.color = 'warning'
      snackbar.text = 'Escribe el nombre de los agentes o extreros.'
      snackbar.show = true
      return
    }
    guardandoDevolucion.value = true
    try {
      const res = await bodegaService.registrarDevolucionRequerimientos({
        proyecto_id: proyectoId.value,
        fecha: devolucion.fecha,
        nombres: devolucion.nombres.trim(),
        items: devolucion.items.map(item => ({ clave: item.clave, devuelto: !!item.devuelto })),
      })
      dialogDevolucion.value = false
      await cargarItems()
      snackbar.color = 'success'
      snackbar.text = res.message || 'Devolución registrada.'
      snackbar.show = true
    } catch (error) {
      snackbar.color = 'error'
      snackbar.text = error.apiMessage || error.response?.data?.message || 'No se pudo registrar la devolución'
      snackbar.show = true
    } finally {
      guardandoDevolucion.value = false
    }
  }

  onMounted(async () => {
    loading.value = true
    try {
      const res = await bodegaService.getRequerimientosProyecto()
      proyectos.value = (res.data?.proyectos || []).map(p => ({
        ...p,
        etiqueta: [p.nombre_proyecto, p.correlativo, p.estado_proyecto].filter(Boolean).join(' · '),
      }))
    } catch (error) {
      snackbar.color = 'error'
      snackbar.text = error.apiMessage || 'No se pudieron cargar los proyectos'
      snackbar.show = true
    } finally {
      loading.value = false
    }
  })
</script>
