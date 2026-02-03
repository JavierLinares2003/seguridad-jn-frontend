<template>
  <v-container>
    <v-card>
      <v-card-title>Ejemplo de Uso de Catálogos</v-card-title>

      <v-card-text>
        <!-- Ejemplo 1: Catálogos simples -->
        <h3 class="text-h6 mb-3">1. Selects Simples</h3>
        <v-row>
          <v-col cols="12" md="4">
            <v-select
              v-model="form.sexo_id"
              item-title="nombre"
              item-value="id"
              :items="sexos"
              label="Sexo"
              :loading="isLoading(CATALOGOS.SEXOS).value"
              variant="outlined"
            />
          </v-col>

          <v-col cols="12" md="4">
            <v-select
              v-model="form.estado_civil_id"
              item-title="nombre"
              item-value="id"
              :items="estadosCiviles"
              label="Estado Civil"
              :loading="isLoading(CATALOGOS.ESTADOS_CIVILES).value"
              variant="outlined"
            />
          </v-col>

          <v-col cols="12" md="4">
            <v-select
              v-model="form.tipo_sangre_id"
              item-title="nombre"
              item-value="id"
              :items="tiposSangre"
              label="Tipo de Sangre"
              :loading="isLoading(CATALOGOS.TIPOS_SANGRE).value"
              variant="outlined"
            />
          </v-col>
        </v-row>

        <v-divider class="my-6" />

        <!-- Ejemplo 2: Selects Dependientes -->
        <h3 class="text-h6 mb-3">2. Selects Dependientes (Departamento → Municipio)</h3>
        <v-row>
          <v-col cols="12" md="6">
            <v-select
              v-model="departamentoSeleccionado"
              clearable
              item-title="nombre"
              item-value="id"
              :items="departamentos"
              label="Departamento"
              variant="outlined"
            />
          </v-col>

          <v-col cols="12" md="6">
            <v-select
              v-model="form.municipio_id"
              :disabled="!departamentoSeleccionado"
              item-title="nombre"
              item-value="id"
              :items="municipios"
              label="Municipio"
              :loading="loadingMunicipios"
              variant="outlined"
            />
          </v-col>
        </v-row>

        <v-divider class="my-6" />

        <!-- Ejemplo 3: Mostrar label por ID -->
        <h3 class="text-h6 mb-3">3. Mostrar Labels</h3>
        <v-alert type="info" variant="tonal">
          <p><strong>Sexo seleccionado:</strong> {{ getLabel(CATALOGOS.SEXOS, form.sexo_id) || 'Ninguno' }}</p>
          <p><strong>Estado civil:</strong> {{ getLabel(CATALOGOS.ESTADOS_CIVILES, form.estado_civil_id) || 'Ninguno' }}</p>
        </v-alert>

        <v-divider class="my-6" />

        <!-- Ejemplo 4: Autocomplete con búsqueda -->
        <h3 class="text-h6 mb-3">4. Autocomplete</h3>
        <v-row>
          <v-col cols="12" md="6">
            <v-autocomplete
              v-model="form.turno_id"
              clearable
              item-title="nombre"
              item-value="id"
              :items="turnos"
              label="Turno"
              :loading="isLoading(CATALOGOS.TURNOS).value"
              variant="outlined"
            />
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-actions>
        <v-btn color="primary" @click="refreshCatalogos">
          <v-icon start>mdi-refresh</v-icon>
          Refrescar Catálogos
        </v-btn>
        <v-btn color="secondary" variant="outlined" @click="showFormData">
          Ver Datos del Form
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Dialog para mostrar datos -->
    <v-dialog v-model="dialog" max-width="500">
      <v-card>
        <v-card-title>Datos del Formulario</v-card-title>
        <v-card-text>
          <pre>{{ JSON.stringify(form, null, 2) }}</pre>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="dialog = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
  import { computed, reactive, ref } from 'vue'
  import { useCatalogos, useDepartamentoMunicipio } from '@/composables/useCatalogos'

  // Usar composable con catálogos iniciales
  const {
    loadCatalogos,
    getCatalogo,
    isLoading,
    getLabel,
    clearCache,
    CATALOGOS,
  } = useCatalogos([
    'estados-civiles',
    'tipos-sangre',
    'sexos',
    'turnos',
  ])

  // Composable para departamento/municipio
  const {
    departamentos,
    departamentoSeleccionado,
    municipios,
    loadingMunicipios,
  } = useDepartamentoMunicipio()

  // Catálogos reactivos
  const sexos = getCatalogo(CATALOGOS.SEXOS)
  const estadosCiviles = getCatalogo(CATALOGOS.ESTADOS_CIVILES)
  const tiposSangre = getCatalogo(CATALOGOS.TIPOS_SANGRE)
  const turnos = getCatalogo(CATALOGOS.TURNOS)

  // Form data
  const form = reactive({
    sexo_id: null,
    estado_civil_id: null,
    tipo_sangre_id: null,
    municipio_id: null,
    turno_id: null,
  })

  const dialog = ref(false)

  // Refrescar catálogos (forzar recarga)
  async function refreshCatalogos () {
    clearCache()
    await loadCatalogos([
      CATALOGOS.ESTADOS_CIVILES,
      CATALOGOS.TIPOS_SANGRE,
      CATALOGOS.SEXOS,
      CATALOGOS.TURNOS,
    ], { force: true })
  }

  function showFormData () {
    dialog.value = true
  }
</script>
