<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center flex-wrap ga-3 mb-4">
      <div>
        <h1 class="text-h5 font-weight-bold mb-0">Asistencia administrativa</h1>
        <p class="text-caption text-medium-emphasis mb-0">
          Solo gerencia y recursos humanos. No aparece en asistencia de campo.
        </p>
      </div>
      <v-spacer />
      <v-text-field
        v-model="fecha"
        density="compact"
        hide-details
        label="Fecha"
        max-width="200"
        prepend-inner-icon="mdi-calendar"
        type="date"
        variant="outlined"
        @update:model-value="cargar"
      />
      <v-btn
        v-if="canManage"
        color="primary"
        :disabled="!hayCambios"
        :loading="saving"
        variant="elevated"
        @click="guardar"
      >
        Guardar
      </v-btn>
    </div>

    <v-card elevation="2" rounded="xl">
      <v-data-table
        :headers="headers"
        :items="items"
        :items-per-page="50"
        :loading="loading"
      >
        <template #item.estado="{ item }">
          <v-chip :color="colorEstado(item.estadoLocal || item.asistencia?.estado)" size="small" variant="tonal">
            {{ etiquetaEstado(item.estadoLocal || item.asistencia?.estado) }}
          </v-chip>
        </template>
        <template #item.calendario="{ item }">
          <v-btn
            icon="mdi-calendar-month-outline"
            size="small"
            title="Ver calendario del mes"
            variant="text"
            @click="abrirCalendario(item)"
          />
        </template>
        <template #item.acciones="{ item }">
          <v-btn-group v-if="canManage" density="compact" variant="tonal">
            <v-btn size="small" @click="marcar(item, 'presente')">Presente</v-btn>
            <v-btn size="small" @click="marcar(item, 'ausente')">Ausente</v-btn>
            <v-btn size="small" @click="marcar(item, 'descanso')">Descanso</v-btn>
          </v-btn-group>
        </template>
        <template #no-data>
          <div class="text-medium-emphasis py-8">
            No hay personal marcado como administrativo.
          </div>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialogCalendario" max-width="920" scrollable>
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center flex-wrap ga-2 pt-4 px-4">
          <div class="text-subtitle-1 font-weight-medium">
            Calendario del mes · {{ nombrePersonaCalendario }}
          </div>
          <v-spacer />
          <v-btn icon="mdi-chevron-left" size="small" variant="text" @click="mesAnterior" />
          <div class="text-body-2 font-weight-medium" style="min-width: 140px; text-align: center;">
            {{ etiquetaMes }}
          </div>
          <v-btn
            :disabled="!puedeMesSiguiente"
            icon="mdi-chevron-right"
            size="small"
            variant="text"
            @click="mesSiguiente"
          />
          <v-btn icon="mdi-close" size="small" variant="text" @click="dialogCalendario = false" />
        </v-card-title>
        <v-card-text>
          <p class="text-caption text-medium-emphasis mb-3">
            Presente, ausente y descanso. Toque un día para pasar a marcar esa fecha.
          </p>
          <div v-if="calendarioResumen" class="d-flex flex-wrap ga-2 mb-4">
            <v-chip color="success" size="small" variant="tonal">{{ calendarioResumen.dias_trabajados }} presentes</v-chip>
            <v-chip color="info" size="small" variant="tonal">{{ calendarioResumen.dias_descanso }} descansos</v-chip>
            <v-chip color="error" size="small" variant="tonal">{{ calendarioResumen.dias_falta }} ausencias</v-chip>
            <v-chip color="grey" size="small" variant="tonal">{{ calendarioResumen.dias_sin_marcar }} sin marcar</v-chip>
          </div>
          <div v-if="loadingCalendario" class="text-medium-emphasis py-6">Cargando calendario…</div>
          <template v-else-if="calendarioMes.length">
            <div class="calendario-head">
              <span v-for="nombre in calendarioDiasSemana" :key="nombre">{{ nombre }}</span>
            </div>
            <div class="calendario-grid">
              <div
                v-for="(dia, idx) in calendarioCeldas"
                :key="dia?.fecha || `empty-${idx}`"
                class="calendario-dia"
                :class="dia ? [calendarioDiaClass(dia), { 'calendario-dia--activo': dia.fecha === fecha }] : 'calendario-dia--empty'"
              >
                <v-tooltip v-if="dia" location="top">
                  <template #activator="{ props: tipProps }">
                    <button
                      v-bind="tipProps"
                      class="calendario-dia__inner"
                      type="button"
                      @click="elegirDia(dia.fecha)"
                    >
                      <span class="calendario-dia__num">{{ dia.fecha?.substring(8) }}</span>
                      <span class="calendario-dia__tag">{{ calendarioEtiqueta(dia) }}</span>
                    </button>
                  </template>
                  <div>{{ dia.fecha }} · {{ calendarioEtiqueta(dia) }}</div>
                </v-tooltip>
              </div>
            </div>
          </template>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3500">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
  import { computed, onMounted, reactive, ref, watch } from 'vue'
  import operacionesService from '@/services/operacionesService'
  import { useAuthStore } from '@/stores/auth'
  import { todayLocalISODate } from '@/utils/dateFormatter'

  const authStore = useAuthStore()
  const canManage = computed(() => authStore.hasPermission('manage-asistencia-administrativa'))

  const fecha = ref(todayLocalISODate())
  const loading = ref(false)
  const saving = ref(false)
  const items = ref([])
  const snackbar = reactive({ show: false, text: '', color: 'success' })

  const dialogCalendario = ref(false)
  const personaCalendarioId = ref(null)
  const mesCalendario = ref(monthStart(todayLocalISODate()))
  const calendarioMes = ref([])
  const calendarioResumen = ref(null)
  const loadingCalendario = ref(false)

  const nombrePersonaCalendario = computed(() => {
    return items.value.find(p => p.id === personaCalendarioId.value)?.nombre_completo || ''
  })

  const etiquetaMes = computed(() => {
    const d = isoToLocalDate(mesCalendario.value)
    return d.toLocaleDateString('es-GT', { month: 'long', year: 'numeric' })
  })

  const puedeMesSiguiente = computed(() => {
    return monthStart(mesCalendario.value) < monthStart(todayLocalISODate())
  })

  const headers = computed(() => {
    const cols = [
      { title: 'Nombre', key: 'nombre_completo' },
      { title: 'Puesto', key: 'puesto' },
      { title: 'Estado', key: 'estado' },
      { title: '', key: 'calendario', sortable: false, width: '56px' },
    ]
    if (canManage.value) {
      cols.push({ title: '', key: 'acciones', sortable: false, align: 'end' })
    }
    return cols
  })

  const hayCambios = computed(() => items.value.some(i => i.estadoLocal))

  const calendarioDiasSemana = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom']
  const calendarioCeldas = computed(() => {
    const dias = calendarioMes.value || []
    if (!dias.length) return []
    const primera = dias[0]?.fecha
    if (!primera) return dias
    const jsDay = new Date(`${primera}T12:00:00`).getDay()
    const offsetLunes = (jsDay + 6) % 7
    return [...Array.from({ length: offsetLunes }, () => null), ...dias]
  })

  function isoToLocalDate (iso) {
    const [y, m, d] = String(iso).substring(0, 10).split('-').map(Number)
    return new Date(y, m - 1, d)
  }

  function monthStart (iso) {
    const [y, m] = String(iso).substring(0, 10).split('-')
    return `${y}-${m}-01`
  }

  function monthBounds (inicioMes) {
    const [y, m] = inicioMes.split('-').map(Number)
    const last = new Date(y, m, 0).getDate()
    return {
      inicio: `${y}-${String(m).padStart(2, '0')}-01`,
      fin: `${y}-${String(m).padStart(2, '0')}-${String(last).padStart(2, '0')}`,
    }
  }

  function addMonths (inicioMes, delta) {
    const [y, m] = inicioMes.split('-').map(Number)
    const d = new Date(y, m - 1 + delta, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  }

  function etiquetaEstado (estado) {
    return ({
      presente: 'Presente',
      asistio: 'Presente',
      ausente: 'Ausente',
      ausente_injustificado: 'Ausente',
      ausente_justificado: 'Ausente justificado',
      ausente_con_permiso: 'Ausente con permiso',
      descanso: 'Descanso',
      sin_registro: 'Sin registro',
    })[estado] || estado || 'Sin registro'
  }

  function colorEstado (estado) {
    return ({
      presente: 'success',
      asistio: 'success',
      ausente: 'error',
      ausente_injustificado: 'error',
      ausente_justificado: 'warning',
      ausente_con_permiso: 'warning',
      descanso: 'info',
      sin_registro: 'grey',
    })[estado] || 'grey'
  }

  function calendarioEtiqueta (dia) {
    const map = {
      cobertura: 'cubrió',
      trabajo: 'presente',
      extra: 'extra',
      descanso: 'descanso',
      falta: 'ausente',
      reemplazado: 'reemplazo',
      sin_marcar: 's/marcar',
      sin_asignacion: 's/marcar',
    }
    return map[dia?.tipo] || dia?.tipo || '—'
  }

  function calendarioDiaClass (dia) {
    const map = {
      cobertura: 'bg-purple',
      trabajo: 'bg-success',
      extra: 'bg-teal',
      descanso: 'bg-info',
      falta: 'bg-error',
      reemplazado: 'bg-warning',
      sin_marcar: 'bg-grey',
      sin_asignacion: 'bg-grey',
    }
    return map[dia?.tipo] || 'bg-grey'
  }

  function marcar (item, estado) {
    item.estadoLocal = estado
  }

  function abrirCalendario (item) {
    personaCalendarioId.value = item.id
    mesCalendario.value = monthStart(fecha.value)
    dialogCalendario.value = true
    cargarCalendario()
  }

  function elegirDia (iso) {
    if (!iso || iso > todayLocalISODate()) return
    fecha.value = iso
    mesCalendario.value = monthStart(iso)
    dialogCalendario.value = false
    cargar()
  }

  function mesAnterior () {
    mesCalendario.value = addMonths(mesCalendario.value, -1)
  }

  function mesSiguiente () {
    if (!puedeMesSiguiente.value) return
    mesCalendario.value = addMonths(mesCalendario.value, 1)
  }

  async function cargarCalendario () {
    if (!personaCalendarioId.value) return
    loadingCalendario.value = true
    try {
      const { inicio, fin } = monthBounds(mesCalendario.value)
      const cal = await operacionesService.getCalendarioDiasTrabajados(personaCalendarioId.value, {
        fecha_inicio: inicio,
        fecha_fin: fin,
      })
      calendarioMes.value = cal.data?.calendario || []
      calendarioResumen.value = cal.data?.resumen || null
    } catch (error) {
      snackbar.color = 'error'
      snackbar.text = error.apiMessage || error.response?.data?.message || 'No se pudo cargar el calendario'
      snackbar.show = true
    } finally {
      loadingCalendario.value = false
    }
  }

  async function cargar () {
    loading.value = true
    try {
      const res = await operacionesService.getAsistenciaAdministrativa(fecha.value)
      items.value = (res.data || []).map(p => ({ ...p, estadoLocal: null }))
    } catch (error) {
      snackbar.color = 'error'
      snackbar.text = error.apiMessage || error.response?.data?.message || 'No se pudo cargar la asistencia'
      snackbar.show = true
    } finally {
      loading.value = false
    }
  }

  async function guardar () {
    const pendientes = items.value.filter(i => i.estadoLocal)
    if (!pendientes.length) return
    saving.value = true
    try {
      const asistencias = pendientes.map(item => {
        const registro = {
          personal_id: item.id,
          fecha_asistencia: fecha.value,
        }
        if (item.estadoLocal === 'ausente') {
          registro.es_ausente = true
          registro.tipo_ausencia = 'injustificada'
          registro.tipo_inasistencia = '24_horas'
        } else if (item.estadoLocal === 'descanso') {
          registro.es_descanso = true
        }
        return registro
      })
      await operacionesService.registrarAsistencia(asistencias)
      snackbar.color = 'success'
      snackbar.text = 'Asistencia administrativa guardada'
      snackbar.show = true
      await cargar()
      if (dialogCalendario.value) await cargarCalendario()
    } catch (error) {
      snackbar.color = 'error'
      snackbar.text = error.apiMessage || error.response?.data?.message || 'No se pudo guardar'
      snackbar.show = true
    } finally {
      saving.value = false
    }
  }

  watch(mesCalendario, () => {
    if (dialogCalendario.value) cargarCalendario()
  })

  onMounted(cargar)
</script>

<style scoped>
.calendario-head {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
  margin-bottom: 6px;
}

.calendario-head span {
  text-align: center;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.55;
  font-weight: 600;
}

.calendario-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
}

.calendario-dia {
  min-height: 58px;
  min-width: 0;
  border-radius: 6px;
  overflow: hidden;
}

.calendario-dia--empty {
  background: transparent;
  min-height: 58px;
}

.calendario-dia--activo {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 1px;
}

.calendario-dia__inner {
  width: 100%;
  height: 100%;
  min-height: 58px;
  padding: 6px 4px 5px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: #fff;
  cursor: pointer;
  border: 0;
  background: transparent;
  text-align: left;
}

.calendario-dia__num {
  font-size: 0.8rem;
  font-weight: 700;
}

.calendario-dia__tag {
  font-size: 0.65rem;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  opacity: 0.92;
}
</style>
