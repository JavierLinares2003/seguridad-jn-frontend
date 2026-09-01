<template>
  <v-container class="pa-6" fluid>
    <!-- Loading -->
    <v-progress-linear
      v-if="store.loading"
      class="position-fixed"
      color="primary"
      height="3"
      indeterminate
      style="top: 64px; left: 0; right: 0; z-index: 10;"
    />

    <!-- Header Card -->
    <v-card v-if="personal" class="mb-6 personal-header-card" elevation="2" rounded="xl">
      <div class="personal-header-accent" />
      <v-card-text class="pa-5 pa-md-6">
        <div class="d-flex flex-column flex-md-row align-md-center justify-space-between ga-4">
          <div class="d-flex align-center ga-4 min-w-0">
            <v-avatar
              class="personal-header-avatar flex-shrink-0"
              color="primary"
              size="88"
              variant="tonal"
            >
              <v-img v-if="personal.foto_url" cover :src="personal.foto_url" />
              <v-icon v-else color="primary" size="48">mdi-account</v-icon>
            </v-avatar>

            <div class="min-w-0">
              <h1 class="text-h5 text-md-h4 font-weight-bold text-truncate">
                {{ personal.nombres }} {{ personal.apellidos }}
              </h1>
              <p v-if="personal.puesto" class="text-body-2 text-medium-emphasis mb-2 mt-1">
                {{ personal.puesto }}
              </p>
              <div class="d-flex align-center flex-wrap ga-2" :class="{ 'mt-2': !personal.puesto }">
                <v-chip
                  v-if="personal.es_administrativo"
                  color="primary"
                  label
                  size="small"
                  variant="flat"
                >
                  Administrativo
                </v-chip>
                <v-chip
                  v-if="personal.vive_en_cuadra"
                  color="teal"
                  label
                  size="small"
                  variant="tonal"
                >
                  <v-icon size="14" start>mdi-bed</v-icon>
                  Cuadra
                </v-chip>
                <v-chip
                  v-if="personal.departamento?.nombre"
                  color="primary"
                  label
                  size="small"
                  variant="tonal"
                >
                  <v-icon size="14" start>mdi-domain</v-icon>
                  {{ personal.departamento.nombre }}
                </v-chip>
                <v-chip
                  class="font-weight-medium"
                  :color="getEstadoColor(personal.estado)"
                  label
                  size="small"
                  variant="flat"
                >
                  <v-icon size="14" start>{{ getEstadoIcon(personal.estado) }}</v-icon>
                  {{ personal.estado }}
                </v-chip>
                <v-chip
                  v-if="personal.pendiente_liquidacion"
                  color="warning"
                  label
                  size="small"
                  variant="flat"
                >
                  <v-icon size="14" start>mdi-tshirt-crew</v-icon>
                  Uniforme / equipo pendiente
                </v-chip>
              </div>
            </div>
          </div>

          <div class="d-flex flex-wrap ga-2 flex-shrink-0">
            <v-btn
              class="text-none"
              color="grey-darken-1"
              rounded="lg"
              variant="tonal"
              @click="goBack"
            >
              <v-icon start>mdi-arrow-left</v-icon>
              Volver
            </v-btn>
            <v-btn
              v-if="expedienteCompleto"
              class="text-none font-weight-bold"
              color="secondary"
              :loading="downloadingCV"
              rounded="lg"
              variant="tonal"
              @click="downloadCV"
            >
              <v-icon start>mdi-file-document-outline</v-icon>
              CV
            </v-btn>
            <v-btn
              v-if="expedienteCompleto"
              class="text-none font-weight-bold"
              color="info"
              :loading="downloadingExpediente"
              rounded="lg"
              variant="tonal"
              @click="downloadExpediente"
            >
              <v-icon start>mdi-folder-account-outline</v-icon>
              Expediente
            </v-btn>
            <v-btn
              v-if="puedeEditarExpediente"
              class="text-none font-weight-bold"
              color="primary"
              rounded="lg"
              :to="{ name: 'personal-edit', params: { id: personal.id } }"
            >
              <v-icon start>mdi-pencil-outline</v-icon>
              Editar
            </v-btn>
            <v-btn
              v-if="['suspendido', 'no_contratar', 'inactivo'].includes(personal.estado)"
              v-can="'edit-personal'"
              class="text-none font-weight-bold"
              color="success"
              rounded="lg"
              variant="tonal"
              @click="dialogReingreso = true"
            >
              <v-icon start>mdi-account-reactivate</v-icon>
              Reingreso
            </v-btn>
            <v-btn
              class="text-none font-weight-bold"
              color="secondary"
              rounded="lg"
              variant="tonal"
              @click="abrirTabCalendario"
            >
              <v-icon start>mdi-calendar-month-outline</v-icon>
              Ver calendario
            </v-btn>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <v-alert
      v-if="esBajaOSuspendido"
      class="mb-6"
      prominent
      type="info"
      variant="tonal"
    >
      <div class="font-weight-bold mb-1">Calendario consultable</div>
      Esta persona está {{ etiquetaEstadoBaja }}. El calendario de días trabajados se conserva
      para que RRHH y contabilidad vean con exactitud qué días pagar. Ábralo en la pestaña Asistencia
      o con el botón Ver calendario.
    </v-alert>

    <v-alert
      v-if="personal?.pendiente_liquidacion"
      class="mb-6"
      prominent
      type="warning"
      variant="tonal"
    >
      <div class="font-weight-bold mb-1">Revisar liquidación de uniforme / equipo</div>
      Esta persona está {{ personal.estado }} y tiene boletas de uniforme/equipo sin devolver.
      Revise la pestaña Equipo / boletas antes de pagar: o se descuenta, o se registra la devolución.
    </v-alert>

    <template v-if="personal">
      <!-- Tabs -->
      <v-card elevation="2" rounded="xl">
        <v-tabs
          v-model="tab"
          bg-color="surface"
          class="border-b"
          color="primary"
          show-arrows
          slider-color="primary"
        >
          <v-tab class="text-none" value="personal">
            <v-icon size="20" start>mdi-account-outline</v-icon>
            Informacion Personal
          </v-tab>
          <template v-if="expedienteCompleto">
          <v-tab class="text-none" value="referencias">
            <v-icon size="20" start>mdi-briefcase-outline</v-icon>
            Referencias
          </v-tab>
          <v-tab class="text-none" value="familiares">
            <v-icon size="20" start>mdi-account-group-outline</v-icon>
            Familiares
          </v-tab>
          <v-tab class="text-none" value="redes">
            <v-icon size="20" start>mdi-share-variant-outline</v-icon>
            Redes Sociales
          </v-tab>
          <v-tab class="text-none" value="documentos">
            <v-icon size="20" start>mdi-file-document-outline</v-icon>
            Documentos
          </v-tab>
          <v-tab class="text-none" value="proyectos">
            <v-icon size="20" start>mdi-clipboard-list-outline</v-icon>
            Proyectos
          </v-tab>
          <v-tab class="text-none" value="asistencia">
            <v-icon size="20" start>mdi-calendar-check-outline</v-icon>
            Asistencia
          </v-tab>
          <v-tab class="text-none" value="equipo">
            <v-icon size="20" start>mdi-tshirt-crew</v-icon>
            Equipo / boletas
          </v-tab>
          <v-tab class="text-none" value="transacciones">
            <v-icon size="20" start>mdi-cash-multiple</v-icon>
            Transacciones
          </v-tab>
          <v-tab class="text-none" value="prestamos">
            <v-icon size="20" start>mdi-currency-usd</v-icon>
            Préstamos
          </v-tab>
          <v-tab class="text-none" value="vacaciones">
            <v-icon size="20" start>mdi-umbrella-beach</v-icon>
            Vacaciones
          </v-tab>
          <v-tab class="text-none" value="permisos">
            <v-icon size="20" start>mdi-clipboard-check-outline</v-icon>
            Permisos
          </v-tab>
          </template>
          <v-tab v-if="expedienteCompleto || alcanceNomina" class="text-none" value="historial-salarios">
            <v-icon size="20" start>mdi-chart-line</v-icon>
            Historial Salarios
          </v-tab>
        </v-tabs>

        <v-tabs-window v-model="tab">
          <!-- Tab: Informacion Personal -->
          <v-tabs-window-item value="personal">
            <v-card-text class="pa-6">
              <v-alert
                v-if="alcanceNomina"
                class="mb-4"
                color="info"
                density="compact"
                variant="tonal"
              >
                Vista de nómina: salario y datos de pago. El expediente completo solo lo ven gerencia y RRHH.
              </v-alert>
              <v-row>
                <v-col cols="12" md="6">
                  <v-card class="h-100" rounded="lg" variant="outlined">
                    <v-card-title class="d-flex align-center bg-grey-lighten-5 py-3 px-4">
                      <v-icon class="mr-2" color="primary" icon="mdi-card-account-details-outline" />
                      <span class="text-subtitle-1 font-weight-bold">Datos Personales</span>
                    </v-card-title>
                    <v-divider />
                    <v-card-text class="pa-0">
                      <v-list class="py-0" density="compact">
                        <v-list-item>
                          <template #prepend>
                            <v-icon color="grey" icon="mdi-identifier" size="20" />
                          </template>
                          <v-list-item-subtitle class="text-caption">DPI</v-list-item-subtitle>
                          <v-list-item-title class="font-weight-medium">{{ formatDPI(personal.dpi) }}</v-list-item-title>
                        </v-list-item>
                        <v-divider />
                        <v-list-item>
                          <template #prepend>
                            <v-icon color="grey" icon="mdi-file-document-outline" size="20" />
                          </template>
                          <v-list-item-subtitle class="text-caption">NIT</v-list-item-subtitle>
                          <v-list-item-title>{{ personal.nit || '-' }}</v-list-item-title>
                        </v-list-item>
                        <v-divider />
                        <v-list-item>
                          <template #prepend>
                            <v-icon color="grey" icon="mdi-card-account-details" size="20" />
                          </template>
                          <v-list-item-subtitle class="text-caption">Número IGSS</v-list-item-subtitle>
                          <v-list-item-title>{{ personal.numero_igss || '-' }}</v-list-item-title>
                        </v-list-item>
                        <v-divider />
                        <v-list-item>
                          <template #prepend>
                            <v-icon color="grey" icon="mdi-cake-variant-outline" size="20" />
                          </template>
                          <v-list-item-subtitle class="text-caption">Fecha Nacimiento</v-list-item-subtitle>
                          <v-list-item-title>{{ formatDate(personal.fecha_nacimiento) }}
                            <v-chip v-if="personal.edad" class="ml-1" color="primary" size="x-small" variant="tonal">{{ personal.edad }} anos</v-chip>
                          </v-list-item-title>
                        </v-list-item>
                        <v-divider />
                        <v-list-item>
                          <template #prepend>
                            <v-icon color="grey" icon="mdi-gender-male-female" size="20" />
                          </template>
                          <v-list-item-subtitle class="text-caption">Sexo</v-list-item-subtitle>
                          <v-list-item-title>{{ personal.sexo?.nombre || '-' }}</v-list-item-title>
                        </v-list-item>
                        <v-divider />
                        <v-list-item>
                          <template #prepend>
                            <v-icon color="grey" icon="mdi-heart-outline" size="20" />
                          </template>
                          <v-list-item-subtitle class="text-caption">Estado Civil</v-list-item-subtitle>
                          <v-list-item-title>{{ personal.estado_civil?.nombre || '-' }}</v-list-item-title>
                        </v-list-item>
                        <v-divider />
                        <v-list-item>
                          <template #prepend>
                            <v-icon color="grey" icon="mdi-water-outline" size="20" />
                          </template>
                          <v-list-item-subtitle class="text-caption">Tipo de Sangre</v-list-item-subtitle>
                          <v-list-item-title>
                            <v-chip v-if="personal.tipo_sangre?.nombre" color="error" size="small" variant="tonal">
                              {{ personal.tipo_sangre.nombre }}
                            </v-chip>
                            <span v-else>-</span>
                          </v-list-item-title>
                        </v-list-item>
                        <template v-if="personal.observaciones">
                          <v-divider />
                          <v-list-item>
                            <template #prepend>
                              <v-icon color="info" icon="mdi-information-outline" size="20" />
                            </template>
                            <v-list-item-subtitle class="text-caption">Observaciones</v-list-item-subtitle>
                            <v-list-item-title class="text-wrap">{{ personal.observaciones }}</v-list-item-title>
                          </v-list-item>
                        </template>
                        <template v-if="personal.observacion_recontratacion">
                          <v-divider />
                          <v-list-item class="bg-amber-lighten-5">
                            <template #prepend>
                              <v-icon color="warning" icon="mdi-comment-alert-outline" size="20" />
                            </template>
                            <v-list-item-subtitle class="text-caption">Observación de recontratación</v-list-item-subtitle>
                            <v-list-item-title class="text-wrap">{{ personal.observacion_recontratacion }}</v-list-item-title>
                          </v-list-item>
                        </template>
                        <template v-if="personal.alergias">
                          <v-divider />
                          <v-list-item class="bg-error-lighten-5">
                            <template #prepend>
                              <v-icon color="error" icon="mdi-alert-circle-outline" size="20" />
                            </template>
                            <v-list-item-subtitle class="text-caption text-error">Alergias</v-list-item-subtitle>
                            <v-list-item-title class="text-error font-weight-medium">{{ personal.alergias }}</v-list-item-title>
                          </v-list-item>
                        </template>
                      </v-list>
                    </v-card-text>
                  </v-card>
                </v-col>

                <v-col cols="12" md="6">
                  <v-card class="mb-4" rounded="lg" variant="outlined">
                    <v-card-title class="d-flex align-center bg-grey-lighten-5 py-3 px-4">
                      <v-icon class="mr-2" color="primary" icon="mdi-briefcase-variant-outline" />
                      <span class="text-subtitle-1 font-weight-bold">Informacion Laboral</span>
                    </v-card-title>
                    <v-divider />
                    <v-card-text class="pa-0">
                      <v-list class="py-0" density="compact">
                        <v-list-item>
                          <template #prepend>
                            <v-icon color="grey" icon="mdi-domain" size="20" />
                          </template>
                          <v-list-item-subtitle class="text-caption">Departamento</v-list-item-subtitle>
                          <v-list-item-title>{{ personal.departamento?.nombre || '-' }}</v-list-item-title>
                        </v-list-item>
                        <v-divider />
                        <v-list-item>
                          <template #prepend>
                            <v-icon color="grey" icon="mdi-badge-account-outline" size="20" />
                          </template>
                          <v-list-item-subtitle class="text-caption">Puesto</v-list-item-subtitle>
                          <v-list-item-title>{{ personal.puesto || '-' }}</v-list-item-title>
                        </v-list-item>
                        <v-divider />
                        <v-list-item>
                          <template #prepend>
                            <v-icon color="grey" icon="mdi-calendar-today" size="20" />
                          </template>
                          <v-list-item-subtitle class="text-caption">Fecha de Ingreso</v-list-item-subtitle>
                          <v-list-item-title>{{ formatDate(personal.fecha_ingreso_original || personal.fecha_inicio) }}</v-list-item-title>
                        </v-list-item>
                        <template v-if="personal.fecha_reingreso">
                          <v-divider />
                          <v-list-item>
                            <template #prepend>
                              <v-icon color="grey" icon="mdi-calendar-refresh" size="20" />
                            </template>
                            <v-list-item-subtitle class="text-caption">Fecha de reingreso</v-list-item-subtitle>
                            <v-list-item-title>{{ formatDate(personal.fecha_reingreso) }}</v-list-item-title>
                          </v-list-item>
                        </template>
                        <v-divider />
                        <v-list-item>
                          <template #prepend>
                            <v-icon color="grey" icon="mdi-file-sign" size="20" />
                          </template>
                          <v-list-item-subtitle class="text-caption">Tipo Contratacion</v-list-item-subtitle>
                          <v-list-item-title>{{ personal.tipo_contratacion?.nombre || '-' }}</v-list-item-title>
                        </v-list-item>
                        <v-divider />
                        <v-list-item>
                          <template #prepend>
                            <v-icon color="grey" icon="mdi-cash-multiple" size="20" />
                          </template>
                          <v-list-item-subtitle class="text-caption">Tipo Pago</v-list-item-subtitle>
                          <v-list-item-title>{{ personal.tipo_pago?.nombre || '-' }}</v-list-item-title>
                        </v-list-item>
                        <v-divider />
                        <v-list-item class="bg-success-lighten-5">
                          <template #prepend>
                            <v-icon color="success" icon="mdi-currency-usd" size="20" />
                          </template>
                          <v-list-item-subtitle class="text-caption">Salario Base</v-list-item-subtitle>
                          <v-list-item-title class="font-weight-bold text-success">Q {{ formatNumber(personal.salario_base) }}</v-list-item-title>
                        </v-list-item>
                        <v-divider />
                        <v-list-item>
                          <template #prepend>
                            <v-icon color="grey" icon="mdi-school-outline" size="20" />
                          </template>
                          <v-list-item-subtitle class="text-caption">Nivel de Estudio</v-list-item-subtitle>
                          <v-list-item-title>{{ personal.nivel_estudio?.nombre || '-' }}</v-list-item-title>
                        </v-list-item>
                        <v-divider />
                        <v-list-item>
                          <template #prepend>
                            <v-icon color="grey" icon="mdi-shield-check-outline" size="20" />
                          </template>
                          <v-list-item-subtitle class="text-caption">Beneficios</v-list-item-subtitle>
                          <v-list-item-title>
                            <div class="d-flex flex-wrap ga-1 py-1">
                              <v-chip
                                :color="personal.tiene_igss ? 'success' : 'grey'"
                                label
                                size="small"
                                :variant="personal.tiene_igss ? 'flat' : 'tonal'"
                              >
                                <v-icon size="14" start>{{ personal.tiene_igss ? 'mdi-check' : 'mdi-close' }}</v-icon>
                                IGSS
                              </v-chip>
                              <v-chip
                                :color="personal.tiene_prestaciones ? 'success' : 'grey'"
                                label
                                size="small"
                                :variant="personal.tiene_prestaciones ? 'flat' : 'tonal'"
                              >
                                <v-icon size="14" start>{{ personal.tiene_prestaciones ? 'mdi-check' : 'mdi-close' }}</v-icon>
                                Prestaciones
                              </v-chip>
                              <v-chip
                                :color="personal.tiene_bono14 ? 'success' : 'grey'"
                                label
                                size="small"
                                :variant="personal.tiene_bono14 ? 'flat' : 'tonal'"
                              >
                                <v-icon size="14" start>{{ personal.tiene_bono14 ? 'mdi-check' : 'mdi-close' }}</v-icon>
                                Bono 14
                              </v-chip>
                            </div>
                          </v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </v-card-text>
                  </v-card>

                  <v-card rounded="lg" variant="outlined">
                    <v-card-title class="d-flex align-center bg-grey-lighten-5 py-3 px-4">
                      <v-icon class="mr-2" color="primary" icon="mdi-phone-outline" />
                      <span class="text-subtitle-1 font-weight-bold">Contacto</span>
                    </v-card-title>
                    <v-divider />
                    <v-card-text class="pa-0">
                      <v-list class="py-0" density="compact">
                        <v-list-item>
                          <template #prepend>
                            <v-icon color="grey" icon="mdi-email-outline" size="20" />
                          </template>
                          <v-list-item-subtitle class="text-caption">Email</v-list-item-subtitle>
                          <v-list-item-title>
                            <a class="text-primary text-decoration-none" :href="`mailto:${personal.email}`">{{ personal.email }}</a>
                          </v-list-item-title>
                        </v-list-item>
                        <v-list-item>
                          <template #prepend>
                            <v-icon color="grey" icon="mdi-phone-outline" size="20" />
                          </template>
                          <v-list-item-subtitle class="text-caption">Teléfono (llamadas)</v-list-item-subtitle>
                          <v-list-item-title>{{ formatPhone(personal.telefono) }}</v-list-item-title>
                        </v-list-item>
                        <v-list-item v-if="personal.telefono_whatsapp">
                          <template #prepend>
                            <v-icon color="grey" icon="mdi-whatsapp" size="20" />
                          </template>
                          <v-list-item-subtitle class="text-caption">WhatsApp</v-list-item-subtitle>
                          <v-list-item-title>{{ formatPhone(personal.telefono_whatsapp) }}</v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </v-card-text>
                  </v-card>
                </v-col>

                <!-- Dirección -->
                <v-col cols="12">
                  <v-card rounded="lg" variant="outlined">
                    <v-card-title class="d-flex align-center bg-grey-lighten-5 py-3 px-4">
                      <v-icon class="mr-2" color="primary" icon="mdi-map-marker" />
                      <span class="text-subtitle-1 font-weight-bold">Dirección</span>
                    </v-card-title>
                    <v-divider />
                    <v-card-text class="pa-0">
                      <v-list class="py-0" density="compact">
                        <v-list-item>
                          <template #prepend>
                            <v-icon color="grey" icon="mdi-map-outline" size="20" />
                          </template>
                          <v-list-item-subtitle class="text-caption">Departamento</v-list-item-subtitle>
                          <v-list-item-title>{{ personal.direccion?.departamento_geografico?.nombre || '-' }}</v-list-item-title>
                        </v-list-item>
                        <v-divider />
                        <v-list-item>
                          <template #prepend>
                            <v-icon color="grey" icon="mdi-city-variant-outline" size="20" />
                          </template>
                          <v-list-item-subtitle class="text-caption">Municipio</v-list-item-subtitle>
                          <v-list-item-title>{{ personal.direccion?.municipio?.nombre || '-' }}</v-list-item-title>
                        </v-list-item>
                        <v-divider />
                        <v-list-item>
                          <template #prepend>
                            <v-icon color="grey" icon="mdi-numeric" size="20" />
                          </template>
                          <v-list-item-subtitle class="text-caption">Zona</v-list-item-subtitle>
                          <v-list-item-title>{{ personal.direccion?.zona || '-' }}</v-list-item-title>
                        </v-list-item>
                        <v-divider />
                        <v-list-item>
                          <template #prepend>
                            <v-icon color="grey" icon="mdi-home-outline" size="20" />
                          </template>
                          <v-list-item-subtitle class="text-caption">Dirección Completa</v-list-item-subtitle>
                          <v-list-item-title>{{ personal.direccion?.direccion_completa || '-' }}</v-list-item-title>
                        </v-list-item>
                        <v-divider />
                        <v-list-item>
                          <template #prepend>
                            <v-icon color="grey" icon="mdi-bed" size="20" />
                          </template>
                          <v-list-item-subtitle class="text-caption">Cuadra</v-list-item-subtitle>
                          <v-list-item-title>
                            {{ personal.vive_en_cuadra ? 'Vive en cuadra con la empresa' : 'No' }}
                          </v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </v-tabs-window-item>

          <!-- Tab: Referencias Laborales -->
          <v-tabs-window-item value="referencias">
            <v-card-text class="pa-6">
              <ReferenciasLaborales
                :personal-id="route.params.id"
                :readonly="!$can('edit-personal')"
                @error="showSnackbar($event, 'error')"
              />
            </v-card-text>
          </v-tabs-window-item>

          <!-- Tab: Familiares -->
          <v-tabs-window-item value="familiares">
            <v-card-text class="pa-6">
              <div class="d-flex justify-end mb-4">
                <v-btn
                  v-can="'edit-personal'"
                  class="text-none font-weight-medium"
                  color="primary"
                  rounded="lg"
                  @click="dialogFamiliar = true"
                >
                  <v-icon start>mdi-plus</v-icon>
                  Agregar Familiar
                </v-btn>
              </div>
              <v-data-table
                :headers="headersFamiliares"
                hover
                :items="familiares"
                :loading="loadingFamiliares"
              >
                <template #item.nombre_completo="{ item }">
                  <div>
                    <strong>{{ item.nombre_completo }}</strong>
                    <v-chip
                      v-if="item.es_contacto_emergencia"
                      class="ml-2"
                      color="error"
                      size="x-small"
                      variant="tonal"
                    >
                      Emergencia
                    </v-chip>
                  </div>
                </template>
                <template #item.parentesco="{ item }">
                  <v-chip color="primary" label size="small" variant="tonal">
                    {{ item.parentesco?.nombre || '-' }}
                  </v-chip>
                </template>
                <template #item.telefono="{ item }">
                  {{ formatPhone(item.telefono) }}
                </template>
                <template #item.actions="{ item }">
                  <v-tooltip location="top" text="Editar">
                    <template #activator="{ props }">
                      <v-btn
                        v-bind="props"
                        class="mr-1"
                        color="warning"
                        icon="mdi-pencil"
                        rounded="lg"
                        size="small"
                        variant="tonal"
                        @click="editFamiliar(item)"
                      />
                    </template>
                  </v-tooltip>
                  <v-tooltip location="top" text="Eliminar">
                    <template #activator="{ props }">
                      <v-btn
                        v-bind="props"
                        color="error"
                        icon="mdi-delete-outline"
                        rounded="lg"
                        size="small"
                        variant="tonal"
                        @click="deleteFamiliar(item.id)"
                      />
                    </template>
                  </v-tooltip>
                </template>
                <template #no-data>
                  <div class="text-center py-10">
                    <v-avatar class="mb-3" color="grey-lighten-3" size="64">
                      <v-icon color="grey-lighten-1" size="36">mdi-account-group-outline</v-icon>
                    </v-avatar>
                    <p class="text-body-1 text-medium-emphasis mb-0">No hay familiares registrados</p>
                  </div>
                </template>
                <template #loading>
                  <v-skeleton-loader type="table-row@3" />
                </template>
              </v-data-table>
            </v-card-text>
          </v-tabs-window-item>

          <!-- Tab: Redes Sociales -->
          <v-tabs-window-item value="redes">
            <v-card-text class="pa-6">
              <div class="d-flex justify-end mb-4">
                <v-btn
                  v-can="'edit-personal'"
                  class="text-none font-weight-medium"
                  color="primary"
                  rounded="lg"
                  @click="dialogRed = true"
                >
                  <v-icon start>mdi-plus</v-icon>
                  Agregar Red Social
                </v-btn>
              </div>
              <v-row>
                <v-col
                  v-for="red in redesSociales"
                  :key="red.id"
                  cols="12"
                  md="4"
                  sm="6"
                >
                  <v-card class="h-100" hover rounded="lg" variant="outlined">
                    <v-card-text class="d-flex align-center pa-4">
                      <v-avatar
                        class="mr-4"
                        :color="getRedSocialColor(red.red_social?.slug)"
                        size="48"
                        variant="tonal"
                      >
                        <v-icon :color="getRedSocialColor(red.red_social?.slug)" size="24">
                          {{ getRedSocialIcon(red.red_social?.slug) }}
                        </v-icon>
                      </v-avatar>
                      <div class="flex-grow-1">
                        <p class="font-weight-bold text-body-1 mb-0">{{ red.red_social?.nombre }}</p>
                        <p class="text-caption text-medium-emphasis mb-1">@{{ red.nombre_usuario }}</p>
                        <a
                          v-if="red.url_perfil"
                          class="text-caption text-primary text-decoration-none"
                          :href="red.url_perfil"
                          target="_blank"
                        >
                          Click para ver perfil
                        </a>
                      </div>
                      <v-tooltip location="top" text="Eliminar">
                        <template #activator="{ props }">
                          <v-btn
                            v-bind="props"
                            color="error"
                            icon="mdi-delete-outline"
                            rounded="lg"
                            size="small"
                            variant="tonal"
                            @click="deleteRedSocial(red.id)"
                          />
                        </template>
                      </v-tooltip>
                    </v-card-text>
                  </v-card>
                </v-col>
                <v-col v-if="redesSociales.length === 0" cols="12">
                  <div class="text-center py-10">
                    <v-avatar class="mb-3" color="grey-lighten-3" size="64">
                      <v-icon color="grey-lighten-1" size="36">mdi-share-variant-outline</v-icon>
                    </v-avatar>
                    <p class="text-body-1 text-medium-emphasis mb-0">No hay redes sociales registradas</p>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-tabs-window-item>

          <!-- Tab: Documentos -->
          <v-tabs-window-item value="documentos">
            <v-card-text class="pa-6">
              <DocumentosPersonal
                :personal-id="route.params.id"
                :readonly="!$can('edit-personal')"
                @error="showSnackbar($event, 'error')"
              />
            </v-card-text>
          </v-tabs-window-item>

          <!-- Tab: Historial de Proyectos -->
          <v-tabs-window-item value="proyectos">
            <v-card-text class="pa-6">
              <v-timeline
                density="comfortable"
                line-color="grey-lighten-2"
                side="end"
              >
                <v-timeline-item
                  v-for="proyecto in proyectos"
                  :key="proyecto.id"
                  :dot-color="getAsignacionColor(proyecto.estado_asignacion)"
                  fill-dot
                  size="small"
                >
                  <template #opposite>
                    <v-chip label size="small" variant="tonal">
                      {{ formatDate(proyecto.fecha_inicio) }}
                    </v-chip>
                  </template>
                  <v-card hover rounded="lg" variant="outlined">
                    <v-card-text class="pa-4">
                      <p class="font-weight-bold text-body-1 mb-1">{{ proyecto.proyecto?.nombre }}</p>
                      <p class="text-body-2 text-medium-emphasis mb-2">
                        <v-icon class="mr-1" icon="mdi-badge-account-outline" size="14" />
                        {{ proyecto.tipo_personal?.nombre || '-' }}
                        <span v-if="proyecto.turno" class="mx-1">|</span>
                        <v-icon v-if="proyecto.turno" class="mr-1" icon="mdi-clock-outline" size="14" />
                        {{ proyecto.turno }}
                      </p>
                      <v-chip
                        class="font-weight-medium"
                        :color="getAsignacionColor(proyecto.estado_asignacion)"
                        label
                        size="small"
                        variant="flat"
                      >
                        <v-icon size="14" start>{{ getAsignacionIcon(proyecto.estado_asignacion) }}</v-icon>
                        {{ getAsignacionLabel(proyecto.estado_asignacion) }}
                      </v-chip>
                    </v-card-text>
                  </v-card>
                </v-timeline-item>
              </v-timeline>
              <div v-if="proyectos.length === 0" class="text-center py-10">
                <v-avatar class="mb-3" color="grey-lighten-3" size="64">
                  <v-icon color="grey-lighten-1" size="36">mdi-clipboard-list-outline</v-icon>
                </v-avatar>
                <p class="text-body-1 text-medium-emphasis mb-0">No hay proyectos registrados</p>
              </div>
            </v-card-text>
          </v-tabs-window-item>

          <!-- Tab: Asistencia -->
          <v-tabs-window-item value="asistencia">
            <v-card-text class="pa-6">
              <div class="d-flex flex-wrap ga-3 mb-4">
                <v-text-field
                  v-model="asistenciaFechaInicio"
                  density="compact"
                  hide-details
                  label="Desde"
                  style="max-width: 180px"
                  type="date"
                  variant="outlined"
                />
                <v-text-field
                  v-model="asistenciaFechaFin"
                  density="compact"
                  hide-details
                  label="Hasta"
                  style="max-width: 180px"
                  type="date"
                  variant="outlined"
                />
                <v-btn color="primary" :loading="loadingAsistencia" variant="tonal" @click="loadAsistenciaHistorial">
                  Consultar
                </v-btn>
              </div>
              <div v-if="asistenciaHistorial?.resumen" class="d-flex flex-wrap ga-2 mb-4">
                <v-chip color="success" variant="tonal">{{ asistenciaHistorial.resumen.dias_trabajados }} trabajados</v-chip>
                <v-chip color="info" variant="tonal">{{ asistenciaHistorial.resumen.dias_descanso }} descansos</v-chip>
                <v-chip v-if="asistenciaHistorial.resumen.dias_extra" color="teal" variant="tonal">{{ asistenciaHistorial.resumen.dias_extra }} extras</v-chip>
                <v-chip v-if="asistenciaHistorial.resumen.dias_cobertura" color="purple" variant="tonal">{{ asistenciaHistorial.resumen.dias_cobertura }} coberturas</v-chip>
                <v-chip color="error" variant="tonal">{{ asistenciaHistorial.resumen.dias_ausente }} ausencias</v-chip>
              </div>
              <div v-if="calendarioMes.length" class="mb-6">
                <div class="text-subtitle-2 mb-2">Calendario del período</div>
                <p class="text-caption text-medium-emphasis mb-3">
                  Sigue visible si la persona está suspendida o dada de baja. Use las fechas de arriba y Consultar.
                </p>
                <div class="calendario-head">
                  <span v-for="nombre in calendarioDiasSemana" :key="nombre">{{ nombre }}</span>
                </div>
                <div class="calendario-grid">
                  <div
                    v-for="(dia, idx) in calendarioCeldas"
                    :key="dia?.fecha || `empty-${idx}`"
                    class="calendario-dia"
                    :class="dia ? calendarioDiaClass(dia) : 'calendario-dia--empty'"
                  >
                    <v-tooltip v-if="dia" location="top">
                      <template #activator="{ props: tipProps }">
                        <div v-bind="tipProps" class="calendario-dia__inner">
                          <span class="calendario-dia__num">{{ dia.fecha?.substring(8) }}</span>
                          <span class="calendario-dia__tag">{{ calendarioEtiqueta(dia) }}</span>
                        </div>
                      </template>
                      <div>{{ dia.fecha }} · {{ calendarioEtiqueta(dia) }}</div>
                      <div v-if="dia.proyecto">{{ dia.proyecto }}</div>
                    </v-tooltip>
                  </div>
                </div>
              </div>
              <v-data-table
                density="compact"
                :headers="asistenciaHeaders"
                :items="asistenciaHistorial?.registros || []"
                :loading="loadingAsistencia"
                :items-per-page="20"
              >
                <template #item.estado="{ item }">
                  <v-chip :color="asistenciaEstadoColor(item.estado)" size="small" variant="tonal">
                    {{ item.estado }}
                  </v-chip>
                </template>
              </v-data-table>
            </v-card-text>
          </v-tabs-window-item>

          <!-- Tab: Equipo / boletas -->
          <v-tabs-window-item value="equipo">
            <v-card-text class="pa-6">
              <EquipoBodegaPersonal
                :personal-id="parseInt(route.params.id)"
                :estado-personal="personal.estado"
                :pendiente-liquidacion="!!personal.pendiente_liquidacion"
                @error="showSnackbar($event, 'error')"
                @updated="loadPersonal"
              />
            </v-card-text>
          </v-tabs-window-item>

          <!-- Tab: Transacciones -->
          <v-tabs-window-item value="transacciones">
            <v-card-text class="pa-6">
              <TransaccionesPersonal
                :personal-id="parseInt(route.params.id)"
                :readonly="!$can('edit-personal')"
                :prefill="prefillTransaccion"
                @error="showSnackbar($event, 'error')"
              />
            </v-card-text>
          </v-tabs-window-item>

          <!-- Tab: Préstamos -->
          <v-tabs-window-item value="prestamos">
            <v-card-text class="pa-6">
              <PrestamosPersonal
                :personal-id="parseInt(route.params.id)"
                :readonly="!$can('edit-personal')"
                @error="showSnackbar($event, 'error')"
              />
            </v-card-text>
          </v-tabs-window-item>

          <!-- Tab: Vacaciones -->
          <v-tabs-window-item value="vacaciones">
            <v-card-text class="pa-6">
              <VacacionesPersonal
                :fecha-inicio="personal.fecha_inicio"
                :personal-id="parseInt(route.params.id)"
                :readonly="!$can('edit-personal')"
                @error="showSnackbar($event, 'error')"
              />
            </v-card-text>
          </v-tabs-window-item>

          <!-- Tab: Permisos -->
          <v-tabs-window-item value="permisos">
            <v-card-text class="pa-6">
              <PermisosPersonal
                :personal-id="parseInt(route.params.id)"
                :readonly="!$can('edit-personal')"
                @error="showSnackbar($event, 'error')"
              />
            </v-card-text>
          </v-tabs-window-item>

          <!-- Tab: Historial de Salarios -->
          <v-tabs-window-item value="historial-salarios">
            <v-card-text class="pa-6">
              <v-data-table
                :headers="headersHistorialSalarios"
                hover
                :items="historialSalarios"
                :loading="loadingHistorial"
                :items-per-page="historialMeta.per_page"
              >
                <template #item.salario_anterior="{ item }">
                  <span class="text-body-2">Q {{ formatNumber(item.salario_anterior) }}</span>
                </template>
                <template #item.salario_nuevo="{ item }">
                  <span class="font-weight-medium text-success">Q {{ formatNumber(item.salario_nuevo) }}</span>
                </template>
                <template #item.diferencia="{ item }">
                  <v-chip
                    :color="item.diferencia >= 0 ? 'success' : 'error'"
                    label
                    size="small"
                    variant="tonal"
                  >
                    {{ item.diferencia >= 0 ? '+' : '' }}Q {{ formatNumber(item.diferencia) }}
                  </v-chip>
                </template>
                <template #item.fecha_cambio="{ item }">
                  {{ formatDate(item.fecha_cambio) }}
                </template>
                <template #item.motivo="{ item }">
                  <span class="text-body-2">{{ item.motivo || '-' }}</span>
                </template>
                <template #item.cambiado_por="{ item }">
                  <span class="text-body-2">{{ item.cambiado_por?.name || '-' }}</span>
                </template>
                <template #no-data>
                  <div class="text-center py-10">
                    <v-avatar class="mb-3" color="grey-lighten-3" size="64">
                      <v-icon color="grey-lighten-1" size="36">mdi-chart-line</v-icon>
                    </v-avatar>
                    <p class="text-body-1 text-medium-emphasis mb-0">No hay historial de salarios</p>
                  </div>
                </template>
                <template #loading>
                  <v-skeleton-loader type="table-row@3" />
                </template>
                <template #bottom>
                  <div v-if="historialMeta.last_page > 1" class="d-flex justify-center align-center pa-4 ga-2">
                    <v-btn
                      :disabled="historialMeta.current_page <= 1"
                      icon="mdi-chevron-left"
                      rounded="lg"
                      size="small"
                      variant="tonal"
                      @click="loadHistorialSalarios(historialMeta.current_page - 1)"
                    />
                    <span class="text-body-2 text-medium-emphasis">
                      Página {{ historialMeta.current_page }} de {{ historialMeta.last_page }}
                    </span>
                    <v-btn
                      :disabled="historialMeta.current_page >= historialMeta.last_page"
                      icon="mdi-chevron-right"
                      rounded="lg"
                      size="small"
                      variant="tonal"
                      @click="loadHistorialSalarios(historialMeta.current_page + 1)"
                    />
                  </div>
                </template>
              </v-data-table>
            </v-card-text>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card>
    </template>

    <!-- Dialog Agregar/Editar Familiar -->
    <v-dialog v-model="dialogFamiliar" max-width="600" persistent>
      <v-card>
        <v-card-title class="d-flex align-center bg-grey-lighten-4">
          <v-icon color="primary" start>mdi-account-group</v-icon>
          {{ editingFamiliar ? 'Editar' : 'Agregar' }} Familiar
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" @click="closeFamiliarDialog" />
        </v-card-title>

        <v-card-text class="pt-4">
          <v-form ref="familiarFormRef">
            <v-row>
              <v-col cols="12">
                <v-select
                  v-model="familiarForm.parentesco_id"
                  density="compact"
                  :error-messages="familiarErrors.parentesco_id"
                  item-title="nombre"
                  item-value="id"
                  :items="parentescos"
                  label="Parentesco *"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="familiarForm.nombre_completo"
                  density="compact"
                  :error-messages="familiarErrors.nombre_completo"
                  label="Nombre Completo *"
                  prepend-inner-icon="mdi-account"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  density="compact"
                  :error-messages="familiarErrors.telefono"
                  label="Teléfono *"
                  maxlength="9"
                  :model-value="familiarTelefonoDisplay"
                  placeholder="0000-0000"
                  prepend-inner-icon="mdi-phone"
                  variant="outlined"
                  @update:model-value="onFamiliarTelefonoInput"
                />
              </v-col>

              <v-col cols="12">
                <v-checkbox
                  v-model="familiarForm.es_contacto_emergencia"
                  color="primary"
                  hide-details
                  label="Es contacto de emergencia"
                />
              </v-col>
            </v-row>

            <v-alert
              v-if="familiarError"
              class="mt-3"
              closable
              density="compact"
              type="error"
              variant="tonal"
              @click:close="familiarError = null"
            >
              {{ familiarError }}
            </v-alert>
          </v-form>
        </v-card-text>

        <v-card-actions class="bg-grey-lighten-4">
          <v-spacer />
          <v-btn variant="text" @click="closeFamiliarDialog">Cancelar</v-btn>
          <v-btn
            color="primary"
            :loading="savingFamiliar"
            variant="flat"
            @click="saveFamiliar"
          >
            <v-icon start>mdi-content-save</v-icon>
            {{ editingFamiliar ? 'Actualizar' : 'Guardar' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Agregar/Editar Red Social -->
    <v-dialog v-model="dialogRed" max-width="600" persistent>
      <v-card>
        <v-card-title class="d-flex align-center bg-grey-lighten-4">
          <v-icon color="primary" start>mdi-share-variant</v-icon>
          {{ editingRed ? 'Editar' : 'Agregar' }} Red Social
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" @click="closeRedDialog" />
        </v-card-title>

        <v-card-text class="pt-4">
          <v-form ref="redFormRef">
            <v-row>
              <v-col cols="12">
                <v-select
                  v-model="redForm.red_social_id"
                  density="compact"
                  :error-messages="redErrors.red_social_id"
                  item-title="nombre"
                  item-value="id"
                  :items="redesSocialesCatalogo"
                  label="Red Social *"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="redForm.nombre_usuario"
                  density="compact"
                  :error-messages="redErrors.nombre_usuario"
                  label="Nombre de Usuario *"
                  prepend-inner-icon="mdi-at"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="redForm.url_perfil"
                  density="compact"
                  :error-messages="redErrors.url_perfil"
                  label="URL del Perfil"
                  placeholder="https://..."
                  prepend-inner-icon="mdi-link"
                  variant="outlined"
                />
              </v-col>
            </v-row>

            <v-alert
              v-if="redError"
              class="mt-3"
              closable
              density="compact"
              type="error"
              variant="tonal"
              @click:close="redError = null"
            >
              {{ redError }}
            </v-alert>
          </v-form>
        </v-card-text>

        <v-card-actions class="bg-grey-lighten-4">
          <v-spacer />
          <v-btn variant="text" @click="closeRedDialog">Cancelar</v-btn>
          <v-btn
            color="primary"
            :loading="savingRed"
            variant="flat"
            @click="saveRedSocial"
          >
            <v-icon start>mdi-content-save</v-icon>
            {{ editingRed ? 'Actualizar' : 'Guardar' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogReingreso" max-width="480">
      <v-card rounded="xl">
        <v-card-title class="bg-success pa-4 text-white">Registrar reingreso</v-card-title>
        <v-card-text class="pa-5">
          <p class="text-body-2 mb-3">
            El ingreso original y el calendario se conservan para que RRHH y contabilidad terminen de pagar.
          </p>
          <v-text-field
            v-model="reingresoForm.fecha_reingreso"
            class="mb-3"
            label="Fecha de reingreso"
            type="date"
            variant="outlined"
          />
          <v-textarea
            v-model="reingresoForm.observacion_recontratacion"
            label="Observación de recontratación"
            rows="3"
            variant="outlined"
          />
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="dialogReingreso = false">Cancelar</v-btn>
          <v-btn color="success" :loading="savingReingreso" variant="elevated" @click="confirmarReingreso">
            Reingresar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      elevation="8"
      rounded="lg"
    >
      <div class="d-flex align-center">
        <v-icon
          class="mr-2"
          :icon="snackbar.color === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle'"
        />
        {{ snackbar.text }}
      </div>
    </v-snackbar>
  </v-container>
</template>

<script setup>
  import { computed, onMounted, reactive, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import DocumentosPersonal from '@/components/personal/DocumentosPersonal.vue'
  import PrestamosPersonal from '@/components/personal/PrestamosPersonal.vue'
  import VacacionesPersonal from '@/components/personal/VacacionesPersonal.vue'
  import PermisosPersonal from '@/components/personal/PermisosPersonal.vue'
  import ReferenciasLaborales from '@/components/personal/ReferenciasLaborales.vue'
  import TransaccionesPersonal from '@/components/personal/TransaccionesPersonal.vue'
  import EquipoBodegaPersonal from '@/components/personal/EquipoBodegaPersonal.vue'
  import { CATALOGOS } from '@/services/catalogoService'
  import personalService from '@/services/personalService'
  import operacionesService from '@/services/operacionesService'
  import { useCatalogosStore } from '@/stores/catalogos'
  import { usePersonalStore } from '@/stores/personal'
  import { useAuthStore } from '@/stores/auth'
  import { formatDPI } from '@/utils/dpiFormatter'
  import { formatDateGT } from '@/utils/dateFormatter'
  import { cleanPhone, formatPhone, formatPhoneInput } from '@/utils/phoneFormatter'

  const route = useRoute()
  const router = useRouter()
  const store = usePersonalStore()
  const catalogosStore = useCatalogosStore()
  const authStore = useAuthStore()

  const tab = ref('personal')
  const personal = computed(() => store.currentItem)
  const expedienteCompleto = computed(() => personal.value?.alcance !== 'nomina' && personal.value?.alcance !== 'directorio')
  const alcanceNomina = computed(() => personal.value?.alcance === 'nomina')
  const puedeEditarExpediente = computed(() => {
    if (!personal.value?.es_administrativo) return authStore.hasPermission('edit-personal')
    return authStore.hasPermission('manage-personal-administrativo')
  })
  const esBajaOSuspendido = computed(() =>
    ['suspendido', 'no_contratar', 'inactivo'].includes(personal.value?.estado),
  )
  const etiquetaEstadoBaja = computed(() => {
    const map = { suspendido: 'suspendida', no_contratar: 'dada de baja (no contratar)', inactivo: 'inactiva' }
    return map[personal.value?.estado] || personal.value?.estado
  })

  const prefillTransaccion = computed(() => {
    if (route.query.tab !== 'transacciones') return null
    const monto = route.query.monto != null ? Number(route.query.monto) : null
    let desc = route.query.desc
    if (typeof desc === 'string') {
      try { desc = decodeURIComponent(desc) } catch { /* keep */ }
    }
    return {
      tipo_transaccion: route.query.tipo || 'uniforme',
      monto: Number.isFinite(monto) ? monto : null,
      descripcion: typeof desc === 'string' ? desc : '',
    }
  })

  // Datos relacionados
  const familiares = ref([])
  const redesSociales = ref([])
  const proyectos = ref([])

  const loadingFamiliares = ref(false)
  const downloadingCV = ref(false)
  const downloadingExpediente = ref(false)

  // Historial de salarios
  const historialSalarios = ref([])
  const loadingHistorial = ref(false)
  const historialMeta = ref({ current_page: 1, last_page: 1, per_page: 15, total: 0 })

  const headersHistorialSalarios = [
    { title: 'Fecha', key: 'fecha_cambio', sortable: false },
    { title: 'Salario Anterior', key: 'salario_anterior', sortable: false },
    { title: 'Salario Nuevo', key: 'salario_nuevo', sortable: false },
    { title: 'Diferencia', key: 'diferencia', sortable: false, align: 'center' },
    { title: 'Motivo', key: 'motivo', sortable: false },
    { title: 'Cambiado por', key: 'cambiado_por', sortable: false },
  ]

  async function loadHistorialSalarios (page = 1) {
    loadingHistorial.value = true
    try {
      const response = await personalService.getHistorialSalarios(route.params.id, { page })
      historialSalarios.value = response.data
      historialMeta.value = response.meta
    } catch {
      showSnackbar('Error al cargar historial de salarios', 'error')
    } finally {
      loadingHistorial.value = false
    }
  }

  const asistenciaFechaInicio = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
  const asistenciaFechaFin = ref(new Date().toISOString().split('T')[0])
  const loadingAsistencia = ref(false)
  const asistenciaHistorial = ref(null)
  const calendarioMes = ref([])
  const dialogReingreso = ref(false)
  const savingReingreso = ref(false)
  const reingresoForm = reactive({
    fecha_reingreso: new Date().toISOString().split('T')[0],
    observacion_recontratacion: '',
  })
  const asistenciaHeaders = [
    { title: 'Fecha', key: 'fecha' },
    { title: 'Proyecto', key: 'proyecto' },
    { title: 'Turno', key: 'turno' },
    { title: 'Estado', key: 'estado' },
    { title: 'Obs.', key: 'observaciones' },
  ]

  async function loadAsistenciaHistorial () {
    loadingAsistencia.value = true
    try {
      const response = await operacionesService.getHistorialAsistencia(route.params.id, {
        fecha_inicio: asistenciaFechaInicio.value,
        fecha_fin: asistenciaFechaFin.value,
      })
      asistenciaHistorial.value = response.data
      const cal = await operacionesService.getCalendarioDiasTrabajados(route.params.id, {
        fecha_inicio: asistenciaFechaInicio.value,
        fecha_fin: asistenciaFechaFin.value,
      })
      calendarioMes.value = cal.data?.calendario || []
    } catch {
      showSnackbar('Error al cargar asistencia', 'error')
    } finally {
      loadingAsistencia.value = false
    }
  }

  async function confirmarReingreso () {
    savingReingreso.value = true
    try {
      await personalService.reingreso(route.params.id, { ...reingresoForm })
      dialogReingreso.value = false
      showSnackbar('Reingreso registrado', 'success')
      await store.fetchById(route.params.id)
    } catch (e) {
      showSnackbar(e.response?.data?.message || 'No se pudo registrar el reingreso', 'error')
    } finally {
      savingReingreso.value = false
    }
  }

  function abrirTabCalendario () {
    tab.value = 'asistencia'
    if (!asistenciaHistorial.value) loadAsistenciaHistorial()
  }

  const calendarioDiasSemana = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom']
  const calendarioCeldas = computed(() => {
    const dias = calendarioMes.value || []
    if (!dias.length) return []
    const primera = dias[0]?.fecha
    if (!primera) return dias
    const jsDay = new Date(`${primera}T00:00:00`).getDay()
    const offsetLunes = (jsDay + 6) % 7
    return [...Array.from({ length: offsetLunes }, () => null), ...dias]
  })

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
      sin_marcar: 'bg-grey',
      sin_asignacion: 'bg-grey-darken-1',
    }
    return map[dia?.tipo] || 'bg-grey'
  }

  function asistenciaEstadoColor (estado) {
    if (estado === 'presente' || estado === 'extra' || estado === 'cobertura' || estado === 'trabajo') return estado === 'extra' ? 'teal' : (estado === 'cobertura' ? 'purple' : 'success')
    if (estado === 'descanso') return 'info'
    if (String(estado || '').includes('ausente')) return 'error'
    return 'grey'
  }

  watch(tab, newTab => {
    if (newTab === 'historial-salarios' && historialSalarios.value.length === 0) {
      loadHistorialSalarios()
    }
    if (newTab === 'asistencia' && !asistenciaHistorial.value) {
      loadAsistenciaHistorial()
    }
  })

  // Dialogs
  const dialogFamiliar = ref(false)
  const dialogRed = ref(false)

  // Formulario de familiar
  const familiarForm = ref({
    parentesco_id: null,
    nombre_completo: '',
    telefono: '',
    es_contacto_emergencia: false,
  })

  const familiarErrors = ref({
    parentesco_id: '',
    nombre_completo: '',
    telefono: '',
  })

  const editingFamiliar = ref(null)
  const savingFamiliar = ref(false)
  const familiarError = ref(null)
  const familiarFormRef = ref(null)

  // Telefono familiar formateado para visualizacion
  const familiarTelefonoDisplay = computed(() => formatPhoneInput(familiarForm.value.telefono))

  // Handler para input de telefono familiar
  function onFamiliarTelefonoInput (value) {
    familiarForm.value.telefono = cleanPhone(value)
  }

  // Catálogos
  const parentescos = computed(() => catalogosStore.getCatalogo(CATALOGOS.PARENTESCOS))
  const redesSocialesCatalogo = computed(() => catalogosStore.getCatalogo(CATALOGOS.REDES_SOCIALES))

  // Formulario de red social
  const redForm = reactive({
    red_social_id: null,
    nombre_usuario: '',
    url_perfil: '',
  })

  const redErrors = reactive({
    red_social_id: '',
    nombre_usuario: '',
    url_perfil: '',
  })

  const editingRed = ref(null)
  const savingRed = ref(false)
  const redError = ref(null)
  const redFormRef = ref(null)

  // Snackbar
  const snackbar = ref({ show: false, text: '', color: 'success' })

  function showSnackbar (text, color = 'success') {
    snackbar.value = { show: true, text, color }
  }

  // Headers de tablas
  const headersFamiliares = [
    { title: 'Nombre', key: 'nombre_completo' },
    { title: 'Parentesco', key: 'parentesco' },
    { title: 'Teléfono', key: 'telefono' },
    { title: '', key: 'actions', sortable: false, width: '120px' },
  ]

  // Helpers
  function formatDate (date) {
    return formatDateGT(date)
  }

  function formatNumber (num) {
    if (!num) return '0.00'
    return Number.parseFloat(num).toLocaleString('es-GT', { minimumFractionDigits: 2 })
  }

  function getEstadoColor (estado) {
    const colors = { activo: 'success', inactivo: 'grey', suspendido: 'warning', no_contratar: 'error', extrero: 'purple', pre_alta: 'info' }
    return colors[estado] || 'grey'
  }

  function getEstadoIcon (estado) {
    const icons = { activo: 'mdi-check-circle', inactivo: 'mdi-close-circle', suspendido: 'mdi-pause-circle', no_contratar: 'mdi-cancel', extrero: 'mdi-account-arrow-right', pre_alta: 'mdi-account-clock' }
    return icons[estado] || 'mdi-circle'
  }

  function getAsignacionColor (estado) {
    const colors = { activa: 'success', suspendida: 'warning', finalizada: 'grey' }
    return colors[estado] || 'grey'
  }

  function getAsignacionIcon (estado) {
    const icons = { activa: 'mdi-check-circle', suspendida: 'mdi-pause-circle', finalizada: 'mdi-stop-circle' }
    return icons[estado] || 'mdi-circle'
  }

  function getAsignacionLabel (estado) {
    const labels = { activa: 'Activa', suspendida: 'Suspendida', finalizada: 'Finalizada' }
    return labels[estado] || estado || 'Sin estado'
  }

  function getRedSocialIcon (slug) {
    const icons = {
      facebook: 'mdi-facebook',
      instagram: 'mdi-instagram',
      twitter: 'mdi-twitter',
      linkedin: 'mdi-linkedin',
      tiktok: 'mdi-music-note',
      whatsapp: 'mdi-whatsapp',
    }
    return icons[slug] || 'mdi-web'
  }

  function getRedSocialColor (slug) {
    const colors = {
      facebook: 'blue',
      instagram: 'pink',
      twitter: 'light-blue',
      linkedin: 'indigo',
      tiktok: 'black',
      whatsapp: 'green',
    }
    return colors[slug] || 'grey'
  }

  // Cargar datos
  async function loadPersonal () {
    try {
      await store.fetchById(route.params.id)
    } catch {
      snackbar.value = { show: true, text: 'Error al cargar personal', color: 'error' }
    }
  }

  async function loadFamiliares () {
    loadingFamiliares.value = true
    try {
      const response = await personalService.getFamiliares(route.params.id)
      familiares.value = response.data || response
    } finally {
      loadingFamiliares.value = false
    }
  }

  async function loadParentescos () {
    try {
      await catalogosStore.loadCatalogo(CATALOGOS.PARENTESCOS)
    } catch (error) {
      console.error('Error loading parentescos', error)
    }
  }

  async function loadRedesSociales () {
    try {
      const response = await personalService.getRedesSociales(route.params.id)
      redesSociales.value = response.data || response
    } catch (error) {
      console.error('Error loading redes sociales', error)
    }
  }

  async function loadRedesSocialesCatalogo () {
    try {
      await catalogosStore.loadCatalogo(CATALOGOS.REDES_SOCIALES)
    } catch (error) {
      console.error('Error loading redes sociales catalogo', error)
    }
  }

  async function loadProyectos () {
    try {
      const response = await personalService.getHistorialProyectos(route.params.id)
      proyectos.value = response.data || response
    } catch (error) {
      console.error('Error loading proyectos', error)
    }
  }

  // Eliminar items
  function resetFamiliarForm () {
    familiarForm.value = {
      parentesco_id: null,
      nombre_completo: '',
      telefono: '',
      es_contacto_emergencia: false,
    }
    familiarErrors.value = {
      parentesco_id: '',
      nombre_completo: '',
      telefono: '',
    }
    familiarError.value = null
    editingFamiliar.value = null
  }

  function closeFamiliarDialog () {
    dialogFamiliar.value = false
    resetFamiliarForm()
  }

  function editFamiliar (familiar) {
    editingFamiliar.value = familiar.id
    familiarForm.value = {
      parentesco_id: familiar.parentesco?.id || familiar.parentesco_id,
      nombre_completo: familiar.nombre_completo,
      telefono: familiar.telefono,
      es_contacto_emergencia: familiar.es_contacto_emergencia || false,
    }
    dialogFamiliar.value = true
  }

  function validateFamiliarForm () {
    let valid = true
    familiarErrors.value = {
      parentesco_id: '',
      nombre_completo: '',
      telefono: '',
    }

    if (!familiarForm.value.parentesco_id) {
      familiarErrors.value.parentesco_id = 'El parentesco es requerido'
      valid = false
    }

    if (!familiarForm.value.nombre_completo.trim()) {
      familiarErrors.value.nombre_completo = 'El nombre completo es requerido'
      valid = false
    }

    if (!familiarForm.value.telefono.trim()) {
      familiarErrors.value.telefono = 'El teléfono es requerido'
      valid = false
    }

    return valid
  }

  async function saveFamiliar () {
    if (!validateFamiliarForm()) return

    savingFamiliar.value = true
    familiarError.value = null

    try {
      const data = {
        parentesco_id: familiarForm.value.parentesco_id,
        nombre_completo: familiarForm.value.nombre_completo,
        telefono: familiarForm.value.telefono,
        es_contacto_emergencia: familiarForm.value.es_contacto_emergencia,
      }

      await (editingFamiliar.value ? personalService.updateFamiliar(route.params.id, editingFamiliar.value, data) : personalService.createFamiliar(route.params.id, data))

      await loadFamiliares()
      closeFamiliarDialog()
      showSnackbar('Familiar guardado correctamente', 'success')
    } catch (error) {
      const errorData = error.response?.data
      if (errorData?.errors) {
        for (const key of Object.keys(errorData.errors)) {
          if (familiarErrors.value[key] !== undefined) {
            familiarErrors.value[key] = errorData.errors[key][0]
          }
        }
        familiarError.value = errorData.message || 'Error de validación'
      } else {
        familiarError.value = errorData?.message || 'Error al guardar familiar'
      }
    } finally {
      savingFamiliar.value = false
    }
  }

  // Redes sociales
  function resetRedForm () {
    Object.assign(redForm, {
      red_social_id: null,
      nombre_usuario: '',
      url_perfil: '',
    })
    Object.assign(redErrors, {
      red_social_id: '',
      nombre_usuario: '',
      url_perfil: '',
    })
    redError.value = null
    editingRed.value = null
  }

  function closeRedDialog () {
    dialogRed.value = false
    resetRedForm()
  }

  function validateRedForm () {
    let valid = true
    Object.assign(redErrors, {
      red_social_id: '',
      nombre_usuario: '',
      url_perfil: '',
    })

    if (!redForm.red_social_id) {
      redErrors.red_social_id = 'La red social es requerida'
      valid = false
    }

    if (!redForm.nombre_usuario.trim()) {
      redErrors.nombre_usuario = 'El nombre de usuario es requerido'
      valid = false
    }

    // La URL es opcional, si se proporciona se validará el formato básico
    if (redForm.url_perfil && redForm.url_perfil.trim()) {
      // Validar que tenga un formato básico de URL (dominio.extension)
      const urlWithoutProtocol = redForm.url_perfil.replace(/^https?:\/\//, '')
      if (!/^[\w-]+(\.[\w-]+)+/.test(urlWithoutProtocol)) {
        redErrors.url_perfil = 'La URL no tiene un formato válido'
        valid = false
      }
    }

    return valid
  }

  // Función para normalizar URL (agregar https:// si no tiene protocolo)
  function normalizeUrl (url) {
    if (!url || !url.trim()) return null
    const trimmed = url.trim()
    if (!/^https?:\/\//i.test(trimmed)) {
      return `https://${trimmed}`
    }
    return trimmed
  }

  async function saveRedSocial () {
    if (!validateRedForm()) return

    savingRed.value = true
    redError.value = null

    try {
      const data = {
        red_social_id: redForm.red_social_id,
        nombre_usuario: redForm.nombre_usuario,
        url_perfil: normalizeUrl(redForm.url_perfil),
      }

      await (editingRed.value ? personalService.updateRedSocial(route.params.id, editingRed.value, data) : personalService.createRedSocial(route.params.id, data))

      await loadRedesSociales()
      closeRedDialog()
      showSnackbar('Red social guardada correctamente', 'success')
    } catch (error) {
      const errorData = error.response?.data
      if (errorData?.errors) {
        for (const key of Object.keys(errorData.errors)) {
          if (redErrors[key] !== undefined) {
            redErrors[key] = errorData.errors[key][0]
          }
        }
        redError.value = errorData.message || 'Error de validación'
      } else {
        redError.value = errorData?.message || 'Error al guardar red social'
      }
    } finally {
      savingRed.value = false
    }
  }

  // Eliminar items
  async function deleteFamiliar (id) {
    try {
      await personalService.deleteFamiliar(route.params.id, id)
      familiares.value = familiares.value.filter(f => f.id !== id)
      snackbar.value = { show: true, text: 'Familiar eliminado', color: 'success' }
    } catch {
      snackbar.value = { show: true, text: 'Error al eliminar', color: 'error' }
    }
  }

  async function deleteRedSocial (id) {
    try {
      await personalService.deleteRedSocial(route.params.id, id)
      redesSociales.value = redesSociales.value.filter(r => r.id !== id)
      snackbar.value = { show: true, text: 'Red social eliminada', color: 'success' }
    } catch {
      snackbar.value = { show: true, text: 'Error al eliminar', color: 'error' }
    }
  }

  function goBack () {
    router.back()
  }

  async function downloadCV () {
    if (!personal.value?.id) return

    try {
      downloadingCV.value = true
      const response = await personalService.downloadCV(personal.value.id)

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `CV_${personal.value.nombres}_${personal.value.apellidos}.pdf`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      showSnackbar('Error al descargar el CV', 'error')
      console.error(error)
    } finally {
      downloadingCV.value = false
    }
  }

  async function downloadExpediente () {
    if (!personal.value?.id) return

    try {
      downloadingExpediente.value = true
      const response = await personalService.downloadExpediente(personal.value.id)

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Expediente_${personal.value.nombres}_${personal.value.apellidos}.pdf`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      showSnackbar('Error al descargar el expediente', 'error')
      console.error(error)
    } finally {
      downloadingExpediente.value = false
    }
  }

  async function initDetalle () {
    asistenciaHistorial.value = null
    calendarioMes.value = []
    const tabQuery = route.query.tab
    if (typeof tabQuery === 'string' && tabQuery) {
      tab.value = tabQuery
    }
    await loadPersonal()
    if (!expedienteCompleto.value) return
    Promise.all([
      loadFamiliares(),
      loadRedesSociales(),
      loadProyectos(),
      loadParentescos(),
      loadRedesSocialesCatalogo(),
    ])
  }

  onMounted(() => {
    initDetalle()
  })

  watch(() => route.params.id, (id, prev) => {
    if (id && id !== prev) {
      initDetalle()
    }
  })
</script>

<style scoped>
.personal-header-card {
  overflow: hidden;
}

.personal-header-accent {
  height: 4px;
  background: rgb(var(--v-theme-primary));
}

.personal-header-avatar {
  border: 2px solid rgba(var(--v-theme-primary), 0.18);
}

.min-w-0 {
  min-width: 0;
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

.calendario-dia__inner {
  height: 100%;
  min-height: 58px;
  padding: 6px 4px 5px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: #fff;
  cursor: default;
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
