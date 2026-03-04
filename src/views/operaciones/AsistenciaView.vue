<template>
  <v-container class="pa-4" fluid>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col>
        <h1 class="text-h4">Control de Asistencia</h1>
        <p class="text-body-2 text-medium-emphasis">
          Registre la asistencia diaria del personal asignado
        </p>
      </v-col>
    </v-row>

    <!-- Filtros -->
    <v-card class="mb-4" elevation="2" rounded="xl">
      <v-card-text>
        <v-row align="center">
          <!-- Date Picker -->
          <v-col cols="12" md="2">
            <v-text-field
              v-model="selectedDate"
              density="comfortable"
              label="Fecha"
              :max="maxDate"
              :min="minDate"
              prepend-inner-icon="mdi-calendar"
              type="date"
              variant="outlined"
              @update:model-value="onDateChange"
            />
          </v-col>

          <!-- Buscar personal - Oculto temporalmente -->
          <!--
          <v-col cols="12" md="3">
            <v-text-field
              v-model="buscarTexto"
              clearable
              density="comfortable"
              label="Buscar personal"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              @click:clear="buscarTexto = ''; cargarAsistencia()"
              @keyup.enter="cargarAsistencia"
            />
          </v-col>
          -->

          <!-- Filtro por proyecto (solo en tab Proyectos) -->
          <v-col v-if="activeTab === 'proyectos'" cols="12" md="2">
            <v-select
              v-model="selectedProyecto"
              clearable
              density="comfortable"
              item-title="nombre_proyecto"
              item-value="id"
              :items="proyectosFiltro"
              label="Filtrar proyecto"
              prepend-inner-icon="mdi-briefcase"
              variant="outlined"
            />
          </v-col>

          <!-- Filtro por departamento (solo en tab Sin Asignación) -->
          <v-col v-if="activeTab === 'sin_asignar'" cols="12" md="3">
            <v-select
              v-model="selectedDepartamento"
              clearable
              density="comfortable"
              hint="Dejar vacío para ver todos los departamentos"
              item-title="nombre"
              item-value="id"
              :items="departamentosDisponibles"
              label="Filtrar departamento"
              persistent-hint
              prepend-inner-icon="mdi-office-building"
              variant="outlined"
              @update:model-value="onDepartamentoChange"
            >
              <template #item="{ props, item }">
                <v-list-item v-bind="props">
                  <template #append>
                    <v-chip color="primary" size="x-small">
                      {{ item.raw.total_personal || 0 }}
                    </v-chip>
                  </template>
                </v-list-item>
              </template>
            </v-select>
          </v-col>

          <!-- Boton Cargar -->
          <v-col cols="12" md="2">
            <v-btn
              block
              color="primary"
              :disabled="!selectedDate"
              :loading="loading"
              variant="elevated"
              @click="cargarAsistencia"
            >
              <v-icon start>mdi-magnify</v-icon>
              Cargar
            </v-btn>
          </v-col>

          <v-spacer />

          <!-- Boton Generar Descansos - Oculto temporalmente -->
          <!--
          <v-col class="text-right" cols="12" md="3">
            <v-btn
              color="secondary"
              variant="tonal"
              @click="dialogDescansos = true"
            >
              <v-icon start>mdi-calendar-refresh</v-icon>
              Generar Descansos
            </v-btn>
          </v-col>
          -->
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Tabs -->
    <v-tabs v-model="activeTab" class="mb-4" color="primary" @update:model-value="onTabChange">
      <v-tab value="proyectos">
        <v-icon start>mdi-briefcase</v-icon>
        Proyectos
      </v-tab>
      <v-tab value="sin_asignar">
        <v-icon start>mdi-account-group</v-icon>
        Sin Asignacion
      </v-tab>
    </v-tabs>

    <!-- ==================== TAB PROYECTOS ==================== -->
    <template v-if="activeTab === 'proyectos'">
      <!-- Loading -->
      <div v-if="loading" class="text-center pa-8">
        <v-progress-circular color="primary" indeterminate size="48" />
        <div class="text-body-2 text-medium-emphasis mt-4">Cargando asistencia...</div>
      </div>

      <!-- Grupos de proyectos -->
      <template v-else-if="gruposProyectos.length > 0">
        <v-card
          v-for="grupo in gruposProyectos"
          :key="grupo.proyecto?.id || 'sin-proyecto'"
          class="mb-4"
          elevation="2"
          rounded="xl"
        >
          <!-- Header del proyecto -->
          <v-card-title class="d-flex align-center flex-wrap pa-4">
            <v-icon class="mr-2" color="primary">mdi-briefcase</v-icon>
            <span class="font-weight-bold">{{ grupo.proyecto?.nombre || 'Sin Proyecto' }}</span>
            <v-chip v-if="grupo.proyecto?.codigo" class="ml-2" color="secondary" size="small" variant="tonal">
              {{ grupo.proyecto.codigo }}
            </v-chip>
            <v-spacer />
            <!-- Resumen inline -->
            <div class="d-flex ga-2 flex-wrap">
              <v-chip color="success" size="small" variant="tonal">
                {{ grupo.resumen?.presentes || 0 }} presentes
              </v-chip>
              <v-chip v-if="grupo.resumen?.tardanzas" color="warning" size="small" variant="tonal">
                {{ grupo.resumen.tardanzas }} tardanzas
              </v-chip>
              <v-chip v-if="grupo.resumen?.descansos" color="info" size="small" variant="tonal">
                {{ grupo.resumen.descansos }} descansos
              </v-chip>
              <v-chip v-if="grupo.resumen?.ausentes_justificados" color="orange" size="small" variant="tonal">
                {{ grupo.resumen.ausentes_justificados }} aus. just.
              </v-chip>
              <v-chip v-if="grupo.resumen?.ausentes_injustificados" color="error" size="small" variant="tonal">
                {{ grupo.resumen.ausentes_injustificados }} aus. injust.
              </v-chip>
              <v-chip color="grey" size="small" variant="tonal">
                {{ grupo.resumen?.total || grupo.personalMapped?.length || 0 }} total
              </v-chip>
            </div>
          </v-card-title>

          <!-- Tabla del proyecto -->
          <v-card-text class="pa-0">
            <v-data-table
              class="asistencia-table"
              density="comfortable"
              :headers="headers"
              :items="grupo.personalMapped"
              :items-per-page="-1"
            >
              <!-- Personal -->
              <template #item.personal="{ item }">
                <div class="d-flex align-center py-2">
                  <v-avatar class="mr-3" color="primary" size="36">
                    <span class="text-white text-caption font-weight-bold">
                      {{ getInitials(item._personal) }}
                    </span>
                  </v-avatar>
                  <div>
                    <div class="font-weight-medium">
                      {{ item._personal?.nombres }} {{ item._personal?.apellidos }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ formatDPI(item._personal?.dpi) }}
                    </div>
                  </div>
                </div>
              </template>

              <!-- Puesto -->
              <template #item.puesto="{ item }">
                <span class="text-body-2">{{ item._puesto || 'N/A' }}</span>
              </template>

              <!-- Turno -->
              <template #item.turno="{ item }">
                <v-chip color="secondary" size="small" variant="tonal">
                  {{ item._turno?.nombre || 'N/A' }}
                </v-chip>
              </template>

              <!-- Estado -->
              <template #item.estado="{ item }">
                <div class="d-flex align-center ga-1 flex-wrap">
                  <v-btn-toggle
                    v-model="item.estadoLocal"
                    color="primary"
                    density="compact"
                    mandatory
                    @update:model-value="onEstadoChange(item)"
                  >
                    <v-btn :color="item.estadoLocal === 'presente' ? 'success' : ''" size="small" value="presente">
                      <v-icon size="small">mdi-check</v-icon>
                      <v-tooltip activator="parent">Presente</v-tooltip>
                    </v-btn>
                    <v-btn :color="item.estadoLocal === 'descanso' ? 'info' : ''" size="small" value="descanso">
                      <v-icon size="small">mdi-sleep</v-icon>
                      <v-tooltip activator="parent">Descanso</v-tooltip>
                    </v-btn>
                    <v-btn :color="item.estadoLocal === 'ausente' ? 'error' : ''" size="small" value="ausente">
                      <v-icon size="small">mdi-account-off</v-icon>
                      <v-tooltip activator="parent">Ausente</v-tooltip>
                    </v-btn>
                  </v-btn-toggle>

                  <v-chip
                    v-if="item.descansoAutomatico"
                    color="info"
                    size="x-small"
                    variant="outlined"
                  >
                    Auto
                  </v-chip>
                  <v-chip
                    v-if="item.estadoLocal === 'ausente' && item.tipoAusenciaLocal"
                    :color="item.tipoAusenciaLocal === 'justificada' ? 'orange' : 'error'"
                    size="x-small"
                    variant="flat"
                  >
                    {{ item.tipoAusenciaLocal === 'justificada' ? 'Just.' : 'Injust.' }}
                  </v-chip>
                  <v-chip
                    v-if="item.asistencia?.fue_reemplazado"
                    color="purple"
                    size="x-small"
                    variant="flat"
                  >
                    Reemplazado
                  </v-chip>
                </div>
              </template>

              <!-- Hora Entrada -->
              <template #item.hora_entrada="{ item }">
                <v-text-field
                  v-model="item.horaEntradaLocal"
                  density="compact"
                  :disabled="item.estadoLocal !== 'presente'"
                  hide-details
                  style="max-width: 120px;"
                  type="time"
                  variant="outlined"
                  @update:model-value="markChanged(item)"
                />
              </template>

              <!-- Hora Salida -->
              <template #item.hora_salida="{ item }">
                <v-text-field
                  v-model="item.horaSalidaLocal"
                  density="compact"
                  :disabled="item.estadoLocal !== 'presente'"
                  hide-details
                  style="max-width: 120px;"
                  type="time"
                  variant="outlined"
                  @update:model-value="markChanged(item)"
                />
              </template>

              <!-- Tardanza -->
              <template #item.tardanza="{ item }">
                <div class="d-flex align-center">
                  <v-checkbox
                    v-model="item.llegoTardeLocal"
                    density="compact"
                    :disabled="item.estadoLocal !== 'presente'"
                    hide-details
                    @update:model-value="markChanged(item)"
                  />
                  <v-text-field
                    v-if="item.llegoTardeLocal"
                    v-model.number="item.minutosRetrasoLocal"
                    density="compact"
                    hide-details
                    min="1"
                    style="max-width: 80px;"
                    suffix="min"
                    type="number"
                    variant="outlined"
                    @update:model-value="markChanged(item)"
                  />
                </div>
              </template>

              <!-- Info Ausencia / Reemplazo -->
              <template #item.ausencia_info="{ item }">
                <div v-if="item.estadoLocal === 'ausente'">
                  <div v-if="item.motivoAusenciaLocal" class="text-caption">
                    <v-icon color="orange" size="x-small">mdi-alert-circle</v-icon>
                    {{ item.motivoAusenciaLocal.nombre }}
                  </div>
                  <div v-if="item.reemplazoLocal" class="text-caption mt-1">
                    <v-icon color="purple" size="x-small">mdi-account-switch</v-icon>
                    {{ item.reemplazoLocal.nombres }} {{ item.reemplazoLocal.apellidos }}
                  </div>
                  <div v-else-if="item.sinReemplazo" class="text-caption text-medium-emphasis mt-1">
                    Sin reemplazo
                  </div>
                </div>
                <span v-else class="text-medium-emphasis">-</span>
              </template>

              <!-- Observaciones -->
              <template #item.observaciones="{ item }">
                <v-text-field
                  v-model="item.observacionesLocal"
                  density="compact"
                  hide-details
                  placeholder="Observaciones..."
                  style="min-width: 150px;"
                  variant="outlined"
                  @update:model-value="markChanged(item)"
                />
              </template>

              <!-- Acciones -->
              <template #item.acciones="{ item }">
                <v-menu>
                  <template #activator="{ props }">
                    <v-btn v-bind="props" icon="mdi-dots-vertical" size="small" variant="text" />
                  </template>
                  <v-list density="compact">
                    <v-list-item @click="abrirTransacciones(item)">
                      <template #prepend>
                        <v-icon size="20">mdi-cash-minus</v-icon>
                      </template>
                      <v-list-item-title>Registrar Transaccion</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="abrirCalendarioTurno(item)">
                      <template #prepend>
                        <v-icon size="20">mdi-calendar-month</v-icon>
                      </template>
                      <v-list-item-title>Ver Calendario Turno</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>

        <!-- Paginacion -->
        <div v-if="paginationData" class="d-flex justify-center align-center pa-4">
          <v-pagination
            v-model="currentPage"
            :length="paginationData.lastPage"
            :total-visible="7"
            @update:model-value="onPageChange"
          />
          <span class="text-caption text-medium-emphasis ml-4">
            {{ paginationData.total }} proyectos
          </span>
        </div>
      </template>

      <!-- Sin datos -->
      <v-card v-else-if="!loading && dataLoaded" elevation="2" rounded="xl">
        <v-card-text class="text-center pa-8">
          <v-icon class="mb-4" color="grey-lighten-1" size="64">mdi-clipboard-text-clock</v-icon>
          <div class="text-h6 text-medium-emphasis">Sin datos de asistencia</div>
          <div class="text-body-2 text-medium-emphasis">
            No se encontraron registros para la fecha seleccionada
          </div>
        </v-card-text>
      </v-card>
    </template>

    <!-- ==================== TAB SIN ASIGNACION ==================== -->
    <template v-if="activeTab === 'sin_asignar'">
      <!-- Loading -->
      <div v-if="loading" class="text-center pa-8">
        <v-progress-circular color="primary" indeterminate size="48" />
        <div class="text-body-2 text-medium-emphasis mt-4">Cargando personal sin asignacion...</div>
      </div>

      <!-- Grupos por departamento -->
      <template v-else-if="gruposDepartamentos.length > 0">
        <!-- <v-alert class="mb-4" density="compact" type="info" variant="tonal">
          {{ metaSinAsignar.total_sin_asignar || 0 }} personas sin asignacion en
          {{ metaSinAsignar.total_departamentos || 0 }} departamentos
        </v-alert> -->

        <v-card
          v-for="grupo in gruposDepartamentos"
          :key="grupo.departamento?.id || 'sin-depto'"
          class="mb-4"
          elevation="2"
          rounded="xl"
        >
          <v-card-title class="d-flex align-center pa-4">
            <v-icon class="mr-2" color="primary">mdi-domain</v-icon>
            <span class="font-weight-bold">{{ grupo.departamento?.nombre || 'Sin Departamento' }}</span>
            <v-spacer />
            <v-chip color="grey" size="small" variant="tonal">
              {{ grupo.total || grupo.personalMapped?.length || 0 }} personas
            </v-chip>
          </v-card-title>

          <v-card-text class="pa-0">
            <v-data-table
              class="asistencia-table"
              density="comfortable"
              :headers="headersSinAsignar"
              :hide-default-footer="!paginationData"
              :items="grupo.personalMapped"
              :items-per-page="-1"
            >
              <!-- Personal -->
              <template #item.personal="{ item }">
                <div class="d-flex align-center py-2">
                  <v-avatar class="mr-3" color="primary" size="36">
                    <span class="text-white text-caption font-weight-bold">
                      {{ getInitials(item._personal) }}
                    </span>
                  </v-avatar>
                  <div>
                    <div class="font-weight-medium">
                      {{ item._personal?.nombre_completo || `${item._personal?.nombres || ''} ${item._personal?.apellidos || ''}` }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ formatDPI(item._personal?.dpi) }}
                    </div>
                  </div>
                </div>
              </template>

              <!-- Estado -->
              <template #item.estado="{ item }">
                <div class="d-flex align-center ga-1 flex-wrap">
                  <v-btn-toggle
                    v-model="item.estadoLocal"
                    color="primary"
                    density="compact"
                    mandatory
                    @update:model-value="onEstadoChange(item)"
                  >
                    <v-btn :color="item.estadoLocal === 'presente' ? 'success' : ''" size="small" value="presente">
                      <v-icon size="small">mdi-check</v-icon>
                      <v-tooltip activator="parent">Presente</v-tooltip>
                    </v-btn>
                    <v-btn :color="item.estadoLocal === 'descanso' ? 'info' : ''" size="small" value="descanso">
                      <v-icon size="small">mdi-sleep</v-icon>
                      <v-tooltip activator="parent">Descanso</v-tooltip>
                    </v-btn>
                    <v-btn :color="item.estadoLocal === 'ausente' ? 'error' : ''" size="small" value="ausente">
                      <v-icon size="small">mdi-account-off</v-icon>
                      <v-tooltip activator="parent">Ausente</v-tooltip>
                    </v-btn>
                  </v-btn-toggle>

                  <v-chip
                    v-if="item.estadoLocal === 'ausente' && item.tipoAusenciaLocal"
                    :color="item.tipoAusenciaLocal === 'justificada' ? 'orange' : 'error'"
                    size="x-small"
                    variant="flat"
                  >
                    {{ item.tipoAusenciaLocal === 'justificada' ? 'Just.' : 'Injust.' }}
                  </v-chip>
                </div>
              </template>

              <!-- Hora Entrada -->
              <template #item.hora_entrada="{ item }">
                <v-text-field
                  v-model="item.horaEntradaLocal"
                  density="compact"
                  :disabled="item.estadoLocal !== 'presente'"
                  hide-details
                  style="max-width: 120px;"
                  type="time"
                  variant="outlined"
                  @update:model-value="markChanged(item)"
                />
              </template>

              <!-- Hora Salida -->
              <template #item.hora_salida="{ item }">
                <v-text-field
                  v-model="item.horaSalidaLocal"
                  density="compact"
                  :disabled="item.estadoLocal !== 'presente'"
                  hide-details
                  style="max-width: 120px;"
                  type="time"
                  variant="outlined"
                  @update:model-value="markChanged(item)"
                />
              </template>

              <!-- Tardanza -->
              <template #item.tardanza="{ item }">
                <div class="d-flex align-center">
                  <v-checkbox
                    v-model="item.llegoTardeLocal"
                    density="compact"
                    :disabled="item.estadoLocal !== 'presente'"
                    hide-details
                    @update:model-value="markChanged(item)"
                  />
                  <v-text-field
                    v-if="item.llegoTardeLocal"
                    v-model.number="item.minutosRetrasoLocal"
                    density="compact"
                    hide-details
                    min="1"
                    style="max-width: 80px;"
                    suffix="min"
                    type="number"
                    variant="outlined"
                    @update:model-value="markChanged(item)"
                  />
                </div>
              </template>

              <!-- Info Ausencia -->
              <template #item.ausencia_info="{ item }">
                <div v-if="item.estadoLocal === 'ausente'">
                  <div v-if="item.motivoAusenciaLocal" class="text-caption">
                    <v-icon color="orange" size="x-small">mdi-alert-circle</v-icon>
                    {{ item.motivoAusenciaLocal.nombre }}
                  </div>
                </div>
                <span v-else class="text-medium-emphasis">-</span>
              </template>

              <!-- Observaciones -->
              <template #item.observaciones="{ item }">
                <v-text-field
                  v-model="item.observacionesLocal"
                  density="compact"
                  hide-details
                  placeholder="Observaciones..."
                  style="min-width: 150px;"
                  variant="outlined"
                  @update:model-value="markChanged(item)"
                />
              </template>

              <!-- Acciones -->
              <template #item.acciones="{ item }">
                <v-menu>
                  <template #activator="{ props }">
                    <v-btn v-bind="props" icon="mdi-dots-vertical" size="small" variant="text" />
                  </template>
                  <v-list density="compact">
                    <v-list-item @click="abrirTransacciones(item)">
                      <template #prepend>
                        <v-icon size="20">mdi-cash-minus</v-icon>
                      </template>
                      <v-list-item-title>Registrar Transaccion</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </template>

              <!-- Footer con paginación personalizada -->
              <template v-if="paginationData" #bottom>
                <div class="d-flex justify-center align-center pa-4">
                  <v-pagination
                    v-model="currentPage"
                    :length="paginationData.lastPage"
                    :total-visible="7"
                    @update:model-value="onPageChange"
                  />
                  <span class="text-caption text-medium-emphasis ml-4">
                    {{ paginationData.total }} personas
                  </span>
                </div>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </template>

      <!-- Sin datos -->
      <v-card v-else-if="!loading && dataLoaded" elevation="2" rounded="xl">
        <v-card-text class="text-center pa-8">
          <v-icon class="mb-4" color="grey-lighten-1" size="64">mdi-account-group</v-icon>
          <div class="text-h6 text-medium-emphasis">Sin personal sin asignacion</div>
          <div class="text-body-2 text-medium-emphasis">
            Todo el personal tiene un proyecto asignado
          </div>
        </v-card-text>
      </v-card>
    </template>

    <!-- Boton Guardar Cambios -->
    <div v-if="hasChanges" class="d-flex justify-center py-6">
      <v-btn
        color="success"
        :loading="saving"
        size="large"
        variant="elevated"
        @click="guardarAsistencia"
      >
        <v-icon start>mdi-content-save</v-icon>
        Guardar Cambios
      </v-btn>
    </div>

    <!-- ==================== DIALOG AUSENCIA (Paso 1) ==================== -->
    <v-dialog v-model="dialogAusencia" max-width="550px" persistent>
      <v-card rounded="xl">
        <v-card-title class="bg-error pa-4">
          <v-icon color="white" start>mdi-account-off</v-icon>
          <span class="text-white">Registrar Ausencia</span>
        </v-card-title>

        <v-card-text class="pa-4">
          <div v-if="selectedAusenteItem" class="mb-4">
            <div class="text-subtitle-2 mb-1">Agente:</div>
            <div class="font-weight-medium">
              {{ selectedAusenteItem._personal?.nombres }}
              {{ selectedAusenteItem._personal?.apellidos }}
            </div>
          </div>

          <v-select
            v-model="ausenciaForm.motivo_ausencia_id"
            class="mb-3"
            density="comfortable"
            item-title="nombre"
            item-value="id"
            :items="operacionesStore.motivosAusencia"
            label="Motivo de ausencia *"
            :loading="loadingMotivos"
            variant="outlined"
          >
            <template #item="{ props, item }">
              <v-list-item v-bind="props">
                <template #subtitle>
                  {{ item.raw.descripcion }}
                </template>
                <template #append>
                  <div class="d-flex ga-1">
                    <v-chip
                      :color="item.raw.es_justificada ? 'success' : 'error'"
                      size="x-small"
                    >
                      {{ item.raw.es_justificada ? 'Justificada' : 'Injustificada' }}
                    </v-chip>
                    <v-chip
                      v-if="item.raw.aplica_descuento"
                      color="warning"
                      size="x-small"
                    >
                      Descuento
                    </v-chip>
                  </div>
                </template>
              </v-list-item>
            </template>
          </v-select>

          <v-alert
            v-if="motivoSeleccionado"
            class="mb-3"
            density="compact"
            :type="motivoSeleccionado.es_justificada ? 'warning' : 'error'"
            variant="tonal"
          >
            <div class="text-body-2">
              <strong>{{ motivoSeleccionado.es_justificada ? 'Justificada' : 'Injustificada' }}</strong>
              — {{ motivoSeleccionado.aplica_descuento ? 'Aplica descuento en planilla' : 'Sin descuento' }}
            </div>
            <div v-if="motivoSeleccionado.requiere_documento" class="text-caption mt-1">
              <v-icon size="x-small">mdi-file-document</v-icon>
              Requiere documento de soporte
            </div>
          </v-alert>

          <v-textarea
            v-model="ausenciaForm.descripcion"
            density="comfortable"
            label="Descripcion (opcional)"
            rows="3"
            variant="outlined"
          />
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="cancelarAusencia">Cancelar</v-btn>
          <v-btn
            color="error"
            :disabled="!ausenciaForm.motivo_ausencia_id"
            variant="elevated"
            @click="confirmarAusenciaPaso1"
          >
            Continuar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ==================== DIALOG REEMPLAZO (Paso 2) ==================== -->
    <v-dialog v-model="dialogReemplazo" max-width="600px" persistent>
      <v-card rounded="xl">
        <v-card-title class="bg-purple pa-4">
          <v-icon color="white" start>mdi-account-switch</v-icon>
          <span class="text-white">Seleccionar Reemplazo</span>
        </v-card-title>

        <v-card-text class="pa-4">
          <div v-if="selectedAusenteItem" class="mb-4">
            <v-alert density="compact" type="info" variant="tonal">
              <div class="text-body-2">
                Ausencia de <strong>{{ selectedAusenteItem._personal?.nombres }}
                {{ selectedAusenteItem._personal?.apellidos }}</strong>
                — {{ motivoSeleccionado?.nombre }}
              </div>
            </v-alert>
          </div>

          <v-text-field
            v-model="filtroReemplazo"
            class="mb-4"
            clearable
            density="compact"
            label="Buscar personal disponible"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
          />

          <v-list v-if="reemplazosDisponiblesFiltrados.length > 0" class="border rounded" density="compact" style="max-height: 300px; overflow-y: auto;">
            <v-list-item
              v-for="persona in reemplazosDisponiblesFiltrados"
              :key="persona.id"
              :value="persona.id"
              @click="selectReemplazo(persona)"
            >
              <template #prepend>
                <v-avatar color="secondary" size="36">
                  <span class="text-white text-caption">
                    {{ persona.nombres?.charAt(0) }}{{ persona.apellidos?.charAt(0) }}
                  </span>
                </v-avatar>
              </template>
              <v-list-item-title>{{ persona.nombres }} {{ persona.apellidos }}</v-list-item-title>
              <v-list-item-subtitle>{{ formatDPI(persona.dpi) }}</v-list-item-subtitle>
              <template #append>
                <v-icon v-if="selectedReemplazoPersona?.id === persona.id" color="success">
                  mdi-check-circle
                </v-icon>
              </template>
            </v-list-item>
          </v-list>

          <v-alert v-else density="compact" type="info" variant="tonal">
            No hay personal disponible para reemplazo en esta fecha
          </v-alert>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-btn variant="text" @click="volverPaso1">
            <v-icon start>mdi-arrow-left</v-icon>
            Volver
          </v-btn>
          <v-spacer />
          <v-btn color="grey" variant="tonal" @click="confirmarSinReemplazo">
            No requiere reemplazo
          </v-btn>
          <v-btn
            color="purple"
            :disabled="!selectedReemplazoPersona"
            variant="elevated"
            @click="confirmarConReemplazo"
          >
            Confirmar Reemplazo
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ==================== DIALOG GENERAR DESCANSOS ==================== -->
    <v-dialog v-model="dialogDescansos" max-width="400px">
      <v-card rounded="xl">
        <v-card-title class="bg-secondary pa-4">
          <v-icon color="white" start>mdi-calendar-refresh</v-icon>
          <span class="text-white">Generar Descansos Automaticos</span>
        </v-card-title>
        <v-card-text class="pa-4">
          <p class="text-body-2 mb-4">
            Genere los descansos programados para el rango de fechas seleccionado.
          </p>
          <v-text-field
            v-model="descansoFechaInicio"
            class="mb-3"
            density="comfortable"
            label="Fecha Inicio"
            type="date"
            variant="outlined"
          />
          <v-text-field
            v-model="descansoFechaFin"
            density="comfortable"
            label="Fecha Fin"
            type="date"
            variant="outlined"
          />
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="dialogDescansos = false">Cancelar</v-btn>
          <v-btn
            color="secondary"
            :disabled="!descansoFechaInicio || !descansoFechaFin"
            :loading="generandoDescansos"
            variant="elevated"
            @click="ejecutarGenerarDescansos"
          >
            Generar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ==================== DIALOG TRANSACCIONES ==================== -->
    <v-dialog v-model="dialogTransaccion" max-width="900" persistent>
      <v-card rounded="xl">
        <v-card-title class="bg-primary pa-4">
          <v-icon color="white" start>mdi-cash-minus</v-icon>
          <span class="text-white">Registrar Transaccion</span>
          <v-spacer />
          <v-btn color="white" icon="mdi-close" variant="text" @click="dialogTransaccion = false" />
        </v-card-title>
        <v-card-text class="pa-6">
          <TransaccionesPersonal
            v-if="selectedPersonalItem"
            :asistencia-id="selectedPersonalItem.asistencia?.id"
            :personal-id="selectedPersonalItem._personal?.id"
            @saved="onTransaccionSaved"
          />
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- ==================== DIALOG CALENDARIO TURNO ==================== -->
    <v-dialog v-model="dialogCalendarioTurno" max-width="700px">
      <v-card rounded="xl">
        <v-card-title class="bg-secondary pa-4">
          <v-icon color="white" start>mdi-calendar-month</v-icon>
          <span class="text-white">Calendario de Turno</span>
          <v-spacer />
          <v-btn color="white" icon="mdi-close" variant="text" @click="dialogCalendarioTurno = false" />
        </v-card-title>
        <v-card-text class="pa-4">
          <div v-if="loadingCalendario" class="text-center pa-8">
            <v-progress-circular color="primary" indeterminate />
          </div>
          <template v-else-if="calendarioData">
            <v-row class="mb-4">
              <v-col cols="12" sm="4">
                <div class="text-caption text-medium-emphasis">Agente</div>
                <div class="font-weight-medium">{{ calendarioData.personal?.nombre }}</div>
              </v-col>
              <v-col cols="12" sm="4">
                <div class="text-caption text-medium-emphasis">Proyecto</div>
                <div class="font-weight-medium">{{ calendarioData.proyecto?.nombre }}</div>
              </v-col>
              <v-col cols="12" sm="4">
                <div class="text-caption text-medium-emphasis">Turno</div>
                <v-chip color="secondary" size="small" variant="tonal">
                  {{ calendarioData.turno?.nombre }}
                  ({{ calendarioData.turno?.dias_trabajo }}T / {{ calendarioData.turno?.dias_descanso }}D)
                </v-chip>
              </v-col>
            </v-row>
            <v-row class="mb-3">
              <v-col cols="5">
                <v-text-field v-model="calendarioFechaInicio" density="compact" hide-details label="Desde" type="date" variant="outlined" />
              </v-col>
              <v-col cols="5">
                <v-text-field v-model="calendarioFechaFin" density="compact" hide-details label="Hasta" type="date" variant="outlined" />
              </v-col>
              <v-col cols="2">
                <v-btn block color="primary" variant="tonal" @click="recargarCalendario">
                  <v-icon>mdi-refresh</v-icon>
                </v-btn>
              </v-col>
            </v-row>
            <div class="calendario-grid">
              <div
                v-for="dia in calendarioData.calendario"
                :key="dia.fecha"
                class="calendario-dia pa-2 rounded text-center"
                :class="{ 'bg-success': dia.es_trabajo, 'bg-info': !dia.es_trabajo }"
                style="opacity: 0.85;"
              >
                <div class="text-caption font-weight-bold">{{ dia.dia_semana?.substring(0, 3) }}</div>
                <div class="text-body-2">{{ dia.fecha?.substring(8) }}</div>
                <v-chip :color="dia.es_trabajo ? 'success' : 'info'" size="x-small" variant="flat">
                  {{ dia.tipo }}
                </v-chip>
              </div>
            </div>
          </template>
          <v-alert v-else density="compact" type="info" variant="tonal">
            No se pudo cargar el calendario
          </v-alert>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="snackbarColor === 'error' ? 8000 : 3000">
      <div style="white-space: pre-line;">{{ snackbarText }}</div>
      <template #actions>
        <v-btn variant="text" @click="snackbar = false">Cerrar</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
  import { format } from 'date-fns'
  import { es } from 'date-fns/locale'
  import { computed, onMounted, ref } from 'vue'
  import TransaccionesPersonal from '@/components/personal/TransaccionesPersonal.vue'
  import { useOperacionesStore } from '@/stores/operaciones'
  import { useProyectosStore } from '@/stores/proyectos'
  import { formatDPI } from '@/utils/dpiFormatter'

  const operacionesStore = useOperacionesStore()
  const proyectosStore = useProyectosStore()

  // Estado general
  const loading = ref(false)
  const saving = ref(false)
  const loadingProyectos = ref(false)
  const generandoDescansos = ref(false)
  const loadingMotivos = ref(false)
  const loadingCalendario = ref(false)
  const dataLoaded = ref(false)

  // Tabs
  const activeTab = ref('proyectos')

  // Datos
  const selectedDate = ref(new Date().toISOString().split('T')[0])
  const buscarTexto = ref('')
  const selectedProyecto = ref(null)
  const proyectosFiltro = ref([])
  const selectedDepartamento = ref(null)
  const departamentosDisponibles = ref([])
  const paginationData = ref(null)
  const currentPage = ref(1)

  // Datos agrupados
  const gruposProyectos = ref([])
  const gruposDepartamentos = ref([])
  const metaSinAsignar = ref({})

  // Dialog Ausencia (Paso 1)
  const dialogAusencia = ref(false)
  const selectedAusenteItem = ref(null)
  const ausenciaForm = ref({
    motivo_ausencia_id: null,
    descripcion: '',
  })

  // Dialog Reemplazo (Paso 2)
  const dialogReemplazo = ref(false)
  const filtroReemplazo = ref('')
  const selectedReemplazoPersona = ref(null)

  // Dialogs adicionales
  const dialogDescansos = ref(false)
  const dialogTransaccion = ref(false)
  const selectedPersonalItem = ref(null)

  // Calendario turno
  const dialogCalendarioTurno = ref(false)
  const calendarioData = ref(null)
  const calendarioFechaInicio = ref(null)
  const calendarioFechaFin = ref(null)
  const calendarioAsignacionId = ref(null)

  // Descansos
  const descansoFechaInicio = ref(null)
  const descansoFechaFin = ref(null)

  // Snackbar
  const snackbar = ref(false)
  const snackbarText = ref('')
  const snackbarColor = ref('success')

  // Headers de la tabla
  const headers = [
    { title: 'Personal', key: 'personal', sortable: true, width: '200px' },
    { title: 'Puesto', key: 'puesto', sortable: true },
    { title: 'Turno', key: 'turno', sortable: true },
    { title: 'Estado', key: 'estado', sortable: false, width: '220px' },
    { title: 'Entrada', key: 'hora_entrada', sortable: false, width: '130px' },
    { title: 'Salida', key: 'hora_salida', sortable: false, width: '130px' },
    { title: 'Tardanza', key: 'tardanza', sortable: false, width: '140px' },
    { title: 'Ausencia / Reemplazo', key: 'ausencia_info', sortable: false, width: '180px' },
    { title: 'Observaciones', key: 'observaciones', sortable: false },
    { title: '', key: 'acciones', sortable: false, width: '60px' },
  ]

  const headersSinAsignar = [
    { title: 'Personal', key: 'personal', sortable: true, width: '200px' },
    { title: 'Estado', key: 'estado', sortable: false, width: '220px' },
    { title: 'Entrada', key: 'hora_entrada', sortable: false, width: '130px' },
    { title: 'Salida', key: 'hora_salida', sortable: false, width: '130px' },
    { title: 'Tardanza', key: 'tardanza', sortable: false, width: '140px' },
    { title: 'Ausencia / Reemplazo', key: 'ausencia_info', sortable: false, width: '180px' },
    { title: 'Observaciones', key: 'observaciones', sortable: false },
    { title: '', key: 'acciones', sortable: false, width: '60px' },
  ]

  // ==================== COMPUTED ====================

  // Restricción de fechas: solo hoy y ayer
  const minDate = computed(() => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return yesterday.toISOString().split('T')[0]
  })

  const maxDate = computed(() => {
    return new Date().toISOString().split('T')[0]
  })

  const hasChanges = computed(() => {
    const proyectosChanged = gruposProyectos.value.some(g =>
      g.personalMapped?.some(p => p.changed),
    )
    const sinAsignarChanged = gruposDepartamentos.value.some(g =>
      g.personalMapped?.some(p => p.changed),
    )
    return proyectosChanged || sinAsignarChanged
  })

  const motivoSeleccionado = computed(() => {
    if (!ausenciaForm.value.motivo_ausencia_id) return null
    return (operacionesStore.motivosAusencia || []).find(
      m => m.id === ausenciaForm.value.motivo_ausencia_id,
    )
  })

  const reemplazosDisponiblesFiltrados = computed(() => {
    let resultado = operacionesStore.reemplazosDisponibles || []

    if (filtroReemplazo.value) {
      const busqueda = filtroReemplazo.value.toLowerCase()
      resultado = resultado.filter(p =>
        `${p.nombres} ${p.apellidos}`.toLowerCase().includes(busqueda)
        || p.dpi?.includes(busqueda),
      )
    }

    return resultado
  })

  // ==================== FUNCIONES ====================

  async function loadProyectos () {
    loadingProyectos.value = true
    try {
      await proyectosStore.fetchAll(true)
      proyectosFiltro.value = proyectosStore.items.filter(p =>
        ['activo', 'planificacion'].includes(p.estado_proyecto),
      )
    } catch (error) {
      console.error('Error loading proyectos:', error)
    } finally {
      loadingProyectos.value = false
    }
  }

  async function loadMotivosAusencia () {
    loadingMotivos.value = true
    try {
      await operacionesStore.fetchMotivosAusencia()
    } catch (error) {
      console.error('Error loading motivos ausencia:', error)
    } finally {
      loadingMotivos.value = false
    }
  }

  async function loadDepartamentosDisponibles () {
    if (!selectedDate.value) return
    try {
      const response = await operacionesStore.fetchDepartamentosDisponibles(selectedDate.value)
      departamentosDisponibles.value = response || []
    } catch (error) {
      console.error('Error loading departamentos disponibles:', error)
    }
  }

  function onDateChange () {
    gruposProyectos.value = []
    gruposDepartamentos.value = []
    paginationData.value = null
    currentPage.value = 1
    dataLoaded.value = false
    selectedDepartamento.value = null

    // Recargar departamentos disponibles si estamos en tab "sin_asignar"
    if (activeTab.value === 'sin_asignar') {
      loadDepartamentosDisponibles()
    }
  }

  function onTabChange () {
    gruposProyectos.value = []
    gruposDepartamentos.value = []
    paginationData.value = null
    currentPage.value = 1
    dataLoaded.value = false
    selectedDepartamento.value = null

    // Cargar departamentos disponibles si estamos en tab "sin_asignar"
    if (activeTab.value === 'sin_asignar') {
      loadDepartamentosDisponibles()
    }

    cargarAsistencia()
  }

  function onPageChange (page) {
    currentPage.value = page
    cargarAsistencia()
  }

  function onDepartamentoChange () {
    currentPage.value = 1
    gruposDepartamentos.value = []
    cargarAsistencia()
  }

  // Mapea un item de personal del API a la estructura editable de la tabla
  function mapPersonalItem (item) {
    const asistencia = item.asistencia || null
    return {
      ...item,
      // Refs normalizados para acceder facilmente
      _personal: item.personal,
      _turno: item.turno,
      _puesto: item.puesto,
      _asignacionId: item.asignacion_id,
      // Estado editable
      estadoLocal: determinarEstado(asistencia),
      horaEntradaLocal: asistencia?.hora_entrada || '',
      horaSalidaLocal: asistencia?.hora_salida || '',
      llegoTardeLocal: asistencia?.llego_tarde || false,
      minutosRetrasoLocal: asistencia?.minutos_retraso || 0,
      observacionesLocal: asistencia?.observaciones || '',
      reemplazoLocal: asistencia?.reemplazo || asistencia?.personal_reemplazo || null,
      motivoAusenciaLocal: asistencia?.motivo_ausencia || null,
      tipoAusenciaLocal: asistencia?.tipo_ausencia || null,
      descripcionAusenciaLocal: asistencia?.descripcion_ausencia || '',
      sinReemplazo: asistencia?.es_ausente && !asistencia?.fue_reemplazado,
      descansoAutomatico: asistencia?.descanso_automatico || false,
      changed: false,
    }
  }

  // Mapea un item de personal SIN asignacion a la estructura editable
  function mapPersonalItemSinAsignar (persona) {
    const asistencia = persona.asistencia || null
    return {
      ...persona,
      _personal: persona,
      _turno: null,
      _puesto: null,
      _asignacionId: null,
      _personalId: persona.id,
      estadoLocal: determinarEstado(asistencia),
      horaEntradaLocal: asistencia?.hora_entrada || '',
      horaSalidaLocal: asistencia?.hora_salida || '',
      llegoTardeLocal: asistencia?.llego_tarde || false,
      minutosRetrasoLocal: asistencia?.minutos_retraso || 0,
      observacionesLocal: asistencia?.observaciones || '',
      reemplazoLocal: asistencia?.reemplazo || asistencia?.personal_reemplazo || null,
      motivoAusenciaLocal: asistencia?.motivo_ausencia || null,
      tipoAusenciaLocal: asistencia?.tipo_ausencia || null,
      descripcionAusenciaLocal: asistencia?.descripcion_ausencia || '',
      sinReemplazo: asistencia?.es_ausente && !asistencia?.fue_reemplazado,
      descansoAutomatico: asistencia?.descanso_automatico || false,
      changed: false,
    }
  }

  async function cargarAsistencia () {
    if (!selectedDate.value) return

    loading.value = true
    dataLoaded.value = false

    try {
      if (activeTab.value === 'sin_asignar') {
        // Tab sin asignacion
        const params = {
          sin_asignar: true,
          ...(buscarTexto.value ? { buscar: buscarTexto.value } : {}),
          ...(selectedDepartamento.value ? { departamento_id: selectedDepartamento.value } : {}),
        }

        // Si hay departamento seleccionado, agregar paginación
        if (selectedDepartamento.value) {
          params.page = currentPage.value
        }

        const response = await operacionesStore.fetchAsistenciaPorFecha(selectedDate.value, params)

        // Con departamento seleccionado: response.items es un objeto { departamento, personal }
        // Sin departamento: response.items es un array de objetos
        if (selectedDepartamento.value && response.items && !Array.isArray(response.items)) {
          // Convertir objeto a array con un solo elemento
          gruposDepartamentos.value = [{
            ...response.items,
            personalMapped: (response.items.personal || []).map(mapPersonalItemSinAsignar),
          }]
          paginationData.value = response.pagination || null
        } else {
          // Vista general (múltiples departamentos)
          gruposDepartamentos.value = (response.items || []).map(grupo => ({
            ...grupo,
            personalMapped: (grupo.personal || []).map(mapPersonalItemSinAsignar),
          }))
          paginationData.value = null
        }

        metaSinAsignar.value = response.meta || {}
      } else {
        // Tab proyectos
        const params = {
          page: currentPage.value,
          per_page: 10,
          ...(buscarTexto.value ? { buscar: buscarTexto.value } : {}),
          ...(selectedProyecto.value ? { proyecto_id: selectedProyecto.value } : {}),
        }

        const response = await operacionesStore.fetchAsistenciaPorFecha(selectedDate.value, params)

        paginationData.value = response.pagination || null

        // Mapear cada grupo de proyecto con su personal editable
        gruposProyectos.value = (response.items || []).map(grupo => ({
          ...grupo,
          personalMapped: (grupo.personal || []).map(mapPersonalItem),
        }))
      }

      dataLoaded.value = true
    } catch (error) {
      console.error('Error cargando asistencia:', error)
      showSnackbar('Error al cargar la asistencia', 'error')
    } finally {
      loading.value = false
    }
  }

  function determinarEstado (asistencia) {
    if (!asistencia || asistencia.estado === 'sin_registro') return 'presente'
    if (asistencia.es_descanso || asistencia.estado === 'descanso') return 'descanso'
    if (asistencia.es_ausente || asistencia.estado === 'ausente_justificado' || asistencia.estado === 'ausente_injustificado') return 'ausente'
    if (asistencia.fue_reemplazado || asistencia.estado === 'reemplazado') return 'ausente'
    return 'presente'
  }

  function onEstadoChange (item) {
    item.changed = true

    if (item.estadoLocal === 'descanso') {
      item.horaEntradaLocal = ''
      item.horaSalidaLocal = ''
      item.llegoTardeLocal = false
      item.minutosRetrasoLocal = 0
      item.reemplazoLocal = null
      item.motivoAusenciaLocal = null
      item.tipoAusenciaLocal = null
      item.descripcionAusenciaLocal = ''
      item.sinReemplazo = false
    } else if (item.estadoLocal === 'ausente') {
      item.horaEntradaLocal = ''
      item.horaSalidaLocal = ''
      item.llegoTardeLocal = false
      item.minutosRetrasoLocal = 0
      abrirAusenciaDialog(item)
    } else {
      item.reemplazoLocal = null
      item.motivoAusenciaLocal = null
      item.tipoAusenciaLocal = null
      item.descripcionAusenciaLocal = ''
      item.sinReemplazo = false
    }
  }

  function markChanged (item) {
    item.changed = true
  }

  // ==================== FLUJO AUSENCIA ====================

  function abrirAusenciaDialog (item) {
    selectedAusenteItem.value = item
    ausenciaForm.value = {
      motivo_ausencia_id: item.motivoAusenciaLocal?.id || null,
      descripcion: item.descripcionAusenciaLocal || '',
    }
    dialogAusencia.value = true
  }

  function cancelarAusencia () {
    if (selectedAusenteItem.value && !selectedAusenteItem.value.motivoAusenciaLocal) {
      selectedAusenteItem.value.estadoLocal = 'presente'
      selectedAusenteItem.value.changed = false
    }
    dialogAusencia.value = false
    selectedAusenteItem.value = null
    ausenciaForm.value = { motivo_ausencia_id: null, descripcion: '' }
  }

  async function confirmarAusenciaPaso1 () {
    if (!ausenciaForm.value.motivo_ausencia_id || !selectedAusenteItem.value) return

    const motivo = motivoSeleccionado.value
    selectedAusenteItem.value.motivoAusenciaLocal = motivo
    selectedAusenteItem.value.tipoAusenciaLocal = motivo.es_justificada ? 'justificada' : 'injustificada'
    selectedAusenteItem.value.descripcionAusenciaLocal = ausenciaForm.value.descripcion
    selectedAusenteItem.value.changed = true

    dialogAusencia.value = false

    filtroReemplazo.value = ''
    selectedReemplazoPersona.value = selectedAusenteItem.value.reemplazoLocal || null

    try {
      await operacionesStore.fetchReemplazosDisponibles(selectedDate.value)
    } catch (error) {
      console.error('Error cargando reemplazos:', error)
    }

    dialogReemplazo.value = true
  }

  function volverPaso1 () {
    dialogReemplazo.value = false
    dialogAusencia.value = true
  }

  function selectReemplazo (persona) {
    selectedReemplazoPersona.value = persona
  }

  function confirmarSinReemplazo () {
    if (selectedAusenteItem.value) {
      selectedAusenteItem.value.reemplazoLocal = null
      selectedAusenteItem.value.sinReemplazo = true
      selectedAusenteItem.value.changed = true
    }
    cerrarFlujoAusencia()
  }

  function confirmarConReemplazo () {
    if (selectedAusenteItem.value && selectedReemplazoPersona.value) {
      selectedAusenteItem.value.reemplazoLocal = selectedReemplazoPersona.value
      selectedAusenteItem.value.sinReemplazo = false
      selectedAusenteItem.value.changed = true
    }
    cerrarFlujoAusencia()
  }

  function cerrarFlujoAusencia () {
    dialogReemplazo.value = false
    selectedAusenteItem.value = null
    selectedReemplazoPersona.value = null
    ausenciaForm.value = { motivo_ausencia_id: null, descripcion: '' }
  }

  // ==================== GUARDAR ====================

  async function guardarAsistencia () {
    // Recoger todos los items con cambios de ambos tabs
    const itemsToSave = []
    for (const grupo of gruposProyectos.value) {
      for (const item of (grupo.personalMapped || [])) {
        if (item.changed) {
          itemsToSave.push(item)
        }
      }
    }
    for (const grupo of gruposDepartamentos.value) {
      for (const item of (grupo.personalMapped || [])) {
        if (item.changed) {
          itemsToSave.push(item)
        }
      }
    }

    if (itemsToSave.length === 0) {
      showSnackbar('No hay cambios para guardar', 'info')
      return
    }

    saving.value = true
    try {
      const asistencias = itemsToSave.map(item => {
        const registro = {
          fecha_asistencia: selectedDate.value,
        }

        // Con asignación: personal_asignado_id | Sin asignación: personal_id
        if (item._asignacionId) {
          registro.personal_asignado_id = item._asignacionId
        } else {
          registro.personal_id = item._personalId
        }

        if (item.estadoLocal === 'descanso') {
          registro.es_descanso = true
        } else if (item.estadoLocal === 'ausente') {
          registro.es_ausente = true
          registro.motivo_ausencia_id = item.motivoAusenciaLocal?.id || null
          registro.descripcion_ausencia = item.descripcionAusenciaLocal || null
          registro.tipo_ausencia = item.tipoAusenciaLocal

          if (item.reemplazoLocal) {
            registro.fue_reemplazado = true
            registro.personal_reemplazo_id = item.reemplazoLocal.id
          }
        } else {
          registro.hora_entrada = item.horaEntradaLocal || null
          registro.hora_salida = item.horaSalidaLocal || null
          registro.llego_tarde = item.llegoTardeLocal
          registro.minutos_retraso = item.llegoTardeLocal ? item.minutosRetrasoLocal : 0
        }

        registro.observaciones = item.observacionesLocal || null

        return registro
      })

      await operacionesStore.registrarAsistencia(asistencias)

      for (const item of itemsToSave) {
        item.changed = false
      }

      showSnackbar('Asistencia guardada correctamente', 'success')
      await cargarAsistencia()
    } catch (error) {
      console.error('Error guardando asistencia:', error)
      const mensajes = formatValidationErrors(error.apiErrors, itemsToSave)
      if (mensajes) {
        showSnackbar(mensajes, 'error')
      } else {
        showSnackbar(error.apiMessage || 'Error al guardar la asistencia', 'error')
      }
    } finally {
      saving.value = false
    }
  }

  function formatValidationErrors (errors, items) {
    if (!errors || typeof errors !== 'object') return null
    const messages = []
    for (const [key, msgs] of Object.entries(errors)) {
      const match = key.match(/^asistencias\.(\d+)\./)
      const persona = match ? items[parseInt(match[1])] : null
      const nombre = persona?._personal?.nombre_completo
        || (persona?._personal ? `${persona._personal.nombres} ${persona._personal.apellidos}` : null)
      for (const msg of (Array.isArray(msgs) ? msgs : [msgs])) {
        messages.push(nombre ? `${nombre}: ${msg}` : msg)
      }
    }
    return messages.length > 0 ? messages.join('\n') : null
  }

  // ==================== DESCANSOS ====================

  async function ejecutarGenerarDescansos () {
    if (!descansoFechaInicio.value || !descansoFechaFin.value) return

    generandoDescansos.value = true
    try {
      await operacionesStore.generarDescansos(descansoFechaInicio.value, descansoFechaFin.value)
      showSnackbar('Descansos generados correctamente', 'success')
      dialogDescansos.value = false

      if (selectedDate.value) {
        await cargarAsistencia()
      }
    } catch (error) {
      console.error('Error generando descansos:', error)
      showSnackbar(error.apiMessage || 'Error al generar descansos', 'error')
    } finally {
      generandoDescansos.value = false
    }
  }

  // ==================== CALENDARIO TURNO ====================

  async function abrirCalendarioTurno (item) {
    const asignacionId = item._asignacionId
    if (!asignacionId) return

    calendarioAsignacionId.value = asignacionId
    dialogCalendarioTurno.value = true
    loadingCalendario.value = true
    calendarioData.value = null

    const today = new Date()
    calendarioFechaInicio.value = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
    calendarioFechaFin.value = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]

    try {
      calendarioData.value = await operacionesStore.fetchCalendarioTurno(asignacionId, {
        fecha_inicio: calendarioFechaInicio.value,
        fecha_fin: calendarioFechaFin.value,
      })
    } catch (error) {
      console.error('Error cargando calendario:', error)
      showSnackbar('Error al cargar calendario de turno', 'error')
    } finally {
      loadingCalendario.value = false
    }
  }

  async function recargarCalendario () {
    if (!calendarioAsignacionId.value) return

    loadingCalendario.value = true
    try {
      calendarioData.value = await operacionesStore.fetchCalendarioTurno(calendarioAsignacionId.value, {
        fecha_inicio: calendarioFechaInicio.value,
        fecha_fin: calendarioFechaFin.value,
      })
    } catch (error) {
      console.error('Error recargando calendario:', error)
    } finally {
      loadingCalendario.value = false
    }
  }

  // ==================== UTILIDADES ====================

  function getInitials (personal) {
    if (!personal) return '?'
    return `${personal.nombres?.charAt(0) || ''}${personal.apellidos?.charAt(0) || ''}`
  }

  function formatDateDisplay (date) {
    if (!date) return ''
    return format(new Date(date + 'T12:00:00'), 'EEEE d \'de\' MMMM, yyyy', { locale: es })
  }

  function showSnackbar (text, color = 'success') {
    snackbarText.value = text
    snackbarColor.value = color
    snackbar.value = true
  }

  function abrirTransacciones (item) {
    selectedPersonalItem.value = item
    dialogTransaccion.value = true
  }

  function onTransaccionSaved () {
    dialogTransaccion.value = false
    selectedPersonalItem.value = null
    showSnackbar('Transaccion registrada exitosamente', 'success')
  }

  onMounted(async () => {
    await Promise.all([
      loadProyectos(),
      loadMotivosAusencia(),
    ])

    const today = new Date()
    descansoFechaInicio.value = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
    descansoFechaFin.value = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]

    // Cargar automaticamente al montar
    await cargarAsistencia()
  })
</script>

<style scoped>
.asistencia-table :deep(.v-data-table__tr:hover) {
  background-color: rgba(var(--v-theme-primary), 0.04);
}

.asistencia-table :deep(th) {
  background-color: rgb(var(--v-theme-surface)) !important;
  font-weight: 600 !important;
}

.calendario-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.calendario-dia {
  min-height: 70px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>
