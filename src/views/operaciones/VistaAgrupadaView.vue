<template>
  <v-container class="pa-4" fluid>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col>
        <h1 class="text-h4">Vista Agrupada de Asistencia</h1>
        <p class="text-body-2 text-medium-emphasis">
          Resumen de asistencia agrupado por proyecto o departamento
        </p>
      </v-col>
    </v-row>

    <!-- Filtros -->
    <v-card class="mb-4" elevation="2" rounded="xl">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" md="3">
            <v-text-field
              v-model="fecha"
              density="comfortable"
              label="Fecha"
              prepend-inner-icon="mdi-calendar"
              type="date"
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="agruparPor"
              density="comfortable"
              :items="opcionesAgrupacion"
              label="Agrupar por"
              prepend-inner-icon="mdi-group"
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-btn
              block
              color="primary"
              :disabled="!fecha"
              :loading="loading"
              variant="elevated"
              @click="cargarVistaAgrupada"
            >
              <v-icon start>mdi-magnify</v-icon>
              Consultar
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Resumen General -->
    <v-row v-if="vistaData?.resumen" class="mb-4">
      <v-col cols="6" sm="4" md="2">
        <v-card color="primary" variant="tonal">
          <v-card-text class="text-center pa-3">
            <div class="text-h5 font-weight-bold">{{ vistaData.resumen.total_registros }}</div>
            <div class="text-caption">Total</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" sm="4" md="2">
        <v-card color="success" variant="tonal">
          <v-card-text class="text-center pa-3">
            <div class="text-h5 font-weight-bold">{{ vistaData.resumen.presentes }}</div>
            <div class="text-caption">Presentes</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" sm="4" md="2">
        <v-card color="warning" variant="tonal">
          <v-card-text class="text-center pa-3">
            <div class="text-h5 font-weight-bold">{{ vistaData.resumen.tardanzas }}</div>
            <div class="text-caption">Tardanzas</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" sm="4" md="2">
        <v-card color="orange" variant="tonal">
          <v-card-text class="text-center pa-3">
            <div class="text-h5 font-weight-bold">{{ vistaData.resumen.ausentes_justificados }}</div>
            <div class="text-caption">Aus. Just.</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" sm="4" md="2">
        <v-card color="error" variant="tonal">
          <v-card-text class="text-center pa-3">
            <div class="text-h5 font-weight-bold">{{ vistaData.resumen.ausentes_injustificados }}</div>
            <div class="text-caption">Aus. Injust.</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" sm="4" md="2">
        <v-card color="info" variant="tonal">
          <v-card-text class="text-center pa-3">
            <div class="text-h5 font-weight-bold">{{ vistaData.resumen.descansos }}</div>
            <div class="text-caption">Descansos</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Grupos -->
    <div v-if="vistaData?.grupos?.length > 0">
      <v-card
        v-for="grupo in vistaData.grupos"
        :key="grupo.id"
        class="mb-4"
        elevation="2"
        rounded="xl"
      >
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2" color="primary">
            {{ agruparPor === 'proyecto' ? 'mdi-briefcase' : 'mdi-domain' }}
          </v-icon>
          {{ grupo.nombre }}
          <v-chip v-if="grupo.codigo" class="ml-2" color="secondary" size="small" variant="tonal">
            {{ grupo.codigo }}
          </v-chip>
          <v-spacer />
          <span class="text-body-2 text-medium-emphasis">{{ grupo.total }} agentes</span>
        </v-card-title>

        <v-card-text>
          <!-- Barras de progreso del grupo -->
          <v-row class="mb-3">
            <v-col cols="6" sm="4" md="2">
              <div class="text-center">
                <div class="text-h6 font-weight-bold text-success">{{ grupo.presentes }}</div>
                <div class="text-caption">Presentes</div>
              </div>
            </v-col>
            <v-col cols="6" sm="4" md="2">
              <div class="text-center">
                <div class="text-h6 font-weight-bold text-warning">{{ grupo.tardanzas }}</div>
                <div class="text-caption">Tardanzas</div>
              </div>
            </v-col>
            <v-col cols="6" sm="4" md="2">
              <div class="text-center">
                <div class="text-h6 font-weight-bold text-info">{{ grupo.descansos }}</div>
                <div class="text-caption">Descansos</div>
              </div>
            </v-col>
            <v-col cols="6" sm="4" md="2">
              <div class="text-center">
                <div class="text-h6 font-weight-bold text-orange">{{ grupo.ausentes_justificados }}</div>
                <div class="text-caption">Aus. Just.</div>
              </div>
            </v-col>
            <v-col cols="6" sm="4" md="2">
              <div class="text-center">
                <div class="text-h6 font-weight-bold text-error">{{ grupo.ausentes_injustificados }}</div>
                <div class="text-caption">Aus. Injust.</div>
              </div>
            </v-col>
            <v-col cols="6" sm="4" md="2">
              <div class="text-center">
                <div class="text-h6 font-weight-bold text-grey">{{ grupo.sin_registro }}</div>
                <div class="text-caption">Sin Registro</div>
              </div>
            </v-col>
          </v-row>

          <!-- Barra visual de cobertura -->
          <div class="d-flex rounded overflow-hidden" style="height: 8px;">
            <div
              class="bg-success"
              :style="{ width: porcentaje(grupo.presentes, grupo.total) }"
            />
            <div
              class="bg-warning"
              :style="{ width: porcentaje(grupo.tardanzas, grupo.total) }"
            />
            <div
              class="bg-info"
              :style="{ width: porcentaje(grupo.descansos, grupo.total) }"
            />
            <div
              class="bg-orange"
              :style="{ width: porcentaje(grupo.ausentes_justificados, grupo.total) }"
            />
            <div
              class="bg-error"
              :style="{ width: porcentaje(grupo.ausentes_injustificados, grupo.total) }"
            />
            <div
              class="bg-grey"
              :style="{ width: porcentaje(grupo.sin_registro, grupo.total) }"
            />
          </div>

          <!-- Expandir detalle -->
          <v-expansion-panels v-if="grupo.asistencias?.length > 0" class="mt-3" variant="accordion">
            <v-expansion-panel>
              <v-expansion-panel-title>
                <v-icon class="mr-2" size="small">mdi-format-list-bulleted</v-icon>
                Ver detalle de asistencias ({{ grupo.asistencias.length }})
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-table density="compact">
                  <thead>
                    <tr>
                      <th>Personal</th>
                      <th>Estado</th>
                      <th>Motivo Ausencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="asist in grupo.asistencias" :key="asist.id">
                      <td>
                        {{ asist.asignacion?.personal?.nombres }}
                        {{ asist.asignacion?.personal?.apellidos }}
                      </td>
                      <td>
                        <v-chip
                          :color="getEstadoColor(asist.estado || asist.tipo)"
                          size="small"
                          variant="tonal"
                        >
                          {{ getEstadoLabel(asist.estado || asist.tipo) }}
                        </v-chip>
                      </td>
                      <td>{{ asist.motivo_ausencia?.nombre || '-' }}</td>
                    </tr>
                  </tbody>
                </v-table>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card-text>
      </v-card>
    </div>

    <!-- Sin datos -->
    <v-card v-else-if="!loading && consultaRealizada" elevation="2" rounded="xl">
      <v-card-text class="text-center pa-8">
        <v-icon class="mb-4" color="grey-lighten-1" size="64">mdi-chart-box-outline</v-icon>
        <div class="text-h6 text-medium-emphasis">Sin datos</div>
        <div class="text-body-2 text-medium-emphasis">
          No se encontraron registros de asistencia para la fecha seleccionada
        </div>
      </v-card-text>
    </v-card>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="3000">
      {{ snackbarText }}
      <template #actions>
        <v-btn variant="text" @click="snackbar = false">Cerrar</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
  import { ref } from 'vue'
  import { useOperacionesStore } from '@/stores/operaciones'

  const operacionesStore = useOperacionesStore()

  const loading = ref(false)
  const consultaRealizada = ref(false)
  const fecha = ref((() => { const _d = new Date(); return `${_d.getFullYear()}-${String(_d.getMonth() + 1).padStart(2, '0')}-${String(_d.getDate()).padStart(2, '0')}` })())
  const agruparPor = ref('proyecto')
  const vistaData = ref(null)

  const opcionesAgrupacion = [
    { title: 'Por Proyecto', value: 'proyecto' },
    { title: 'Por Departamento', value: 'departamento' },
  ]

  // Snackbar
  const snackbar = ref(false)
  const snackbarText = ref('')
  const snackbarColor = ref('success')

  async function cargarVistaAgrupada () {
    if (!fecha.value) return

    loading.value = true
    consultaRealizada.value = false

    try {
      vistaData.value = await operacionesStore.fetchVistaAgrupada({
        fecha: fecha.value,
        agrupar_por: agruparPor.value,
      })
      consultaRealizada.value = true
    } catch (error) {
      console.error('Error cargando vista agrupada:', error)
      snackbarText.value = error.apiMessage || 'Error al cargar vista agrupada'
      snackbarColor.value = 'error'
      snackbar.value = true
    } finally {
      loading.value = false
    }
  }

  function porcentaje (valor, total) {
    if (!total || total === 0) return '0%'
    return `${Math.round((valor / total) * 100)}%`
  }

  function getEstadoColor (estado) {
    const colores = {
      presente: 'success',
      tarde: 'warning',
      descanso: 'info',
      reemplazado: 'purple',
      ausente_justificado: 'orange',
      ausente_injustificado: 'error',
      sin_registro: 'grey',
    }
    return colores[estado] || 'grey'
  }

  function getEstadoLabel (estado) {
    const labels = {
      presente: 'Presente',
      tarde: 'Tarde',
      descanso: 'Descanso',
      reemplazado: 'Reemplazado',
      ausente_justificado: 'Aus. Justificada',
      ausente_injustificado: 'Aus. Injustificada',
      sin_registro: 'Sin Registro',
    }
    return labels[estado] || estado
  }
</script>
