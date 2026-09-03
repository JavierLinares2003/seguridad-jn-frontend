<template>
  <v-container class="pa-4" fluid>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col>
        <h1 class="text-h4">Control de Asistencia</h1>
        <p class="text-body-2 text-medium-emphasis">
          Registre la asistencia diaria. El calendario de bajas y suspendidos se consulta aquí abajo, buscando a la persona.
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

          <!-- Buscar personal -->
          <v-col cols="12" md="3">
            <v-text-field
              v-model="buscarTexto"
              clearable
              density="comfortable"
              label="Buscar en el día"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              @click:clear="buscarTexto = ''; cargarAsistencia()"
              @keyup.enter="cargarAsistencia"
            />
          </v-col>

          <v-col cols="12" md="3">
            <v-autocomplete
              v-model="consultaCalendario"
              clearable
              density="comfortable"
              hide-no-data
              item-title="nombre_completo"
              item-value="id"
              :items="opcionesCalendario"
              label="Calendario (incluye bajas)"
              :loading="buscandoCalendario"
              no-filter
              placeholder="Nombre o DPI"
              prepend-inner-icon="mdi-calendar-search"
              return-object
              variant="outlined"
              @update:search="onBuscarCalendario"
              @update:model-value="onElegirCalendario"
            >
              <template #item="{ props, item }">
                <v-list-item
                  v-bind="props"
                  :subtitle="`${item.raw.dpi || ''} · ${item.raw.estado || ''}`"
                />
              </template>
            </v-autocomplete>
          </v-col>

          <!-- Filtro por proyecto (solo en tab Proyectos) -->
          <v-col v-if="activeTab === 'proyectos'" cols="12" md="3">
            <v-autocomplete
              v-model="selectedProyecto"
              clearable
              density="comfortable"
              item-title="nombre_proyecto"
              :items="proyectosAutocomplete"
              label="Filtrar proyecto"
              :loading="loadingProyectosAutocomplete"
              no-data-text="Sin resultados"
              prepend-inner-icon="mdi-briefcase"
              return-object
              variant="outlined"
              @focus="onFocusProyecto"
              @update:search="onBuscarProyecto"
            >
              <template #item="{ props, item }">
                <v-list-item v-bind="props" :subtitle="item.raw.correlativo">
                  <template v-if="item.raw.empresa_cliente" #append>
                    <span class="text-caption text-medium-emphasis">{{ item.raw.empresa_cliente }}</span>
                  </template>
                </v-list-item>
              </template>
            </v-autocomplete>
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
              @click="() => solicitarRecarga(cargarAsistencia)"
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
    <v-tabs v-model="activeTab" bg-color="surface" class="mb-4" color="primary" slider-color="primary" @update:model-value="onTabChange">
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
            <span class="font-weight-bold">{{ grupo.proyecto?.nombre_proyecto || grupo.proyecto?.nombre || 'Sin Proyecto' }}</span>
            <v-chip v-if="grupo.proyecto?.correlativo || grupo.proyecto?.codigo" class="ml-2" color="secondary" size="small" variant="tonal">
              {{ grupo.proyecto.correlativo || grupo.proyecto.codigo }}
            </v-chip>
            <v-chip v-if="grupo.proyecto?.telefono" class="ml-2" color="primary" size="small" variant="tonal">
              <v-icon start size="small">mdi-phone</v-icon>
              {{ grupo.proyecto.telefono }}
            </v-chip>
            <v-spacer />
            <!-- Resumen inline -->
            <div class="d-flex ga-2 flex-wrap">
              <v-chip color="success" size="small" variant="tonal">
                {{ grupo.resumen?.presentes || 0 }} presentes
              </v-chip>
              <v-chip v-if="contarExtrasGrupo(grupo)" color="teal" size="small" variant="tonal">
                {{ contarExtrasGrupo(grupo) }} extras
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
                    <div v-if="item._personal?.telefono" class="text-caption text-medium-emphasis">
                      <v-icon size="x-small">mdi-phone</v-icon>
                      {{ item._personal.telefono }}
                    </div>
                    <div v-if="item._personal?.telefono_whatsapp" class="text-caption text-medium-emphasis">
                      <v-icon size="x-small">mdi-whatsapp</v-icon>
                      {{ item._personal.telefono_whatsapp }}
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
                    @update:model-value="onEstadoChange(item)"
                  >
                    <v-btn :color="item.estadoLocal === 'presente' ? 'success' : ''" size="small" value="presente">
                      <v-icon size="small">mdi-check</v-icon>
                      <v-tooltip activator="parent">Presente</v-tooltip>
                    </v-btn>
                    <v-btn :color="item.estadoLocal === 'extra' ? 'teal' : ''" size="small" value="extra">
                      <v-icon size="small">mdi-clock-plus</v-icon>
                      <v-tooltip activator="parent">Extra</v-tooltip>
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
                    v-if="item.estadoLocal === null"
                    color="warning"
                    size="x-small"
                    variant="tonal"
                  >
                    <v-icon size="12" start>mdi-help-circle</v-icon>
                    Sin marcar
                  </v-chip>
                  <v-chip
                    v-if="item.descansoAutomatico"
                    color="info"
                    size="x-small"
                    variant="outlined"
                  >
                    Auto
                  </v-chip>
                  <v-chip
                    v-if="item.estadoLocal === 'ausente' && item.permisoIdLocal"
                    color="success"
                    size="x-small"
                    variant="flat"
                  >
                    <v-icon size="12" start>mdi-shield-check</v-icon>
                    Con permiso
                  </v-chip>
                  <v-chip
                    v-else-if="item.estadoLocal === 'ausente' && item.tipoInasistenciaLocal"
                    color="deep-orange"
                    size="x-small"
                    variant="flat"
                  >
                    {{ item.tipoInasistenciaLocal === '12_horas' ? '12h — Q200' : '24h — Q400' }}
                  </v-chip>
                  <v-tooltip
                    v-if="item.estadoLocal === 'presente' && item.permisoReposicionIdLocal"
                    location="top"
                  >
                    <template #activator="{ props: tooltipProps }">
                      <v-chip
                        v-bind="tooltipProps"
                        color="indigo"
                        size="x-small"
                        variant="tonal"
                      >
                        <v-icon size="12" start>mdi-repeat</v-icon>
                        Repos. {{ item.horasReposicionLocal }}h
                      </v-chip>
                    </template>
                    <div>
                      <div class="font-weight-bold">Reposición de horas</div>
                      <div>Horas: {{ item.horasReposicionLocal }}h</div>
                      <div v-if="item.permisoReposicionLocal?.descripcion">
                        Permiso: {{ item.permisoReposicionLocal.descripcion }}
                      </div>
                      <div v-if="item.permisoReposicionLocal?.saldo_pendiente !== undefined">
                        Saldo restante: {{ item.permisoReposicionLocal.saldo_pendiente }}h
                      </div>
                    </div>
                  </v-tooltip>
                  <v-chip
                    v-if="item.asistencia?.fue_reemplazado || item.reemplazoLocal"
                    color="purple"
                    size="x-small"
                    variant="flat"
                  >
                    Cubierto
                  </v-chip>
                  <v-chip
                    v-if="item.asistencia?.cubrio_en"
                    color="teal"
                    size="x-small"
                    variant="tonal"
                  >
                    Cubrió otro puesto
                  </v-chip>
                </div>
              </template>

              <!-- Info Ausencia / Reemplazo -->
              <template #item.ausencia_info="{ item }">
                <div v-if="item.estadoLocal === 'ausente' || item.estadoLocal === 'descanso' || item.asistencia?.cubrio_en">
                  <div v-if="item.estadoLocal === 'ausente' && item.motivoAusenciaLocal" class="text-caption">
                    <v-icon color="orange" size="x-small">mdi-alert-circle</v-icon>
                    {{ item.motivoAusenciaLocal.nombre }}
                  </div>
                  <div v-if="item.reemplazoLocal" class="text-caption mt-1">
                    <v-icon color="purple" size="x-small">mdi-account-switch</v-icon>
                    Cubrió: {{ item.reemplazoLocal.nombres }} {{ item.reemplazoLocal.apellidos }}
                  </div>
                  <div v-else-if="item.estadoLocal === 'ausente' && item.sinReemplazo" class="text-caption text-medium-emphasis mt-1">
                    Sin cubridor
                  </div>
                  <div
                    v-else-if="item.estadoLocal === 'descanso' && !item.reemplazoLocal"
                    class="text-caption text-medium-emphasis mt-1"
                  >
                    Descanso. No hay que cubrir si el turno ya tiene a otro agente.
                  </div>
                  <div v-if="item.asistencia?.cubrio_en" class="text-caption mt-1 text-teal">
                    <v-icon color="teal" size="x-small">mdi-account-arrow-right</v-icon>
                    Cubrió en {{ item.asistencia.cubrio_en.proyecto || 'otro proyecto' }}
                  </div>
                  <v-btn
                    v-if="item.estadoLocal === 'descanso' || item.estadoLocal === 'ausente'"
                    class="mt-1 text-none"
                    :color="item.estadoLocal === 'descanso' && !item.reemplazoLocal ? 'medium-emphasis' : 'purple'"
                    size="x-small"
                    variant="text"
                    @click="abrirCubridoresDialog(item)"
                  >
                    {{ textoCubrimiento(item) }}
                  </v-btn>
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
                    <v-list-item
                      v-if="item.estadoLocal === 'presente'"
                      @click="abrirReposicionDialog(item)"
                    >
                      <template #prepend>
                        <v-icon size="20">mdi-repeat</v-icon>
                      </template>
                      <v-list-item-title>Registrar Reposición</v-list-item-title>
                    </v-list-item>
                    <v-divider />
                    <v-list-item @click="abrirBajaDialog(item)">
                      <template #prepend>
                        <v-icon size="20" color="error">mdi-account-off</v-icon>
                      </template>
                      <v-list-item-title class="text-error">Dar de Baja</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>

        <!-- Paginacion -->
        <div v-if="paginationData" class="d-flex justify-center align-center flex-wrap ga-3 pa-4">
          <v-select
            v-model="perPageProyectos"
            density="compact"
            hide-details
            item-title="title"
            item-value="value"
            :items="opcionesPorPagina"
            label="Por página"
            style="max-width: 140px"
            variant="outlined"
            @update:model-value="onPerPageChange"
          />
          <v-pagination
            :model-value="currentPage"
            :length="paginationData.lastPage"
            :total-visible="7"
            @update:model-value="onPageChange"
          />
          <span class="text-caption text-medium-emphasis">
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
                    <div v-if="item._personal?.telefono" class="text-caption text-medium-emphasis">
                      <v-icon size="x-small">mdi-phone</v-icon>
                      {{ item._personal.telefono }}
                    </div>
                    <div v-if="item._personal?.telefono_whatsapp" class="text-caption text-medium-emphasis">
                      <v-icon size="x-small">mdi-whatsapp</v-icon>
                      {{ item._personal.telefono_whatsapp }}
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
                    @update:model-value="onEstadoChange(item)"
                  >
                    <v-btn :color="item.estadoLocal === 'presente' ? 'success' : ''" size="small" value="presente">
                      <v-icon size="small">mdi-check</v-icon>
                      <v-tooltip activator="parent">Presente</v-tooltip>
                    </v-btn>
                    <v-btn :color="item.estadoLocal === 'extra' ? 'teal' : ''" size="small" value="extra">
                      <v-icon size="small">mdi-clock-plus</v-icon>
                      <v-tooltip activator="parent">Extra</v-tooltip>
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
                    v-if="item.estadoLocal === null"
                    color="warning"
                    size="x-small"
                    variant="tonal"
                  >
                    <v-icon size="12" start>mdi-help-circle</v-icon>
                    Sin marcar
                  </v-chip>
                  <v-chip
                    v-if="item.estadoLocal === 'ausente' && item.permisoIdLocal"
                    color="success"
                    size="x-small"
                    variant="flat"
                  >
                    <v-icon size="12" start>mdi-shield-check</v-icon>
                    Con permiso
                  </v-chip>
                  <v-chip
                    v-else-if="item.estadoLocal === 'ausente' && item.tipoAusenciaLocal"
                    :color="item.tipoAusenciaLocal === 'justificada' ? 'orange' : 'error'"
                    size="x-small"
                    variant="flat"
                  >
                    {{ item.tipoAusenciaLocal === 'justificada' ? 'Just.' : 'Injust.' }}
                  </v-chip>
                  <v-tooltip
                    v-if="item.estadoLocal === 'presente' && item.permisoReposicionIdLocal"
                    location="top"
                  >
                    <template #activator="{ props: tooltipProps }">
                      <v-chip
                        v-bind="tooltipProps"
                        color="indigo"
                        size="x-small"
                        variant="tonal"
                      >
                        <v-icon size="12" start>mdi-repeat</v-icon>
                        Repos. {{ item.horasReposicionLocal }}h
                      </v-chip>
                    </template>
                    <div>
                      <div class="font-weight-bold">Reposición de horas</div>
                      <div>Horas: {{ item.horasReposicionLocal }}h</div>
                      <div v-if="item.permisoReposicionLocal?.descripcion">
                        Permiso: {{ item.permisoReposicionLocal.descripcion }}
                      </div>
                      <div v-if="item.permisoReposicionLocal?.saldo_pendiente !== undefined">
                        Saldo restante: {{ item.permisoReposicionLocal.saldo_pendiente }}h
                      </div>
                    </div>
                  </v-tooltip>
                  <v-btn
                    icon="mdi-calendar-month"
                    size="small"
                    variant="text"
                    @click="abrirCalendarioPersonal(item)"
                  >
                    <v-tooltip activator="parent">Ver días trabajados</v-tooltip>
                  </v-btn>
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
                    <v-list-item @click="abrirCalendarioPersonal(item)">
                      <template #prepend>
                        <v-icon size="20">mdi-calendar-month</v-icon>
                      </template>
                      <v-list-item-title>Ver días trabajados</v-list-item-title>
                    </v-list-item>
                    <v-list-item
                      v-if="item.estadoLocal === 'presente'"
                      @click="abrirReposicionDialog(item)"
                    >
                      <template #prepend>
                        <v-icon size="20">mdi-repeat</v-icon>
                      </template>
                      <v-list-item-title>Registrar Reposición</v-list-item-title>
                    </v-list-item>
                    <v-divider />
                    <v-list-item @click="abrirBajaDialog(item)">
                      <template #prepend>
                        <v-icon size="20" color="error">mdi-account-off</v-icon>
                      </template>
                      <v-list-item-title class="text-error">Dar de Baja</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </template>

              <!-- Footer con paginación personalizada -->
              <template v-if="paginationData" #bottom>
                <div class="d-flex justify-center align-center pa-4">
                  <v-pagination
                    :model-value="currentPage"
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
    <div class="d-flex justify-center py-6">
      <v-btn
        color="success"
        :loading="saving"
        size="large"
        variant="elevated"
        @click="guardarAsistencia"
      >
        <v-icon start>mdi-content-save</v-icon>
        Guardar Cambios
        <v-chip
          v-if="hasChanges"
          class="ml-2"
          color="white"
          size="x-small"
          text-color="success"
          variant="flat"
        >
          {{ cantidadCambios }}
        </v-chip>
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

          <!-- Motivo de ausencia — oculto temporalmente (viene del backend /motivos-ausencia) -->
          <!--
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
          -->

          <!-- Permisos disponibles -->
          <div class="mb-4">
            <div class="text-body-2 mb-2 font-weight-medium">
              <v-icon class="mr-1" size="18">mdi-clipboard-check-outline</v-icon>
              ¿Tiene permiso aprobado?
            </div>

            <div v-if="loadingPermisos" class="d-flex align-center ga-2 mb-2">
              <v-progress-circular indeterminate size="16" width="2" />
              <span class="text-caption text-medium-emphasis">Buscando permisos...</span>
            </div>

            <template v-else-if="permisosDisponibles.length > 0">
              <v-radio-group
                v-model="ausenciaForm.permiso_id"
                density="compact"
                hide-details
              >
                <v-radio :value="null" label="Sin permiso (aplica descuento)" />
                <v-radio
                  v-for="p in permisosDisponibles"
                  :key="p.id"
                  :value="p.id"
                >
                  <template #label>
                    <div class="d-flex align-center ga-2">
                      <span>{{ p.descripcion }}</span>
                      <v-chip color="success" size="x-small" variant="tonal">
                        Saldo: {{ p.saldo_pendiente }}{{ p.tipo === 'dias' ? 'd' : 'h' }}
                      </v-chip>
                    </div>
                  </template>
                </v-radio>
              </v-radio-group>

              <v-alert
                v-if="ausenciaForm.permiso_id"
                class="mt-2"
                density="compact"
                type="success"
                variant="tonal"
              >
                Ausencia justificada — sin descuento en planilla
              </v-alert>
            </template>

            <div v-else class="text-caption text-medium-emphasis">
              No hay permisos vigentes con saldo disponible
            </div>
          </div>

          <!-- Tipo de inasistencia (solo sin permiso) -->
          <div v-if="!ausenciaForm.permiso_id" class="mb-3">
            <div class="text-body-2 mb-2 font-weight-medium">Tipo de inasistencia *</div>
            <v-btn-toggle
              v-model="ausenciaForm.tipo_inasistencia"
              color="error"
              density="comfortable"
              mandatory
              rounded="lg"
              variant="outlined"
            >
              <v-btn value="12_horas">
                <v-icon size="small" start>mdi-clock-outline</v-icon>
                12 horas — Q200
              </v-btn>
              <v-btn value="24_horas">
                <v-icon size="small" start>mdi-clock-alert-outline</v-icon>
                24 horas — Q400
              </v-btn>
            </v-btn-toggle>
          </div>

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
            :color="ausenciaForm.permiso_id ? 'success' : 'error'"
            :disabled="!ausenciaForm.permiso_id && !ausenciaForm.tipo_inasistencia"
            variant="elevated"
            @click="confirmarAusenciaPaso1"
          >
            {{ ausenciaForm.permiso_id ? 'Confirmar' : 'Continuar' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ==================== DIALOG REEMPLAZO (Paso 2) ==================== -->
    <v-dialog v-model="dialogReemplazo" max-width="600px" persistent>
      <v-card rounded="xl">
        <v-card-title class="bg-purple pa-4">
          <v-icon color="white" start>mdi-account-switch</v-icon>
          <span class="text-white">Asignar cubridor</span>
        </v-card-title>

        <v-card-text class="pa-4">
          <div v-if="selectedAusenteItem" class="mb-4">
            <v-alert density="compact" type="info" variant="tonal">
              <div class="text-body-2">
                Cubrir a <strong>{{ selectedAusenteItem._personal?.nombres }}
                {{ selectedAusenteItem._personal?.apellidos }}</strong>
                ({{ selectedAusenteItem.estadoLocal === 'descanso' ? 'descanso' : 'ausencia' }})
              </div>
              <div class="text-caption mt-1">
                El cubridor debe estar de descanso en su puesto o sin asignación. Su descanso original no se toca.
              </div>
            </v-alert>
          </div>

          <v-text-field
            v-model="filtroReemplazo"
            class="mb-4"
            clearable
            density="compact"
            label="Buscar cubridor (disponible o de descanso)"
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
              <v-list-item-subtitle>
                {{ formatDPI(persona.dpi) }}
                <span v-if="persona.origen_cobertura === 'descanso'">
                  · Descanso en {{ persona.proyecto_origen || 'su puesto' }}
                </span>
                <span v-else> · Disponible (sin puesto)</span>
              </v-list-item-subtitle>
              <template #append>
                <v-chip
                  class="mr-2"
                  :color="persona.origen_cobertura === 'descanso' ? 'info' : 'success'"
                  size="x-small"
                  variant="tonal"
                >
                  {{ persona.origen_cobertura === 'descanso' ? 'Descanso' : 'Disponible' }}
                </v-chip>
                <v-icon v-if="selectedReemplazoPersona?.id === persona.id" color="success">
                  mdi-check-circle
                </v-icon>
              </template>
            </v-list-item>
          </v-list>

          <v-alert v-else density="compact" type="info" variant="tonal">
            No hay cubridores: alguien sin puesto, o de descanso en otro proyecto.
          </v-alert>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-btn variant="text" @click="volverPaso1">
            <v-icon start>mdi-arrow-left</v-icon>
            Volver
          </v-btn>
          <v-spacer />
          <v-btn color="grey" variant="tonal" @click="confirmarSinReemplazo">
            Sin cubridor
          </v-btn>
          <v-btn
            color="purple"
            :disabled="!selectedReemplazoPersona"
            variant="elevated"
            @click="confirmarConReemplazo"
          >
            Confirmar cubridor
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

    <!-- ==================== DIALOG DAR DE BAJA ==================== -->
    <v-dialog v-model="dialogBaja" max-width="480" persistent>
      <v-card rounded="xl">
        <v-card-title class="pa-4">
          <v-icon color="error" start>mdi-account-off</v-icon>
          Dar de Baja
        </v-card-title>
        <v-card-text class="pa-4">
          <p class="mb-4 text-body-2">
            <strong>{{ selectedBajaItem?._personal?.nombre_completo }}</strong>
          </p>
          <v-radio-group v-model="bajaEstado" label="Tipo de baja" class="mb-2">
            <v-radio label="Suspendido (temporal)" value="suspendido" />
            <v-radio label="No contratar (definitivo)" value="no_contratar" color="error" />
          </v-radio-group>
          <v-textarea
            v-model="bajaMotivo"
            label="Motivo *"
            :counter="500"
            :maxlength="500"
            rows="3"
            variant="outlined"
          />
          <v-btn
            class="mt-2"
            color="secondary"
            prepend-icon="mdi-calendar-month"
            variant="tonal"
            @click="abrirCalendarioDesdeBaja"
          >
            Ver días trabajados
          </v-btn>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn variant="text" :disabled="loadingBaja" @click="cerrarBajaDialog">Cancelar</v-btn>
          <v-btn
            color="error"
            variant="flat"
            :loading="loadingBaja"
            :disabled="!bajaEstado || !bajaMotivo?.trim()"
            @click="confirmarBaja"
          >
            Confirmar Baja
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ==================== DIALOG CALENDARIO TURNO ==================== -->
    <v-dialog v-model="dialogCalendarioTurno" max-width="840px" scrollable>
      <v-card rounded="xl">
        <v-card-title class="bg-secondary pa-4">
          <v-icon color="white" start>mdi-calendar-month</v-icon>
          <span class="text-white">{{ calendarioTitulo }}</span>
          <v-spacer />
          <v-btn color="white" icon="mdi-close" variant="text" @click="dialogCalendarioTurno = false" />
        </v-card-title>
        <v-card-text class="pa-4">
          <div v-if="loadingCalendario" class="text-center pa-8">
            <v-progress-circular color="primary" indeterminate />
          </div>
          <template v-else-if="calendarioData">
            <v-row class="mb-3" dense>
              <v-col cols="12" sm="4">
                <div class="text-caption text-medium-emphasis">Agente</div>
                <div class="font-weight-medium">{{ calendarioData.personal?.nombre }}</div>
              </v-col>
              <v-col cols="12" sm="4">
                <div class="text-caption text-medium-emphasis">Proyecto actual</div>
                <div class="font-weight-medium">
                  {{ calendarioData.sin_asignacion ? 'Sin puesto asignado' : (calendarioData.proyecto?.nombre || '—') }}
                </div>
              </v-col>
              <v-col cols="12" sm="4">
                <div class="text-caption text-medium-emphasis">
                  {{ calendarioData.sin_asignacion ? 'Días del periodo' : 'Inicio en puesto' }}
                </div>
                <div class="font-weight-medium">
                  <template v-if="calendarioData.sin_asignacion">
                    {{ calendarioData.resumen?.dias_trabajados || 0 }} trabajados
                  </template>
                  <template v-else>
                    {{ calendarioData.fecha_inicio_asignacion ? String(calendarioData.fecha_inicio_asignacion).substring(0, 10) : '—' }}
                  </template>
                </div>
                <v-chip
                  v-if="calendarioData.turno?.nombre"
                  class="mt-1"
                  color="secondary"
                  size="x-small"
                  variant="tonal"
                >
                  {{ calendarioData.turno?.nombre }}
                  ({{ calendarioData.turno?.dias_trabajo }}T / {{ calendarioData.turno?.dias_descanso }}D)
                </v-chip>
              </v-col>
            </v-row>
            <v-alert
              v-if="calendarioData.puestos_anteriores?.length"
              class="mb-3"
              density="compact"
              type="info"
              variant="tonal"
            >
              Días de otro puesto se marcan con una franja a la izquierda:
              {{ calendarioData.puestos_anteriores.map(p => p.proyecto).filter(Boolean).join(', ') }}
            </v-alert>
            <div
              v-if="calendarioData.sin_asignacion && calendarioData.resumen"
              class="d-flex flex-wrap ga-2 mb-3"
            >
              <v-chip color="success" size="small" variant="tonal">
                {{ calendarioData.resumen.dias_trabajados }} trabajados
              </v-chip>
              <v-chip color="teal" size="small" variant="tonal">
                {{ calendarioData.resumen.dias_extra }} extra
              </v-chip>
              <v-chip color="info" size="small" variant="tonal">
                {{ calendarioData.resumen.dias_descanso }} descanso
              </v-chip>
              <v-chip color="error" size="small" variant="tonal">
                {{ calendarioData.resumen.dias_falta }} faltas
              </v-chip>
            </div>
            <v-row class="mb-3" dense>
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
            <div class="calendario-head">
              <span v-for="nombre in calendarioDiasSemana" :key="nombre">{{ nombre }}</span>
            </div>
            <div class="calendario-grid">
              <div
                v-for="(dia, idx) in calendarioCeldas"
                :key="dia?.fecha || `empty-${idx}`"
                class="calendario-dia"
                :class="dia ? [calendarioDiaClass(dia), { 'calendario-dia--otro': dia.puesto_anterior }] : 'calendario-dia--empty'"
              >
                <v-tooltip v-if="dia" location="top">
                  <template #activator="{ props: tipProps }">
                    <div v-bind="tipProps" class="calendario-dia__inner">
                      <span class="calendario-dia__num">{{ dia.fecha?.substring(8) }}</span>
                      <span class="calendario-dia__tag">{{ calendarioEtiqueta(dia) }}</span>
                    </div>
                  </template>
                  <div>
                    <div>{{ dia.fecha }} · {{ calendarioEtiqueta(dia) }}</div>
                    <div v-if="dia.proyecto">{{ dia.puesto_anterior ? 'Puesto anterior: ' : '' }}{{ dia.proyecto }}</div>
                    <div v-if="dia.observaciones">{{ dia.observaciones }}</div>
                  </div>
                </v-tooltip>
              </div>
            </div>
            <div class="d-flex flex-wrap ga-2 mt-3 text-caption">
              <v-chip color="purple" size="x-small" variant="tonal">cubrió</v-chip>
              <v-chip color="success" size="x-small" variant="tonal">trabajo</v-chip>
              <v-chip color="teal" size="x-small" variant="tonal">extra</v-chip>
              <v-chip color="info" size="x-small" variant="tonal">descanso</v-chip>
              <v-chip color="error" size="x-small" variant="tonal">falta</v-chip>
              <v-chip color="warning" size="x-small" variant="tonal">reemplazo</v-chip>
              <v-chip color="grey" size="x-small" variant="tonal">sin marcar</v-chip>
              <v-chip color="blue-grey" size="x-small" variant="tonal">sin asignar</v-chip>
              <v-chip color="secondary" size="x-small" variant="outlined">franja = otro puesto</v-chip>
            </div>
          </template>
          <v-alert v-else density="compact" type="info" variant="tonal">
            No se pudo cargar el calendario
          </v-alert>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- ==================== DIALOG REPOSICIÓN ==================== -->
    <v-dialog v-model="dialogReposicion" max-width="480px" persistent>
      <v-card rounded="xl">
        <v-card-title class="bg-indigo pa-4">
          <v-icon color="white" start>mdi-repeat</v-icon>
          <span class="text-white">Registrar Reposición de Horas</span>
        </v-card-title>

        <v-card-text class="pa-4">
          <div v-if="selectedReposicionItem" class="mb-4">
            <div class="text-subtitle-2 mb-1">Agente:</div>
            <div class="font-weight-medium">
              {{ selectedReposicionItem._personal?.nombres }}
              {{ selectedReposicionItem._personal?.apellidos }}
            </div>
          </div>

          <div v-if="loadingPermisosReposicion" class="d-flex justify-center py-4">
            <v-progress-circular color="indigo" indeterminate />
          </div>

          <template v-else>
            <v-select
              v-model="reposicionForm.permiso_id"
              clearable
              density="comfortable"
              item-title="descripcion"
              item-value="id"
              :items="permisosConSaldo"
              label="Permiso a reponer"
              no-data-text="No hay permisos con saldo pendiente"
              prepend-inner-icon="mdi-clipboard-check-outline"
              variant="outlined"
            >
              <template #item="{ props: itemProps, item }">
                <v-list-item v-bind="itemProps">
                  <template #append>
                    <v-chip color="warning" size="x-small" variant="tonal">
                      Saldo: {{ item.raw.saldo_pendiente }}h
                    </v-chip>
                  </template>
                </v-list-item>
              </template>
            </v-select>

            <v-text-field
              v-model.number="reposicionForm.horas_reposicion"
              class="mt-3"
              density="comfortable"
              :disabled="!reposicionForm.permiso_id"
              label="Horas a reponer hoy"
              min="0.5"
              prepend-inner-icon="mdi-clock-plus-outline"
              step="0.5"
              type="number"
              variant="outlined"
            />

            <v-alert
              v-if="reposicionForm.permiso_id && reposicionForm.horas_reposicion"
              class="mt-2"
              density="compact"
              type="info"
              variant="tonal"
            >
              Se registrarán {{ reposicionForm.horas_reposicion }}h de reposición para este día.
            </v-alert>
          </template>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="cancelarReposicion">Cancelar</v-btn>
          <v-btn
            color="indigo"
            :disabled="!reposicionForm.permiso_id || !reposicionForm.horas_reposicion"
            variant="elevated"
            @click="confirmarReposicion"
          >
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ==================== DIALOG CAMBIOS PENDIENTES ==================== -->
    <v-dialog v-model="dialogConfirmRecarga" max-width="480" persistent>
      <v-card rounded="xl">
        <v-card-title class="bg-warning pa-4 d-flex align-center">
          <v-icon color="white" start>mdi-alert-outline</v-icon>
          <span class="text-white font-weight-bold">Cambios pendientes</span>
        </v-card-title>
        <v-card-text class="pa-5">
          <p class="text-body-1 mb-1">
            Tienes <strong>{{ cantidadCambios }}</strong> cambio(s) pendientes sin guardar.
          </p>
          <p class="text-body-2 text-medium-emphasis">
            ¿Qué deseas hacer antes de continuar?
          </p>
        </v-card-text>
        <v-card-actions class="pa-4 ga-2 flex-wrap">
          <v-btn variant="text" @click="cancelarRecarga">Cancelar</v-btn>
          <v-spacer />
          <v-btn color="error" variant="tonal" @click="confirmarDescartarYRecargar">
            <v-icon start>mdi-delete-outline</v-icon>
            Descartar cambios
          </v-btn>
          <v-btn color="success" :loading="saving" variant="elevated" @click="confirmarGuardarYRecargar">
            <v-icon start>mdi-content-save</v-icon>
            Guardar y continuar
          </v-btn>
        </v-card-actions>
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
  import operacionesService from '@/services/operacionesService'
  import permisosService from '@/services/permisosService'
  import personalService from '@/services/personalService'
  import proyectoService from '@/services/proyectoService'
  import { useOperacionesStore } from '@/stores/operaciones'

  const operacionesStore = useOperacionesStore()

  // Estado general
  const loading = ref(false)
  const saving = ref(false)
  const generandoDescansos = ref(false)
  const loadingMotivos = ref(false)
  const loadingCalendario = ref(false)
  const dataLoaded = ref(false)

  // Tabs
  const activeTab = ref('proyectos')

  function localDateStr (date = new Date()) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  // Datos
  const selectedDate = ref(localDateStr())
  const buscarTexto = ref('')
  const consultaCalendario = ref(null)
  const opcionesCalendario = ref([])
  const buscandoCalendario = ref(false)
  let busquedaCalendarioTimeout = null
  const selectedProyecto = ref(null)   // objeto completo del proyecto seleccionado
  const proyectosAutocomplete = ref([])
  const loadingProyectosAutocomplete = ref(false)
  let buscarProyectoTimer = null
  const selectedDepartamento = ref(null)
  const departamentosDisponibles = ref([])
  const paginationData = ref(null)
  const currentPage = ref(1)
  const perPageProyectos = ref(25)
  const opcionesPorPagina = [
    { title: '10', value: 10 },
    { title: '25', value: 25 },
    { title: '50', value: 50 },
    { title: 'Todos', value: 200 },
  ]

  // Datos agrupados
  const gruposProyectos = ref([])
  const gruposDepartamentos = ref([])
  const metaSinAsignar = ref({})

  // Dialog Ausencia (Paso 1)
  const dialogAusencia = ref(false)
  const selectedAusenteItem = ref(null)
  const ausenciaForm = ref({
    motivo_ausencia_id: null,
    tipo_inasistencia: null,
    descripcion: '',
    permiso_id: null,
  })
  const permisosDisponibles = ref([])
  const loadingPermisos = ref(false)

  // Dialog Reposición
  const dialogReposicion = ref(false)
  const selectedReposicionItem = ref(null)
  const reposicionForm = ref({ permiso_id: null, horas_reposicion: null })
  const permisosConSaldo = ref([])
  const loadingPermisosReposicion = ref(false)

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
  const calendarioPersonalId = ref(null)

  // Dar de baja
  const dialogBaja = ref(false)
  const selectedBajaItem = ref(null)
  const bajaEstado = ref('')
  const bajaMotivo = ref('')
  const loadingBaja = ref(false)

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
    { title: 'Ausencia / Reemplazo', key: 'ausencia_info', sortable: false, width: '180px' },
    { title: 'Observaciones', key: 'observaciones', sortable: false },
    { title: '', key: 'acciones', sortable: false, width: '60px' },
  ]

  const headersSinAsignar = [
    { title: 'Personal', key: 'personal', sortable: true, width: '200px' },
    { title: 'Estado', key: 'estado', sortable: false, width: '220px' },
    { title: 'Ausencia / Reemplazo', key: 'ausencia_info', sortable: false, width: '180px' },
    { title: 'Observaciones', key: 'observaciones', sortable: false },
    { title: '', key: 'acciones', sortable: false, width: '60px' },
  ]

  // ==================== COMPUTED ====================

  // Restricción de fechas: solo hoy y ayer
  const minDate = computed(() => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return localDateStr(yesterday)
  })

  const maxDate = computed(() => {
    return localDateStr()
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

  const cantidadCambios = computed(() => {
    let total = 0
    for (const g of gruposProyectos.value) {
      total += (g.personalMapped || []).filter(p => p.changed).length
    }
    for (const g of gruposDepartamentos.value) {
      total += (g.personalMapped || []).filter(p => p.changed).length
    }
    return total
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

  async function cargarProyectosIniciales () {
    loadingProyectosAutocomplete.value = true
    try {
      const response = await proyectoService.getAll({ per_page: 20, estado: 'activo' })
      proyectosAutocomplete.value = response?.data?.data || response?.data || []
    } catch {
      // ignorar
    } finally {
      loadingProyectosAutocomplete.value = false
    }
  }

  function onFocusProyecto () {
    if (!proyectosAutocomplete.value.length) cargarProyectosIniciales()
  }

  function onBuscarProyecto (text) {
    // Evitar re-buscar cuando el texto viene de una selección ya realizada
    if (selectedProyecto.value && text === selectedProyecto.value.nombre_proyecto) return

    clearTimeout(buscarProyectoTimer)

    if (!text || text.trim().length === 0) {
      cargarProyectosIniciales()
      return
    }

    buscarProyectoTimer = setTimeout(async () => {
      loadingProyectosAutocomplete.value = true
      try {
        const response = await proyectoService.getAll({ search: text.trim(), per_page: 20 })
        proyectosAutocomplete.value = response?.data?.data || response?.data || []
      } catch {
        // ignorar
      } finally {
        loadingProyectosAutocomplete.value = false
      }
    }, 400)
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
    solicitarRecarga(() => {
      gruposProyectos.value = []
      gruposDepartamentos.value = []
      paginationData.value = null
      currentPage.value = 1
      dataLoaded.value = false
      selectedDepartamento.value = null
      if (activeTab.value === 'sin_asignar') loadDepartamentosDisponibles()
      cargarAsistencia()
    })
  }

  function onTabChange () {
    solicitarRecarga(() => {
      gruposProyectos.value = []
      gruposDepartamentos.value = []
      paginationData.value = null
      currentPage.value = 1
      dataLoaded.value = false
      selectedDepartamento.value = null
      if (activeTab.value === 'sin_asignar') loadDepartamentosDisponibles()
      cargarAsistencia()
    })
  }

  function onPageChange (page) {
    solicitarRecarga(() => {
      currentPage.value = page
      cargarAsistencia()
    })
  }

  function onPerPageChange () {
    currentPage.value = 1
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
      _personalId: item.personal?.id || null,
      // Estado editable
      asistenciaId: asistencia?.id || null,
      estadoLocal: determinarEstado(asistencia),
      estadoOriginal: determinarEstado(asistencia),
      horaEntradaLocal: asistencia?.hora_entrada || '',
      horaSalidaLocal: asistencia?.hora_salida || '',
      llegoTardeLocal: asistencia?.llego_tarde || false,
      minutosRetrasoLocal: asistencia?.minutos_retraso || 0,
      observacionesLocal: asistencia?.observaciones || '',
      reemplazoLocal: asistencia?.reemplazo || asistencia?.personal_reemplazo || null,
      motivoAusenciaLocal: asistencia?.motivo_ausencia || null,
      tipoAusenciaLocal: asistencia?.tipo_ausencia || null,
      tipoInasistenciaLocal: asistencia?.tipo_inasistencia || null,
      descripcionAusenciaLocal: asistencia?.descripcion_ausencia || '',
      permisoIdLocal: asistencia?.permiso_ausencia_id || null,
      sinReemplazo: asistencia?.es_ausente && !asistencia?.fue_reemplazado,
      descansoAutomatico: asistencia?.descanso_automatico || false,
      permisoReposicionIdLocal: asistencia?.permiso_reposicion?.id || asistencia?.permiso_reposicion_id || null,
      permisoReposicionLocal: asistencia?.permiso_reposicion || null,
      horasReposicionLocal: asistencia?.horas_reposicion || null,
      changed: false,
    }
  }

  // Mapea un item del CASO 2 (proyecto_id específico): { asignacion: {...}, asistencia: {...} }
  function mapPersonalItemCaso2 (item) {
    const asignacion = item.asignacion || {}
    const asistencia = item.asistencia || null
    return {
      ...item,
      _personal: asignacion.personal,
      _turno: asignacion.turno,
      _puesto: asignacion.puesto,
      _asignacionId: asignacion.id,
      _personalId: asignacion.personal?.id || null,
      asistenciaId: asistencia?.id || null,
      estadoLocal: determinarEstado(asistencia),
      estadoOriginal: determinarEstado(asistencia),
      horaEntradaLocal: asistencia?.hora_entrada || '',
      horaSalidaLocal: asistencia?.hora_salida || '',
      llegoTardeLocal: asistencia?.llego_tarde || false,
      minutosRetrasoLocal: asistencia?.minutos_retraso || 0,
      observacionesLocal: asistencia?.observaciones || '',
      reemplazoLocal: asistencia?.reemplazo || asistencia?.personal_reemplazo || null,
      motivoAusenciaLocal: asistencia?.motivo_ausencia || null,
      tipoAusenciaLocal: asistencia?.tipo_ausencia || null,
      tipoInasistenciaLocal: asistencia?.tipo_inasistencia || null,
      descripcionAusenciaLocal: asistencia?.descripcion_ausencia || '',
      permisoIdLocal: asistencia?.permiso_ausencia_id || null,
      sinReemplazo: asistencia?.es_ausente && !asistencia?.fue_reemplazado,
      descansoAutomatico: asistencia?.descanso_automatico || false,
      permisoReposicionIdLocal: asistencia?.permiso_reposicion?.id || asistencia?.permiso_reposicion_id || null,
      permisoReposicionLocal: asistencia?.permiso_reposicion || null,
      horasReposicionLocal: asistencia?.horas_reposicion || null,
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
      asistenciaId: asistencia?.id || null,
      estadoLocal: determinarEstado(asistencia),
      estadoOriginal: determinarEstado(asistencia),
      horaEntradaLocal: asistencia?.hora_entrada || '',
      horaSalidaLocal: asistencia?.hora_salida || '',
      llegoTardeLocal: asistencia?.llego_tarde || false,
      minutosRetrasoLocal: asistencia?.minutos_retraso || 0,
      observacionesLocal: asistencia?.observaciones || '',
      reemplazoLocal: asistencia?.reemplazo || asistencia?.personal_reemplazo || null,
      motivoAusenciaLocal: asistencia?.motivo_ausencia || null,
      tipoAusenciaLocal: asistencia?.tipo_ausencia || null,
      tipoInasistenciaLocal: asistencia?.tipo_inasistencia || null,
      descripcionAusenciaLocal: asistencia?.descripcion_ausencia || '',
      permisoIdLocal: asistencia?.permiso_ausencia_id || null,
      sinReemplazo: asistencia?.es_ausente && !asistencia?.fue_reemplazado,
      descansoAutomatico: asistencia?.descanso_automatico || false,
      permisoReposicionIdLocal: asistencia?.permiso_reposicion?.id || asistencia?.permiso_reposicion_id || null,
      permisoReposicionLocal: asistencia?.permiso_reposicion || null,
      horasReposicionLocal: asistencia?.horas_reposicion || null,
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
        const proyectoId = selectedProyecto.value?.id || null
        const params = {
          ...(buscarTexto.value ? { buscar: buscarTexto.value } : {}),
          ...(proyectoId ? { proyecto_id: proyectoId } : {}),
        }

        if (!proyectoId) {
          params.page = currentPage.value
          params.per_page = perPageProyectos.value
        }

        const response = await operacionesStore.fetchAsistenciaPorFecha(selectedDate.value, params)

        if (proyectoId) {
          // CASO 2: respuesta plana [ { asignacion, asistencia } ] — envolver en un único grupo
          gruposProyectos.value = [{
            proyecto: selectedProyecto.value
              ? { id: selectedProyecto.value.id, nombre: selectedProyecto.value.nombre_proyecto, correlativo: selectedProyecto.value.correlativo, telefono: selectedProyecto.value.telefono }
              : { id: response.meta?.proyecto_id, nombre: 'Proyecto' },
            resumen: null,
            personalMapped: (response.items || []).map(mapPersonalItemCaso2),
          }]
          paginationData.value = null
        } else {
          // CASO 1: respuesta agrupada por proyecto con paginación
          paginationData.value = response.pagination || null
          gruposProyectos.value = (response.items || []).map(grupo => ({
            ...grupo,
            personalMapped: (grupo.personal || []).map(mapPersonalItem),
          }))
        }
      }

      aplicarPendientes()
      dataLoaded.value = true
    } catch (error) {
      console.error('Error cargando asistencia:', error)
      showSnackbar('Error al cargar la asistencia', 'error')
    } finally {
      loading.value = false
    }
  }

  // ==================== PERSISTENCIA DE CAMBIOS PENDIENTES ====================

  function itemKey (item) {
    return item._asignacionId ? `a_${item._asignacionId}` : `p_${item._personalId || item.id}`
  }

  function storageKey (fecha) {
    return `asistencia_pending_${fecha}`
  }

  function extractarEstado (item) {
    return {
      estadoLocal: item.estadoLocal,
      horaEntradaLocal: item.horaEntradaLocal,
      horaSalidaLocal: item.horaSalidaLocal,
      llegoTardeLocal: item.llegoTardeLocal,
      minutosRetrasoLocal: item.minutosRetrasoLocal,
      observacionesLocal: item.observacionesLocal,
      reemplazoLocal: item.reemplazoLocal,
      motivoAusenciaLocal: item.motivoAusenciaLocal,
      tipoAusenciaLocal: item.tipoAusenciaLocal,
      tipoInasistenciaLocal: item.tipoInasistenciaLocal,
      descripcionAusenciaLocal: item.descripcionAusenciaLocal,
      permisoIdLocal: item.permisoIdLocal,
      sinReemplazo: item.sinReemplazo,
      permisoReposicionIdLocal: item.permisoReposicionIdLocal,
      permisoReposicionLocal: item.permisoReposicionLocal,
      horasReposicionLocal: item.horasReposicionLocal,
    }
  }

  function persistirPendientes () {
    if (!selectedDate.value) return
    const pendientes = {}
    for (const g of gruposProyectos.value) {
      for (const item of (g.personalMapped || [])) {
        if (item.changed) pendientes[itemKey(item)] = extractarEstado(item)
      }
    }
    for (const g of gruposDepartamentos.value) {
      for (const item of (g.personalMapped || [])) {
        if (item.changed) pendientes[itemKey(item)] = extractarEstado(item)
      }
    }
    if (Object.keys(pendientes).length > 0) {
      sessionStorage.setItem(storageKey(selectedDate.value), JSON.stringify(pendientes))
    } else {
      sessionStorage.removeItem(storageKey(selectedDate.value))
    }
  }

  function aplicarPendientes () {
    if (!selectedDate.value) return
    const raw = sessionStorage.getItem(storageKey(selectedDate.value))
    if (!raw) return
    try {
      const pendientes = JSON.parse(raw)
      for (const g of gruposProyectos.value) {
        for (const item of (g.personalMapped || [])) {
          const estado = pendientes[itemKey(item)]
          if (estado) Object.assign(item, estado, { changed: true })
        }
      }
      for (const g of gruposDepartamentos.value) {
        for (const item of (g.personalMapped || [])) {
          const estado = pendientes[itemKey(item)]
          if (estado) Object.assign(item, estado, { changed: true })
        }
      }
    } catch { /* ignorar errores de parseo */ }
  }

  function limpiarPendientes () {
    if (!selectedDate.value) return
    sessionStorage.removeItem(storageKey(selectedDate.value))
  }

  // ==================== FIN PERSISTENCIA ====================

  // ==================== CONFIRMACIÓN DE RECARGA ====================

  const dialogConfirmRecarga = ref(false)
  const pendingReloadAction = ref(null)

  function solicitarRecarga (action) {
    if (!hasChanges.value) {
      action()
      return
    }
    pendingReloadAction.value = action
    dialogConfirmRecarga.value = true
  }

  async function confirmarGuardarYRecargar () {
    dialogConfirmRecarga.value = false
    const action = pendingReloadAction.value
    pendingReloadAction.value = null
    const saved = await guardarAsistencia({ skipReload: true })
    if (saved && action) action()
  }

  function confirmarDescartarYRecargar () {
    dialogConfirmRecarga.value = false
    limpiarPendientes()
    const action = pendingReloadAction.value
    pendingReloadAction.value = null
    if (action) action()
  }

  function cancelarRecarga () {
    dialogConfirmRecarga.value = false
    pendingReloadAction.value = null
  }

  function determinarEstado (asistencia) {
    if (!asistencia || asistencia.estado === 'sin_registro') return null
    if (asistencia.es_descanso || asistencia.estado === 'descanso') return 'descanso'
    if (asistencia.es_ausente || asistencia.estado === 'ausente_justificado' || asistencia.estado === 'ausente_injustificado') return 'ausente'
    if (asistencia.fue_reemplazado || asistencia.estado === 'reemplazado') return 'ausente'
    if (asistencia.es_extra || asistencia.estado === 'extra') return 'extra'
    return 'presente'
  }

  function onEstadoChange (item) {
    item.changed = true

    if (item.estadoLocal === 'descanso') {
      item.horaEntradaLocal = ''
      item.horaSalidaLocal = ''
      item.llegoTardeLocal = false
      item.minutosRetrasoLocal = 0
      item.motivoAusenciaLocal = null
      item.tipoAusenciaLocal = null
      item.tipoInasistenciaLocal = null
      item.descripcionAusenciaLocal = ''
      persistirPendientes()
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
      item.tipoInasistenciaLocal = null
      item.descripcionAusenciaLocal = ''
      item.permisoIdLocal = null
      item.sinReemplazo = false
      persistirPendientes()
    }
  }

  function markChanged (item) {
    item.changed = true
    persistirPendientes()
  }

  // ==================== FLUJO AUSENCIA / COBERTURA ====================

  function textoCubrimiento (item) {
    if (item.reemplazoLocal) return 'Cambiar cubridor'
    if (item.estadoLocal === 'descanso') return 'Poner cubridor (opcional)'
    return 'Asignar cubridor'
  }

  async function abrirCubridoresDialog (item) {
    selectedAusenteItem.value = item
    filtroReemplazo.value = ''
    selectedReemplazoPersona.value = item.reemplazoLocal || null
    try {
      await operacionesStore.fetchReemplazosDisponibles(selectedDate.value, {
        excluir_personal_id: item._personalId,
        proyecto_id: item.proyecto?.id || item._proyectoId || null,
      })
    } catch (error) {
      console.error('Error cargando cubridores:', error)
    }
    dialogReemplazo.value = true
  }

  async function abrirAusenciaDialog (item) {
    selectedAusenteItem.value = item
    ausenciaForm.value = {
      motivo_ausencia_id: item.motivoAusenciaLocal?.id || null,
      tipo_inasistencia: item.tipoInasistenciaLocal || null,
      descripcion: item.descripcionAusenciaLocal || '',
      permiso_id: item.permisoIdLocal || null,
    }
    permisosDisponibles.value = []
    dialogAusencia.value = true  // abrir primero para mostrar el spinner dentro

    loadingPermisos.value = true
    try {
      if (item.asistenciaId) {
        // Asistencia ya existe: usar endpoint específico (filtra por fecha)
        const response = await operacionesService.getPermisosDisponibles(item.asistenciaId)
        permisosDisponibles.value = response.data || []
      } else {
        // Registro nuevo: consultar permisos con saldo del personal
        const personalId = item._personal?.id || item._personalId
        if (personalId) {
          const response = await permisosService.getPermisos(personalId, { con_saldo: 1 })
          permisosDisponibles.value = response.data || []
        }
      }
    } catch {
      // Sin permisos disponibles, continuar normal
    } finally {
      loadingPermisos.value = false
    }
  }

  function cancelarAusencia () {
    if (selectedAusenteItem.value && !selectedAusenteItem.value.motivoAusenciaLocal) {
      selectedAusenteItem.value.estadoLocal = selectedAusenteItem.value.estadoOriginal ?? null
      selectedAusenteItem.value.changed = false
    }
    dialogAusencia.value = false
    selectedAusenteItem.value = null
    permisosDisponibles.value = []
    ausenciaForm.value = { motivo_ausencia_id: null, tipo_inasistencia: null, descripcion: '', permiso_id: null }
  }

  async function confirmarAusenciaPaso1 () {
    if (!selectedAusenteItem.value) return

    const conPermiso = !!ausenciaForm.value.permiso_id
    selectedAusenteItem.value.motivoAusenciaLocal = null
    selectedAusenteItem.value.tipoAusenciaLocal = conPermiso ? 'justificada' : 'injustificada'
    selectedAusenteItem.value.tipoInasistenciaLocal = ausenciaForm.value.tipo_inasistencia
    selectedAusenteItem.value.descripcionAusenciaLocal = ausenciaForm.value.descripcion
    selectedAusenteItem.value.permisoIdLocal = ausenciaForm.value.permiso_id || null
    selectedAusenteItem.value.changed = true
    persistirPendientes()

    dialogAusencia.value = false
    permisosDisponibles.value = []

    filtroReemplazo.value = ''
    selectedReemplazoPersona.value = selectedAusenteItem.value.reemplazoLocal || null

    try {
      await operacionesStore.fetchReemplazosDisponibles(selectedDate.value, {
        excluir_personal_id: selectedAusenteItem.value?._personalId,
        proyecto_id: selectedAusenteItem.value?.proyecto?.id
          || gruposProyectos.value.find(g => (g.personalMapped || []).includes(selectedAusenteItem.value))?.proyecto?.id,
      })
    } catch (error) {
      console.error('Error cargando cubridores:', error)
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
    persistirPendientes()
  }

  function confirmarConReemplazo () {
    if (selectedAusenteItem.value && selectedReemplazoPersona.value) {
      selectedAusenteItem.value.reemplazoLocal = selectedReemplazoPersona.value
      selectedAusenteItem.value.sinReemplazo = false
      selectedAusenteItem.value.changed = true
    }
    cerrarFlujoAusencia()
    persistirPendientes()
  }

  function cerrarFlujoAusencia () {
    dialogReemplazo.value = false
    selectedAusenteItem.value = null
    selectedReemplazoPersona.value = null
    permisosDisponibles.value = []
    ausenciaForm.value = { motivo_ausencia_id: null, tipo_inasistencia: null, descripcion: '', permiso_id: null }
  }

  // ==================== FLUJO REPOSICIÓN ====================

  async function abrirReposicionDialog (item) {
    selectedReposicionItem.value = item
    reposicionForm.value = {
      permiso_id: item.permisoReposicionIdLocal || null,
      horas_reposicion: item.horasReposicionLocal || null,
    }
    permisosConSaldo.value = []
    loadingPermisosReposicion.value = true
    dialogReposicion.value = true
    try {
      const personalId = item._personal?.id || item._personalId
      if (personalId) {
        const response = await permisosService.getPermisos(personalId, { con_saldo: 1, tipo: 'horas' })
        permisosConSaldo.value = response.data || []
      }
    } catch {
      // Sin permisos, se muestra lista vacía
    } finally {
      loadingPermisosReposicion.value = false
    }
  }

  function confirmarReposicion () {
    if (!selectedReposicionItem.value) return
    selectedReposicionItem.value.permisoReposicionIdLocal = reposicionForm.value.permiso_id || null
    selectedReposicionItem.value.horasReposicionLocal = reposicionForm.value.horas_reposicion || null
    selectedReposicionItem.value.changed = true
    persistirPendientes()
    dialogReposicion.value = false
    selectedReposicionItem.value = null
    reposicionForm.value = { permiso_id: null, horas_reposicion: null }
  }

  function cancelarReposicion () {
    dialogReposicion.value = false
    selectedReposicionItem.value = null
    reposicionForm.value = { permiso_id: null, horas_reposicion: null }
  }

  // ==================== GUARDAR ====================

  async function guardarAsistencia ({ skipReload = false } = {}) {
    // Recolectar items con cambios del view actual
    const changedItems = []
    const allItems = []
    for (const grupo of gruposProyectos.value) {
      for (const item of (grupo.personalMapped || [])) {
        allItems.push(item)
        if (item.changed) changedItems.push(item)
      }
    }
    for (const grupo of gruposDepartamentos.value) {
      for (const item of (grupo.personalMapped || [])) {
        allItems.push(item)
        if (item.changed) changedItems.push(item)
      }
    }

    const itemsToSave = changedItems.length > 0
      ? changedItems.filter(i => i.estadoLocal !== null)
      : allItems.filter(i => i.estadoLocal !== null)

    if (itemsToSave.length === 0) {
      showSnackbar('No hay personal cargado para guardar', 'info')
      return
    }

    saving.value = true
    let saved = false
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
          if (item.reemplazoLocal) {
            registro.fue_reemplazado = true
            registro.personal_reemplazo_id = item.reemplazoLocal.id
            registro.motivo_reemplazo = 'Cobertura'
          }
        } else if (item.estadoLocal === 'ausente') {
          registro.es_ausente = true
          registro.motivo_ausencia_id = item.motivoAusenciaLocal?.id || null
          registro.descripcion_ausencia = item.descripcionAusenciaLocal || null
          registro.tipo_ausencia = item.tipoAusenciaLocal
          registro.tipo_inasistencia = item.tipoInasistenciaLocal
          if (item.permisoIdLocal) registro.permiso_id = item.permisoIdLocal

          if (item.reemplazoLocal) {
            registro.fue_reemplazado = true
            registro.personal_reemplazo_id = item.reemplazoLocal.id
            registro.motivo_reemplazo = 'Cobertura'
          }
        } else {
          registro.es_extra = item.estadoLocal === 'extra'
          registro.hora_entrada = item.horaEntradaLocal || null
          registro.hora_salida = item.horaSalidaLocal || null
          registro.llego_tarde = item.llegoTardeLocal
          registro.minutos_retraso = item.llegoTardeLocal ? item.minutosRetrasoLocal : 0
          if (item.permisoReposicionIdLocal) {
            registro.permiso_reposicion_id = item.permisoReposicionIdLocal
            registro.horas_reposicion = item.horasReposicionLocal || 0
          }
        }

        registro.observaciones = item.observacionesLocal || null

        return registro
      })

      await operacionesStore.registrarAsistencia(asistencias)

      limpiarPendientes()
      for (const item of itemsToSave) {
        item.changed = false
      }

      showSnackbar('Asistencia guardada correctamente', 'success')
      saved = true
      if (!skipReload) await cargarAsistencia()
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
    return saved
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

  const calendarioTitulo = computed(() => {
    return calendarioData.value?.sin_asignacion
      ? 'Calendario de días trabajados'
      : 'Calendario de Turno'
  })

  const calendarioDiasSemana = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom']

  const calendarioCeldas = computed(() => {
    const dias = calendarioData.value?.calendario || []
    if (!dias.length) return []
    const primera = dias[0]?.fecha
    if (!primera) return dias
    const jsDay = new Date(`${primera}T00:00:00`).getDay()
    const offsetLunes = (jsDay + 6) % 7
    return [...Array.from({ length: offsetLunes }, () => null), ...dias]
  })

  function rangoCalendarioMesActual () {
    const today = new Date()
    calendarioFechaInicio.value = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
    calendarioFechaFin.value = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]
  }

  function onBuscarCalendario (texto) {
    clearTimeout(busquedaCalendarioTimeout)
    const q = String(texto || '').trim()
    if (q.length < 2) {
      opcionesCalendario.value = []
      return
    }
    busquedaCalendarioTimeout = setTimeout(async () => {
      buscandoCalendario.value = true
      try {
        const res = await personalService.getAll({ buscar: q, per_page: 20 })
        const items = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : [])
        opcionesCalendario.value = items
      } catch {
        opcionesCalendario.value = []
      } finally {
        buscandoCalendario.value = false
      }
    }, 300)
  }

  function onElegirCalendario (persona) {
    if (!persona?.id) return
    abrirCalendarioPersonal({
      _personalId: persona.id,
      _personal: { id: persona.id, nombre_completo: persona.nombre_completo },
    })
  }

  async function abrirCalendarioTurno (item) {
    const asignacionId = item._asignacionId
    if (!asignacionId) return

    calendarioAsignacionId.value = asignacionId
    calendarioPersonalId.value = null
    dialogCalendarioTurno.value = true
    loadingCalendario.value = true
    calendarioData.value = null
    rangoCalendarioMesActual()

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

  function abrirCalendarioDesdeBaja () {
    if (!selectedBajaItem.value) return
    if (selectedBajaItem.value._asignacionId) {
      abrirCalendarioTurno(selectedBajaItem.value)
      return
    }
    abrirCalendarioPersonal(selectedBajaItem.value)
  }

  async function abrirCalendarioPersonal (item) {
    const personalId = item._personalId || item._personal?.id
    if (!personalId) return

    calendarioPersonalId.value = personalId
    calendarioAsignacionId.value = null
    dialogCalendarioTurno.value = true
    loadingCalendario.value = true
    calendarioData.value = null
    rangoCalendarioMesActual()

    try {
      calendarioData.value = await operacionesStore.fetchCalendarioDiasTrabajados(personalId, {
        fecha_inicio: calendarioFechaInicio.value,
        fecha_fin: calendarioFechaFin.value,
      })
    } catch (error) {
      console.error('Error cargando calendario:', error)
      showSnackbar('Error al cargar el calendario de días trabajados', 'error')
    } finally {
      loadingCalendario.value = false
    }
  }

  async function recargarCalendario () {
    if (!calendarioAsignacionId.value && !calendarioPersonalId.value) return

    loadingCalendario.value = true
    try {
      if (calendarioPersonalId.value) {
        calendarioData.value = await operacionesStore.fetchCalendarioDiasTrabajados(calendarioPersonalId.value, {
          fecha_inicio: calendarioFechaInicio.value,
          fecha_fin: calendarioFechaFin.value,
        })
      } else {
        calendarioData.value = await operacionesStore.fetchCalendarioTurno(calendarioAsignacionId.value, {
          fecha_inicio: calendarioFechaInicio.value,
          fecha_fin: calendarioFechaFin.value,
        })
      }
    } catch (error) {
      console.error('Error recargando calendario:', error)
    } finally {
      loadingCalendario.value = false
    }
  }

  function calendarioEtiqueta (dia) {
    const map = {
      cobertura: 'cubrió',
      trabajo: 'trabajo',
      extra: 'extra',
      descanso: 'descanso',
      falta: 'falta',
      reemplazado: 'reemplazo',
      sin_marcar: 's/marcar',
      sin_asignacion: 's/asignar',
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
      sin_marcar: 'bg-grey-lighten-2',
      sin_asignacion: 'bg-blue-grey-lighten-4',
    }
    return map[dia?.tipo] || 'bg-grey-lighten-3'
  }

  // ==================== UTILIDADES ====================

  function contarExtrasGrupo (grupo) {
    return (grupo?.personalMapped || []).filter(i => i.estadoLocal === 'extra').length
  }

  function getInitials (personal) {
    if (!personal) return '?'
    return `${personal.nombres?.charAt(0) || ''}${personal.apellidos?.charAt(0) || ''}`
  }

  function formatDPI (dpi) {
    if (!dpi) return ''
    const str = String(dpi).replace(/\D/g, '')
    if (str.length === 13) return `${str.slice(0, 4)} ${str.slice(4, 9)} ${str.slice(9)}`
    return str
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

  function abrirBajaDialog (item) {
    selectedBajaItem.value = item
    bajaEstado.value = ''
    bajaMotivo.value = ''
    dialogBaja.value = true
  }

  function cerrarBajaDialog () {
    dialogBaja.value = false
    selectedBajaItem.value = null
  }

  async function confirmarBaja () {
    if (!bajaEstado.value || !bajaMotivo.value?.trim()) return
    loadingBaja.value = true
    try {
      await personalService.darBaja(selectedBajaItem.value._personalId, {
        estado: bajaEstado.value,
        motivo: bajaMotivo.value.trim(),
      })
      const personalId = selectedBajaItem.value._personalId
      for (const grupo of gruposProyectos.value) {
        grupo.personalMapped = grupo.personalMapped.filter(p => p._personalId !== personalId)
      }
      for (const grupo of gruposDepartamentos.value) {
        grupo.personalMapped = grupo.personalMapped.filter(p => p._personalId !== personalId)
      }
      cerrarBajaDialog()
      showSnackbar('Personal dado de baja correctamente.', 'success')
    } catch (error) {
      const backendErrors = error.response?.data?.errors
      const msg = backendErrors
        ? Object.values(backendErrors).flat()[0]
        : error.response?.data?.message || 'Error al dar de baja'
      showSnackbar(msg, 'error')
    } finally {
      loadingBaja.value = false
    }
  }

  onMounted(async () => {
    // cargarProyectosIniciales corre en background (no bloquea la carga de asistencia)
    cargarProyectosIniciales()
    await loadMotivosAusencia()

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

.calendario-dia--otro {
  box-shadow: inset 4px 0 0 var(--jn-blue);
}

.calendario-dia__inner {
  height: 100%;
  min-height: 58px;
  padding: 6px 4px 5px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  cursor: default;
}

.calendario-dia__num {
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1;
}

.calendario-dia__tag {
  font-size: 0.62rem;
  letter-spacing: 0.02em;
  line-height: 1.1;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  opacity: 0.9;
}
</style>
