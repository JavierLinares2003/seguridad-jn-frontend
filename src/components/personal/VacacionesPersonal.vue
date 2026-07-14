<template>
  <div>
    <!-- Tarjeta de Saldo -->
    <v-card class="mb-6" elevation="2" rounded="xl">
      <v-card-title class="d-flex align-center bg-teal-lighten-5 py-4 px-6">
        <v-icon color="teal-darken-2" start>mdi-umbrella-beach</v-icon>
        <span class="text-subtitle-1 font-weight-bold">Saldo de Vacaciones</span>
        <v-chip
          v-if="fechaInicio"
          class="ml-3"
          color="teal"
          label
          size="small"
          variant="tonal"
        >
          <v-icon size="14" start>mdi-calendar-today</v-icon>
          Inicio: {{ formatDate(fechaInicio) }}
        </v-chip>
        <v-spacer />
        <v-chip
          class="font-weight-bold text-body-2"
          :color="saldoColor"
          size="default"
          variant="flat"
        >
          <v-icon size="16" start>mdi-calendar-check</v-icon>
          {{ saldo.saldo_disponible }} días disponibles
        </v-chip>
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-6">
        <v-row v-if="!loadingSaldo" align="center">
          <!-- Saldo inicial -->
          <v-col cols="12" sm="6" md="3">
            <div class="text-center">
              <div class="text-caption text-medium-emphasis mb-1">Saldo Inicial</div>
              <div class="d-flex align-center justify-center ga-2">
                <span class="text-h5 font-weight-bold text-teal-darken-2">{{ saldo.saldo_inicial }}</span>
                <span class="text-caption text-medium-emphasis">días</span>
                <v-btn
                  v-if="!readonly"
                  density="compact"
                  icon
                  size="x-small"
                  variant="text"
                  @click="abrirEditarSaldo"
                >
                  <v-icon size="16">mdi-pencil</v-icon>
                </v-btn>
              </div>
            </div>
          </v-col>

          <v-col class="d-none d-md-flex justify-center" md="1">
            <v-icon color="medium-emphasis">mdi-plus</v-icon>
          </v-col>

          <!-- Días acumulados -->
          <v-col cols="12" sm="6" md="3">
            <div class="text-center">
              <div class="text-caption text-medium-emphasis mb-1">Días Ganados</div>
              <div class="d-flex align-center justify-center ga-2">
                <span class="text-h5 font-weight-bold text-primary">{{ saldo.dias_acumulados }}</span>
                <span class="text-caption text-medium-emphasis">días ({{ saldo.dias_anuales }}/año)</span>
              </div>
            </div>
          </v-col>

          <v-col class="d-none d-md-flex justify-center" md="1">
            <v-icon color="medium-emphasis">mdi-minus</v-icon>
          </v-col>

          <!-- Días tomados -->
          <v-col cols="12" sm="6" md="3">
            <div class="text-center">
              <div class="text-caption text-medium-emphasis mb-1">Días Tomados</div>
              <div class="d-flex align-center justify-center ga-2">
                <span class="text-h5 font-weight-bold text-error">{{ saldo.dias_tomados }}</span>
                <span class="text-caption text-medium-emphasis">días</span>
              </div>
            </div>
          </v-col>

        <!--   <v-col class="d-none d-md-flex justify-center" md="1">
            <v-icon color="medium-emphasis">mdi-equal</v-icon>
          </v-col> -->
        </v-row>

        <div v-if="loadingSaldo" class="d-flex justify-center py-6">
          <v-progress-circular color="teal" indeterminate />
        </div>
      </v-card-text>
    </v-card>

    <!-- Formulario de Registro -->
    <v-card v-if="!readonly" class="mb-6" elevation="2" rounded="xl">
      <v-card-title class="d-flex align-center bg-grey-lighten-5 py-4 px-6">
        <v-icon color="primary" start>mdi-calendar-plus</v-icon>
        <span class="text-subtitle-1 font-weight-bold">Registrar Vacación Aprobada</span>
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-6">
        <v-form ref="formRef" @submit.prevent="guardarVacacion">
          <v-row>
            <!-- Días solicitados -->
            <v-col cols="12" sm="6" md="3">
              <v-text-field
                v-model.number="form.dias_solicitados"
                density="comfortable"
                :error-messages="errors.dias_solicitados"
                label="Días Solicitados *"
                min="1"
                prepend-inner-icon="mdi-calendar-range"
                type="number"
                variant="outlined"
              />
            </v-col>

            <!-- Días aprobados -->
            <v-col cols="12" sm="6" md="3">
              <v-text-field
                v-model.number="form.dias_aprobados"
                density="comfortable"
                :error-messages="errors.dias_aprobados"
                label="Días Aprobados *"
                min="0"
                prepend-inner-icon="mdi-calendar-check"
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
                label="Fecha Inicio"
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
                :disabled="fechaFinBloqueada"
                :error-messages="errors.fecha_fin"
                label="Fecha Fin"
                :min="form.fecha_inicio"
                persistent-hint
                prepend-inner-icon="mdi-calendar-end"
                type="date"
                variant="outlined"
              />
            </v-col>

            <!-- Descripción -->
            <v-col cols="12" md="9">
              <v-text-field
                v-model="form.descripcion"
                density="comfortable"
                :error-messages="errors.descripcion"
                label="Descripción / Motivo"
                prepend-inner-icon="mdi-text"
                variant="outlined"
              />
            </v-col>

            <!-- Observaciones -->
            <v-col cols="12">
              <v-textarea
                v-model="form.observaciones"
                auto-grow
                density="comfortable"
                :error-messages="errors.observaciones"
                label="Observaciones"
                prepend-inner-icon="mdi-note-text"
                rows="2"
                variant="outlined"
              />
            </v-col>

            <!-- Documento -->
            <v-col cols="12">
              <div class="text-subtitle-2 mb-2">
                <v-icon class="mr-1" size="18">mdi-paperclip</v-icon>
                Documento de Aprobación
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
            <v-btn
              :disabled="saving"
              variant="text"
              @click="resetForm"
            >
              Limpiar
            </v-btn>
            <v-btn
              color="primary"
              :loading="saving"
              type="submit"
              variant="elevated"
            >
              <v-icon start>mdi-content-save</v-icon>
              Registrar Vacación
            </v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>

    <!-- Tabla de registros -->
    <v-card elevation="2" rounded="xl">
      <v-card-title class="d-flex align-center flex-wrap gap-2 py-4 px-6">
        <v-icon color="teal-darken-2" start>mdi-format-list-bulleted</v-icon>
        <span class="text-subtitle-1 font-weight-bold">Historial de Vacaciones</span>
        <v-spacer />
        <v-select
          v-model="filtroAnio"
          clearable
          density="compact"
          hide-details
          :items="aniosDisponibles"
          label="Filtrar por año"
          style="max-width: 150px"
          variant="outlined"
        />
      </v-card-title>
      <v-divider />

      <v-data-table
        :headers="headers"
        :items="vacacionesFiltradas"
        :loading="loading"
        no-data-text="No hay registros de vacaciones"
        :sort-by="[{ key: 'anio', order: 'desc' }]"
      >
        <!-- Año -->
        <template #item.anio="{ item }">
          <v-chip color="primary" size="small" variant="tonal">{{ item.anio }}</v-chip>
        </template>

        <!-- Período -->
        <template #item.periodo="{ item }">
          <span v-if="item.fecha_inicio || item.fecha_fin" class="text-body-2">
            {{ formatDate(item.fecha_inicio) }}
            <template v-if="item.fecha_fin"> — {{ formatDate(item.fecha_fin) }}</template>
          </span>
          <span v-else class="text-disabled text-caption">—</span>
        </template>

        <!-- Días solicitados -->
        <template #item.dias_solicitados="{ item }">
          <v-chip color="warning" size="small" variant="tonal">{{ item.dias_solicitados }}</v-chip>
        </template>

        <!-- Días aprobados -->
        <template #item.dias_aprobados="{ item }">
          <v-chip :color="item.dias_aprobados > 0 ? 'success' : 'grey'" size="small" variant="flat">
            {{ item.dias_aprobados }}
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
            {{ item.documento_extension?.toUpperCase() }}
          </v-btn>
          <span v-else class="text-disabled text-caption">Sin documento</span>
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

    <!-- Dialog editar saldo inicial -->
    <v-dialog v-model="dialogSaldo" max-width="400" persistent>
      <v-card rounded="xl">
        <v-card-title class="py-4 px-6">
          <v-icon class="mr-2" color="teal">mdi-pencil</v-icon>
          Editar Saldo Inicial
        </v-card-title>
        <v-card-text class="px-6 pb-2">
          <p class="text-body-2 text-medium-emphasis mb-4">
            Ingrese los días acumulados de años anteriores al inicio del sistema.
          </p>
          <v-text-field
            v-model.number="saldoInicialEdit"
            density="comfortable"
            label="Días de saldo inicial"
            min="0"
            prepend-inner-icon="mdi-counter"
            type="number"
            variant="outlined"
          />
        </v-card-text>
        <v-card-actions class="px-6 pb-4">
          <v-spacer />
          <v-btn :disabled="savingSaldo" variant="text" @click="dialogSaldo = false">Cancelar</v-btn>
          <v-btn color="primary" :loading="savingSaldo" variant="elevated" @click="guardarSaldoInicial">
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog confirmar eliminación -->
    <v-dialog v-model="deleteDialog" max-width="400" persistent>
      <v-card rounded="xl">
        <v-card-title class="py-4 px-6">
          <v-icon class="mr-2" color="error">mdi-alert</v-icon>
          Eliminar Registro
        </v-card-title>
        <v-card-text class="px-6">
          ¿Está seguro que desea eliminar el registro de vacación del año
          <strong>{{ itemToDelete?.anio }}</strong>?
          Esta acción no se puede deshacer.
        </v-card-text>
        <v-card-actions class="px-6 pb-4">
          <v-spacer />
          <v-btn :disabled="deleting" variant="text" @click="deleteDialog = false">Cancelar</v-btn>
          <v-btn color="error" :loading="deleting" variant="elevated" @click="eliminarVacacion">
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
  import vacacionesService from '@/services/vacacionesService'

  const props = defineProps({
    personalId: { type: Number, required: true },
    readonly: { type: Boolean, default: false },
    fechaInicio: { type: String, default: null },
  })

  const emit = defineEmits(['updated', 'error'])

  const snackbar = reactive({ show: false, text: '', color: 'success' })
  function showSuccess (text) { snackbar.text = text; snackbar.color = 'success'; snackbar.show = true }
  function showError (text) { snackbar.text = text; snackbar.color = 'error'; snackbar.show = true }

  // ─── Estado ────────────────────────────────────────────────────────────────
  const vacaciones = ref([])
  const saldo = ref({
    saldo_inicial: 0,
    dias_anuales: 8,
    dias_acumulados: 0,
    dias_tomados: 0,
    saldo_disponible: 0,
    anio_actual: new Date().getFullYear(),
  })
  const loading = ref(false)
  const loadingSaldo = ref(false)
  const saving = ref(false)
  const deleting = ref(false)
  const savingSaldo = ref(false)
  const downloadingId = ref(null)

  // Filtro
  const filtroAnio = ref(null)

  // Dialogs
  const deleteDialog = ref(false)
  const dialogSaldo = ref(false)
  const itemToDelete = ref(null)
  const saldoInicialEdit = ref(0)

  // File upload
  const fileInputRef = ref(null)
  const selectedFile = ref(null)
  const isDragging = ref(false)
  const uploadError = ref(null)
  const maxFileSizeMB = Number(import.meta.env.VITE_MAX_FILE_SIZE_MB) || 5

  // Formulario
  const formRef = ref(null)

  const form = reactive({
    fecha_inicio: '',
    fecha_fin: '',
    dias_solicitados: null,
    dias_aprobados: null,
    descripcion: '',
    observaciones: '',
  })
  const errors = reactive({})

  // ─── Computed ──────────────────────────────────────────────────────────────
  const saldoColor = computed(() => {
    const d = saldo.value.saldo_disponible
    if (d <= 0) return 'error'
    if (d <= 3) return 'warning'
    return 'teal-darken-2'
  })

  const aniosDisponibles = computed(() => {
    const anios = [...new Set(vacaciones.value.map(v => v.anio))].sort((a, b) => b - a)
    return anios
  })

  const vacacionesFiltradas = computed(() => {
    if (!filtroAnio.value) return vacaciones.value
    return vacaciones.value.filter(v => v.anio === filtroAnio.value)
  })

  const fechaFinBloqueada = computed(() =>
    !!form.fecha_inicio && !!form.dias_aprobados && form.dias_aprobados > 0,
  )

  watch([() => form.fecha_inicio, () => form.dias_aprobados], ([fecha, dias]) => {
    if (fecha && dias && dias > 0) {
      const start = new Date(fecha + 'T12:00:00')
      start.setDate(start.getDate() + Number(dias) - 1)
      form.fecha_fin = start.toISOString().split('T')[0]
    } else {
      form.fecha_fin = ''
    }
  })

  // ─── Tabla ─────────────────────────────────────────────────────────────────
  const headers = [
    { title: 'Año', key: 'anio', sortable: true, width: '80px' },
    { title: 'Período', key: 'periodo', sortable: false },
    { title: 'Solicitados', key: 'dias_solicitados', sortable: true, align: 'center' },
    { title: 'Aprobados', key: 'dias_aprobados', sortable: true, align: 'center' },
    { title: 'Descripción', key: 'descripcion', sortable: false },
    { title: 'Documento', key: 'documento', sortable: false, align: 'center' },
    { title: '', key: 'actions', sortable: false, align: 'center', width: '60px' },
  ]

  // ─── Carga de datos ────────────────────────────────────────────────────────
  async function loadVacaciones () {
    loading.value = true
    try {
      const response = await vacacionesService.getVacaciones(props.personalId)
      vacaciones.value = response.data?.vacaciones || []
      saldo.value = response.data?.saldo || saldo.value
    } catch {
      emit('error', 'Error al cargar vacaciones')
    } finally {
      loading.value = false
    }
  }

  // ─── Guardar vacación ──────────────────────────────────────────────────────
  async function guardarVacacion () {
    Object.keys(errors).forEach(k => delete errors[k])
    uploadError.value = null

    if (!form.dias_solicitados || form.dias_solicitados < 1) { errors.dias_solicitados = ['Mínimo 1 día']; return }
    if (form.dias_aprobados === null || form.dias_aprobados === '') { errors.dias_aprobados = ['Requerido']; return }

    if (form.fecha_inicio && form.fecha_fin && form.dias_aprobados > 0) {
      const start = new Date(form.fecha_inicio + 'T12:00:00')
      const end = new Date(form.fecha_fin + 'T12:00:00')
      const diff = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1
      if (diff !== Number(form.dias_aprobados)) {
        errors.fecha_fin = [`El rango debe cubrir exactamente ${form.dias_aprobados} día(s)`]
        return
      }
    }

    saving.value = true
    try {
      const formData = new FormData()
      formData.append('dias_solicitados', form.dias_solicitados)
      formData.append('dias_aprobados', form.dias_aprobados)
      if (form.fecha_inicio) formData.append('fecha_inicio', form.fecha_inicio)
      if (form.fecha_fin) formData.append('fecha_fin', form.fecha_fin)
      if (form.descripcion) formData.append('descripcion', form.descripcion)
      if (form.observaciones) formData.append('observaciones', form.observaciones)
      if (selectedFile.value) formData.append('documento', selectedFile.value)

      await vacacionesService.registrarVacacion(props.personalId, formData)
      showSuccess('Vacación registrada exitosamente.')
      resetForm()
      await loadVacaciones()
      emit('updated')
    } catch (error) {
      const apiErrors = error.response?.data?.errors
      if (apiErrors) {
        Object.assign(errors, Object.fromEntries(Object.entries(apiErrors).map(([k, v]) => [k, v])))
      } else {
        showError(error.apiMessage || 'Error al registrar la vacación.')
      }
    } finally {
      saving.value = false
    }
  }

  // ─── Eliminar ──────────────────────────────────────────────────────────────
  function confirmarEliminar (item) {
    itemToDelete.value = item
    deleteDialog.value = true
  }

  async function eliminarVacacion () {
    if (!itemToDelete.value) return
    deleting.value = true
    try {
      await vacacionesService.deleteVacacion(props.personalId, itemToDelete.value.id)
      showSuccess('Registro eliminado.')
      deleteDialog.value = false
      await loadVacaciones()
      emit('updated')
    } catch {
      showError('Error al eliminar el registro.')
    } finally {
      deleting.value = false
    }
  }

  // ─── Saldo inicial ─────────────────────────────────────────────────────────
  function abrirEditarSaldo () {
    saldoInicialEdit.value = saldo.value.saldo_inicial
    dialogSaldo.value = true
  }

  async function guardarSaldoInicial () {
    savingSaldo.value = true
    try {
      const response = await vacacionesService.updateSaldoInicial(props.personalId, saldoInicialEdit.value)
      saldo.value = response.data
      showSuccess('Saldo inicial actualizado.')
      dialogSaldo.value = false
      emit('updated')
    } catch {
      showError('Error al actualizar el saldo inicial.')
    } finally {
      savingSaldo.value = false
    }
  }

  // ─── Descarga de documento ────────────────────────────────────────────────
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

      const fileName = item.documento_nombre || `vacacion_${item.anio}.${item.documento_extension}`
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
  function triggerFileInput () {
    fileInputRef.value?.click()
  }

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
    form.fecha_inicio = ''
    form.fecha_fin = ''
    form.dias_solicitados = null
    form.dias_aprobados = null
    form.descripcion = ''
    form.observaciones = ''
    Object.keys(errors).forEach(k => delete errors[k])
    clearFile()
    formRef.value?.reset()
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────────────
  onMounted(() => {
    loadVacaciones()
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
