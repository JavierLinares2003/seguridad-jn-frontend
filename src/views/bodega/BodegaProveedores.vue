<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center flex-wrap ga-3 mb-4">
      <v-btn icon="mdi-arrow-left" variant="text" :to="{ name: 'bodega' }" />
      <div>
        <h1 class="text-h5 font-weight-bold mb-0">Proveedores</h1>
        <p class="text-caption text-medium-emphasis mb-0">
          Quién abastece uniformes, insumos y equipo. Cada proveedor tiene código PRV-0001 para identificarlo.
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
        Nuevo proveedor
      </v-btn>
    </div>

    <v-card class="mb-4" elevation="2" rounded="xl">
      <v-card-text class="pa-4">
        <v-text-field
          v-model="search"
          clearable
          density="compact"
          label="Buscar código, nombre, insumo o teléfono"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          @keyup.enter="cargar"
          @click:clear="cargar"
        />
      </v-card-text>
    </v-card>

    <v-card elevation="2" rounded="xl">
      <v-data-table :headers="headers" :items="items" :loading="loading" :items-per-page="25">
        <template #item.codigo="{ item }">
          <span class="font-weight-medium">{{ item.codigo || '—' }}</span>
        </template>
        <template #item.telefono="{ item }">
          {{ item.telefono || item.contacto || '—' }}
        </template>
        <template #item.cuenta="{ item }">
          <span v-if="item.numero_cuenta">{{ item.numero_cuenta }}</span>
          <span v-else class="text-medium-emphasis">—</span>
          <div v-if="item.banco" class="text-caption text-medium-emphasis">{{ item.banco }}</div>
        </template>
        <template #item.activo="{ item }">
          <v-chip :color="item.activo ? 'success' : 'grey'" size="small" variant="tonal">
            {{ item.activo ? 'Activo' : 'Inactivo' }}
          </v-chip>
        </template>
        <template #item.acciones="{ item }">
          <v-btn
            v-if="canManage"
            color="info"
            icon="mdi-pencil"
            size="small"
            variant="tonal"
            @click="abrirEditar(item)"
          />
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialog" max-width="560" persistent>
      <v-card rounded="xl">
        <v-card-title class="pa-4">{{ editId ? 'Editar proveedor' : 'Nuevo proveedor' }}</v-card-title>
        <v-card-text>
          <v-text-field
            v-if="editId"
            class="mb-2"
            :model-value="form.codigo || '—'"
            label="Código"
            readonly
            variant="outlined"
          />
          <v-text-field v-model="form.nombre" class="mb-2" label="Nombre *" variant="outlined" />
          <v-text-field v-model="form.insumo" class="mb-2" label="Insumo / qué provee" placeholder="Uniformes, botas, limpieza…" variant="outlined" />
          <v-text-field v-model="form.telefono" class="mb-2" label="Teléfono" variant="outlined" />
          <v-text-field v-model="form.numero_cuenta" class="mb-2" label="Número de cuenta" variant="outlined" />
          <v-text-field v-model="form.banco" class="mb-2" label="Banco" variant="outlined" />
          <v-textarea v-model="form.observaciones" class="mb-2" label="Observaciones" rows="2" variant="outlined" />
          <v-switch v-if="editId" v-model="form.activo" color="success" label="Activo" />
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">Cancelar</v-btn>
          <v-btn color="primary" :disabled="!form.nombre" :loading="saving" variant="elevated" @click="guardar">
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
  import bodegaService from '@/services/bodegaService'
  import { useAuthStore } from '@/stores/auth'

  const authStore = useAuthStore()
  const canManage = computed(() => authStore.hasPermission('manage-bodega'))

  const loading = ref(false)
  const saving = ref(false)
  const items = ref([])
  const search = ref('')
  const dialog = ref(false)
  const editId = ref(null)
  const snackbar = reactive({ show: false, text: '', color: 'success' })
  const form = reactive({
    codigo: '',
    nombre: '',
    insumo: '',
    telefono: '',
    numero_cuenta: '',
    banco: '',
    observaciones: '',
    activo: true,
  })

  const headers = [
    { title: 'Código', key: 'codigo', width: '110px' },
    { title: 'Proveedor', key: 'nombre' },
    { title: 'Insumo', key: 'insumo' },
    { title: 'Teléfono', key: 'telefono' },
    { title: 'Cuenta', key: 'cuenta', sortable: false },
    { title: 'Estado', key: 'activo' },
    { title: '', key: 'acciones', sortable: false, width: '80px' },
  ]

  async function cargar () {
    loading.value = true
    try {
      const res = await bodegaService.getProveedores({
        incluir_inactivos: 1,
        search: search.value || undefined,
      })
      items.value = res.data || []
    } finally {
      loading.value = false
    }
  }

  function abrirCrear () {
    editId.value = null
    form.codigo = ''
    form.nombre = ''
    form.insumo = ''
    form.telefono = ''
    form.numero_cuenta = ''
    form.banco = ''
    form.observaciones = ''
    form.activo = true
    dialog.value = true
  }

  function abrirEditar (item) {
    editId.value = item.id
    form.codigo = item.codigo || ''
    form.nombre = item.nombre
    form.insumo = item.insumo || ''
    form.telefono = item.telefono || item.contacto || ''
    form.numero_cuenta = item.numero_cuenta || ''
    form.banco = item.banco || ''
    form.observaciones = item.observaciones || ''
    form.activo = item.activo !== false
    dialog.value = true
  }

  async function guardar () {
    if (!form.nombre) return
    saving.value = true
    try {
      const payload = {
        nombre: form.nombre,
        insumo: form.insumo || null,
        telefono: form.telefono || null,
        numero_cuenta: form.numero_cuenta || null,
        banco: form.banco || null,
        observaciones: form.observaciones || null,
        activo: form.activo,
      }
      if (editId.value) {
        await bodegaService.updateProveedor(editId.value, payload)
      } else {
        await bodegaService.createProveedor(payload)
      }
      dialog.value = false
      await cargar()
      snackbar.color = 'success'
      snackbar.text = 'Proveedor guardado.'
      snackbar.show = true
    } catch (e) {
      snackbar.color = 'error'
      snackbar.text = e.apiMessage || 'No se pudo guardar'
      snackbar.show = true
    } finally {
      saving.value = false
    }
  }

  onMounted(cargar)
</script>
