<template>
  <v-container class="pa-6" fluid>
    <!-- Header -->
    <v-row align="center" class="mb-6">
      <v-col>
        <div class="d-flex align-center">
          <v-avatar class="mr-4" color="teal-darken-2" rounded="lg" size="48">
            <v-icon icon="mdi-umbrella-beach" size="28" />
          </v-avatar>
          <div>
            <h1 class="text-h4 font-weight-bold text-grey-darken-3">Configuración de Vacaciones</h1>
            <p class="text-body-2 text-medium-emphasis mb-0">Define los días anuales de vacaciones por departamento</p>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Default global -->
    <v-card class="mb-6" elevation="2" rounded="xl">
      <v-card-title class="d-flex align-center bg-teal-lighten-5 py-4 px-6">
        <v-icon color="teal-darken-2" start>mdi-cog</v-icon>
        <span class="text-subtitle-1 font-weight-bold">Valor por Defecto</span>
        <v-spacer />
        <v-chip color="teal-darken-2" size="small" variant="tonal">
          Aplica a departamentos sin configuración propia
        </v-chip>
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-6">
        <v-row align="center">
          <v-col cols="12" md="6">
            <p class="text-body-2 text-medium-emphasis">
              Este valor se usará para cualquier departamento que no tenga configuración propia.
            </p>
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model.number="defaultDias"
              density="comfortable"
              label="Días por año (default)"
              min="1"
              max="365"
              prepend-inner-icon="mdi-calendar"
              type="number"
              variant="outlined"
              hide-details
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-btn
              block
              color="teal-darken-2"
              :loading="savingDefault"
              variant="elevated"
              @click="guardarDefault"
            >
              <v-icon start>mdi-content-save</v-icon>
              Guardar Default
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Tabla de departamentos -->
    <v-card elevation="2" rounded="xl">
      <v-card-title class="d-flex align-center py-4 px-6">
        <v-icon color="primary" start>mdi-office-building</v-icon>
        <span class="text-subtitle-1 font-weight-bold">Días por Departamento</span>
        <v-spacer />
        <v-text-field
          v-model="search"
          clearable
          density="compact"
          hide-details
          label="Buscar departamento"
          prepend-inner-icon="mdi-magnify"
          style="max-width: 260px"
          variant="outlined"
        />
      </v-card-title>
      <v-divider />

      <v-data-table
        :headers="headers"
        :items="departamentos"
        :loading="loading"
        :search="search"
        no-data-text="No hay departamentos"
      >
        <!-- Departamento -->
        <template #item.departamento_nombre="{ item }">
          <div class="d-flex align-center ga-2">
            <span class="font-weight-medium">{{ item.departamento_nombre }}</span>
            <v-chip v-if="!item.tiene_config_propia" color="grey" size="x-small" variant="tonal">
              default
            </v-chip>
          </div>
        </template>

        <!-- Días configurados -->
        <template #item.dias_por_anio="{ item }">
          <div v-if="editingId !== item.departamento_id" class="d-flex align-center ga-2">
            <v-chip :color="item.tiene_config_propia ? 'primary' : 'grey'" size="small" variant="tonal">
              {{ item.dias_por_anio }} días/año
            </v-chip>
          </div>
          <v-text-field
            v-else
            v-model.number="editDias"
            density="compact"
            hide-details
            min="1"
            max="365"
            style="max-width: 120px"
            type="number"
            variant="outlined"
          />
        </template>

        <!-- Acciones -->
        <template #item.actions="{ item }">
          <div v-if="editingId !== item.departamento_id" class="d-flex ga-1">
            <v-btn
              color="primary"
              density="compact"
              icon
              size="small"
              variant="text"
              @click="iniciarEdicion(item)"
            >
              <v-icon size="18">mdi-pencil</v-icon>
            </v-btn>
            <v-btn
              v-if="item.tiene_config_propia"
              color="error"
              density="compact"
              icon
              size="small"
              variant="text"
              @click="confirmarRestaurar(item)"
            >
              <v-icon size="18">mdi-restore</v-icon>
            </v-btn>
          </div>
          <div v-else class="d-flex ga-1">
            <v-btn
              color="success"
              density="compact"
              icon
              :loading="savingId === item.departamento_id"
              size="small"
              variant="text"
              @click="guardarEdicion(item)"
            >
              <v-icon size="18">mdi-check</v-icon>
            </v-btn>
            <v-btn
              color="grey"
              density="compact"
              icon
              size="small"
              variant="text"
              @click="cancelarEdicion"
            >
              <v-icon size="18">mdi-close</v-icon>
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialog confirmar restaurar -->
    <v-dialog v-model="restoreDialog" max-width="400" persistent>
      <v-card rounded="xl">
        <v-card-title class="py-4 px-6">
          <v-icon class="mr-2" color="warning">mdi-restore</v-icon>
          Restaurar a Default
        </v-card-title>
        <v-card-text class="px-6">
          ¿Restaurar la configuración de <strong>{{ itemToRestore?.departamento_nombre }}</strong>
          al valor por defecto ({{ defaultDias }} días)?
        </v-card-text>
        <v-card-actions class="px-6 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="restoreDialog = false">Cancelar</v-btn>
          <v-btn color="warning" :loading="restoring" variant="elevated" @click="restaurarDefault">
            Restaurar
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
  </v-container>
