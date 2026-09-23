<template>
  <v-container class="pa-6" fluid>
    <v-row align="center" class="mb-4">
      <v-col>
        <div class="d-flex align-center">
          <v-avatar class="mr-4" color="primary" rounded="lg" size="48">
            <v-icon icon="mdi-bank-outline" size="28" />
          </v-avatar>
          <div>
            <h1 class="text-h4 font-weight-bold">Contabilidad</h1>
            <p class="text-body-2 text-medium-emphasis mb-0">
              Nombres, banco y cuenta. Quien cobra en efectivo queda marcado y no se transfiere.
            </p>
          </div>
        </div>
      </v-col>
      <v-col cols="auto">
        <v-btn
          class="text-none"
          color="primary"
          :loading="exportando"
          prepend-icon="mdi-download"
          variant="tonal"
          @click="descargarCsv"
        >
          Descargar CSV
        </v-btn>
      </v-col>
    </v-row>

    <v-row class="mb-2">
      <v-col v-for="chip in chips" :key="chip.value" cols="6" md="2">
        <v-card
          class="pa-3 cursor-pointer"
          :color="forma === chip.value ? chip.color : undefined"
          rounded="lg"
          style="cursor: pointer"
          :variant="forma === chip.value ? 'flat' : 'outlined'"
          @click="elegirForma(chip.value)"
        >
          <div class="text-caption" :class="textoChip(chip)">
            {{ chip.label }}
          </div>
          <div class="text-h5 font-weight-bold" :class="textoChip(chip)">
            {{ resumen[chip.key] ?? 0 }}
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-card class="mb-4" rounded="xl">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" md="6">
            <v-text-field
              v-model="buscar"
              clearable
              density="comfortable"
              hide-details
              label="Buscar nombre, DPI o puesto"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              @click:clear="buscar = ''; cargar()"
              @keyup.enter="cargar(1)"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="estado"
              density="comfortable"
              hide-details
              item-title="text"
              item-value="value"
              :items="estados"
              label="Estado"
              variant="outlined"
              @update:model-value="cargar(1)"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-btn block class="text-none" color="primary" size="large" @click="cargar(1)">
              Buscar
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card rounded="xl">
      <v-data-table
        class="contabilidad-table"
        :headers="headers"
        :items="items"
        :items-per-page="meta.per_page"
        :loading="cargando"
        hide-default-footer
      >
        <template #item.nombre_completo="{ item }">
          <div class="font-weight-medium">{{ item.nombre_completo }}</div>
          <div class="text-caption text-medium-emphasis">{{ item.puesto || 'Sin puesto' }}</div>
        </template>
        <template #item.forma="{ item }">
          <v-chip :color="colorForma(item.forma)" size="small" variant="tonal">
            {{ etiquetaForma(item) }}
          </v-chip>
          <div v-if="item.cuenta_ignorada" class="text-caption text-warning mt-1">
            Tiene cuenta guardada, pero se paga en efectivo
          </div>
          <div v-else-if="!item.cuenta_completa" class="text-caption text-error mt-1">
            Falta banco o número de cuenta
          </div>
        </template>
        <template #item.banco="{ item }">
          <span v-if="item.forma === 'efectivo'" class="text-medium-emphasis">Efectivo</span>
          <span v-else>{{ item.banco || '—' }}</span>
        </template>
        <template #item.numero_cuenta="{ item }">
          <div v-if="item.forma === 'efectivo'" class="text-medium-emphasis">—</div>
          <template v-else>
            <div>{{ item.numero_cuenta || '—' }}</div>
            <div v-if="item.tipo_cuenta" class="text-caption text-medium-emphasis">{{ item.tipo_cuenta }}</div>
          </template>
        </template>
        <template #item.nombre_cuenta="{ item }">
          {{ item.forma === 'efectivo' ? '—' : (item.nombre_cuenta || '—') }}
        </template>
        <template #no-data>
          <div class="pa-6 text-medium-emphasis">No hay personal con ese filtro.</div>
        </template>
      </v-data-table>
      <div class="d-flex justify-end pa-4">
        <v-pagination
          v-if="meta.last_page > 1"
          :length="meta.last_page"
          :model-value="meta.current_page"
          @update:model-value="cargar"
        />
      </div>
    </v-card>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
  import { onMounted, ref } from 'vue'
  import personalService from '@/services/personalService'

  const chips = [
    { label: 'Todos', value: '', key: 'total', color: 'primary' },
    { label: 'Efectivo', value: 'efectivo', key: 'efectivo', color: 'warning' },
    { label: 'Banco', value: 'banco', key: 'banco', color: 'primary' },
    { label: 'Cheque', value: 'cheque', key: 'cheque', color: 'secondary' },
    { label: 'Sin definir', value: 'sin_definir', key: 'sin_definir', color: 'grey-darken-1' },
    { label: 'Falta cuenta', value: 'incompleto', key: 'incompletos', color: 'error' },
  ]

  const estados = [
    { text: 'Activos', value: 'activo' },
    { text: 'Todos', value: '' },
    { text: 'Bajas y suspendidos', value: 'bajas' },
  ]

  const headers = [
    { title: 'Nombre', key: 'nombre_completo', sortable: false },
    { title: 'Departamento', key: 'departamento', sortable: false },
    { title: 'Forma de pago', key: 'forma', sortable: false },
    { title: 'Banco', key: 'banco', sortable: false },
    { title: 'Cuenta', key: 'numero_cuenta', sortable: false },
    { title: 'A nombre de', key: 'nombre_cuenta', sortable: false },
  ]

  const items = ref([])
  const resumen = ref({})
  const cargando = ref(false)
  const exportando = ref(false)
  const buscar = ref('')
  const estado = ref('activo')
  const forma = ref('')
  const meta = ref({ current_page: 1, last_page: 1, per_page: 25, total: 0 })
  const snackbar = ref({ show: false, text: '', color: 'error' })

  function textoChip (chip) {
    if (forma.value !== chip.value) return 'text-medium-emphasis'
    if (chip.color === 'warning' || chip.color === 'grey-darken-1') return 'text-black'
    return 'text-white'
  }

  function etiquetaForma (item) {
    if (item.forma === 'efectivo') return 'Efectivo'
    if (item.forma === 'banco') return item.tipo_pago || 'Banco'
    if (item.forma === 'cheque') return 'Cheque'
    if (item.forma === 'sin_definir') return 'Sin definir'
    return item.tipo_pago || 'Otro'
  }

  function colorForma (formaPago) {
    return {
      efectivo: 'warning',
      banco: 'primary',
      cheque: 'secondary',
      sin_definir: 'grey',
    }[formaPago] || 'grey'
  }

  function elegirForma (valor) {
    forma.value = forma.value === valor ? '' : valor
    cargar(1)
  }

  async function cargar (page = meta.value.current_page || 1) {
    cargando.value = true
    try {
      const res = await personalService.resumenCuentas({
        buscar: buscar.value || undefined,
        estado: estado.value,
        forma: forma.value || undefined,
        page,
        per_page: 25,
      })
      items.value = Array.isArray(res?.data) ? res.data : []
      resumen.value = res?.resumen || {}
      meta.value = res?.meta || meta.value
    } catch (error) {
      snackbar.value = {
        show: true,
        text: error.response?.data?.message || 'No se pudo cargar el resumen de cuentas',
        color: 'error',
      }
    } finally {
      cargando.value = false
    }
  }

  function filaCsv (valor) {
    const texto = String(valor ?? '')
    return `"${texto.replaceAll('"', '""')}"`
  }

  async function descargarCsv () {
    exportando.value = true
    try {
      const res = await personalService.resumenCuentas({
        buscar: buscar.value || undefined,
        estado: estado.value,
        forma: forma.value || undefined,
        page: 1,
        per_page: 2000,
      })
      const filas = Array.isArray(res?.data) ? res.data : []
      const encabezado = ['Nombre', 'Puesto', 'Departamento', 'Estado', 'Forma de pago', 'Banco', 'Tipo de cuenta', 'Número de cuenta', 'A nombre de']
      const lineas = [
        encabezado.join(','),
        ...filas.map(item => [
          item.nombre_completo,
          item.puesto,
          item.departamento,
          item.estado,
          etiquetaForma(item),
          item.forma === 'efectivo' ? '' : item.banco,
          item.forma === 'efectivo' ? '' : item.tipo_cuenta,
          item.forma === 'efectivo' ? '' : item.numero_cuenta,
          item.forma === 'efectivo' ? '' : item.nombre_cuenta,
        ].map(filaCsv).join(',')),
      ]
      const blob = new Blob([`\uFEFF${lineas.join('\n')}`], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'cuentas-contabilidad.csv'
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      snackbar.value = { show: true, text: 'No se pudo descargar el archivo', color: 'error' }
    } finally {
      exportando.value = false
    }
  }

  onMounted(() => cargar(1))
</script>
