<template>
  <v-card flat>
    <v-card-title class="d-flex align-center px-0">
      <span class="text-h6">Configuración de Puestos y Plazas</span>
      <v-spacer />
      <v-btn
        v-if="canManage"
        color="primary"
        prepend-icon="mdi-plus"
        variant="elevated"
        @click="openDialog()"
      >
        Agregar Puesto
      </v-btn>
    </v-card-title>

    <v-data-table
      :headers="headers"
      hover
      :items="items"
      :loading="loading"
    >
      <template #item.costo_hora_proyecto="{ item }">
        Q{{ parseFloat(item.costo_hora_proyecto).toFixed(2) }}
      </template>
      <template #item.pago_hora_personal="{ item }">
        Q{{ parseFloat(item.pago_hora_personal).toFixed(2) }}
      </template>
      <template #item.margen_utilidad="{ item }">
        <v-chip
          :color="getMarginColor(item.margen_utilidad)"
          label
          size="small"
        >
          {{ parseFloat(item.margen_utilidad).toFixed(2) }}%
        </v-chip>
      </template>
      <template #item.turno="{ item }">
        {{ item.turno?.nombre || 'N/A' }}
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

    <!-- Dialogo Formulario -->
    <v-dialog v-model="dialog" max-width="800px" persistent>
      <v-card rounded="xl">
        <v-card-title class="pa-4 text-h6">
          {{ editedItem.id ? 'Editar Puesto' : 'Nuevo Puesto' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="form" v-model="valid">
            <v-row>
              <!-- Info Básica -->
              <v-col cols="12">
                <div class="text-caption text-medium-emphasis mb-2 font-weight-bold">INFORMACIÓN GENERAL</div>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="editedItem.tipo_personal_id"
                  density="comfortable"
                  item-title="nombre"
                  item-value="id"
                  :items="catalogs.tiposPersonal"
                  label="Tipo Personal *"
                  :rules="[v => !!v || 'Requerido']"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field
                  v-model.number="editedItem.cantidad_requerida"
                  density="comfortable"
                  label="Plazas *"
                  min="1"
                  :rules="[v => !!v || 'Requerido', v => v > 0 || 'Min 1']"
                  type="number"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="editedItem.turno_id"
                  density="comfortable"
                  item-title="nombre"
                  item-value="id"
                  :items="catalogs.turnos"
                  label="Turno *"
                  :rules="[v => !!v || 'Requerido']"
                  variant="outlined"
                />
              </v-col>

              <!-- Requisitos -->
              <v-col cols="12">
                <v-divider class="my-2" />
                <div class="text-caption text-medium-emphasis mb-2 font-weight-bold">REQUISITOS DEL PUESTO</div>
              </v-col>
              <v-col cols="6" md="3">
                <v-text-field
                  v-model.number="editedItem.edad_minima"
                  density="comfortable"
                  label="Edad Mínima *"
                  :rules="[v => !!v || 'Requerido']"
                  type="number"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="6" md="3">
                <v-text-field
                  v-model.number="editedItem.edad_maxima"
                  density="comfortable"
                  label="Edad Máxima *"
                  :rules="[v => !!v || 'Requerido', v => !editedItem.edad_minima || v >= editedItem.edad_minima || 'Debe ser >= Mínima']"
                  type="number"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                  v-model="editedItem.sexo_id"
                  clearable
                  density="comfortable"
                  hint="Dejar vacío si es indistinto"
                  item-title="nombre"
                  item-value="id"
                  :items="catalogs.sexos"
                  label="Sexo Requerido"
                  persistent-hint
                  variant="outlined"
                />
              </v-col>
              <v-col cols="6" md="3">
                <v-text-field
                  v-model.number="editedItem.altura_minima"
                  density="comfortable"
                  label="Altura Min (mts)"
                  step="0.01"
                  type="number"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="editedItem.estudio_minimo_id"
                  clearable
                  density="comfortable"
                  item-title="nombre"
                  item-value="id"
                  :items="catalogs.nivelesEstudio"
                  label="Nivel Estudio Mínimo"
                  variant="outlined"
                />
              </v-col>

              <!-- Costos -->
              <v-col cols="12">
                <v-divider class="my-2" />
                <div class="text-caption text-medium-emphasis mb-2 font-weight-bold">COSTOS Y MARGEN</div>
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model.number="editedItem.costo_hora_proyecto"
                  density="comfortable"
                  label="Precio Cliente *"
                  min="0"
                  prefix="Q"
                  :rules="[v => v !== null && v !== '' || 'Requerido']"
                  step="0.01"
                  type="number"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model.number="editedItem.pago_hora_personal"
                  density="comfortable"
                  label="Pago Personal *"
                  min="0"
                  prefix="Q"
                  :rules="[
                    v => v !== null && v !== '' || 'Requerido',
                    v => !editedItem.costo_hora_proyecto || v <= editedItem.costo_hora_proyecto || 'Pago > Precio Cliente'
                  ]"
                  step="0.01"
                  type="number"
                  variant="outlined"
                />
              </v-col>
              <v-col class="d-flex align-center justify-center" cols="12" md="4">
                <v-card class="px-4 py-2 w-100 text-center" :color="marginColor" variant="tonal">
                  <div class="text-caption font-weight-bold">MARGEN UTILIDAD</div>
                  <div class="text-h4 font-weight-bold">{{ calculatedMargin }}%</div>
                </v-card>
              </v-col>

            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn
            variant="text"
            @click="closeDialog"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="primary"
            :loading="saving"
            variant="elevated"
            @click="save"
          >
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialogo Confirmar Eliminar -->
    <v-dialog v-model="dialogDelete" max-width="400px">
      <v-card rounded="xl">
        <v-card-title class="text-h6">¿Eliminar puesto?</v-card-title>
        <v-card-text>Esta acción eliminará el puesto y podría afectar asignaciones existentes.</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDelete">Cancelar</v-btn>
          <v-btn color="error" :loading="deleting" variant="elevated" @click="deleteItemConfirm">Eliminar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import catalogoService from '@/services/catalogoService'
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

  const canManage = computed(() => authStore.hasPermission('manage-proyectos-configuracion'))

  const headers = computed(() => {
    const baseHeaders = [
      { title: 'Tipo Personal', key: 'tipo_personal.nombre' },
      { title: 'Plazas', key: 'cantidad_requerida', align: 'center' },
      { title: 'Turno', key: 'turno' }, // uses template to show name
      { title: 'Pr. Cliente', key: 'costo_hora_proyecto', align: 'end' },
      { title: 'Pago Pers', key: 'pago_hora_personal', align: 'end' },
      { title: 'Margen', key: 'margen_utilidad', align: 'center' },
    ]
    if (canManage.value) {
      baseHeaders.push({ title: 'Acciones', key: 'actions', sortable: false, align: 'end' })
    }
    return baseHeaders
  })

  // Catalogs
  const catalogs = ref({
    tiposPersonal: [],
    turnos: [],
    sexos: [],
    nivelesEstudio: [],
  })

  // Dialog state
  const dialog = ref(false)
  const dialogDelete = ref(false)
  const saving = ref(false)
  const deleting = ref(false)
  const valid = ref(false)
  const form = ref(null)

  const defaultItem = {
    id: null,
    // nombre_puesto: '', // Removed
    cantidad_requerida: 1,
    edad_minima: 18,
    edad_maxima: 65,
    sexo_id: null,
    altura_minima: null,
    estudio_minimo_id: null,
    tipo_personal_id: null,
    turno_id: null,
    costo_hora_proyecto: null,
    pago_hora_personal: null,
    estado: 'activo',
  }
  const editedItem = ref({ ...defaultItem })
  const itemToDelete = ref(null)

  // Computed for Margin Display in Form
  const calculatedMargin = computed(() => {
    const costo = Number.parseFloat(editedItem.value.costo_hora_proyecto)
    const pago = Number.parseFloat(editedItem.value.pago_hora_personal)
    if (!costo || costo <= 0) return '0.00'
    const margin = ((costo - pago) / costo) * 100
    return margin.toFixed(2)
  })

  const marginColor = computed(() => {
    const margin = Number.parseFloat(calculatedMargin.value)
    if (margin < 0) return 'error'
    if (margin < 10) return 'warning'
    return 'success'
  })

  async function loadCatalogs () {
    try {
      // Fetch specific catalogs
      const [tp, tur, sex, edu] = await Promise.all([
        catalogoService.get('tipos-personal'),
        catalogoService.get('turnos'),
        catalogoService.get('sexos'),
        catalogoService.get('niveles-estudio'),
      ])
      catalogs.value.tiposPersonal = tp || []
      catalogs.value.turnos = tur || []
      catalogs.value.sexos = sex || []
      catalogs.value.nivelesEstudio = edu || []
    } catch (error) {
      console.error('Error loading catalogs', error)
    }
  }

  async function loadItems () {
    loading.value = true
    try {
      const response = await store.fetchConfiguracionPersonal(props.proyectoId)
      // Map Turno relationship manually if needed, or rely on API response structure.
      // The backend `index` returns `$proyecto->configuracionPersonal`.
      // Does the model relation `turno()` auto-load? No, unless we append `with('turno')` in Controller.
      // I need to update Controller to eager load `turno`.
      // For now, I will map using current catalogs.
      // OPTIMIZATION: Update backend controller later to eager load.
      // WORKAROUND: Map locally.
      items.value = response.map(item => ({
        ...item,
        turno: catalogs.value.turnos.find(t => t.id === item.turno_id) || { nombre: '?' },
      }))
    } catch (error) {
      console.error(error)
    } finally {
      loading.value = false
    }
  }

  function openDialog (item) {
    editedItem.value = item ? { ...item } : { ...defaultItem }
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
      await (editedItem.value.id ? store.updateConfiguracionPersonal(props.proyectoId, editedItem.value.id, editedItem.value) : store.createConfiguracionPersonal(props.proyectoId, editedItem.value))
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
      await store.deleteConfiguracionPersonal(props.proyectoId, itemToDelete.value.id)
      await loadItems()
      closeDelete()
    } catch (error) {
      console.error(error)
    } finally {
      deleting.value = false
    }
  }

  function getMarginColor (margin) {
    if (margin < 0) return 'error'
    if (margin < 15) return 'warning'
    return 'success'
  }

  watch(() => props.proyectoId, () => {
    if (props.proyectoId) {
      loadCatalogs().then(loadItems)
    }
  })

  onMounted(() => {
    if (props.proyectoId) {
      loadCatalogs().then(loadItems)
    }
  })
</script>
