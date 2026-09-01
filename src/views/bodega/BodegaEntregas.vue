<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center flex-wrap ga-3 mb-4">
      <v-btn icon="mdi-arrow-left" variant="text" :to="{ name: 'bodega' }" />
      <div>
        <h1 class="text-h5 font-weight-bold mb-0">Entregas a personal</h1>
        <p class="text-caption text-medium-emphasis mb-0">
          Cada entrega genera una boleta. Ese número es la guía de lo que tiene el personal y de lo que debe devolver al salir.
        </p>
      </div>
      <v-spacer />
      <v-btn
        v-if="canManage"
        color="primary"
        variant="elevated"
        @click="abrirDialog('kit')"
      >
        <v-icon start>mdi-tshirt-crew</v-icon>
        Armar kit
      </v-btn>
      <v-btn
        v-if="canManage"
        color="warning"
        variant="tonal"
        @click="abrirDialog('reposicion')"
      >
        <v-icon start>mdi-restore</v-icon>
        Reposición
      </v-btn>
      <v-btn
        v-if="canManage"
        color="secondary"
        variant="tonal"
        @click="abrirDialog('simple')"
      >
        <v-icon start>mdi-package-variant-closed</v-icon>
        Entrega simple
      </v-btn>
    </div>

    <v-card elevation="2" rounded="xl">
      <v-data-table :headers="headers" :items="items" :loading="loading" :items-per-page="20">
        <template #item.fecha_entrega="{ item }">
          {{ formatDate(item.fecha_entrega) }}
        </template>
        <template #item.tipo="{ item }">
          <v-chip :color="tipoColor(item.tipo)" size="small" variant="flat">
            {{ tipoLabel(item.tipo) }}
          </v-chip>
        </template>
        <template #item.personal="{ item }">
          <div>{{ item.personal?.nombres }} {{ item.personal?.apellidos }}</div>
          <div v-if="item.personal_operaciones" class="text-caption text-medium-emphasis">
            Vía ops: {{ item.personal_operaciones.nombres }} {{ item.personal_operaciones.apellidos }}
          </div>
        </template>
        <template #item.items="{ item }">
          {{ item.items?.length || 0 }} ítem(s)
          <div class="text-caption text-medium-emphasis">
            {{ resumenItems(item) }}
          </div>
        </template>
        <template #item.monto_total="{ item }">
          <span v-if="item.cobrar">Q{{ formatMoney(item.monto_total) }}</span>
          <span v-else class="text-medium-emphasis">Sin cobro</span>
        </template>
        <template #item.estado="{ item }">
          <v-chip :color="item.devuelta_at || !item.pendiente_devolucion ? 'success' : 'warning'" size="small" variant="tonal">
            {{ item.devuelta_at || !item.pendiente_devolucion ? 'Devuelto' : 'En poder' }}
          </v-chip>
        </template>
        <template #item.acciones="{ item }">
          <v-btn
            color="secondary"
            size="small"
            variant="tonal"
            @click="abrirVistaPreviaBoleta(item)"
          >
            <v-icon start>mdi-printer</v-icon>
            Boleta
          </v-btn>
          <v-btn
            v-if="canManage && item.pendiente_devolucion !== false && !item.devuelta_at"
            class="ml-1"
            color="primary"
            size="small"
            variant="tonal"
            :loading="devolviendoId === item.id"
            @click="devolverBoleta(item)"
          >
            <v-icon start>mdi-package-down</v-icon>
            Devolver
          </v-btn>
          <v-btn
            v-if="item.cobrar && !item.grupo_uniforme"
            class="ml-1"
            color="info"
            size="small"
            variant="tonal"
            :to="linkDescuento(item)"
          >
            Armar cuotas
          </v-btn>
          <v-chip
            v-else-if="item.grupo_uniforme"
            class="ml-1"
            color="success"
            size="small"
            variant="tonal"
          >
            Descuento creado
          </v-chip>
        </template>
      </v-data-table>
    </v-card>

    <!-- ========== KIT ========== -->
    <v-dialog v-model="dialogKit" max-width="820" persistent scrollable>
      <v-card rounded="xl">
        <v-card-title class="bg-primary pa-4 text-white">
          Armar kit / uniforme
        </v-card-title>
        <v-card-text class="pa-6">
          <v-alert class="mb-4" density="compact" type="info" variant="tonal">
            Puedes cargar un combo prearmado y solo elegir talla/condición, o armar prenda por prenda. Si activas cuotas, el total se descuenta en planilla.
          </v-alert>

          <v-select
            v-model="kitId"
            class="mb-4"
            clearable
            item-title="nombre"
            item-value="id"
            :items="kits"
            label="Cargar combo prearmado"
            no-data-text="No hay combos. Créalos en Bodega → Combos."
            variant="outlined"
            @update:model-value="aplicarCombo"
          />

          <v-autocomplete
            v-model="form.personal_id"
            class="mb-2"
            clearable
            item-title="nombre_completo"
            item-value="id"
            :items="personalOpts"
            :loading="loadingPersonal"
            label="Usuario final (guardia) *"
            placeholder="Buscar por nombre..."
            variant="outlined"
            @update:search="buscarPersonal"
          />
          <v-switch
            v-model="form.via_operaciones"
            class="mb-2"
            color="primary"
            density="compact"
            hide-details
            label="Lo lleva operaciones (el guardia ya está en el punto)"
          />
          <v-autocomplete
            v-if="form.via_operaciones"
            v-model="form.personal_operaciones_id"
            class="mb-2"
            clearable
            item-title="nombre_completo"
            item-value="id"
            :items="personalOpts"
            label="Quién de operaciones recibe en bodega *"
            variant="outlined"
            @update:search="buscarPersonal"
          />
          <v-text-field v-model="form.fecha_entrega" class="mb-4" label="Fecha" type="date" variant="outlined" />

          <div class="text-subtitle-2 font-weight-bold mb-2">Ítems del conjunto</div>
          <v-row dense class="mb-2">
            <v-col cols="12" md="5">
              <v-autocomplete
                v-model="draft.producto_id"
                clearable
                density="compact"
                :item-title="productoLabel"
                item-value="id"
                :items="productosOpts"
                :loading="loadingProductos"
                label="Producto de uniforme"
                no-data-text="Sin ítems de uniforme"
                placeholder="Buscar uniforme / accesorio..."
                variant="outlined"
                @update:model-value="onDraftProducto"
                @update:search="buscarProducto"
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-select
                v-model="draft.variante_id"
                density="compact"
                :disabled="!draft.producto_id"
                item-title="etiqueta"
                item-value="id"
                :items="draftVariantes"
                label="Variante / talla"
                variant="outlined"
              />
            </v-col>
            <v-col cols="6" md="2">
              <v-text-field v-model.number="draft.cantidad" density="compact" label="Cant." min="1" type="number" variant="outlined" />
            </v-col>
            <v-col cols="6" md="2">
              <v-text-field v-model.number="draft.precio_unitario" density="compact" label="Precio Q" min="0" step="0.01" type="number" variant="outlined" />
            </v-col>
          </v-row>
          <div class="d-flex mb-3">
            <v-spacer />
            <v-btn color="secondary" variant="tonal" @click="agregarItemKit">
              <v-icon start>mdi-plus</v-icon>
              Agregar al kit
            </v-btn>
          </div>

          <v-alert v-if="itemError" class="mb-3" density="compact" type="warning" variant="tonal">{{ itemError }}</v-alert>

          <v-table v-if="form.items.length" class="mb-4" density="compact">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cant.</th>
                <th>Precio</th>
                <th>Subtotal</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <tr v-for="(it, idx) in form.items" :key="idx">
                <td>
                  {{ it.nombre }}
                  <v-select
                    v-if="it.variantes?.length"
                    v-model="it.variante_id"
                    class="mt-1"
                    density="compact"
                    hide-details
                    item-title="etiqueta"
                    item-value="id"
                    :items="it.variantes"
                    label="Talla / condición"
                    variant="outlined"
                    @update:model-value="onItemVariante(it)"
                  />
                  <div v-else class="text-caption">{{ it.etiqueta }} · stock {{ it.existencia }}</div>
                </td>
                <td>{{ it.cantidad }}</td>
                <td>
                  <v-text-field
                    v-model.number="it.precio_unitario"
                    density="compact"
                    hide-details
                    min="0"
                    prefix="Q"
                    step="0.01"
                    style="max-width: 110px"
                    type="number"
                    variant="outlined"
                  />
                </td>
                <td>Q{{ formatMoney(it.cantidad * (it.precio_unitario || 0)) }}</td>
                <td>
                  <v-btn color="error" icon="mdi-delete" size="small" variant="text" @click="quitarItem(idx)" />
                </td>
              </tr>
            </tbody>
          </v-table>
          <v-alert v-else class="mb-4" density="compact" type="info" variant="tonal">
            Agrega camisa, pantalón, gorra, etc. para armar el conjunto.
          </v-alert>

          <div v-if="form.items.length" class="d-flex align-center mb-4">
            <span class="text-subtitle-1 font-weight-bold">
              {{ form.a_cuotas ? 'Total a descontar:' : 'Total del kit:' }}
            </span>
            <v-spacer />
            <span class="text-h6 text-info">Q{{ formatMoney(montoTotal) }}</span>
          </div>

          <template v-if="form.items.length">
            <div class="d-flex align-center flex-wrap ga-2 mb-2">
              <div class="text-subtitle-2 font-weight-bold">Plan de cuotas</div>
              <v-spacer />
              <v-switch
                v-model="form.a_cuotas"
                color="primary"
                density="compact"
                hide-details
                label="A cuotas"
              />
            </div>
            <v-alert
              v-if="!form.a_cuotas"
              class="mb-3"
              density="compact"
              type="warning"
              variant="tonal"
            >
              Sin cuotas: se entrega el kit y no se crea descuento en planilla.
            </v-alert>
            <v-row v-else dense>
              <v-col cols="12" md="4">
                <v-text-field v-model.number="form.cuotas_totales" density="compact" label="Cuotas *" max="60" min="1" type="number" variant="outlined" />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model="form.fecha_inicio_descuento" density="compact" label="Inicio 1ª cuota" type="date" variant="outlined" />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model="form.descripcion_descuento" density="compact" label="Concepto" placeholder="Kit uniforme agente..." variant="outlined" />
              </v-col>
            </v-row>
          </template>

          <v-textarea v-model="form.observaciones" class="mt-3" label="Observaciones" rows="2" variant="outlined" />
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="dialogKit = false">Cancelar</v-btn>
          <v-btn color="primary" :disabled="!puedeGuardarKit" :loading="saving" variant="elevated" @click="guardar">
            {{ form.a_cuotas ? 'Registrar kit y descuento' : 'Registrar kit' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ========== REPOSICIÓN ========== -->
    <v-dialog v-model="dialogReposicion" max-width="560" persistent>
      <v-card rounded="xl">
        <v-card-title class="bg-warning pa-4 text-white">
          Reposición de equipo
        </v-card-title>
        <v-card-text class="pa-6">
          <v-alert class="mb-4" density="compact" type="warning" variant="tonal">
            Para cuando pierden o dañan algo (gorra, radio, etc.). Un solo ítem. Tú decides si se cobra o no.
          </v-alert>

          <v-autocomplete
            v-model="form.personal_id"
            class="mb-2"
            clearable
            item-title="nombre_completo"
            item-value="id"
            :items="personalOpts"
            :loading="loadingPersonal"
            label="Usuario final (guardia) *"
            placeholder="Buscar por nombre..."
            variant="outlined"
            @update:search="buscarPersonal"
          />
          <v-switch
            v-model="form.via_operaciones"
            class="mb-2"
            color="primary"
            density="compact"
            hide-details
            label="Lo lleva operaciones (el guardia ya está en el punto)"
          />
          <v-autocomplete
            v-if="form.via_operaciones"
            v-model="form.personal_operaciones_id"
            class="mb-2"
            clearable
            item-title="nombre_completo"
            item-value="id"
            :items="personalOpts"
            label="Quién de operaciones recibe en bodega *"
            variant="outlined"
            @update:search="buscarPersonal"
          />
          <v-select
            v-model="form.motivo_reposicion"
            class="mb-2"
            :items="motivosReposicion"
            label="Motivo *"
            variant="outlined"
          />
          <v-switch
            v-model="form.cambio_por_dano"
            class="mb-2"
            color="warning"
            density="compact"
            hide-details
            label="Cambio por daño: entra la prenda dañada (no vuelve a stock bueno) y sale la nueva"
          />
          <v-text-field v-model="form.fecha_entrega" class="mb-2" label="Fecha" type="date" variant="outlined" />

          <v-autocomplete
            v-model="draft.producto_id"
            class="mb-2"
            clearable
            :item-title="productoLabel"
            item-value="id"
            :items="productosOpts"
            :loading="loadingProductos"
            label="Qué se repone *"
            placeholder="Buscar producto..."
            variant="outlined"
            @update:model-value="onDraftProducto"
            @update:search="buscarProducto"
          />
          <v-select
            v-model="draft.variante_id"
            class="mb-2"
            :disabled="!draft.producto_id"
            item-title="etiqueta"
            item-value="id"
            :items="draftVariantes"
            label="Variante / talla *"
            variant="outlined"
          />
          <v-text-field v-model.number="draft.cantidad" class="mb-3" label="Cantidad *" min="1" type="number" variant="outlined" />

          <v-card border class="pa-4 mb-3" rounded="lg" variant="outlined">
            <div class="text-subtitle-2 font-weight-bold mb-2">¿Se cobra al trabajador?</div>
            <v-radio-group v-model="form.cobrar" class="mt-0" color="warning" hide-details inline>
              <v-radio :value="false" label="No cobrar (solo reponer)" />
              <v-radio :value="true" label="Sí cobrar" />
            </v-radio-group>
            <template v-if="form.cobrar">
              <v-text-field
                v-model.number="draft.precio_unitario"
                class="mt-3"
                label="Monto a descontar *"
                min="0.01"
                prefix="Q"
                step="0.01"
                type="number"
                variant="outlined"
              />
              <v-row dense>
                <v-col cols="6">
                  <v-text-field v-model.number="form.cuotas_totales" label="Cuotas" max="60" min="1" type="number" variant="outlined" />
                </v-col>
                <v-col cols="6">
                  <v-text-field v-model="form.fecha_inicio_descuento" label="Inicio 1ª cuota" type="date" variant="outlined" />
                </v-col>
              </v-row>
            </template>
          </v-card>

          <v-alert v-if="itemError" class="mb-3" density="compact" type="warning" variant="tonal">{{ itemError }}</v-alert>
          <v-textarea v-model="form.observaciones" label="Observaciones" rows="2" variant="outlined" />
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="dialogReposicion = false">Cancelar</v-btn>
          <v-btn color="warning" :disabled="!puedeGuardarReposicion" :loading="saving" variant="elevated" @click="guardar">
            {{ form.cobrar ? 'Reponer y cobrar' : 'Reponer sin cobro' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ========== SIMPLE ========== -->
    <v-dialog v-model="dialogSimple" max-width="520" persistent>
      <v-card rounded="xl">
        <v-card-title class="bg-secondary pa-4 text-white">
          Entrega simple
        </v-card-title>
        <v-card-text class="pa-6">
          <v-alert class="mb-4" density="compact" type="info" variant="tonal">
            Entrega rápida de <strong>un solo producto</strong>. Baja stock y queda registrado a quién se le dio. Sin armar kit ni precios.
          </v-alert>

          <v-autocomplete
            v-model="form.personal_id"
            class="mb-2"
            clearable
            item-title="nombre_completo"
            item-value="id"
            :items="personalOpts"
            :loading="loadingPersonal"
            label="Usuario final (guardia) *"
            placeholder="Buscar por nombre..."
            variant="outlined"
            @update:search="buscarPersonal"
          />
          <v-switch
            v-model="form.via_operaciones"
            class="mb-2"
            color="primary"
            density="compact"
            hide-details
            label="Lo lleva operaciones (el guardia ya está en el punto)"
          />
          <v-autocomplete
            v-if="form.via_operaciones"
            v-model="form.personal_operaciones_id"
            class="mb-2"
            clearable
            item-title="nombre_completo"
            item-value="id"
            :items="personalOpts"
            label="Quién de operaciones recibe en bodega *"
            variant="outlined"
            @update:search="buscarPersonal"
          />
          <v-text-field v-model="form.fecha_entrega" class="mb-2" label="Fecha" type="date" variant="outlined" />
          <v-autocomplete
            v-model="draft.producto_id"
            class="mb-2"
            clearable
            :item-title="productoLabel"
            item-value="id"
            :items="productosOpts"
            :loading="loadingProductos"
            label="Producto *"
            placeholder="Buscar producto..."
            variant="outlined"
            @update:model-value="onDraftProducto"
            @update:search="buscarProducto"
          />
          <v-select
            v-model="draft.variante_id"
            class="mb-2"
            :disabled="!draft.producto_id"
            item-title="etiqueta"
            item-value="id"
            :items="draftVariantes"
            label="Variante *"
            variant="outlined"
          />
          <v-text-field v-model.number="draft.cantidad" class="mb-2" label="Cantidad *" min="1" type="number" variant="outlined" />
          <v-textarea v-model="form.observaciones" label="Observaciones" rows="2" variant="outlined" />
          <v-alert v-if="itemError" class="mt-3" density="compact" type="warning" variant="tonal">{{ itemError }}</v-alert>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="dialogSimple = false">Cancelar</v-btn>
          <v-btn color="secondary" :disabled="!puedeGuardarSimple" :loading="saving" variant="elevated" @click="guardar">
            Entregar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogBoleta" max-width="960" scrollable @update:model-value="onCerrarVistaPrevia">
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon class="mr-2" color="secondary">mdi-file-eye-outline</v-icon>
          Vista previa · Boleta {{ previewNumero }}
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" @click="cerrarVistaPrevia" />
        </v-card-title>
        <v-card-text class="pa-0">
          <div v-if="loadingBoleta" class="text-center pa-12">
            <v-progress-circular color="primary" indeterminate size="40" />
            <div class="text-body-2 mt-3">Generando boleta…</div>
          </div>
          <iframe
            v-else-if="previewUrl"
            class="boleta-preview"
            :src="previewUrl"
            title="Vista previa de boleta"
          />
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-btn
            color="secondary"
            :disabled="!previewUrl"
            variant="tonal"
            @click="descargarBoletaPreview"
          >
            <v-icon start>mdi-download</v-icon>
            Descargar
          </v-btn>
          <v-btn
            color="primary"
            :disabled="!previewUrl"
            variant="tonal"
            @click="imprimirBoletaPreview"
          >
            <v-icon start>mdi-printer</v-icon>
            Imprimir
          </v-btn>
          <v-spacer />
          <v-btn variant="text" @click="cerrarVistaPrevia">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="4000">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
  import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
  import { format } from 'date-fns'
  import { es } from 'date-fns/locale'
  import bodegaService from '@/services/bodegaService'
  import personalService from '@/services/personalService'
  import { useAuthStore } from '@/stores/auth'

  const authStore = useAuthStore()
  const canManage = computed(() => authStore.hasPermission('manage-bodega'))

  const loading = ref(false)
  const saving = ref(false)
  const loadingPersonal = ref(false)
  const loadingProductos = ref(false)
  const items = ref([])
  const dialogKit = ref(false)
  const dialogReposicion = ref(false)
  const dialogSimple = ref(false)
  const personalOpts = ref([])
  const productosOpts = ref([])
  const kits = ref([])
  const kitId = ref(null)
  const draftVariantes = ref([])
  const itemError = ref('')
  const devolviendoId = ref(null)
  const dialogBoleta = ref(false)
  const loadingBoleta = ref(false)
  const previewUrl = ref('')
  const previewNumero = ref('')
  const snackbar = reactive({ show: false, text: '', color: 'success' })

  const form = reactive({
    tipo: 'kit',
    personal_id: null,
    personal_operaciones_id: null,
    via_operaciones: false,
    cambio_por_dano: false,
    fecha_entrega: localDate(),
    motivo_reposicion: null,
    cobrar: true,
    a_cuotas: true,
    observaciones: '',
    items: [],
    cuotas_totales: 10,
    fecha_inicio_descuento: localDate(),
    descripcion_descuento: '',
  })

  const draft = reactive({
    producto_id: null,
    variante_id: null,
    cantidad: 1,
    precio_unitario: 0,
    nombre: '',
  })

  const motivosReposicion = ['Pérdida', 'Daño', 'Desgaste', 'Cambio de talla', 'Otro']

  const headers = [
    { title: 'Fecha', key: 'fecha_entrega' },
    { title: 'Tipo', key: 'tipo' },
    { title: 'Personal', key: 'personal' },
    { title: 'Ítems', key: 'items', sortable: false },
    { title: 'Boleta', key: 'numero_boleta' },
    { title: 'Monto', key: 'monto_total' },
    { title: 'Estado', key: 'estado', sortable: false },
    { title: '', key: 'acciones', sortable: false, width: '320px' },
  ]

  const montoTotal = computed(() =>
    form.items.reduce((sum, it) => sum + (Number(it.cantidad) || 0) * (Number(it.precio_unitario) || 0), 0)
  )

  const puedeGuardarKit = computed(() => {
    if (!form.personal_id || !form.items.length) return false
    if (form.items.some(it => !it.variante_id)) return false
    if (form.a_cuotas) {
      if (montoTotal.value <= 0) return false
      if (!form.cuotas_totales || form.cuotas_totales < 1) return false
      if (form.items.some(it => Number(it.precio_unitario) <= 0)) return false
    }
    return true
  })

  const puedeGuardarReposicion = computed(() => {
    if (!form.personal_id || !form.motivo_reposicion) return false
    if (!draft.variante_id || !draft.cantidad) return false
    if (form.cobrar) {
      if (Number(draft.precio_unitario) <= 0) return false
      if (!form.cuotas_totales || form.cuotas_totales < 1) return false
    }
    return true
  })

  const puedeGuardarSimple = computed(() =>
    !!(form.personal_id && draft.variante_id && draft.cantidad >= 1)
  )

  function localDate () {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  function formatDate (date) {
    if (!date) return '—'
    const d = String(date).includes('T') ? new Date(date) : new Date(date + 'T12:00:00')
    if (Number.isNaN(d.getTime())) return date
    return format(d, 'dd/MM/yyyy', { locale: es })
  }

  function formatMoney (n) {
    return Number(n || 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  function productoLabel (p) {
    return [p.codigo, p.nombre].filter(Boolean).join(' · ')
  }

  function precioSugerido (variante) {
    return Number(variante?.precio_sugerido || 0)
  }

  function tipoLabel (tipo) {
    return ({ kit: 'Kit', reposicion: 'Reposición', simple: 'Simple' })[tipo] || tipo
  }

  function tipoColor (tipo) {
    return ({ kit: 'primary', reposicion: 'warning', simple: 'secondary' })[tipo] || 'grey'
  }

  function resumenItems (entrega) {
    const list = entrega.items || []
    return list.slice(0, 3).map(i => i.variante?.producto?.nombre).filter(Boolean).join(', ')
      + (list.length > 3 ? '…' : '')
  }

  function linkDescuento (entrega) {
    return {
      name: 'personal-detalle',
      params: { id: entrega.personal_id },
      query: {
        tab: 'transacciones',
        tipo: 'uniforme',
        monto: String(entrega.monto_total ?? 0),
        desc: entrega.tipo === 'reposicion'
          ? `Reposición${entrega.motivo_reposicion ? ' - ' + entrega.motivo_reposicion : ''}`
          : 'Kit / uniforme entregado',
      },
    }
  }

  function mapPersonal (list) {
    return (list || []).map(p => ({
      ...p,
      nombre_completo: p.nombre_completo || `${p.nombres || ''} ${p.apellidos || ''}`.trim(),
    }))
  }

  async function cargar () {
    loading.value = true
    try {
      const res = await bodegaService.getEntregas({ per_page: 50 })
      items.value = res.data?.data || res.data || []
    } finally {
      loading.value = false
    }
  }

  let searchPersonalTimer = null
  function buscarPersonal (q) {
    clearTimeout(searchPersonalTimer)
    searchPersonalTimer = setTimeout(async () => {
      const term = (q || '').trim()
      if (term.length > 0 && term.length < 2) return
      loadingPersonal.value = true
      try {
        const params = { per_page: 25, estado: 'activo', sort_by: 'apellidos', sort_order: 'asc', directorio: 1 }
        if (term) params.buscar = term
        const res = await personalService.getAll(params)
        personalOpts.value = mapPersonal(res?.data || [])
      } finally {
        loadingPersonal.value = false
      }
    }, 300)
  }

  function paramsProductos (search = '') {
    const params = { per_page: 50 }
    if (search) params.search = search
    if (form.tipo === 'kit') params.para_kit = 1
    return params
  }

  async function cargarProductosOpts (search = '') {
    loadingProductos.value = true
    try {
      const res = await bodegaService.getProductos(paramsProductos(search))
      productosOpts.value = res.data?.data || res.data || []
    } finally {
      loadingProductos.value = false
    }
  }

  let searchProductoTimer = null
  function buscarProducto (q) {
    clearTimeout(searchProductoTimer)
    searchProductoTimer = setTimeout(() => {
      cargarProductosOpts((q || '').trim())
    }, 300)
  }

  async function onDraftProducto (id) {
    draft.variante_id = null
    draftVariantes.value = []
    draft.nombre = ''
    if (!id) return
    const prod = productosOpts.value.find(p => p.id === id)
    draft.nombre = prod?.nombre || ''
    const res = await bodegaService.getProducto(id)
    const full = res.data?.producto || res.data
    draft.nombre = full?.nombre || draft.nombre
    draftVariantes.value = (full?.variantes || []).map(v => ({
      ...v,
      etiqueta: `${v.etiqueta} (stock ${v.existencia})`,
    }))
    if (draftVariantes.value.length === 1) {
      draft.variante_id = draftVariantes.value[0].id
    }
  }

  watch(() => draft.variante_id, id => {
    if (!id) return
    const variante = draftVariantes.value.find(v => v.id === id)
    if (variante) {
      draft.precio_unitario = precioSugerido(variante)
    }
  })

  function onItemVariante (row) {
    const variante = (row.variantes || []).find(v => v.id === row.variante_id)
    if (!variante) return
    row.etiqueta = variante.etiqueta?.replace(/\s*\(stock.*\)$/, '') || variante.etiqueta
    row.existencia = variante.existencia
    row.precio_unitario = precioSugerido(variante)
  }

  async function aplicarCombo (id) {
    if (!id) return
    let kit = kits.value.find(k => k.id === id)
    if (!kit?.items?.length) {
      const res = await bodegaService.getKit(id)
      kit = res.data
    }
    form.items = []
    for (const item of kit.items || []) {
      const prod = item.producto
      if (!prod) continue
      const variantes = (prod.variantes || []).map(v => ({
        ...v,
        etiqueta: `${v.etiqueta} (stock ${v.existencia})`,
      }))
      const unica = variantes.length === 1 ? variantes[0] : null
      form.items.push({
        producto_id: prod.id,
        variante_id: unica?.id || null,
        cantidad: item.cantidad || 1,
        precio_unitario: unica ? precioSugerido(unica) : Number(prod.precio_venta || 0),
        nombre: productoLabel(prod),
        etiqueta: unica ? unica.etiqueta : 'Elegir talla / condición',
        existencia: unica?.existencia || 0,
        variantes,
        fromCombo: true,
      })
    }
  }

  function buildItemFromDraft (requirePrice) {
    itemError.value = ''
    const variante = draftVariantes.value.find(v => v.id === draft.variante_id)
    if (!draft.variante_id || !variante) {
      itemError.value = 'Selecciona producto y variante.'
      return null
    }
    const cantidad = Number(draft.cantidad) || 0
    if (cantidad < 1) {
      itemError.value = 'La cantidad debe ser al menos 1.'
      return null
    }
    if (cantidad > Number(variante.existencia || 0)) {
      itemError.value = `Stock insuficiente. Disponible: ${variante.existencia}.`
      return null
    }
    if (requirePrice && Number(draft.precio_unitario) <= 0) {
      itemError.value = 'Indica el monto a cobrar.'
      return null
    }
    return {
      variante_id: draft.variante_id,
      cantidad,
      precio_unitario: requirePrice ? Number(draft.precio_unitario) : 0,
      nombre: draft.nombre || 'Producto',
      etiqueta: variante.etiqueta?.replace(/\s*\(stock.*\)$/, '') || variante.etiqueta,
      existencia: variante.existencia,
    }
  }

  function agregarItemKit () {
    const item = buildItemFromDraft(!!form.a_cuotas)
    if (!item) return
    const ya = form.items.findIndex(i => i.variante_id === item.variante_id)
    if (ya >= 0) {
      const nuevaCant = form.items[ya].cantidad + item.cantidad
      if (nuevaCant > item.existencia) {
        itemError.value = `Stock insuficiente al acumular. Disponible: ${item.existencia}.`
        return
      }
      form.items[ya].cantidad = nuevaCant
    } else {
      form.items.push(item)
    }
    draft.variante_id = null
    draft.cantidad = 1
  }

  function quitarItem (idx) {
    form.items.splice(idx, 1)
  }

  async function abrirDialog (tipo) {
    form.tipo = tipo
    form.personal_id = null
    form.personal_operaciones_id = null
    form.via_operaciones = false
    form.cambio_por_dano = false
    form.fecha_entrega = localDate()
    form.motivo_reposicion = null
    form.cobrar = tipo === 'kit'
    form.a_cuotas = true
    form.observaciones = ''
    form.items = []
    form.cuotas_totales = tipo === 'reposicion' ? 2 : 10
    form.fecha_inicio_descuento = localDate()
    form.descripcion_descuento = ''
    draft.producto_id = null
    draft.variante_id = null
    draft.cantidad = 1
    draft.precio_unitario = 0
    draft.nombre = ''
    draftVariantes.value = []
    kitId.value = null
    itemError.value = ''

    dialogKit.value = tipo === 'kit'
    dialogReposicion.value = tipo === 'reposicion'
    dialogSimple.value = tipo === 'simple'

    loadingPersonal.value = true
    try {
      const [pers, kitsRes] = await Promise.all([
        personalService.getAll({ per_page: 30, estado: 'activo', sort_by: 'apellidos', sort_order: 'asc', directorio: 1 }),
        bodegaService.getKits(),
        cargarProductosOpts(),
      ])
      personalOpts.value = mapPersonal(pers?.data || [])
      kits.value = kitsRes?.data || []
    } finally {
      loadingPersonal.value = false
    }
  }

  async function guardar () {
    itemError.value = ''

    if (form.tipo === 'kit') {
      if (!puedeGuardarKit.value) return
      form.cobrar = !!form.a_cuotas
    } else if (form.tipo === 'reposicion') {
      if (!puedeGuardarReposicion.value) return
      const item = buildItemFromDraft(form.cobrar)
      if (!item) return
      form.items = [item]
    } else {
      if (!puedeGuardarSimple.value) return
      form.cobrar = false
      const item = buildItemFromDraft(false)
      if (!item) return
      form.items = [item]
    }

    for (const it of form.items) {
      if (it.cantidad > it.existencia) {
        snackbar.text = `Stock insuficiente en ${it.nombre}. Disponible: ${it.existencia}.`
        snackbar.color = 'error'
        snackbar.show = true
        return
      }
    }

    saving.value = true
    try {
      const payload = {
        personal_id: form.personal_id,
        personal_operaciones_id: form.via_operaciones ? form.personal_operaciones_id : null,
        tipo: form.tipo,
        cobrar: form.cobrar,
        motivo_reposicion: form.tipo === 'reposicion' ? form.motivo_reposicion : null,
        cambio_por_dano: form.tipo === 'reposicion' && form.cambio_por_dano,
        variante_entrada_dano_id: form.tipo === 'reposicion' && form.cambio_por_dano
          ? (form.items[0]?.variante_id || null)
          : null,
        cantidad_entrada_dano: 1,
        observaciones: form.observaciones || null,
        fecha_entrega: form.fecha_entrega,
        items: form.items.map(it => ({
          variante_id: it.variante_id,
          cantidad: it.cantidad,
          precio_unitario: form.cobrar ? Number(it.precio_unitario) : 0,
        })),
      }
      if (form.cobrar && (form.tipo !== 'kit' || form.a_cuotas)) {
        payload.descuento = {
          cuotas_totales: Number(form.cuotas_totales),
          fecha_inicio: form.fecha_inicio_descuento || form.fecha_entrega,
          descripcion: form.descripcion_descuento || undefined,
        }
      }

      const res = await bodegaService.crearEntrega(payload)
      dialogKit.value = false
      dialogReposicion.value = false
      dialogSimple.value = false
      await cargar()
      const boleta = res.data?.numero_boleta
      snackbar.color = 'success'
      snackbar.text = form.cobrar && res.grupo_uniforme
        ? `Registrado. Boleta ${boleta || ''}. Descuento en ${form.cuotas_totales} cuotas creado.`
        : form.tipo === 'kit' && !form.a_cuotas
          ? `Kit registrado${boleta ? ' · boleta ' + boleta : ''} sin descuento en planilla.`
          : `Entrega registrada${boleta ? ' · boleta ' + boleta : ''}.`
      snackbar.show = true
      if (res.data?.id) {
        abrirVistaPreviaBoleta(res.data)
      }
    } catch (e) {
      snackbar.color = 'error'
      snackbar.text = e.apiMessage || 'No se pudo registrar la entrega'
      snackbar.show = true
    } finally {
      saving.value = false
    }
  }

  function revocarPreview () {
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value)
      previewUrl.value = ''
    }
  }

  function cerrarVistaPrevia () {
    dialogBoleta.value = false
    revocarPreview()
  }

  function onCerrarVistaPrevia (abierto) {
    if (!abierto) revocarPreview()
  }

  async function abrirVistaPreviaBoleta (item) {
    if (!item?.id) return
    previewNumero.value = item.numero_boleta || String(item.id)
    dialogBoleta.value = true
    loadingBoleta.value = true
    revocarPreview()
    try {
      const control = item.devuelta_at ? 'entrada' : 'salida'
      const response = await bodegaService.downloadBoleta(item.id, { control })
      const blob = new Blob([response.data], { type: 'application/pdf' })
      previewUrl.value = URL.createObjectURL(blob)
    } catch (e) {
      dialogBoleta.value = false
      snackbar.color = 'error'
      snackbar.text = e.apiMessage || 'No se pudo generar la boleta'
      snackbar.show = true
    } finally {
      loadingBoleta.value = false
    }
  }

  function descargarBoletaPreview () {
    if (!previewUrl.value) return
    const link = document.createElement('a')
    link.href = previewUrl.value
    link.download = `BOLETA-BODEGA-${previewNumero.value}.pdf`
    link.click()
  }

  function imprimirBoletaPreview () {
    if (!previewUrl.value) return
    window.open(previewUrl.value, '_blank', 'noopener')
  }

  async function devolverBoleta (item) {
    const numero = item.numero_boleta || item.id
    if (!confirm(`¿Registrar devolución de la boleta ${numero}? El equipo vuelve a bodega y la boleta queda como guía de entrada.`)) {
      return
    }
    devolviendoId.value = item.id
    try {
      const res = await bodegaService.devolverEntrega(item.id)
      snackbar.color = 'success'
      snackbar.text = res.message || 'Devolución registrada.'
      snackbar.show = true
      await cargar()
    } catch (e) {
      snackbar.color = 'error'
      snackbar.text = e.apiMessage || 'No se pudo registrar la devolución'
      snackbar.show = true
    } finally {
      devolviendoId.value = null
    }
  }

  onMounted(cargar)
  onUnmounted(revocarPreview)
</script>

<style scoped>
.boleta-preview {
  width: 100%;
  height: min(78vh, 820px);
  border: 0;
  background: #fff;
}
</style>
