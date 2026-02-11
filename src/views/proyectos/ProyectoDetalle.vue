<template>
  <v-container fluid>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col>
        <v-btn icon="mdi-arrow-left" :to="{ name: 'proyectos' }" variant="text" />
        <span class="text-h4 ml-2">Detalle de Proyecto</span>
      </v-col>
      <v-col cols="auto">
        <v-btn
          color="secondary"
          prepend-icon="mdi-file-document-edit-outline"
          variant="tonal"
          @click="dialogActas = true"
        >
          Aceptación de Servicios
        </v-btn>
        <v-btn
          v-if="canEdit"
          class="ml-2"
          color="primary"
          prepend-icon="mdi-pencil"
          :to="{ name: 'proyectos-edit', params: { id: route.params.id } }"
          variant="tonal"
        >
          Editar Información
        </v-btn>
      </v-col>
    </v-row>

    <v-card v-if="loading" class="pa-4 text-center">
      <v-progress-circular color="primary" indeterminate />
    </v-card>

    <v-card v-else-if="proyecto" elevation="2" rounded="xl">
      <!-- Banner / Resumen -->
      <v-img
        class="align-end"
        cover
        height="150"
        src="https://cdn.vuetifyjs.com/images/cards/server-room.jpg"
      >
        <v-card-title class="text-white text-h4 font-weight-bold ml-4 mb-2">
          {{ proyecto.nombre_proyecto }}
        </v-card-title>
        <v-card-subtitle class="text-white ml-4 mb-4 text-h6">
          {{ proyecto.correlativo }} - {{ proyecto.empresa_cliente }}
        </v-card-subtitle>
      </v-img>

      <v-tabs v-model="tab" align-tabs="start" color="primary">
        <v-tab value="general">Información General</v-tab>
        <v-tab value="ubicacion">Ubicación y Facturación</v-tab>
        <v-tab value="contactos">Contactos</v-tab>
        <v-tab value="inventario">Inventario</v-tab>
        <v-tab value="personal">Configuración Personal</v-tab>
        <v-tab value="asignaciones">Asignaciones</v-tab>
        <v-tab value="documentos">Documentos</v-tab>
      </v-tabs>

      <v-card-text class="bg-grey-lighten-5 pt-4">
        <v-window v-model="tab">

          <!-- TAB 1: Información General -->
          <v-window-item value="general">
            <v-row>
              <v-col cols="12" md="8">
                <v-card class="mb-4">
                  <v-card-title>Descripción</v-card-title>
                  <v-card-text>
                    {{ proyecto.descripcion || 'Sin descripción' }}
                  </v-card-text>
                </v-card>

                <v-card>
                  <v-card-title>Fechas Clave</v-card-title>
                  <v-card-text>
                    <v-row>
                      <v-col cols="6" md="3">
                        <div class="text-caption text-medium-emphasis">Inicio Estimado</div>
                        <div class="text-body-1">{{ formatDate(proyecto.fecha_inicio_estimada) }}</div>
                      </v-col>
                      <v-col cols="6" md="3">
                        <div class="text-caption text-medium-emphasis">Fin Estimado</div>
                        <div class="text-body-1">{{ formatDate(proyecto.fecha_fin_estimada) }}</div>
                      </v-col>
                      <v-col cols="6" md="3">
                        <div class="text-caption text-medium-emphasis">Inicio Real</div>
                        <div class="text-body-1">{{ formatDate(proyecto.fecha_inicio_real) }}</div>
                      </v-col>
                      <v-col cols="6" md="3">
                        <div class="text-caption text-medium-emphasis">Fin Real</div>
                        <div class="text-body-1">{{ formatDate(proyecto.fecha_fin_real) }}</div>
                      </v-col>
                    </v-row>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="12" md="4">
                <v-card class="mb-4">
                  <v-card-title>Estado</v-card-title>
                  <v-card-text class="text-center pa-6">
                    <v-chip
                      class="text-capitalize"
                      :color="getEstadoColor(proyecto.estado_proyecto)"
                      size="x-large"
                      variant="flat"
                    >
                      <v-icon :icon="getEstadoIcon(proyecto.estado_proyecto)" start />
                      {{ proyecto.estado_proyecto }}
                    </v-chip>
                  </v-card-text>
                </v-card>

                <v-card>
                  <v-card-title>Tipo</v-card-title>
                  <v-card-text>
                    {{ proyecto.tipo_proyecto?.nombre }}
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-window-item>

          <!-- TAB 2: Ubicación y Facturación -->
          <v-window-item value="ubicacion">
            <v-row>
              <!-- Ubicación -->
              <v-col cols="12" md="6">
                <v-card class="h-100">
                  <v-card-item>
                    <template #prepend>
                      <v-icon color="primary" icon="mdi-map-marker" />
                    </template>
                    <v-card-title>Ubicación del Proyecto</v-card-title>
                  </v-card-item>

                  <v-card-text v-if="proyecto.ubicacion">
                    <v-list density="compact">
                      <v-list-item>
                        <template #prepend>
                          <v-icon class="mr-2" icon="mdi-map-marker-check" size="small" />
                        </template>
                        <v-list-item-title>Departamento / Municipio</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ proyecto.ubicacion.departamento_geografico?.nombre || 'No definido' }} /
                          {{ proyecto.ubicacion.municipio?.nombre || 'No definido' }}
                        </v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item>
                        <template #prepend>
                          <v-icon class="mr-2" icon="mdi-sign-direction" size="small" />
                        </template>
                        <v-list-item-title>Dirección Completa</v-list-item-title>
                        <v-list-item-subtitle class="text-wrap">
                          {{ proyecto.ubicacion.direccion_completa || 'No definida' }}
                        </v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item>
                        <template #prepend>
                          <v-icon class="mr-2" icon="mdi-map-marker-radius" size="small" />
                        </template>
                        <v-list-item-title>Zona</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ proyecto.ubicacion.zona || 'No definida' }}
                        </v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </v-card-text>
                  <v-card-text v-else class="text-medium-emphasis font-italic">
                    Sin información de ubicación registrada.
                  </v-card-text>
                </v-card>
              </v-col>

              <!-- Facturación -->
              <v-col cols="12" md="6">
                <v-card class="h-100">
                  <v-card-item>
                    <template #prepend>
                      <v-icon color="secondary" icon="mdi-receipt" />
                    </template>
                    <v-card-title>Datos de Facturación</v-card-title>
                  </v-card-item>

                  <v-card-text v-if="proyecto.facturacion">
                    <v-row>
                      <v-col cols="6">
                        <div class="text-caption text-medium-emphasis">Tipo Documento</div>
                        <div class="text-body-2 font-weight-medium">
                          {{ proyecto.facturacion.tipo_documento_facturacion?.nombre || 'N/A' }}
                        </div>
                      </v-col>
                      <v-col cols="6">
                        <div class="text-caption text-medium-emphasis">NIT Cliente</div>
                        <div class="text-body-2 font-weight-medium">
                          {{ proyecto.facturacion.nit_cliente || 'C/F' }}
                        </div>
                      </v-col>

                      <v-col cols="12">
                        <div class="text-caption text-medium-emphasis">Nombre Facturación</div>
                        <div class="text-body-2">
                          {{ proyecto.facturacion.nombre_facturacion || '-' }}
                        </div>
                      </v-col>

                      <v-col cols="12">
                        <div class="text-caption text-medium-emphasis">Dirección Facturación</div>
                        <div class="text-body-2">
                          {{ proyecto.facturacion.direccion_facturacion || '-' }}
                        </div>
                      </v-col>

                      <v-divider class="my-2" />

                      <v-col cols="6">
                        <div class="text-caption text-medium-emphasis">Forma de Pago</div>
                        <div class="text-body-2">
                          {{ proyecto.facturacion.forma_pago || '-' }}
                        </div>
                      </v-col>
                      <v-col cols="6">
                        <div class="text-caption text-medium-emphasis">Periodicidad</div>
                        <div class="text-body-2">
                          {{ proyecto.facturacion.periodicidad_pago?.nombre || '-' }}
                        </div>
                      </v-col>

                      <v-col cols="6">
                        <div class="text-caption text-medium-emphasis">Día de Pago</div>
                        <div class="text-body-2">
                          {{ proyecto.facturacion.dia_pago || '-' }}
                        </div>
                      </v-col>
                      <v-col cols="6">
                        <div class="text-caption text-medium-emphasis">Monto Total</div>
                        <div class="text-body-2 font-weight-bold text-success">
                          {{ proyecto.facturacion.moneda }} {{ proyecto.facturacion.monto_proyecto_total }}
                        </div>
                      </v-col>
                    </v-row>
                  </v-card-text>
                  <v-card-text v-else class="text-medium-emphasis font-italic">
                    Sin información de facturación registrada.
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-window-item>

          <!-- TAB 3: Contactos -->
          <v-window-item value="contactos">
            <ContactosProyecto :proyecto-id="proyecto.id" />
          </v-window-item>

          <!-- TAB 4: Inventario -->
          <v-window-item value="inventario">
            <InventarioProyecto :proyecto-id="proyecto.id" />
          </v-window-item>

          <!-- TAB 5: Configuración Personal -->
          <v-window-item value="personal">
            <ConfiguracionPersonalProyecto :proyecto-id="proyecto.id" />
          </v-window-item>

          <!-- TAB 6: Asignaciones de Personal -->
          <v-window-item value="asignaciones">
            <AsignacionesProyecto :proyecto-id="proyecto.id" />
          </v-window-item>

          <!-- TAB 7: Documentos -->
          <v-window-item value="documentos">
            <DocumentosProyecto
              v-if="proyecto"
              :proyecto-id="proyecto.id"
              :readonly="!canManage"
              @error="handleError"
              @updated="loadProyecto"
            />
          </v-window-item>

        </v-window>
      </v-card-text>
    </v-card>

    <!-- Dialog Actas -->
    <v-dialog v-model="dialogActas" max-width="1200">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon start>mdi-file-document-edit-outline</v-icon>
          Carta de Aceptación de Servicios
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" @click="dialogActas = false" />
        </v-card-title>
        <v-card-text>
          <ActasProyecto v-if="proyecto" :proyecto-id="proyecto.id" />
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
  import { format } from 'date-fns'
  import { es } from 'date-fns/locale'
  import { computed, onMounted, ref } from 'vue'
  import { useRoute } from 'vue-router'
  import DocumentosProyecto from '@/components/proyectos/DocumentosProyecto.vue'
  import { useAuthStore } from '@/stores/auth'

  import { useProyectosStore } from '@/stores/proyectos'
  import AsignacionesProyecto from '@/views/operaciones/components/AsignacionesProyecto.vue'
  import ConfiguracionPersonalProyecto from './components/ConfiguracionPersonalProyecto.vue'
  // Componentes
  import ContactosProyecto from './components/ContactosProyecto.vue'
  import InventarioProyecto from './components/InventarioProyecto.vue'
  import ActasProyecto from './components/ActasProyecto.vue'

  const route = useRoute()
  const store = useProyectosStore()
  const authStore = useAuthStore()

  const canEdit = computed(() => authStore.hasPermission('edit-proyectos'))
  const canManage = computed(() => authStore.hasPermission('edit-proyectos'))

  const tab = ref('general')
  const loading = ref(true)
  const dialogActas = ref(false)

  const proyecto = computed(() => store.currentItem)

  async function loadData () {
    loading.value = true
    try {
      await store.fetchById(route.params.id)
    } catch (error) {
      console.error(error)
    } finally {
      loading.value = false
    }
  }

  // Alias for loadData to match component event
  const loadProyecto = loadData

  // Handle errors from child components
  function handleError (message) {
    console.error(message)
  // You can add a toast notification here if you have one
  }

  // Color del estado
  function getEstadoColor (estado) {
    const colors = {
      planificacion: 'info',
      activo: 'success',
      suspendido: 'warning',
      finalizado: 'grey',
    }
    return colors[estado] || 'grey'
  }

  // Icono del estado
  function getEstadoIcon (estado) {
    const icons = {
      planificacion: 'mdi-clipboard-text-clock-outline',
      activo: 'mdi-play-circle-outline',
      suspendido: 'mdi-pause-circle-outline',
      finalizado: 'mdi-check-circle-outline',
    }
    return icons[estado] || 'mdi-help-circle-outline'
  }

  function formatDate (date) {
    if (!date) return '-'
    return format(new Date(date), 'dd MMM yyyy', { locale: es })
  }

  onMounted(() => {
    loadData()
  })
</script>
