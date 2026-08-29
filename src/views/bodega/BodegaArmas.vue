<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center flex-wrap ga-3 mb-4">
      <v-btn icon="mdi-arrow-left" variant="text" :to="{ name: 'bodega' }" />
      <div>
        <h1 class="text-h5 font-weight-bold mb-0">Armas</h1>
        <p class="text-caption text-medium-emphasis mb-0">
          Inventario por serie: revólver, 9mm y escopeta. Incluye tenencia, portación y vencimiento.
        </p>
      </div>
      <v-spacer />
      <v-btn
        v-if="canManage"
        color="primary"
        variant="elevated"
        @click="abrirCrear"
      >
        <v-icon start>mdi-plus</v-icon>
        Registrar arma
      </v-btn>
    </div>

    <v-row class="mb-4" dense>
      <v-col v-for="card in resumenCards" :key="card.title" cols="6" md="3">
        <v-card class="pa-4" elevation="2" rounded="xl">
          <div class="text-caption text-medium-emphasis">{{ card.title }}</div>
          <div class="text-h5 font-weight-bold" :class="card.color">{{ card.value }}</div>
        </v-card>
      </v-col>
    </v-row>

    <v-card class="mb-4" elevation="2" rounded="xl">
      <v-card-text class="pa-4">
        <v-row dense>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="search"
              clearable
              density="compact"
              hide-details
              label="Buscar código, serie, marca o responsable"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              @keyup.enter="cargar"
              @click:clear="cargar"
            />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-select
              v-model="filtroTipo"
              clearable
              density="compact"
              hide-details
              item-title="title"
              item-value="value"
              :items="tipos"
              label="Tipo"
              variant="outlined"
              @update:model-value="cargar"
            />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-select
              v-model="filtroEstado"
              clearable
              density="compact"
              hide-details
              item-title="title"
              item-value="value"
              :items="estados"
              label="Estado"
              variant="outlined"
              @update:model-value="cargar"
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-btn block color="primary" variant="tonal" @click="cargar">Cargar</v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card elevation="2" rounded="xl">
      <v-data-table :headers="headers" :items="items" :loading="loading" :items-per-page="25">
        <template #item.codigo="{ item }">
          <div class="font-weight-medium">{{ item.codigo || '—' }}</div>
          <div v-if="item.codigo_interno" class="text-caption text-medium-emphasis">
            Int. {{ item.codigo_interno }}
          </div>
        </template>
        <template #item.tipo="{ item }">
          <v-chip size="small" variant="tonal">{{ item.tipo_label || item.tipo }}</v-chip>
        </template>
        <template #item.arma="{ item }">
          <div>{{ item.marca || '—' }} {{ item.modelo }}</div>
          <div class="text-caption text-medium-emphasis">Serie {{ item.serie }}</div>
        </template>
        <template #item.documentos="{ item }">
          <div class="text-caption">Tenencia {{ item.tenencia || '—' }}</div>
          <div class="text-caption">Portación {{ item.portacion || '—' }}</div>
        </template>
        <template #item.vencimiento="{ item }">
          <div>{{ formatDate(item.vencimiento) }}</div>
          <v-chip
            v-if="item.alerta_vencimiento === 'vencida'"
            color="error"
            size="x-small"
            variant="flat"
          >
            Vencida
          </v-chip>
          <v-chip
            v-else-if="item.alerta_vencimiento === 'por_vencer'"
            color="warning"
            size="x-small"
            variant="tonal"
          >
            Por vencer
          </v-chip>
        </template>
        <template #item.responsable="{ item }">
          <div>{{ item.responsable_nombre || item.personal?.nombre_completo || '—' }}</div>
          <div v-if="item.proyecto" class="text-caption text-medium-emphasis">
            {{ item.proyecto.nombre_proyecto }}
          </div>
        </template>
        <template #item.estado="{ item }">
          <v-chip :color="estadoColor(item.estado)" size="small" variant="tonal">
            {{ item.estado_label || item.estado }}
          </v-chip>
        </template>
        <template #item.acciones="{ item }">
          <v-btn
            v-if="canManage && item.proyecto_id"
            color="warning"
            size="small"
            variant="tonal"
            @click="devolver(item)"
          >
            Descargar
          </v-btn>
          <v-btn
            v-if="canManage"
            class="ml-1"
            color="info"
            icon="mdi-pencil"
            size="small"
            variant="tonal"
            @click="abrirEditar(item)"
          />
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialog" max-width="720" persistent>
      <v-card rounded="xl">
        <v-card-title class="pa-4">{{ editId ? 'Editar arma' : 'Registrar arma' }}</v-card-title>
        <v-card-text>
          <v-row dense>
            <v-col cols="12" sm="4">
              <v-text-field
                :model-value="form.codigo || 'Se asigna al guardar'"
                label="Código"
                readonly
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field v-model="form.codigo_interno" label="Código interno" variant="outlined" />
            </v-col>
            <v-col cols="12" sm="4">
              <v-select
                v-model="form.tipo"
                item-title="title"
                item-value="value"
                :items="tipos"
                label="Tipo *"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="form.marca" label="Marca" variant="outlined" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="form.modelo" label="Modelo" variant="outlined" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="form.serie" label="Serie *" variant="outlined" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-select
                v-model="form.estado"
                item-title="title"
                item-value="value"
                :items="estados"
                label="Estado"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="form.tenencia" label="Tenencia" variant="outlined" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="form.portacion" label="Portación" variant="outlined" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="form.vencimiento" label="Vencimiento" type="date" variant="outlined" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-select
                v-model="form.proyecto_id"
                clearable
                item-title="nombre_proyecto"
                item-value="id"
                :items="proyectos"
                label="Proyecto"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12">
              <v-text-field v-model="form.responsable_nombre" label="Responsable" variant="outlined" />
            </v-col>
            <v-col cols="12">
              <v-textarea v-model="form.observaciones" label="Observaciones" rows="2" variant="outlined" />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">Cancelar</v-btn>
          <v-btn
            color="primary"
            :disabled="!form.tipo || !form.serie"
            :loading="saving"
            variant="elevated"
            @click="guardar"
          >
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3500">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
  import { computed, onMounted, reactive, ref } from 'vue'
  import { format } from 'date-fns'
  import bodegaService from '@/services/bodegaService'
  import proyectoService from '@/services/proyectoService'
  import { useAuthStore } from '@/stores/auth'

  const authStore = useAuthStore()
  const canManage = computed(() => authStore.hasPermission('manage-bodega'))

  const loading = ref(false)
  const saving = ref(false)
  const items = ref([])
  const meta = ref({})
  const tipos = ref([
    { value: 'revolver', title: 'Revólver' },
    { value: '9mm', title: '9mm' },
    { value: 'escopeta', title: 'Escopeta' },
  ])
  const estados = ref([
    { value: 'en_bodega', title: 'En bodega' },
    { value: 'asignada', title: 'Asignada' },
    { value: 'mantenimiento', title: 'Mantenimiento' },
    { value: 'baja', title: 'Baja' },
  ])
  const proyectos = ref([])
  const search = ref('')
  const filtroTipo = ref(null)
  const filtroEstado = ref(null)
  const dialog = ref(false)
  const editId = ref(null)
  const snackbar = reactive({ show: false, text: '', color: 'success' })
  const form = reactive(formVacio())

  const headers = [
    { title: 'Código', key: 'codigo', width: '120px' },
    { title: 'Tipo', key: 'tipo', width: '120px' },
    { title: 'Arma', key: 'arma', sortable: false },
    { title: 'Documentos', key: 'documentos', sortable: false },
    { title: 'Vencimiento', key: 'vencimiento', width: '140px' },
    { title: 'Responsable / Proyecto', key: 'responsable', sortable: false },
    { title: 'Estado', key: 'estado', width: '140px' },
    { title: '', key: 'acciones', sortable: false, width: '160px' },
  ]

  const resumenCards = computed(() => {
    const m = meta.value || {}
    return [
      { title: 'Armas', value: m.total ?? 0, color: 'text-primary' },
      { title: 'En bodega', value: m.en_bodega ?? 0, color: 'text-success' },
      { title: 'Asignadas', value: m.asignadas ?? 0, color: 'text-info' },
      { title: 'Portación vencida', value: m.vencidas ?? 0, color: 'text-error' },
    ]
  })

  function formVacio () {
    return {
      codigo: '',
      codigo_interno: '',
      tipo: 'revolver',
      marca: '',
      modelo: '',
      serie: '',
      tenencia: '',
      portacion: '',
      vencimiento: '',
      responsable_nombre: '',
      proyecto_id: null,
      estado: 'en_bodega',
      observaciones: '',
    }
  }

  function estadoColor (estado) {
    return ({
      en_bodega: 'success',
      asignada: 'info',
      mantenimiento: 'warning',
      baja: 'grey',
    })[estado] || 'grey'
  }

  function formatDate (date) {
    if (!date) return '—'
    const value = typeof date === 'string' ? date.substring(0, 10) : date
    return format(new Date(`${value}T12:00:00`), 'dd/MM/yyyy')
  }

  async function cargar () {
    loading.value = true
    try {
      const res = await bodegaService.getArmas({
        search: search.value || undefined,
        tipo: filtroTipo.value || undefined,
        estado: filtroEstado.value || undefined,
      })
      items.value = res.data || []
      meta.value = res.meta || {}
    } finally {
      loading.value = false
    }
  }

  function abrirCrear () {
    editId.value = null
    Object.assign(form, formVacio())
    dialog.value = true
  }

  function abrirEditar (item) {
    editId.value = item.id
    Object.assign(form, {
      codigo: item.codigo || '',
      codigo_interno: item.codigo_interno || '',
      tipo: item.tipo,
      marca: item.marca || '',
      modelo: item.modelo || '',
      serie: item.serie || '',
      tenencia: item.tenencia || '',
      portacion: item.portacion || '',
      vencimiento: item.vencimiento ? String(item.vencimiento).substring(0, 10) : '',
      responsable_nombre: item.responsable_nombre || '',
      proyecto_id: item.proyecto_id || null,
      estado: item.estado || 'en_bodega',
      observaciones: item.observaciones || '',
    })
    dialog.value = true
  }

  async function devolver (item) {
    try {
      const res = await bodegaService.devolverArmaBodega(item.id)
      snackbar.color = 'success'
      snackbar.text = res.message || 'Arma descargada. Volvió a bodega.'
      snackbar.show = true
      await cargar()
    } catch (error) {
      snackbar.color = 'error'
      snackbar.text = error.apiMessage || error.response?.data?.message || 'No se pudo descargar el arma'
      snackbar.show = true
    }
  }

  async function guardar () {
    saving.value = true
    try {
      const payload = {
        codigo_interno: form.codigo_interno || null,
        tipo: form.tipo,
        marca: form.marca || null,
        modelo: form.modelo || null,
        serie: form.serie,
        tenencia: form.tenencia || null,
        portacion: form.portacion || null,
        vencimiento: form.vencimiento || null,
        responsable_nombre: form.responsable_nombre || null,
        proyecto_id: form.proyecto_id || null,
        estado: form.estado,
        observaciones: form.observaciones || null,
      }
      if (editId.value) {
        await bodegaService.updateArma(editId.value, payload)
      } else {
        await bodegaService.createArma(payload)
      }
      snackbar.color = 'success'
      snackbar.text = editId.value ? 'Arma actualizada' : 'Arma registrada'
      snackbar.show = true
      dialog.value = false
      await cargar()
    } catch (error) {
      snackbar.color = 'error'
      snackbar.text = error.apiMessage || error.response?.data?.message || 'No se pudo guardar el arma'
      snackbar.show = true
    } finally {
      saving.value = false
    }
  }

  onMounted(async () => {
    try {
      const [cat, proys] = await Promise.all([
        bodegaService.getArmasCatalogo(),
        proyectoService.getAll({ per_page: 200 }),
      ])
      if (cat.data?.tipos?.length) tipos.value = cat.data.tipos
      if (cat.data?.estados?.length) estados.value = cat.data.estados
      proyectos.value = proys.data || proys.items || []
    } catch {
      proyectos.value = []
    }
    await cargar()
  })
</script>
