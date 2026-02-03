<template>
  <v-card class="mb-4">
    <v-card-title class="d-flex align-center">
      <v-icon start>mdi-file-document-edit-outline</v-icon>
      Cartas de Aceptación Generadas
      <v-spacer />
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        variant="tonal"
        @click="openDialog"
      >
        Generar Carta
      </v-btn>
    </v-card-title>
    
    <v-data-table
      :headers="headers"
      :items="actas"
      :loading="loading"
      no-data-text="No hay actas generadas"
    >
      <template #item.fecha_creacion="{ item }">
        {{ new Date(item.created_at).toLocaleString() }}
      </template>
      <template #item.actions="{ item }">
        <v-btn
          color="primary"
          icon
          size="small"
          :loading="downloadingId === item.id"
          variant="text"
          @click="downloadActa(item)"
        >
          <v-icon>mdi-download</v-icon>
        </v-btn>
      </template>
    </v-data-table>

    <!-- Modal Generación -->
    <v-dialog v-model="dialog" max-width="600">
      <v-card>
        <v-card-title>Generar Carta de Aceptación</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="generate">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="form.nombre_firmante"
                  label="Nombre del Firmante"
                  :rules="[v => !!v || 'Requerido']"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.dpi_firmante"
                  label="DPI Firmante"
                  :rules="[v => !!v || 'Requerido']"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.puesto_firmante"
                  label="Puesto Firmante"
                  :rules="[v => !!v || 'Requerido']"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.fecha_firma"
                  label="Fecha de Firma"
                  type="date"
                  :rules="[v => !!v || 'Requerido']"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.fecha_inicio_servicios"
                  label="Fecha Inicio Servicios"
                  type="date"
                  :rules="[v => !!v || 'Requerido']"
                  variant="outlined"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">Cancelar</v-btn>
          <v-btn color="primary" :loading="generating" @click="generate">Generar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
  import { onMounted, reactive, ref } from 'vue'
  import proyectoService from '@/services/proyectoService'

  const props = defineProps({
    proyectoId: {
      type: [Number, String],
      required: true,
    },
  })

  const actas = ref([])
  const loading = ref(false)
  const dialog = ref(false)
  const generating = ref(false)
  const downloadingId = ref(null)
  const form = reactive({
    nombre_firmante: '',
    dpi_firmante: '',
    puesto_firmante: '',
    fecha_firma: new Date().toISOString().substr(0, 10),
    fecha_inicio_servicios: new Date().toISOString().substr(0, 10),
  })

  const headers = [
    { title: 'Fecha Generación', key: 'fecha_creacion' },
    { title: 'Firmante', key: 'nombre_firmante' },
    { title: 'Puesto', key: 'puesto_firmante' },
    { title: 'Acciones', key: 'actions', sortable: false },
  ]

  async function loadActas () {
    loading.value = true
    try {
      actas.value = await proyectoService.getActas(props.proyectoId)
    } finally {
      loading.value = false
    }
  }

  function openDialog () {
    dialog.value = true
  }

  async function generate () {
    if (!form.nombre_firmante || !form.dpi_firmante) return // Simple validation

    generating.value = true
    try {
      await proyectoService.generateActa(props.proyectoId, form)
      await loadActas()
      dialog.value = false
      // Reset form if needed, or keep for convenience
    } catch (e) {
      console.error(e)
    } finally {
      generating.value = false
    }
  }

  async function downloadActa (item) {
    downloadingId.value = item.id
    try {
      const response = await proyectoService.downloadActa(props.proyectoId, item.id)
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Acta_${item.fecha_marca || 'Inicio'}.pdf`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (e) {
      console.error(e)
    } finally {
      downloadingId.value = null
    }
  }

  onMounted(loadActas)
</script>
