<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center flex-wrap ga-3 mb-4">
      <v-btn icon="mdi-arrow-left" variant="text" :to="{ name: 'bodega' }" />
      <div>
        <h1 class="text-h5 font-weight-bold mb-0">Artículos de baja</h1>
        <p class="text-caption text-medium-emphasis mb-0">
          Ya no están en condiciones de uso. Salieron del inventario activo y quedan aquí para control.
        </p>
      </div>
      <v-spacer />
      <v-chip color="error" variant="tonal">{{ totalUnidades }} uds. de baja</v-chip>
    </div>

    <v-card class="mb-4" elevation="2" rounded="xl">
      <v-card-text class="pa-4">
        <v-row dense>
          <v-col cols="12" md="5">
            <v-text-field
              v-model="filtros.search"
              clearable
              density="compact"
              label="Buscar"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              @keyup.enter="cargar"
              @click:clear="cargar"
            />
          </v-col>
          <v-col cols="12" md="5">
            <v-select
              v-model="filtros.categoria_id"
              clearable
              density="compact"
              item-title="nombre"
              item-value="id"
              :items="categorias"
              label="Categoría"
              variant="outlined"
              @update:model-value="cargar"
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-btn block color="secondary" variant="tonal" @click="cargar">Filtrar</v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card elevation="2" rounded="xl">
      <v-data-table
        :headers="headers"
        :items="items"
        :loading="loading"
        :items-per-page="25"
      >
        <template #item.producto="{ item }">
          <div class="font-weight-medium">{{ item.producto?.nombre || '—' }}</div>
          <div class="text-caption text-medium-emphasis">{{ item.producto?.codigo || '—' }}</div>
        </template>
        <template #item.categoria="{ item }">
          <v-chip size="small" variant="tonal">{{ item.producto?.categoria?.nombre || '—' }}</v-chip>
        </template>
        <template #item.variante="{ item }">
          {{ item.etiqueta || 'Única' }}
        </template>
        <template #item.existencia_baja="{ item }">
          <span class="font-weight-bold">{{ item.existencia_baja }}</span>
        </template>
        <template #item.existencia="{ item }">
          {{ item.existencia }}
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script setup>
  import { onMounted, reactive, ref } from 'vue'
  import bodegaService from '@/services/bodegaService'

  const loading = ref(false)
  const items = ref([])
  const categorias = ref([])
  const totalUnidades = ref(0)
  const filtros = reactive({
    search: '',
    categoria_id: null,
  })

  const headers = [
    { title: 'Producto', key: 'producto' },
    { title: 'Categoría', key: 'categoria' },
    { title: 'Variante', key: 'variante', sortable: false },
    { title: 'De baja', key: 'existencia_baja' },
    { title: 'Aún activo', key: 'existencia' },
  ]

  async function cargar () {
    loading.value = true
    try {
      const params = { per_page: 100 }
      if (filtros.search) params.search = filtros.search
      if (filtros.categoria_id) params.categoria_id = filtros.categoria_id
      const res = await bodegaService.getBajas(params)
      items.value = res.data?.data || res.data || []
      totalUnidades.value = res.meta?.unidades_baja ?? 0
    } finally {
      loading.value = false
    }
  }

  onMounted(async () => {
    const cats = await bodegaService.getCategorias()
    categorias.value = cats.data || []
    await cargar()
  })
</script>