</template>

<script setup>
  import vacacionesService from '@/services/vacacionesService'

  const loading = ref(false)
  const saving = ref(false)
  const savingDefault = ref(false)
  const savingId = ref(null)
  const restoring = ref(false)
  const search = ref('')
  const editingId = ref(null)
  const editDias = ref(0)

  const departamentos = ref([])
  const defaultConfig = ref(null)
  const defaultDias = ref(8)

  const restoreDialog = ref(false)
  const itemToRestore = ref(null)

  const snackbar = reactive({ show: false, text: '', color: 'success' })
  function showSuccess (text) { snackbar.text = text; snackbar.color = 'success'; snackbar.show = true }
  function showError (text) { snackbar.text = text; snackbar.color = 'error'; snackbar.show = true }

  const headers = [
    { title: 'Departamento', key: 'departamento_nombre', sortable: true },
    { title: 'Días por Año', key: 'dias_por_anio', sortable: true, align: 'center' },
    { title: 'Acciones', key: 'actions', sortable: false, align: 'center', width: '120px' },
  ]

  async function loadConfig () {
    loading.value = true
    try {
      const response = await vacacionesService.getConfig()
      departamentos.value = response.data?.departamentos || []
      defaultConfig.value = response.data?.default || null
      defaultDias.value = defaultConfig.value?.dias_por_anio ?? 8
    } catch {
      showError('Error al cargar la configuración.')
    } finally {
      loading.value = false
    }
  }

  async function guardarDefault () {
    savingDefault.value = true
    try {
      await vacacionesService.saveConfig({ departamento_id: null, dias_por_anio: defaultDias.value })
      showSuccess('Valor por defecto actualizado.')
      await loadConfig()
    } catch {
      showError('Error al guardar el valor por defecto.')
    } finally {
      savingDefault.value = false
    }
  }

  function iniciarEdicion (item) {
    editingId.value = item.departamento_id
    editDias.value = item.dias_por_anio
  }

  function cancelarEdicion () {
    editingId.value = null
    editDias.value = 0
  }

  async function guardarEdicion (item) {
    savingId.value = item.departamento_id
    try {
      if (item.config_id) {
        await vacacionesService.updateConfig(item.config_id, { dias_por_anio: editDias.value })
      } else {
        await vacacionesService.saveConfig({ departamento_id: item.departamento_id, dias_por_anio: editDias.value })
      }
      showSuccess(`Configuración de ${item.departamento_nombre} actualizada.`)
      cancelarEdicion()
      await loadConfig()
    } catch {
      showError('Error al guardar la configuración.')
    } finally {
      savingId.value = null
    }
  }

  function confirmarRestaurar (item) {
    itemToRestore.value = item
    restoreDialog.value = true
  }

  async function restaurarDefault () {
    if (!itemToRestore.value?.config_id) return
    restoring.value = true
    try {
      await vacacionesService.deleteConfig(itemToRestore.value.config_id)
      showSuccess(`${itemToRestore.value.departamento_nombre} ahora usa el valor por defecto.`)
      restoreDialog.value = false
      await loadConfig()
    } catch {
      showError('Error al restaurar la configuración.')
    } finally {
      restoring.value = false
    }
  }

  onMounted(() => {
    loadConfig()
  })
</script>
