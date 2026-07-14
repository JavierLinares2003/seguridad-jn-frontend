<template>
  <div>
    <!-- Formulario de Registro -->
    <v-card v-if="!readonly" class="mb-6" elevation="2" rounded="xl">
      <v-card-title class="d-flex align-center bg-grey-lighten-5 py-4 px-6">
        <v-icon color="primary" start>mdi-plus-circle-outline</v-icon>
        <span class="text-subtitle-1 font-weight-bold">Registrar Permiso de Ausencia</span>
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-6">
        <v-form ref="formRef" @submit.prevent="guardarPermiso">
          <v-row>
            <!-- Tipo -->
            <v-col cols="12" sm="6" md="3">
              <v-select
                v-model="form.tipo"
                density="comfortable"
                :error-messages="errors.tipo"
                :items="tiposPermiso"
                label="Tipo de permiso *"
                prepend-inner-icon="mdi-tag-outline"
                variant="outlined"
              />
            </v-col>

            <!-- Cantidad aprobada -->
            <v-col cols="12" sm="6" md="3">
              <v-text-field
                v-model.number="form.cantidad_aprobada"
                density="comfortable"
                :error-messages="errors.cantidad_aprobada"
                :label="form.tipo === 'dias' ? 'Días aprobados *' : 'Horas aprobadas *'"
                min="1"
                :prepend-inner-icon="form.tipo === 'dias' ? 'mdi-calendar-check' : 'mdi-clock-check-outline'"
                type="number"
                variant="outlined"
              />
            </v-col>

            <!-- Fecha inicio -->
            <v-col cols="12" sm="6" md="3">
              <v-text-field
                v-model="form.fecha_inicio"
                density="comfortable"
                :error-messages="errors.fecha_inicio"
                label="Fecha inicio *"
                prepend-inner-icon="mdi-calendar-start"
                type="date"
                variant="outlined"
              />
            </v-col>

            <!-- Fecha fin -->
            <v-col cols="12" sm="6" md="3">
              <v-text-field
                v-model="form.fecha_fin"
                density="comfortable"
                :error-messages="errors.fecha_fin"
                label="Fecha fin *"
                :min="form.fecha_inicio"
                prepend-inner-icon="mdi-calendar-end"
                type="date"
                variant="outlined"
              />
            </v-col>

            <!-- Descripción -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.descripcion"
                density="comfortable"
                :error-messages="errors.descripcion"
                label="Descripción / Motivo *"
                prepend-inner-icon="mdi-text"
                variant="outlined"
              />
            </v-col>

            <!-- Observaciones -->
            <v-col cols="12" md="6">
              <v-textarea
                v-model="form.observaciones"
                auto-grow
                density="comfortable"
                :error-messages="errors.observaciones"
                label="Observaciones"
                prepend-inner-icon="mdi-note-text"
                rows="1"
                variant="outlined"
              />
            </v-col>

            <!-- Documento -->
            <v-col cols="12">
              <div class="text-subtitle-2 mb-2">
                <v-icon class="mr-1" size="18">mdi-paperclip</v-icon>
                Documento de aprobación (opcional)
              </div>

              <input
                ref="fileInputRef"
                accept=".pdf,.jpg,.jpeg,.png"
                hidden
                type="file"
                @change="onFileSelect"
              >

              <div
                v-if="!selectedFile"
                class="upload-area rounded-lg pa-6 text-center cursor-pointer"
                :class="{ 'dragging': isDragging }"
                @click="triggerFileInput"
                @dragenter.prevent="isDragging = true"
                @dragleave.prevent="isDragging = false"
                @dragover.prevent
                @drop.prevent="onDrop"
              >
                <v-icon class="mb-2" color="grey-lighten-1" size="40">mdi-cloud-upload-outline</v-icon>
                <div class="text-body-2 text-medium-emphasis">
                  Arrastra un archivo o <span class="text-primary font-weight-medium">selecciona</span>
                </div>
                <div class="text-caption text-disabled mt-1">PDF, JPG, PNG — máx. {{ maxFileSizeMB }}MB</div>
              </div>

              <v-alert
                v-if="selectedFile"
                class="mt-2"
                color="success"
                density="compact"
                rounded="lg"
                variant="tonal"
              >
                <template #prepend>
                  <v-icon>mdi-file-check</v-icon>
                </template>
                <div class="d-flex align-center justify-space-between">
                  <span class="text-body-2">{{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})</span>
                  <v-btn density="compact" icon size="x-small" variant="text" @click="clearFile">
                    <v-icon size="16">mdi-close</v-icon>
                  </v-btn>
                </div>
              </v-alert>

              <v-alert
                v-if="uploadError"
                class="mt-2"
                density="compact"
                rounded="lg"
                type="error"
                variant="tonal"
              >
                {{ uploadError }}
              </v-alert>
            </v-col>
          </v-row>

          <v-divider class="mb-4 mt-2" />

          <div class="d-flex ga-3 justify-end">
            <v-btn :disabled="saving" variant="text" @click="resetForm">Limpiar</v-btn>
            <v-btn color="primary" :loading="saving" type="submit" variant="elevated">
              <v-icon start>mdi-content-save</v-icon>
              Registrar permiso
            </v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>

    <!-- Tabla de permisos -->
    <v-card elevation="2" rounded="xl">
      <v-card-title class="d-flex align-center flex-wrap gap-2 py-4 px-6">
        <v-icon color="indigo-darken-2" start>mdi-format-list-bulleted</v-icon>
        <span class="text-subtitle-1 font-weight-bold">Historial de Permisos</span>
        <v-spacer />
        <v-select
          v-model="filtroTipo"
          clearable
          density="compact"
          hide-details
          :items="tiposPermiso"
          label="Filtrar por tipo"
          style="max-width: 160px"
          variant="outlined"
        />
      </v-card-title>
      <v-divider />

      <v-data-table
        :headers="headers"
        :items="permisosFiltrados"
        :loading="loading"
        no-data-text="No hay permisos registrados"
        :sort-by="[{ key: 'fecha_inicio', order: 'desc' }]"
      >
        <!-- Tipo -->
        <template #item.tipo="{ item }">
          <v-chip
            :color="item.tipo === 'dias' ? 'teal' : 'indigo'"
            size="small"
            variant="tonal"
          >
            <v-icon size="14" start>{{ item.tipo === 'dias' ? 'mdi-calendar' : 'mdi-clock-outline' }}</v-icon>
            {{ item.tipo === 'dias' ? 'Días' : 'Horas' }}
          </v-chip>
        </template>

        <!-- Período -->
        <template #item.periodo="{ item }">
          <span v-if="item.fecha_inicio" class="text-body-2">
            {{ formatDate(item.fecha_inicio) }}
            <template v-if="item.fecha_fin"> — {{ formatDate(item.fecha_fin) }}</template>
          </span>
          <span v-else class="text-disabled text-caption">—</span>
        </template>

        <!-- Cantidad aprobada -->
        <template #item.cantidad_aprobada="{ item }">
          <v-chip color="primary" size="small" variant="tonal">
            {{ item.cantidad_aprobada }} {{ item.tipo === 'dias' ? 'd' : 'h' }}
          </v-chip>
        </template>

        <!-- Saldo pendiente -->
        <template #item.saldo_pendiente="{ item }">
          <v-chip
            :color="item.saldo_pendiente <= 0 ? 'success' : 'warning'"
            size="small"
            variant="flat"
          >
            {{ item.saldo_pendiente }} {{ item.tipo === 'dias' ? 'd' : 'h' }}
          </v-chip>
        </template>

        <!-- Descripción -->
        <template #item.descripcion="{ item }">
          <span class="text-body-2">{{ item.descripcion || '—' }}</span>
        </template>

        <!-- Documento -->
        <template #item.documento="{ item }">
          <v-btn
            v-if="item.tiene_documento"
            color="primary"
            density="compact"
            :loading="downloadingId === item.id"
            size="small"
            variant="tonal"
            @click="descargarDocumento(item)"
          >
            <v-icon size="16" start>mdi-download</v-icon>
            Doc.
          </v-btn>
          <span v-else class="text-disabled text-caption">—</span>
        </template>

        <!-- Reposiciones -->
        <template #item.reposiciones="{ item }">
          <v-btn
            density="compact"
            size="small"
            variant="text"
            @click="verDetalle(item)"
          >
            <v-icon size="16" start>mdi-eye-outline</v-icon>
            Ver
          </v-btn>
        </template>

        <!-- Acciones -->
        <template #item.actions="{ item }">
          <v-btn
            v-if="!readonly"
            color="error"
            density="compact"
            icon
            size="small"
            variant="text"
            @click="confirmarEliminar(item)"
          >
            <v-icon size="18">mdi-delete</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialog detalle / reposiciones -->
    <v-dialog v-model="dialogDetalle" max-width="600" scrollable>
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center bg-indigo-lighten-5 py-4 px-6">
          <v-icon color="indigo-darken-2" start>mdi-history</v-icon>
          <span class="text-subtitle-1 font-weight-bold">Detalle del permiso</span>
          <v-spacer />
          <v-btn icon size="small" variant="text" @click="dialogDetalle = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-6">
          <div v-if="loadingDetalle" class="d-flex justify-center py-6">
            <v-progress-circular color="indigo" indeterminate />
          </div>
          <template v-else-if="detallePermiso">
            <!-- Resumen -->
            <v-row class="mb-4" dense>
              <v-col cols="6" sm="3">
                <div class="text-caption text-medium-emphasis">Tipo</div>
                <v-chip :color="detallePermiso.tipo === 'dias' ? 'teal' : 'indigo'" size="small" variant="tonal">
                  {{ detallePermiso.tipo === 'dias' ? 'Días' : 'Horas' }}
                </v-chip>
              </v-col>
              <v-col cols="6" sm="3">
                <div class="text-caption text-medium-emphasis">Aprobado</div>
                <div class="font-weight-bold">
                  {{ detallePermiso.cantidad_aprobada }} {{ detallePermiso.tipo === 'dias' ? 'días' : 'horas' }}
                </div>
              </v-col>
              <v-col cols="6" sm="3">
                <div class="text-caption text-medium-emphasis">Repuesto</div>
                <div class="font-weight-bold text-success">
                  {{ detallePermiso.horas_repuestas ?? 0 }} {{ detallePermiso.tipo === 'dias' ? 'días' : 'horas' }}
                </div>
              </v-col>
              <v-col cols="6" sm="3">
                <div class="text-caption text-medium-emphasis">Saldo pendiente</div>
                <div :class="detallePermiso.saldo_pendiente <= 0 ? 'text-success' : 'text-warning'" class="font-weight-bold">
                  {{ detallePermiso.saldo_pendiente }} {{ detallePermiso.tipo === 'dias' ? 'días' : 'horas' }}
                </div>
              </v-col>
              <v-col cols="12">
                <div class="text-caption text-medium-emphasis">Período</div>
                <div class="text-body-2">
                  {{ formatDate(detallePermiso.fecha_inicio) }} — {{ formatDate(detallePermiso.fecha_fin) }}
                </div>
              </v-col>
              <v-col v-if="detallePermiso.descripcion" cols="12">
                <div class="text-caption text-medium-emphasis">Descripción</div>
                <div class="text-body-2">{{ detallePermiso.descripcion }}</div>
              </v-col>
            </v-row>

            <v-divider class="mb-4" />

            <!-- Reposiciones -->
            <div class="text-subtitle-2 mb-3">
              <v-icon class="mr-1" color="indigo" size="18">mdi-repeat</v-icon>
              Reposiciones registradas
              <v-chip class="ml-2" size="x-small" variant="tonal">{{ (detallePermiso.reposiciones || []).length }}</v-chip>
            </div>

            <v-list v-if="(detallePermiso.reposiciones || []).length > 0" density="compact" lines="one">
              <v-list-item
                v-for="rep in detallePermiso.reposiciones"
                :key="rep.id"
                rounded="lg"
              >
                <template #prepend>
                  <v-icon color="success" size="20">mdi-check-circle-outline</v-icon>
                </template>
                <v-list-item-title>{{ formatDate(rep.fecha) }}</v-list-item-title>
                <v-list-item-subtitle>{{ rep.proyecto || 'Sin proyecto' }}</v-list-item-subtitle>
                <template #append>
                  <v-chip color="success" size="x-small" variant="tonal">
                    {{ rep.horas_reposicion }}h
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
            <div v-else class="text-center text-medium-emphasis text-body-2 py-4">
              No hay reposiciones registradas aún
            </div>

            <div v-if="detallePermiso.ausencias_count !== undefined" class="mt-4 text-caption text-medium-emphasis">
              Ausencias vinculadas: {{ detallePermiso.ausencias_count }}
            </div>
          </template>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Dialog confirmar eliminación -->
    <v-dialog v-model="deleteDialog" max-width="400" persistent>
      <v-card rounded="xl">
        <v-card-title class="py-4 px-6">
          <v-icon class="mr-2" color="error">mdi-alert</v-icon>
          Eliminar permiso
        </v-card-title>
        <v-card-text class="px-6">
          ¿Está seguro que desea eliminar este permiso? Esta acción no se puede deshacer.
        </v-card-text>
        <v-card-actions class="px-6 pb-4">
          <v-spacer />
          <v-btn :disabled="deleting" variant="text" @click="deleteDialog = false">Cancelar</v-btn>
          <v-btn color="error" :loading="deleting" variant="elevated" @click="eliminarPermiso">
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" elevation="8" rounded="lg">
      <div class="d-flex align-center">
        <v-icon class="mr-2" :icon="snackbar.color === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle'" />
        {{ snackbar.text }}
      </div>
    </v-snackbar>
  </div>
