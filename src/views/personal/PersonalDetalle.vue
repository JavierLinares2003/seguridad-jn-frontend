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
    <v-card v-if="personal" class="mb-6" elevation="2" rounded="xl">
      <v-card-text class="pa-0">
        <!-- Banner superior -->
        <v-sheet class="rounded-t-xl" color="primary" height="100" />

        <div class="px-6 pb-6" style="margin-top: -50px;">
          <v-row align="end">
            <v-col cols="12" md="auto">
              <v-avatar class="elevation-6 border-white" size="100" style="border: 4px solid white;">
                <v-img v-if="personal.foto_url" cover :src="personal.foto_url" />
                <v-icon v-else color="grey-lighten-1" size="56">mdi-account</v-icon>
              </v-avatar>
            </v-col>
            <v-col class="pt-md-8" cols="12" md>
              <div class="d-flex flex-column flex-md-row align-md-center justify-space-between">
                <div>
                  <h1 class="text-h4 font-weight-bold text-grey-darken-3">
                    {{ personal.nombres }} {{ personal.apellidos }}
                  </h1>
                  <div class="d-flex align-center flex-wrap ga-2 mt-2">
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
                  </div>
                </div>
                <div class="mt-4 mt-md-0 d-flex ga-2">

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
                    class="text-none font-weight-bold"
                    color="secondary"
                    elevation="2"
                    :loading="downloadingCV"
                    rounded="lg"
                    variant="tonal"
                    @click="downloadCV"
                  >
                    <v-icon start>mdi-file-document-outline</v-icon>
                    CV
                  </v-btn>
                  <v-btn
                    v-can="'edit-personal'"
                    class="text-none font-weight-bold"
                    color="primary"
                    elevation="2"
                    rounded="lg"
                    :to="{ name: 'personal-edit', params: { id: personal.id } }"
                  >
                    <v-icon start>mdi-pencil-outline</v-icon>
                    Editar
                  </v-btn>
                </div>
              </div>
            </v-col>
          </v-row>
        </div>
      </v-card-text>
    </v-card>

    <template v-if="personal">
      <!-- Tabs -->
      <v-card elevation="2" rounded="xl">
        <v-tabs
          v-model="tab"
          bg-color="grey-lighten-5"
          class="border-b"
          color="primary"
          show-arrows
          slider-color="primary"
        >
          <v-tab class="text-none" value="personal">
            <v-icon size="20" start>mdi-account-outline</v-icon>
            Informacion Personal
          </v-tab>
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
          <v-tab class="text-none" value="transacciones">
            <v-icon size="20" start>mdi-cash-multiple</v-icon>
            Transacciones
          </v-tab>
          <v-tab class="text-none" value="prestamos">
            <v-icon size="20" start>mdi-currency-usd</v-icon>
            Préstamos
          </v-tab>
        </v-tabs>

        <v-tabs-window v-model="tab">
          <!-- Tab: Informacion Personal -->
          <v-tabs-window-item value="personal">
            <v-card-text class="pa-6">
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
                          <v-list-item-title class="font-weight-medium">{{ personal.dpi }}</v-list-item-title>
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
                            <v-chip class="ml-1" color="primary" size="x-small" variant="tonal">{{ personal.edad }} anos</v-chip>
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
                          <v-list-item-subtitle class="text-caption">Telefono</v-list-item-subtitle>
                          <v-list-item-title>{{ personal.telefono }}</v-list-item-title>
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
                      </v-list>
                    </v-card-text>
                  </v-card>
                </v-col>

                <v-col v-if="personal.observaciones" cols="12">
                  <v-alert
                    prominent
                    rounded="lg"
                    type="info"
                    variant="tonal"
                  >
                    <template #title>Observaciones</template>
                    {{ personal.observaciones }}
                  </v-alert>
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
                          {{ red.url_perfil }}
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
                  :dot-color="proyecto.activo ? 'success' : 'grey'"
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
                        :color="proyecto.activo ? 'success' : 'grey'"
                        label
                        size="small"
                        variant="flat"
                      >
                        <v-icon size="14" start>{{ proyecto.activo ? 'mdi-check-circle' : 'mdi-check' }}</v-icon>
                        {{ proyecto.activo ? 'Activo' : 'Finalizado' }}
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

          <!-- Tab: Transacciones -->
          <v-tabs-window-item value="transacciones">
            <v-card-text class="pa-6">
              <TransaccionesPersonal
                :personal-id="parseInt(route.params.id)"
                :readonly="!$can('edit-personal')"
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
                  v-model="familiarForm.telefono"
                  density="compact"
                  :error-messages="familiarErrors.telefono"
                  label="Teléfono *"
                  prepend-inner-icon="mdi-phone"
                  variant="outlined"
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
  import { computed, onMounted, reactive, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import DocumentosPersonal from '@/components/personal/DocumentosPersonal.vue'
  import PrestamosPersonal from '@/components/personal/PrestamosPersonal.vue'
  import ReferenciasLaborales from '@/components/personal/ReferenciasLaborales.vue'
  import TransaccionesPersonal from '@/components/personal/TransaccionesPersonal.vue'
  import { CATALOGOS } from '@/services/catalogoService'
  import personalService from '@/services/personalService'
  import { useCatalogosStore } from '@/stores/catalogos'
  import { usePersonalStore } from '@/stores/personal'

  const route = useRoute()
  const router = useRouter()
  const store = usePersonalStore()
  const catalogosStore = useCatalogosStore()

  const tab = ref('personal')
  const personal = computed(() => store.currentItem)

  // Datos relacionados
  const familiares = ref([])
  const redesSociales = ref([])
  const proyectos = ref([])

  const loadingFamiliares = ref(false)
  const downloadingCV = ref(false)

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
    if (!date) return '-'
    return new Date(date).toLocaleDateString('es-GT')
  }

  function formatNumber (num) {
    if (!num) return '0.00'
    return Number.parseFloat(num).toLocaleString('es-GT', { minimumFractionDigits: 2 })
  }

  function getEstadoColor (estado) {
    const colors = { activo: 'success', inactivo: 'grey', suspendido: 'warning' }
    return colors[estado] || 'grey'
  }

  function getEstadoIcon (estado) {
    const icons = { activo: 'mdi-check-circle', inactivo: 'mdi-close-circle', suspendido: 'mdi-pause-circle' }
    return icons[estado] || 'mdi-circle'
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

    if (redForm.url_perfil && !/^https?:\/\/.+/.test(redForm.url_perfil)) {
      redErrors.url_perfil = 'La URL debe ser válida (comenzar con http:// o https://)'
      valid = false
    }

    return valid
  }

  async function saveRedSocial () {
    if (!validateRedForm()) return

    savingRed.value = true
    redError.value = null

    try {
      const data = {
        red_social_id: redForm.red_social_id,
        nombre_usuario: redForm.nombre_usuario,
        url_perfil: redForm.url_perfil || null,
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

  // Inicializar
  onMounted(async () => {
    await loadPersonal()
    // Cargar datos relacionados en paralelo
    Promise.all([
      loadFamiliares(),
      loadRedesSociales(),
      loadProyectos(),
      loadParentescos(),
      loadRedesSocialesCatalogo(),
    ])
  })
</script>
