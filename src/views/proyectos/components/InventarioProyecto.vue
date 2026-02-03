<template>
  <v-card flat>
    <v-card-title class="d-flex align-center px-0">
      <span class="text-h6">Inventario Asignado</span>
      <v-spacer />
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

    <!-- Dialogo Formulario -->
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
        <v-card-title class="text-h6">¿Eliminar item?</v-card-title>
        <v-card-text>Esta acción no se puede deshacer.</v-card-text>
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
  import { format } from 'date-fns'
  import { es } from 'date-fns/locale'
  import { computed, onMounted, ref, watch } from 'vue'
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

  const canManage = computed(() => authStore.hasPermission('manage-proyectos-inventario'))

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

  // Dialog state
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

  function openDialog (item) {
    if (item) {
      // Convertir fechas ISO a formato yyyy-MM-dd para inputs de tipo date
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

  watch(() => props.proyectoId, () => {
    if (props.proyectoId) loadItems()
  })

  onMounted(() => {
    if (props.proyectoId) loadItems()
  })
</script>
