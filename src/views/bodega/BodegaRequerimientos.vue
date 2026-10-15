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
      </v-card-actions>
    </v-card>

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
  const snackbar = reactive({ show: false, text: '', color: 'success' })

  const izquierda = computed(() => items.value.filter(item => item.columna === 'izq'))
  const derecha = computed(() => items.value.filter(item => item.columna === 'der'))

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
      return
    }
    loading.value = true
    try {
      const res = await bodegaService.getRequerimientosProyecto(proyectoId.value)
      items.value = res.data?.items || []
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

  onMounted(async () => {
    loading.value = true
    try {
      const res = await bodegaService.getRequerimientosProyecto()
      proyectos.value = (res.data?.proyectos || []).map(p => ({
        ...p,
        etiqueta: p.correlativo ? `${p.nombre_proyecto} · ${p.correlativo}` : p.nombre_proyecto,
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
