<template>
  <div>
    <!-- Alertas de documentos próximos a vencer -->
    <v-alert
      v-if="documentosProximosVencer.length > 0"
      class="mb-4"
      closable
      type="warning"
      variant="tonal"
    >
      <template #title>
        <v-icon start>mdi-alert-clock</v-icon>
        Documentos próximos a vencer
      </template>
      <ul class="mt-2">
        <li v-for="doc in documentosProximosVencer" :key="doc.id">
          <strong>{{ doc.tipo_documento?.nombre || doc.nombre_documento }}</strong> -
          Vence: {{ formatDate(doc.fecha_vencimiento) }}
          <v-chip
            class="ml-2"
            :color="getVencimientoColor(doc.fecha_vencimiento)"
            size="x-small"
          >
            {{ getDiasRestantes(doc.fecha_vencimiento) }}
          </v-chip>
        </li>
      </ul>
    </v-alert>

    <!-- Filtros y botón agregar -->
    <div class="d-flex flex-wrap gap-3 mb-4 align-center">
      <v-select
        v-model="filtroTipo"
        clearable
        density="compact"
        hide-details
        item-title="nombre"
        item-value="id"
        :items="tiposDocumento"
        label="Filtrar por tipo"
        style="max-width: 250px"
        variant="outlined"
        @update:model-value="filtrarDocumentos"
      />

      <v-spacer />

      <v-btn
        v-if="!readonly"
        color="primary"
        size="small"
        @click="showUploadDialog = true"
      >
        <v-icon start>mdi-upload</v-icon>
        Subir Documento
      </v-btn>
    </div>

    <!-- Lista de documentos -->
    <v-data-table
      density="compact"
      :headers="headers"
      :items="documentosFiltrados"
      :items-per-page="10"
      :loading="loading"
    >
      <!-- Nombre y tipo -->
      <template #item.nombre="{ item }">
        <div>
          <div class="d-flex align-center">
            <v-icon class="mr-2" :color="getFileIconColor(item.extension)">
              {{ getFileIcon(item.extension) }}
            </v-icon>
            <div>
              <strong>{{ item.nombre_documento || item.nombre_archivo_original }}</strong>
              <div class="text-caption text-grey">
                {{ item.tipo_documento?.nombre || "Sin tipo" }}
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Fecha vencimiento -->
      <template #item.fecha_vencimiento="{ item }">
        <template v-if="item.fecha_vencimiento">
          <div class="d-flex align-center">
            <span>{{ formatDate(item.fecha_vencimiento) }}</span>
            <v-chip
              class="ml-2"
              :color="getVencimientoColor(item.fecha_vencimiento)"
              size="x-small"
            >
              {{ getEstadoVencimiento(item.fecha_vencimiento) }}
            </v-chip>
          </div>
        </template>
        <span v-else class="text-grey">N/A</span>
      </template>

      <!-- Estado -->
      <template #item.estado_documento="{ item }">
        <v-chip
          :color="getEstadoDocumentoColor(item.estado_documento)"
          size="small"
          variant="tonal"
        >
          {{ item.estado_documento || "vigente" }}
        </v-chip>
      </template>

      <!-- Fecha subida -->
      <template #item.fecha_subida="{ item }">
        {{ formatDate(item.fecha_subida) }}
      </template>

      <!-- Acciones -->
      <template #item.actions="{ item }">
        <v-btn
          color="primary"
          icon="mdi-download"
          size="small"
          :title="'Descargar ' + (item.nombre_documento || item.nombre_archivo_original)"
          variant="text"
          @click="downloadDocument(item)"
        />
        <v-btn
          color="info"
          icon="mdi-eye"
          size="small"
          title="Vista previa"
          variant="text"
          @click="previewDocument(item)"
        />
        <v-btn
          v-if="!readonly"
          color="error"
          icon="mdi-delete"
          size="small"
          title="Eliminar"
          variant="text"
          @click="confirmDelete(item)"
        />
      </template>

      <!-- No data -->
      <template #no-data>
        <div class="text-center py-8 text-grey">
          <v-icon size="64">mdi-file-document-outline</v-icon>
          <p class="mt-2">No hay documentos registrados</p>
          <v-btn
            v-if="!readonly"
            class="mt-2"
            color="primary"
            size="small"
            variant="tonal"
            @click="showUploadDialog = true"
          >
            Subir primer documento
          </v-btn>
        </div>
      </template>
    </v-data-table>

    <!-- Dialog para subir documento -->
    <v-dialog v-model="showUploadDialog" max-width="600" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon color="primary" start>mdi-file-upload</v-icon>
          Subir Documento
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" @click="closeUploadDialog" />
        </v-card-title>

        <v-card-text>
          <v-form ref="uploadFormRef" @submit.prevent="uploadDocument">
            <!-- Drag & Drop Area -->
            <div
              class="drop-zone mb-4"
              :class="{
                'drop-zone--active': isDragging,
                'drop-zone--has-file': selectedFile,
              }"
              @click="triggerFileInput"
              @dragenter.prevent="onDragEnter"
              @dragleave.prevent="onDragLeave"
              @dragover.prevent
              @drop.prevent="onDrop"
            >
              <input
                ref="fileInputRef"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                hidden
                type="file"
                @change="onFileSelect"
              >

              <template v-if="!selectedFile">
                <v-icon color="grey" size="48">mdi-cloud-upload</v-icon>
                <p class="text-body-1 mt-2">
                  Arrastra un archivo aquí o
                  <strong>haz clic para seleccionar</strong>
                </p>
                <p class="text-caption text-grey">
                  PDF, Word, Imágenes (máx. {{ maxFileSizeMB }}MB)
                </p>
              </template>

              <template v-else>
                <v-icon
                  :color="getFileIconColor(getFileExtension(selectedFile.name))"
                  size="48"
                >
                  {{ getFileIcon(getFileExtension(selectedFile.name)) }}
                </v-icon>
                <p class="text-body-1 mt-2">{{ selectedFile.name }}</p>
                <p class="text-caption text-grey">
                  {{ formatFileSize(selectedFile.size) }}
                </p>
                <v-btn
                  class="mt-2"
                  color="error"
                  size="small"
                  variant="text"
                  @click.stop="clearFile"
                >
                  Quitar archivo
                </v-btn>
              </template>
            </div>

            <!-- Progress bar -->
            <v-progress-linear
              v-if="uploading"
              class="mb-4"
              color="primary"
              height="8"
              :model-value="uploadProgress"
              rounded
            >
              <template #default>
                <span class="text-caption">{{ uploadProgress }}%</span>
              </template>
            </v-progress-linear>

            <!-- Campos del formulario -->
            <v-row>
              <v-col cols="12">
                <v-select
                  v-model="uploadForm.tipo_documento_proyecto_id"
                  density="compact"
                  item-title="nombre"
                  item-value="id"
                  :items="tiposDocumento"
                  label="Tipo de Documento *"
                  :loading="loadingTipos"
                  :rules="[(v) => !!v || 'Seleccione un tipo']"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="uploadForm.nombre_documento"
                  density="compact"
                  label="Nombre del documento"
                  placeholder="Opcional - se usa nombre del archivo"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="uploadForm.fecha_vencimiento"
                  density="compact"
                  hint="Dejar vacío si no vence"
                  label="Fecha de Vencimiento"
                  persistent-hint
                  type="date"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="uploadForm.descripcion"
                  auto-grow
                  density="compact"
                  label="Descripción"
                  rows="2"
                  variant="outlined"
                />
              </v-col>
            </v-row>

            <!-- Error message -->
            <v-alert
              v-if="uploadError"
              class="mt-3"
              closable
              density="compact"
              type="error"
              variant="tonal"
              @click:close="uploadError = null"
            >
              {{ uploadError }}
            </v-alert>
          </v-form>
        </v-card-text>

        <v-card-actions class="bg-grey-lighten-4">
          <v-spacer />
          <v-btn variant="text" @click="closeUploadDialog"> Cancelar </v-btn>
          <v-btn
            color="primary"
            :disabled="!selectedFile || !uploadForm.tipo_documento_proyecto_id"
            :loading="uploading"
            variant="flat"
            @click="uploadDocument"
          >
            <v-icon start>mdi-upload</v-icon>
            Subir
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog confirmar eliminación -->
    <v-dialog v-model="deleteDialog" max-width="400" persistent>
      <v-card>
        <v-card-title class="text-subtitle-1">
          <v-icon class="mr-2" color="error">mdi-alert</v-icon>
          Confirmar Eliminación
        </v-card-title>
        <v-card-text>
          ¿Está seguro de eliminar el documento
          <strong>{{
            itemToDelete?.nombre_documento || itemToDelete?.nombre_archivo_original
          }}</strong>
          ?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false"> Cancelar </v-btn>
          <v-btn
            color="error"
            :loading="deleting"
            variant="flat"
            @click="deleteDocument"
          >
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog vista previa -->
    <v-dialog v-model="previewDialog" max-width="900">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon start>mdi-file-eye</v-icon>
          {{ previewItem?.nombre_documento || previewItem?.nombre_archivo_original }}
          <v-spacer />
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="previewDialog = false"
          />
        </v-card-title>
        <v-card-text class="text-center pa-0">
          <template v-if="isImagePreview && previewItem?.blob_url">
            <v-img
              contain
              max-height="600"
              :src="previewItem.blob_url"
            />
          </template>
          <template v-else-if="isPdfPreview && previewItem?.blob_url">
            <iframe
              height="600"
              :src="previewItem.blob_url"
              style="border: none"
              width="100%"
            />
          </template>
          <template v-else-if="!previewItem?.blob_url">
            <div class="pa-8">
              <v-progress-circular color="primary" indeterminate />
              <p class="mt-4">Cargando vista previa...</p>
            </div>
          </template>
          <template v-else>
            <div class="pa-8 text-grey">
              <v-icon size="64">mdi-file-document</v-icon>
              <p class="mt-4">
                Vista previa no disponible para este tipo de archivo
              </p>
              <v-btn
                class="mt-4"
                color="primary"
                @click="downloadDocument(previewItem)"
              >
                <v-icon start>mdi-download</v-icon>
                Descargar archivo
              </v-btn>
            </div>
          </template>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
  import { computed, onMounted, reactive, ref, watch } from 'vue'
  import { CATALOGOS } from '@/services/catalogoService'
  import proyectoService from '@/services/proyectoService'
  import { useCatalogosStore } from '@/stores/catalogos'

  const props = defineProps({
    proyectoId: {
      type: [Number, String],
      required: true,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
  })

  const emit = defineEmits(['updated', 'error'])

  const catalogosStore = useCatalogosStore()

  // Estado
  const documentos = ref([])
  const loading = ref(false)
  const uploading = ref(false)
  const deleting = ref(false)
  const uploadProgress = ref(0)
  const uploadError = ref(null)
  const loadingTipos = ref(false)

  // Filtros
  const filtroTipo = ref(null)
  const documentosFiltrados = ref([])

  // Dialogs
  const showUploadDialog = ref(false)
  const deleteDialog = ref(false)
  const previewDialog = ref(false)
  const itemToDelete = ref(null)
  const previewItem = ref(null)

  // Drag & Drop
  const isDragging = ref(false)
  const selectedFile = ref(null)
  const fileInputRef = ref(null)
  const uploadFormRef = ref(null)

  // Formulario de upload
  const uploadForm = reactive({
    tipo_documento_proyecto_id: null,
    nombre_documento: '',
    descripcion: '',
    fecha_vencimiento: '',
  })

  // Tipos de documento
  const tiposDocumento = computed(() =>
    catalogosStore.getCatalogo(CATALOGOS.TIPOS_DOCUMENTOS_PROYECTO),
  )

  // Headers de la tabla
  const headers = [
    { title: 'Documento', key: 'nombre', sortable: true },
    { title: 'Vencimiento', key: 'fecha_vencimiento', sortable: true },
    { title: 'Estado', key: 'estado_documento', sortable: true, align: 'center' },
    { title: 'Fecha Subida', key: 'fecha_subida', sortable: true },
    {
      title: '',
      key: 'actions',
      sortable: false,
      width: '130px',
      align: 'center',
    },
  ]

  // Documentos próximos a vencer (30 días)
  const documentosProximosVencer = computed(() => {
    const hoy = new Date()
    const limite = new Date()
    limite.setDate(limite.getDate() + 30)

    return documentos.value.filter(doc => {
      if (!doc.fecha_vencimiento) return false
      const vencimiento = new Date(doc.fecha_vencimiento)
      return vencimiento >= hoy && vencimiento <= limite
    })
  })

  // Preview helpers
  const isImagePreview = computed(() => {
    if (!previewItem.value || !previewItem.value.extension) return false
    const ext = previewItem.value.extension.toLowerCase()
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)
  })

  const isPdfPreview = computed(() => {
    if (!previewItem.value || !previewItem.value.extension) return false
    const ext = previewItem.value.extension.toLowerCase()
    return ext === 'pdf'
  })

  // Helpers de formato
  function formatDate (date) {
    if (!date) return '-'
    // Extraer solo la parte de fecha para evitar desfase por timezone
    const dateOnly = typeof date === 'string' && date.includes('T')
      ? date.split('T')[0]
      : date
    return new Date(dateOnly + 'T12:00:00').toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  function formatFileSize (bytes) {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  function getFileExtension (filename) {
    return filename?.split('.').pop() || ''
  }

  function getFileIcon (extension) {
    const ext = extension?.toLowerCase()
    const icons = {
      pdf: 'mdi-file-pdf-box',
      doc: 'mdi-file-word',
      docx: 'mdi-file-word',
      xls: 'mdi-file-excel',
      xlsx: 'mdi-file-excel',
      jpg: 'mdi-file-image',
      jpeg: 'mdi-file-image',
      png: 'mdi-file-image',
      gif: 'mdi-file-image',
      webp: 'mdi-file-image',
    }
    return icons[ext] || 'mdi-file-document'
  }

  function getFileIconColor (extension) {
    const ext = extension?.toLowerCase()
    const colors = {
      pdf: 'red',
      doc: 'blue',
      docx: 'blue',
      xls: 'green',
      xlsx: 'green',
      jpg: 'orange',
      jpeg: 'orange',
      png: 'orange',
      gif: 'purple',
    }
    return colors[ext] || 'grey'
  }

  function getEstadoDocumentoColor (estado) {
    const colors = {
      vigente: 'success',
      por_vencer: 'warning',
      vencido: 'error',
    }
    return colors[estado?.toLowerCase()] || 'grey'
  }

  function getVencimientoColor (fecha) {
    if (!fecha) return 'grey'
    const hoy = new Date()
    const vencimiento = new Date(fecha)
    const diff = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24))

    if (diff < 0) return 'error'
    if (diff <= 7) return 'error'
    if (diff <= 30) return 'warning'
    return 'success'
  }

  function getEstadoVencimiento (fecha) {
    if (!fecha) return ''
    const hoy = new Date()
    const vencimiento = new Date(fecha)
    const diff = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24))

    if (diff < 0) return 'Vencido'
    if (diff === 0) return 'Vence hoy'
    if (diff === 1) return 'Vence mañana'
    if (diff <= 7) return `${diff} días`
    if (diff <= 30) return `${diff} días`
    return 'Vigente'
  }

  function getDiasRestantes (fecha) {
    if (!fecha) return ''
    const hoy = new Date()
    const vencimiento = new Date(fecha)
    const diff = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24))

    if (diff < 0) return 'Vencido'
    if (diff === 0) return 'Hoy'
    if (diff === 1) return '1 día'
    return `${diff} días`
  }

  // Drag & Drop handlers
  function onDragEnter () {
    isDragging.value = true
  }

  function onDragLeave () {
    isDragging.value = false
  }

  function onDrop (event) {
    isDragging.value = false
    const files = event.dataTransfer.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  function triggerFileInput () {
    fileInputRef.value?.click()
  }

  function onFileSelect (event) {
    const files = event.target.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  const maxFileSizeMB = Number(import.meta.env.VITE_MAX_FILE_SIZE_MB) || 2

  function handleFile (file) {
    if (file.size > maxFileSizeMB * 1024 * 1024) {
      uploadError.value = `El archivo excede el tamaño máximo de ${maxFileSizeMB}MB`
      return
    }

    // Validar tipo
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    if (!allowedTypes.includes(file.type)) {
      uploadError.value = 'Tipo de archivo no permitido'
      return
    }

    selectedFile.value = file
    uploadError.value = null
  }

  function clearFile () {
    selectedFile.value = null
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
  }

  // CRUD operations
  async function loadDocumentos () {
    loading.value = true
    try {
      const response = await proyectoService.getDocumentos(props.proyectoId)
      documentos.value = response.data || response || []
      filtrarDocumentos()
    } catch {
      emit('error', 'Error al cargar documentos')
    } finally {
      loading.value = false
    }
  }

  async function loadTiposDocumento () {
    loadingTipos.value = true
    try {
      await catalogosStore.loadCatalogo(CATALOGOS.TIPOS_DOCUMENTOS_PROYECTO)
    } finally {
      loadingTipos.value = false
    }
  }

  function filtrarDocumentos () {
    documentosFiltrados.value = filtroTipo.value
      ? documentos.value.filter(
        doc => doc.tipo_documento_proyecto_id === filtroTipo.value,
      )
      : documentos.value
  }

  async function uploadDocument () {
    if (!selectedFile.value || !uploadForm.tipo_documento_proyecto_id) return

    uploading.value = true
    uploadProgress.value = 0
    uploadError.value = null

    try {
      const formData = new FormData()
      formData.append('archivo', selectedFile.value)
      formData.append('tipo_documento_proyecto_id', uploadForm.tipo_documento_proyecto_id)

      if (uploadForm.nombre_documento) {
        formData.append('nombre_documento', uploadForm.nombre_documento)
      }
      if (uploadForm.descripcion) {
        formData.append('descripcion', uploadForm.descripcion)
      }
      if (uploadForm.fecha_vencimiento) {
        formData.append('fecha_vencimiento', uploadForm.fecha_vencimiento)
      }

      // Simular progreso
      const progressInterval = setInterval(() => {
        if (uploadProgress.value < 90) {
          uploadProgress.value += 10
        }
      }, 200)

      await proyectoService.uploadDocumento(props.proyectoId, formData)

      clearInterval(progressInterval)
      uploadProgress.value = 100

      await loadDocumentos()
      closeUploadDialog()
      emit('updated')
    } catch (error) {
      // Mostrar errores específicos de validación del backend si existen
      const validationErrors = error.apiErrors || error.response?.data?.errors
      if (validationErrors) {
        const detalles = Object.values(validationErrors).flat().join('. ')
        uploadError.value = detalles || error.apiMessage || 'Error de validación'
      } else {
        uploadError.value
          = error.apiMessage
            || error.response?.data?.message
            || 'Error al subir documento'
      }
      console.error('Error upload documento:', error.response?.data || error)
      emit('error', uploadError.value)
    } finally {
      uploading.value = false
    }
  }

  function closeUploadDialog () {
    showUploadDialog.value = false
    clearFile()
    uploadForm.tipo_documento_proyecto_id = null
    uploadForm.nombre_documento = ''
    uploadForm.descripcion = ''
    uploadForm.fecha_vencimiento = ''
    uploadError.value = null
    uploadProgress.value = 0
  }

  async function downloadDocument (item) {
    try {
      const token = localStorage.getItem('auth_token_jn')
      const axios = (await import('axios')).default

      const response = await axios({
        url: item.url,
        method: 'GET',
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const fileName = item.nombre_archivo_original || item.nombre_documento || 'documento'
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/octet-stream',
      })

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName)
      document.body.append(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      emit('error', 'Error al descargar documento')
    }
  }

  async function previewDocument (item) {
    previewItem.value = item
    previewDialog.value = true

    try {
      const token = localStorage.getItem('auth_token_jn')
      const axios = (await import('axios')).default

      const response = await axios({
        url: item.url_preview,
        method: 'GET',
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const blob = new Blob([response.data], {
        type: response.headers['content-type'],
      })
      previewItem.value.blob_url = window.URL.createObjectURL(blob)
    } catch {
      emit('error', 'Error al cargar vista previa')
    }
  }

  function confirmDelete (item) {
    itemToDelete.value = item
    deleteDialog.value = true
  }

  async function deleteDocument () {
    if (!itemToDelete.value) return
    deleting.value = true
    try {
      await proyectoService.deleteDocumento(props.proyectoId, itemToDelete.value.id)
      await loadDocumentos()
      deleteDialog.value = false
      itemToDelete.value = null
      emit('updated')
    } catch {
      emit('error', 'Error al eliminar documento')
    } finally {
      deleting.value = false
    }
  }

  // Lifecycle
  watch(() => props.proyectoId, () => {
    if (props.proyectoId) {
      loadDocumentos()
    }
  })

  onMounted(() => {
    if (props.proyectoId) {
      loadTiposDocumento()
      loadDocumentos()
    }
  })
</script>

<style scoped>
.drop-zone {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #fafafa;
}

.drop-zone:hover {
  border-color: #1976d2;
  background-color: #f5f5f5;
}

.drop-zone--active {
  border-color: #1976d2;
  background-color: #e3f2fd;
}

.drop-zone--has-file {
  border-color: #4caf50;
  background-color: #f1f8e9;
}
</style>
