<template>
  <div>
    <v-card v-if="canViewArmas" class="mb-6" elevation="0" variant="outlined" rounded="xl">
      <v-card-title class="d-flex align-center flex-wrap ga-2 pa-4">
        <v-icon start>mdi-pistol</v-icon>
        <span class="text-h6">Armas del proyecto</span>
        <v-spacer />
        <v-btn
          v-if="canManageArmas"
          color="primary"
          prepend-icon="mdi-archive-arrow-down"
          variant="elevated"
          @click="abrirCargarArma"
        >
          Cargar arma
        </v-btn>
      </v-card-title>
      <v-card-subtitle class="px-4 pb-2">
        Las armas se cargan desde bodega y se descargan para devolverlas.
      </v-card-subtitle>
      <v-data-table
        :headers="headersArmas"
        hover
        :items="armas"
        :items-per-page="10"
        :loading="loadingArmas"
      >
        <template #item.arma="{ item }">
          <div class="font-weight-medium">{{ item.marca || '—' }} {{ item.modelo }}</div>
          <div class="text-caption text-medium-emphasis">Serie {{ item.serie }}</div>
        </template>
        <template #item.tipo="{ item }">
          <v-chip size="small" variant="tonal">{{ item.tipo_label || item.tipo }}</v-chip>
        </template>
        <template #item.estado="{ item }">
          <v-chip color="info" size="small" variant="tonal">
            {{ item.estado_label || item.estado }}
          </v-chip>
        </template>
        <template #item.acciones="{ item }">
          <v-btn
            v-if="canManageArmas"
            color="warning"
            prepend-icon="mdi-archive-arrow-up"
            size="small"
            variant="tonal"
            @click="confirmarDescargar(item)"
          >
            Descargar
          </v-btn>
        </template>
        <template #no-data>
          <div class="text-medium-emphasis py-6">
            No hay armas cargadas en este proyecto.
          </div>
        </template>
      </v-data-table>
    </v-card>

    <v-card flat>
      <v-card-title class="d-flex align-center px-0">
        <span class="text-h6">Inventario asignado</span>
        <v-spacer />
        <v-btn
          v-if="canManage"
          color="primary"
          prepend-icon="mdi-plus"
          variant="elevated"
          @click="openDialog()"
        >
          Asignar Item
        </v-btn>
      </v-card-title>

      <v-data-table
        :headers="headers"
        hover
        :items="items"
        :loading="loading"
      >
        <template #item.estado_item="{ item }">
          <v-chip
            class="text-uppercase"
            :color="getEstadoColor(item.estado_item)"
            label
            size="small"
          >
            {{ item.estado_item }}
          </v-chip>
        </template>

        <template #item.fecha_asignacion="{ item }">
          {{ formatDate(item.fecha_asignacion) }}
        </template>

        <template #item.actions="{ item }">
          <v-btn
            color="primary"
            icon="mdi-pencil"
            size="small"
            variant="text"
            @click="openDialog(item)"
          />
          <v-btn
            color="error"
            icon="mdi-delete"
            size="small"
            variant="text"
            @click="confirmDelete(item)"
          />
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialogCargar" max-width="560px" persistent>
      <v-card rounded="xl">
        <v-card-title class="pa-4 text-h6">Cargar arma al proyecto</v-card-title>
        <v-card-text>
          <v-select
            v-model="armaSeleccionadaId"
            density="comfortable"
            :items="armasDisponibles"
            :item-title="tituloArma"
            item-value="id"
            label="Arma en bodega *"
            :loading="loadingDisponibles"
            variant="outlined"
          />
          <v-text-field
            v-model="responsableArma"
            class="mt-2"
            density="comfortable"
            label="Responsable (opcional)"
            variant="outlined"
          />
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="dialogCargar = false">Cancelar</v-btn>
          <v-btn
            color="primary"
            :disabled="!armaSeleccionadaId"
            :loading="guardandoArma"
            variant="elevated"
            @click="cargarArma"
          >
            Cargar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogDescargar" max-width="420px">
      <v-card rounded="xl">
        <v-card-title class="text-h6">¿Descargar arma?</v-card-title>
        <v-card-text>
          {{ armaADescargar?.codigo || armaADescargar?.serie }} volverá a bodega y saldrá de este inventario.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialogDescargar = false">Cancelar</v-btn>
          <v-btn color="warning" :loading="guardandoArma" variant="elevated" @click="descargarArma">
            Descargar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialog" max-width="600px" persistent>
      <v-card rounded="xl">
        <v-card-title class="pa-4 text-h6">
          {{ editedItem.id ? 'Editar Item' : 'Asignar Nuevo Item' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="form" v-model="valid">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedItem.codigo_inventario"
                  density="comfortable"
                  label="Código Inventario *"
                  :rules="[v => !!v || 'Requerido']"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="editedItem.estado_item"
                  density="comfortable"
                  :items="['asignado', 'en_uso', 'devuelto', 'dañado']"
                  label="Estado *"
                  :rules="[v => !!v || 'Requerido']"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" md="8">
                <v-text-field
                  v-model="editedItem.nombre_item"
                  density="comfortable"
                  label="Nombre del Item *"
                  :rules="[v => !!v || 'Requerido']"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model.number="editedItem.cantidad_asignada"
                  density="comfortable"
                  label="Cantidad *"
                  min="1"
                  :rules="[v => !!v || 'Requerido', v => v > 0 || 'Min 1']"
                  type="number"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedItem.fecha_asignacion"
                  density="comfortable"
                  label="Fecha Asignación"
                  type="date"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedItem.fecha_devolucion"
                  density="comfortable"
                  label="Fecha Devolución"
                  type="date"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="editedItem.observaciones"
                  auto-grow
                  density="comfortable"
                  label="Observaciones"
                  rows="2"
                  variant="outlined"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">Cancelar</v-btn>
          <v-btn color="primary" :loading="saving" variant="elevated" @click="save">
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogDelete" max-width="400px">
      <v-card rounded="xl">
        <v-card-title class="text-h6">¿Eliminar item?</v-card-title>
        <v-card-text>Esta acción no se puede deshacer.</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDelete">Cancelar</v-btn>
          <v-btn color="error" :loading="deleting" variant="elevated" @click="deleteItemConfirm">Eliminar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3500">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
  import { format } from 'date-fns'
  import { computed, onMounted, reactive, ref, watch } from 'vue'
  import bodegaService from '@/services/bodegaService'
  import { useAuthStore } from '@/stores/auth'
  import { useProyectosStore } from '@/stores/proyectos'

  const props = defineProps({
    proyectoId: {
      type: [Number, String],
      required: true,
    },
  })

  const store = useProyectosStore()
  const authStore = useAuthStore()
  const loading = ref(false)
  const items = ref([])
  const armas = ref([])
  const armasDisponibles = ref([])
  const loadingArmas = ref(false)
  const loadingDisponibles = ref(false)
  const dialogCargar = ref(false)
  const dialogDescargar = ref(false)
  const armaSeleccionadaId = ref(null)
  const responsableArma = ref('')
  const armaADescargar = ref(null)
  const guardandoArma = ref(false)
  const snackbar = reactive({ show: false, text: '', color: 'success' })

  const canManage = computed(() => authStore.hasPermission('manage-proyectos-inventario'))
  const canViewArmas = computed(() => authStore.hasPermission('view-armas'))
  const canManageArmas = computed(() => authStore.hasPermission('manage-armas'))

  const headers = computed(() => {
    const baseHeaders = [
      { title: 'Código', key: 'codigo_inventario' },
      { title: 'Item', key: 'nombre_item' },
      { title: 'Cant.', key: 'cantidad_asignada' },
      { title: 'Estado', key: 'estado_item', align: 'center' },
      { title: 'Fecha Asignación', key: 'fecha_asignacion' },
    ]
    if (canManage.value) {
      baseHeaders.push({ title: 'Acciones', key: 'actions', sortable: false, align: 'end' })
    }
    return baseHeaders
  })

  const headersArmas = computed(() => {
    const cols = [
      { title: 'Código', key: 'codigo' },
      { title: 'Tipo', key: 'tipo' },
      { title: 'Arma', key: 'arma', sortable: false },
      { title: 'Responsable', key: 'responsable_nombre' },
      { title: 'Estado', key: 'estado' },
    ]
    if (canManageArmas.value) {
      cols.push({ title: '', key: 'acciones', sortable: false, align: 'end' })
    }
    return cols
  })

  const dialog = ref(false)
  const dialogDelete = ref(false)
  const saving = ref(false)
  const deleting = ref(false)
  const valid = ref(false)
  const form = ref(null)

  const defaultItem = {
    id: null,
    codigo_inventario: '',
    nombre_item: '',
    cantidad_asignada: 1,
    estado_item: 'asignado',
    fecha_asignacion: new Date().toISOString().slice(0, 10),
    fecha_devolucion: null,
    observaciones: '',
  }
  const editedItem = ref({ ...defaultItem })
  const itemToDelete = ref(null)

  function tituloArma (arma) {
    const codigo = arma.codigo || arma.serie
    const tipo = arma.tipo_label || arma.tipo
    const nombre = [arma.marca, arma.modelo].filter(Boolean).join(' ')
    return `${codigo} · ${tipo}${nombre ? ` · ${nombre}` : ''}`
  }

  async function loadItems () {
    loading.value = true
    try {
      items.value = await store.fetchInventario(props.proyectoId)
    } catch (error) {
      console.error(error)
    } finally {
      loading.value = false
    }
  }

  async function loadArmas () {
    loadingArmas.value = true
    try {
      const res = await bodegaService.getArmas({ proyecto_id: props.proyectoId })
      armas.value = res.data || []
    } catch (error) {
      console.error(error)
      armas.value = []
    } finally {
      loadingArmas.value = false
    }
  }

  async function abrirCargarArma () {
    dialogCargar.value = true
    armaSeleccionadaId.value = null
    responsableArma.value = ''
    loadingDisponibles.value = true
    try {
      const res = await bodegaService.getArmas({ disponibles: 1 })
      armasDisponibles.value = res.data || []
    } catch (error) {
      snackbar.color = 'error'
      snackbar.text = error.apiMessage || error.response?.data?.message || 'No se pudieron cargar las armas de bodega'
      snackbar.show = true
      armasDisponibles.value = []
    } finally {
      loadingDisponibles.value = false
    }
  }

  async function cargarArma () {
    if (!armaSeleccionadaId.value) return
    guardandoArma.value = true
    try {
      const res = await bodegaService.asignarArmaProyecto(armaSeleccionadaId.value, {
        proyecto_id: props.proyectoId,
        responsable_nombre: responsableArma.value || null,
      })
      snackbar.color = 'success'
      snackbar.text = res.message || 'Arma cargada al proyecto'
      snackbar.show = true
      dialogCargar.value = false
      await loadArmas()
    } catch (error) {
      snackbar.color = 'error'
      snackbar.text = error.apiMessage || error.response?.data?.message || 'No se pudo cargar el arma'
      snackbar.show = true
    } finally {
      guardandoArma.value = false
    }
  }

  function confirmarDescargar (item) {
    armaADescargar.value = item
    dialogDescargar.value = true
  }

  async function descargarArma () {
    if (!armaADescargar.value) return
    guardandoArma.value = true
    try {
      const res = await bodegaService.devolverArmaBodega(armaADescargar.value.id)
      snackbar.color = 'success'
      snackbar.text = res.message || 'Arma descargada a bodega'
      snackbar.show = true
      dialogDescargar.value = false
      armaADescargar.value = null
      await loadArmas()
    } catch (error) {
      snackbar.color = 'error'
      snackbar.text = error.apiMessage || error.response?.data?.message || 'No se pudo descargar el arma'
      snackbar.show = true
    } finally {
      guardandoArma.value = false
    }
  }

  function openDialog (item) {
    if (item) {
      const formatDateForInput = isoDate => {
        if (!isoDate) return null
        return isoDate.split('T')[0]
      }

      editedItem.value = {
        ...item,
        fecha_asignacion: formatDateForInput(item.fecha_asignacion),
        fecha_devolucion: formatDateForInput(item.fecha_devolucion),
      }
    } else {
      editedItem.value = { ...defaultItem }
    }
    dialog.value = true
  }

  function closeDialog () {
    dialog.value = false
    setTimeout(() => {
      editedItem.value = { ...defaultItem }
      if (form.value) form.value.resetValidation()
    }, 300)
  }

  async function save () {
    const { valid } = await form.value.validate()
    if (!valid) return

    saving.value = true
    try {
      await (editedItem.value.id ? store.updateInventario(props.proyectoId, editedItem.value.id, editedItem.value) : store.createInventario(props.proyectoId, editedItem.value))
      await loadItems()
      closeDialog()
    } catch (error) {
      console.error(error)
    } finally {
      saving.value = false
    }
  }

  function confirmDelete (item) {
    itemToDelete.value = item
    dialogDelete.value = true
  }

  function closeDelete () {
    dialogDelete.value = false
    itemToDelete.value = null
  }

  async function deleteItemConfirm () {
    if (!itemToDelete.value) return
    deleting.value = true
    try {
      await store.deleteInventario(props.proyectoId, itemToDelete.value.id)
      await loadItems()
      closeDelete()
    } catch (error) {
      console.error(error)
    } finally {
      deleting.value = false
    }
  }

  function getEstadoColor (estado) {
    const colors = {
      asignado: 'info',
      en_uso: 'primary',
      devuelto: 'success',
      dañado: 'error',
    }
    return colors[estado] || 'grey'
  }

  function formatDate (date) {
    if (!date) return ''
    return format(new Date(date), 'dd/MM/yyyy')
  }

  function loadAll () {
    if (!props.proyectoId) return
    loadItems()
    if (canViewArmas.value) loadArmas()
  }

  watch(() => props.proyectoId, () => {
    loadAll()
  })

  onMounted(() => {
    loadAll()
  })
</script>
