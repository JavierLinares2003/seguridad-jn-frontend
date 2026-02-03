<template>
  <v-card flat>
    <v-card-title class="d-flex align-center px-0">
      <span class="text-h6">Contactos del Proyecto</span>
      <v-spacer />
      <v-spacer />
      <v-btn
        v-if="canManage"
        color="primary"
        prepend-icon="mdi-plus"
        variant="elevated"
        @click="openDialog()"
      >
        Nuevo Contacto
      </v-btn>
    </v-card-title>

    <v-data-table
      :headers="headers"
      hover
      :items="items"
      :loading="loading"
    >
      <template #item.es_contacto_principal="{ item }">
        <v-chip
          v-if="item.es_contacto_principal"
          color="success"
          label
          size="small"
        >
          Principal
        </v-chip>
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
    <v-dialog v-model="dialog" max-width="500px" persistent>
      <v-card rounded="xl">
        <v-card-title class="pa-4 text-h6">
          {{ editedItem.id ? 'Editar Contacto' : 'Nuevo Contacto' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="form" v-model="valid">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="editedItem.nombre_contacto"
                  density="comfortable"
                  label="Nombre Completo *"
                  :rules="[v => !!v || 'Requerido']"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedItem.telefono"
                  density="comfortable"
                  label="Teléfono *"
                  :rules="[v => !!v || 'Requerido']"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedItem.puesto"
                  density="comfortable"
                  label="Puesto *"
                  :rules="[v => !!v || 'Requerido']"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="editedItem.email"
                  density="comfortable"
                  label="Email"
                  type="email"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12">
                <v-checkbox
                  v-model="editedItem.es_contacto_principal"
                  color="primary"
                  hide-details
                  label="Es contacto principal"
                />
                <v-alert
                  v-if="editedItem.es_contacto_principal"
                  class="mt-2 text-caption"
                  density="compact"
                  type="info"
                  variant="tonal"
                >
                  Al marcar este como principal, cualquier otro contacto principal será desmarcado automáticamente.
                </v-alert>
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
        <v-card-title class="text-h6">¿Eliminar contacto?</v-card-title>
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

  const canManage = computed(() => authStore.hasPermission('manage-proyectos-contactos'))

  const headers = computed(() => {
    const baseHeaders = [
      { title: 'Nombre', key: 'nombre_contacto' },
      { title: 'Puesto', key: 'puesto' },
      { title: 'Teléfono', key: 'telefono' },
      { title: 'Email', key: 'email' },
      { title: 'Principal', key: 'es_contacto_principal', align: 'center' },
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
    nombre_contacto: '',
    telefono: '',
    email: '',
    puesto: '',
    es_contacto_principal: false,
  }
  const editedItem = ref({ ...defaultItem })
  const itemToDelete = ref(null)

  async function loadItems () {
    loading.value = true
    try {
      items.value = await store.fetchContactos(props.proyectoId)
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
      await (editedItem.value.id ? store.updateContacto(props.proyectoId, editedItem.value.id, editedItem.value) : store.createContacto(props.proyectoId, editedItem.value))
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
      await store.deleteContacto(props.proyectoId, itemToDelete.value.id)
      await loadItems()
      closeDelete()
    } catch (error) {
      console.error(error)
    } finally {
      deleting.value = false
    }
  }

  watch(() => props.proyectoId, () => {
    if (props.proyectoId) loadItems()
  })

  onMounted(() => {
    if (props.proyectoId) loadItems()
  })
</script>
