<template>
  <div>
    <!-- Botón Agregar -->
    <div class="d-flex justify-end mb-4">
      <v-btn
        v-if="!showForm && !readonly"
        color="primary"
        size="small"
        @click="openForm()"
      >
        <v-icon start>mdi-plus</v-icon>
        Agregar Referencia
      </v-btn>
    </div>

    <!-- Formulario Inline -->
    <v-expand-transition>
      <v-card v-if="showForm" class="mb-4" variant="outlined">
        <v-card-title class="text-subtitle-1 bg-grey-lighten-4">
          <v-icon size="small" start>mdi-briefcase-edit</v-icon>
          {{ isEditing ? 'Editar' : 'Nueva' }} Referencia Laboral
        </v-card-title>

        <v-card-text>
          <v-form ref="formRef" @submit.prevent="saveReferencia">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.nombre_empresa"
                  density="compact"
                  :error-messages="formErrors.nombre_empresa"
                  label="Empresa *"
                  prepend-inner-icon="mdi-domain"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.puesto_ocupado"
                  density="compact"
                  :error-messages="formErrors.puesto_ocupado"
                  label="Puesto *"
                  prepend-inner-icon="mdi-badge-account"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.telefono"
                  density="compact"
                  :error-messages="formErrors.telefono"
                  label="Teléfono *"
                  prepend-inner-icon="mdi-phone"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.direccion"
                  density="compact"
                  label="Dirección"
                  prepend-inner-icon="mdi-map-marker"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="4">
                <v-text-field
                  v-model="form.fecha_inicio"
                  density="compact"
                  :error-messages="formErrors.fecha_inicio"
                  label="Fecha Inicio *"
                  type="date"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="4">
                <v-text-field
                  v-model="form.fecha_fin"
                  density="compact"
                  :disabled="empleoActual"
                  :error-messages="formErrors.fecha_fin"
                  label="Fecha Fin"
                  type="date"
                  variant="outlined"
                />
              </v-col>

              <v-col class="d-flex align-center" cols="12" md="4">
                <v-checkbox
                  v-model="empleoActual"
                  color="primary"
                  hide-details
                  label="Empleo Actual"
                  @change="onEmpleoActualChange"
                />
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="form.motivo_retiro"
                  auto-grow
                  density="compact"
                  :disabled="empleoActual"
                  :error-messages="formErrors.motivo_retiro"
                  label="Motivo de Retiro"
                  rows="2"
                  variant="outlined"
                />
              </v-col>
            </v-row>

            <!-- Errores de validación -->
            <v-alert
              v-if="formError"
              class="mb-3"
              closable
              density="compact"
              type="error"
              variant="tonal"
              @click:close="formError = null"
            >
              {{ formError }}
            </v-alert>
          </v-form>
        </v-card-text>

        <v-card-actions class="bg-grey-lighten-4">
          <v-spacer />
          <v-btn variant="text" @click="cancelForm">
            Cancelar
          </v-btn>
          <v-btn
            color="primary"
            :loading="saving"
            variant="flat"
            @click="saveReferencia"
          >
            <v-icon start>mdi-content-save</v-icon>
            {{ isEditing ? 'Actualizar' : 'Guardar' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-expand-transition>

    <!-- Tabla de Referencias -->
    <v-data-table
      density="compact"
      :headers="headers"
      :items="items"
      :items-per-page="5"
      :loading="loading"
    >
      <!-- Empresa y Puesto -->
      <template #item.nombre_empresa="{ item }">
        <div>
          <strong>{{ item.nombre_empresa }}</strong>
          <div class="text-caption text-grey">{{ item.puesto_ocupado }}</div>
        </div>
      </template>

      <!-- Período -->
      <template #item.periodo="{ item }">
        <div class="text-caption">
          {{ formatDate(item.fecha_inicio) }} -
          {{ !item.fecha_fin ? 'Actual' : formatDate(item.fecha_fin) }}
        </div>
        <v-chip
          v-if="!item.fecha_fin"
          color="success"
          size="x-small"
          variant="tonal"
        >
          Empleo Actual
        </v-chip>
      </template>

      <!-- Contacto -->
      <template #item.contacto="{ item }">
        <div v-if="item.telefono">
          <div class="text-caption">
            <v-icon size="x-small">mdi-phone</v-icon>
            {{ item.telefono }}
          </div>
        </div>
        <span v-else class="text-grey">-</span>
      </template>

      <!-- Acciones -->
      <template #item.actions="{ item }">
        <template v-if="!readonly">
          <v-btn
            color="warning"
            icon="mdi-pencil"
            size="small"
            variant="text"
            @click="openForm(item)"
          />
          <v-btn
            color="error"
            icon="mdi-delete"
            size="small"
            variant="text"
            @click="confirmDelete(item)"
          />
        </template>
      </template>

      <!-- No data -->
      <template #no-data>
        <div class="text-center py-4 text-grey">
          <v-icon size="48">mdi-briefcase-off</v-icon>
          <p class="mt-2">No hay referencias laborales registradas</p>
        </div>
      </template>
    </v-data-table>

    <!-- Dialog Confirmar Eliminación -->
    <v-dialog v-model="deleteDialog" max-width="400" persistent>
      <v-card>
        <v-card-title class="text-subtitle-1">
          <v-icon class="mr-2" color="error">mdi-alert</v-icon>
          Confirmar Eliminación
        </v-card-title>
        <v-card-text>
          ¿Está seguro de eliminar la referencia de
          <strong>{{ itemToDelete?.nombre_empresa }}</strong>?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">
            Cancelar
          </v-btn>
          <v-btn
            color="error"
            :loading="deleting"
            variant="flat"
            @click="deleteReferencia"
          >
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
  import { computed, reactive, ref, watch } from 'vue'
  import personalService from '@/services/personalService'

  const props = defineProps({
    personalId: {
      type: [Number, String],
      required: true,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
  })

  const emit = defineEmits(['updated', 'error'])

  // Estado
  const items = ref([])
  const loading = ref(false)
  const saving = ref(false)
  const deleting = ref(false)
  const showForm = ref(false)
  const isEditing = ref(false)
  const editingId = ref(null)
  const formError = ref(null)

  // Form
  const formRef = ref(null)
  const form = reactive({
    nombre_empresa: '',
    puesto_ocupado: '',
    telefono: '',
    direccion: '',
    fecha_inicio: '',
    fecha_fin: '',
    motivo_retiro: '',
  })

  const empleoActual = ref(false)

  const formErrors = reactive({
    nombre_empresa: '',
    puesto_ocupado: '',
    telefono: '',
    fecha_inicio: '',
    fecha_fin: '',
    motivo_retiro: '',
  })

  // Dialog eliminar
  const deleteDialog = ref(false)
  const itemToDelete = ref(null)

  // Headers de la tabla
  const headers = computed(() => {
    const cols = [
      { title: 'Empresa / Puesto', key: 'nombre_empresa', sortable: true },
      { title: 'Período', key: 'periodo', sortable: false },
      { title: 'Contacto', key: 'contacto', sortable: false },
    ]

    if (!props.readonly) {
      cols.push({ title: '', key: 'actions', sortable: false, width: '100px', align: 'center' })
    }

    return cols
  })

  // Helpers
  function formatDate (date) {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'short',
    })
  }

  function resetForm () {
    Object.assign(form, {
      nombre_empresa: '',
      puesto_ocupado: '',
      telefono: '',
      direccion: '',
      fecha_inicio: '',
      fecha_fin: '',
      motivo_retiro: '',
    })
    empleoActual.value = false
    for (const key of Object.keys(formErrors)) (formErrors[key] = '')
    formError.value = null
    isEditing.value = false
    editingId.value = null
  }

  function openForm (item = null) {
    resetForm()

    if (item) {
      isEditing.value = true
      editingId.value = item.id
      Object.assign(form, {
        nombre_empresa: item.nombre_empresa || '',
        puesto_ocupado: item.puesto_ocupado || '',
        telefono: item.telefono || '',
        direccion: item.direccion || '',
        fecha_inicio: item.fecha_inicio || '',
        fecha_fin: item.fecha_fin || '',
        motivo_retiro: item.motivo_retiro || '',
      })
      empleoActual.value = !item.fecha_fin
    }

    showForm.value = true
  }

  function cancelForm () {
    showForm.value = false
    resetForm()
  }

  function onEmpleoActualChange () {
    if (empleoActual.value) {
      form.fecha_fin = ''
      form.motivo_retiro = ''
    }
  }

  // Validación
  function validateForm () {
    let valid = true
    for (const key of Object.keys(formErrors)) (formErrors[key] = '')

    if (!form.nombre_empresa.trim()) {
      formErrors.nombre_empresa = 'La empresa es requerida'
      valid = false
    }

    if (!form.puesto_ocupado.trim()) {
      formErrors.puesto_ocupado = 'El puesto es requerido'
      valid = false
    }

    if (!form.telefono.trim()) {
      formErrors.telefono = 'El teléfono es requerido'
      valid = false
    }

    if (!form.fecha_inicio) {
      formErrors.fecha_inicio = 'La fecha de inicio es requerida'
      valid = false
    }

    // Validar que fecha_fin sea mayor a fecha_inicio
    if (form.fecha_inicio && form.fecha_fin && !empleoActual.value) {
      const inicio = new Date(form.fecha_inicio)
      const fin = new Date(form.fecha_fin)
      if (fin < inicio) {
        formErrors.fecha_fin = 'La fecha fin debe ser posterior a la fecha inicio'
        valid = false
      }
    }

    // Validar motivo_retiro si hay fecha_fin
    if (form.fecha_fin && !empleoActual.value && !form.motivo_retiro.trim()) {
      formErrors.motivo_retiro = 'El motivo de retiro es requerido cuando hay fecha de fin'
      valid = false
    }

    return valid
  }

  // Cargar datos
  async function loadReferencias () {
    loading.value = true
    try {
      const response = await personalService.getReferencias(props.personalId)
      items.value = response.data || response
    } catch {
      emit('error', 'Error al cargar referencias')
    } finally {
      loading.value = false
    }
  }

  // Guardar
  async function saveReferencia () {
    if (!validateForm()) return

    saving.value = true
    formError.value = null

    try {
      const data = {
        nombre_empresa: form.nombre_empresa,
        puesto_ocupado: form.puesto_ocupado,
        telefono: form.telefono,
        direccion: form.direccion || null,
        fecha_inicio: form.fecha_inicio,
        fecha_fin: empleoActual.value ? null : form.fecha_fin || null,
        motivo_retiro: empleoActual.value ? null : form.motivo_retiro || null,
      }

      await (isEditing.value ? personalService.updateReferencia(props.personalId, editingId.value, data) : personalService.createReferencia(props.personalId, data))

      await loadReferencias()
      cancelForm()
      emit('updated')
    } catch (error) {
      const errorData = error.response?.data
      if (errorData?.errors) {
        // Mapear errores del backend a los campos del formulario
        for (const key of Object.keys(errorData.errors)) {
          if (formErrors[key] !== undefined) {
            formErrors[key] = errorData.errors[key][0]
          }
        }
        formError.value = errorData.message || 'Error de validación'
      } else {
        formError.value = errorData?.message || 'Error al guardar referencia'
      }
      emit('error', formError.value)
    } finally {
      saving.value = false
    }
  }

  // Eliminar
  function confirmDelete (item) {
    itemToDelete.value = item
    deleteDialog.value = true
  }

  async function deleteReferencia () {
    if (!itemToDelete.value) return

    deleting.value = true
    try {
      await personalService.deleteReferencia(props.personalId, itemToDelete.value.id)
      items.value = items.value.filter(i => i.id !== itemToDelete.value.id)
      deleteDialog.value = false
      itemToDelete.value = null
      emit('updated')
    } catch {
      emit('error', 'Error al eliminar referencia')
    } finally {
      deleting.value = false
    }
  }

  // Watch personalId para recargar
  watch(
    () => props.personalId,
    newId => {
      if (newId) loadReferencias()
    },
    { immediate: true },
  )

  // Exponer método para recargar
  defineExpose({
    reload: loadReferencias,
  })
</script>