</template>

<script setup>
  import permisosService from '@/services/permisosService'

  const props = defineProps({
    personalId: { type: Number, required: true },
    readonly: { type: Boolean, default: false },
  })

  const emit = defineEmits(['updated', 'error'])

  const snackbar = reactive({ show: false, text: '', color: 'success' })
  function showSuccess (text) { snackbar.text = text; snackbar.color = 'success'; snackbar.show = true }
  function showError (text) { snackbar.text = text; snackbar.color = 'error'; snackbar.show = true }

  const tiposPermiso = [
    { title: 'Horas', value: 'horas' },
    { title: 'Días', value: 'dias' },
  ]

  // ─── Estado ────────────────────────────────────────────────────────────────
  const permisos = ref([])
  const loading = ref(false)
  const saving = ref(false)
  const deleting = ref(false)
  const downloadingId = ref(null)
  const loadingDetalle = ref(false)

  const filtroTipo = ref(null)

  const deleteDialog = ref(false)
  const dialogDetalle = ref(false)
  const itemToDelete = ref(null)
  const detallePermiso = ref(null)

  const fileInputRef = ref(null)
  const selectedFile = ref(null)
  const isDragging = ref(false)
  const uploadError = ref(null)
  const maxFileSizeMB = Number(import.meta.env.VITE_MAX_FILE_SIZE_MB) || 5

  const formRef = ref(null)
  const form = reactive({
    tipo: 'horas',
    cantidad_aprobada: null,
    fecha_inicio: '',
    fecha_fin: '',
    descripcion: '',
    observaciones: '',
  })
  const errors = reactive({})

  // ─── Computed ──────────────────────────────────────────────────────────────
  const permisosFiltrados = computed(() => {
    if (!filtroTipo.value) return permisos.value
    return permisos.value.filter(p => p.tipo === filtroTipo.value)
  })

  // ─── Tabla ─────────────────────────────────────────────────────────────────
  const headers = [
    { title: 'Tipo', key: 'tipo', sortable: true, width: '100px' },
    { title: 'Período', key: 'periodo', sortable: false },
    { title: 'Aprobado', key: 'cantidad_aprobada', sortable: true, align: 'center' },
    { title: 'Saldo', key: 'saldo_pendiente', sortable: true, align: 'center' },
    { title: 'Descripción', key: 'descripcion', sortable: false },
    { title: 'Documento', key: 'documento', sortable: false, align: 'center', width: '90px' },
    { title: 'Reposiciones', key: 'reposiciones', sortable: false, align: 'center', width: '100px' },
    { title: '', key: 'actions', sortable: false, align: 'center', width: '60px' },
  ]

  // ─── Carga de datos ────────────────────────────────────────────────────────
  async function loadPermisos () {
    loading.value = true
    try {
      const response = await permisosService.getPermisos(props.personalId)
      permisos.value = response.data || []
    } catch {
      emit('error', 'Error al cargar permisos')
    } finally {
      loading.value = false
    }
  }

  // ─── Guardar ───────────────────────────────────────────────────────────────
  async function guardarPermiso () {
    Object.keys(errors).forEach(k => delete errors[k])
    uploadError.value = null

    if (!form.tipo) { errors.tipo = ['Requerido']; return }
    if (!form.cantidad_aprobada || form.cantidad_aprobada < 1) { errors.cantidad_aprobada = ['Mínimo 1']; return }
    if (!form.descripcion?.trim()) { errors.descripcion = ['Requerido']; return }
    if (!form.fecha_inicio) { errors.fecha_inicio = ['Requerido']; return }
    if (!form.fecha_fin) { errors.fecha_fin = ['Requerido']; return }

    saving.value = true
    try {
      const formData = new FormData()
      formData.append('tipo', form.tipo)
      formData.append('cantidad_aprobada', form.cantidad_aprobada)
      formData.append('fecha_inicio', form.fecha_inicio)
      formData.append('fecha_fin', form.fecha_fin)
      if (form.descripcion) formData.append('descripcion', form.descripcion)
      if (form.observaciones) formData.append('observaciones', form.observaciones)
      if (selectedFile.value) formData.append('documento', selectedFile.value)

      await permisosService.registrarPermiso(props.personalId, formData)
      showSuccess('Permiso registrado exitosamente.')
      resetForm()
      await loadPermisos()
      emit('updated')
    } catch (error) {
      const apiErrors = error.response?.data?.errors
      if (apiErrors) {
        Object.assign(errors, Object.fromEntries(Object.entries(apiErrors).map(([k, v]) => [k, v])))
      } else {
        showError(error.apiMessage || 'Error al registrar el permiso.')
      }
    } finally {
      saving.value = false
    }
  }

  // ─── Detalle ───────────────────────────────────────────────────────────────
  async function verDetalle (item) {
    dialogDetalle.value = true
    loadingDetalle.value = true
    detallePermiso.value = null
    try {
      const response = await permisosService.getPermiso(props.personalId, item.id)
      detallePermiso.value = response.data
    } catch {
      showError('Error al cargar el detalle.')
      dialogDetalle.value = false
    } finally {
      loadingDetalle.value = false
    }
  }

  // ─── Eliminar ──────────────────────────────────────────────────────────────
  function confirmarEliminar (item) {
    itemToDelete.value = item
    deleteDialog.value = true
  }

  async function eliminarPermiso () {
    if (!itemToDelete.value) return
    deleting.value = true
    try {
      await permisosService.deletePermiso(props.personalId, itemToDelete.value.id)
      showSuccess('Permiso eliminado.')
      deleteDialog.value = false
      await loadPermisos()
      emit('updated')
    } catch {
      showError('Error al eliminar el permiso.')
    } finally {
      deleting.value = false
    }
  }

  // ─── Descarga de documento ─────────────────────────────────────────────────
  async function descargarDocumento (item) {
    downloadingId.value = item.id
    try {
      const token = localStorage.getItem('auth_token_jn')
      const axios = (await import('axios')).default
      const response = await axios({
        url: item.url_documento,
        method: 'GET',
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` },
      })

      const fileName = `permiso_${item.id}.pdf`
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/octet-stream',
      })

      if (window.showSaveFilePicker) {
        try {
          const handle = await window.showSaveFilePicker({ suggestedName: fileName })
          const writable = await handle.createWritable()
          await writable.write(blob)
          await writable.close()
          return
        } catch (e) {
          if (e.name === 'AbortError') return
        }
      }

      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = fileName
      document.body.append(link)
      link.click()
      setTimeout(() => { link.remove(); URL.revokeObjectURL(blobUrl) }, 100)
    } catch {
      showError('Error al descargar el documento.')
    } finally {
      downloadingId.value = null
    }
  }

  // ─── File upload helpers ───────────────────────────────────────────────────
  function triggerFileInput () { fileInputRef.value?.click() }

  function onFileSelect (event) {
    const files = event.target.files
    if (files.length > 0) handleFile(files[0])
  }

  function onDrop (event) {
    isDragging.value = false
    const files = event.dataTransfer.files
    if (files.length > 0) handleFile(files[0])
  }

  function handleFile (file) {
    uploadError.value = null
    if (file.size > maxFileSizeMB * 1024 * 1024) {
      uploadError.value = `El archivo excede el tamaño máximo de ${maxFileSizeMB}MB`
      return
    }
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext)) {
      uploadError.value = `Extensión .${ext} no permitida. Use PDF, JPG o PNG.`
      return
    }
    selectedFile.value = file
  }

  function clearFile () {
    selectedFile.value = null
    uploadError.value = null
    if (fileInputRef.value) fileInputRef.value.value = ''
  }

  // ─── Utils ─────────────────────────────────────────────────────────────────
  function formatDate (date) {
    if (!date) return '—'
    const dateOnly = String(date).split(/[T ]/)[0]
    return new Date(dateOnly + 'T12:00:00').toLocaleDateString('es-GT', {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  }

  function formatFileSize (bytes) {
    if (!bytes) return ''
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  function resetForm () {
    form.tipo = 'horas'
    form.cantidad_aprobada = null
    form.fecha_inicio = ''
    form.fecha_fin = ''
    form.descripcion = ''
    form.observaciones = ''
    Object.keys(errors).forEach(k => delete errors[k])
    clearFile()
    formRef.value?.reset()
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────────────
  onMounted(() => {
    loadPermisos()
  })
</script>

<style scoped>
.upload-area {
  border: 2px dashed rgb(var(--v-theme-on-surface), 0.15);
  transition: border-color 0.2s, background-color 0.2s;
}

.upload-area:hover,
.upload-area.dragging {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.04);
  cursor: pointer;
}
</style>
