<template>
  <div>
    <!-- Préstamo Activo -->
    <v-card v-if="prestamoActivo" class="mb-6" elevation="2" rounded="xl">
      <v-card-title class="d-flex align-center bg-success-lighten-5 py-4 px-6">
        <v-icon color="success" start>mdi-cash-check</v-icon>
        <span class="text-subtitle-1 font-weight-bold">Préstamo Activo</span>
        <v-spacer />
        <v-chip color="success" size="small" variant="flat">
          <v-icon size="14" start>mdi-check-circle</v-icon>
          Activo
        </v-chip>
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-6">
        <v-row>
          <v-col cols="12" md="6">
            <v-list density="compact">
              <v-list-item>
                <v-list-item-subtitle class="text-caption">Monto Total</v-list-item-subtitle>
                <v-list-item-title class="text-h5 font-weight-bold text-primary">
                  Q{{ formatNumber(prestamoActivo.monto_total) }}
                </v-list-item-title>
              </v-list-item>
              <v-divider class="my-2" />
              <v-list-item>
                <v-list-item-subtitle class="text-caption">Saldo Pendiente</v-list-item-subtitle>
                <v-list-item-title class="text-h5 font-weight-bold text-error">
                  Q{{ formatNumber(prestamoActivo.saldo_pendiente) }}
                </v-list-item-title>
              </v-list-item>
              <v-divider class="my-2" />
              <v-list-item>
                <v-list-item-subtitle class="text-caption">Fecha del Préstamo</v-list-item-subtitle>
                <v-list-item-title>{{ formatDate(prestamoActivo.fecha_prestamo) }}</v-list-item-title>
              </v-list-item>
              <v-divider class="my-2" />
              <v-list-item>
                <v-list-item-subtitle class="text-caption">Fecha Primer Pago</v-list-item-subtitle>
                <v-list-item-title>{{ formatDate(prestamoActivo.fecha_primer_pago) }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-col>
          <v-col cols="12" md="6">
            <div class="mb-4">
              <div class="d-flex justify-space-between mb-2">
                <span class="text-caption">Progreso de Pago</span>
                <span class="text-caption font-weight-bold">{{ porcentajePagado }}%</span>
              </div>
              <v-progress-linear
                color="success"
                height="25"
                :model-value="porcentajePagado"
                rounded
              >
                <template #default>
                  <span class="text-white font-weight-bold text-caption">
                    {{ prestamoActivo.cuotas_pagadas || 0 }}/{{ prestamoActivo.cuotas_totales || 0 }} cuotas
                  </span>
                </template>
              </v-progress-linear>
            </div>

            <div class="d-flex ga-2">
              <v-btn
                v-if="!readonly"
                block
                color="primary"
                variant="elevated"
                @click="dialogAbono = true"
              >
                <v-icon start>mdi-cash-plus</v-icon>
                Abonar al Préstamo
              </v-btn>
              <v-btn
                color="info"
                variant="tonal"
                @click="verHistorialPrestamo(prestamoActivo)"
              >
                <v-icon>mdi-history</v-icon>
              </v-btn>
              <v-btn
                v-if="!readonly"
                color="warning"
                variant="tonal"
                @click="cancelarPrestamo(prestamoActivo)"
              >
                <v-icon>mdi-close-circle</v-icon>
              </v-btn>
              <v-btn
                v-if="isAdmin && !readonly"
                color="error"
                variant="tonal"
                @click="abrirEliminarPrestamo(prestamoActivo)"
              >
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Formulario de Solicitud de Préstamo -->
    <v-card v-if="!prestamoActivo && !readonly" class="mb-6" elevation="2" rounded="xl">
      <v-card-title class="d-flex align-center bg-grey-lighten-5 py-4 px-6">
        <v-icon color="primary" start>mdi-currency-usd</v-icon>
        <span class="text-subtitle-1 font-weight-bold">Solicitar Préstamo</span>
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-6">
        <v-form ref="formRef" @submit.prevent="solicitarPrestamo">
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="formPrestamo.monto_total"
                density="comfortable"
                :error-messages="errorsPrestamo.monto_total"
                label="Monto Total *"
                min="1"
                prefix="Q"
                prepend-inner-icon="mdi-currency-usd"
                step="0.01"
                type="number"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="formPrestamo.cuotas_totales"
                density="comfortable"
                :error-messages="errorsPrestamo.cuotas_totales"
                label="Número de Cuotas *"
                min="1"
                prepend-inner-icon="mdi-numeric"
                type="number"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="formPrestamo.tasa_interes"
                density="comfortable"
                :error-messages="errorsPrestamo.tasa_interes"
                label="Tasa de Interés (%)"
                max="100"
                min="0"
                prepend-inner-icon="mdi-percent"
                step="0.01"
                suffix="%"
                type="number"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="formPrestamo.monto_cuota"
                density="comfortable"
                :error-messages="errorsPrestamo.monto_cuota"
                hint="Calculado automáticamente"
                label="Monto por Cuota"
                min="0"
                persistent-hint
                prefix="Q"
                prepend-inner-icon="mdi-cash"
                readonly
                step="0.01"
                type="number"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="formPrestamo.fecha_prestamo"
                density="comfortable"
                :error-messages="errorsPrestamo.fecha_prestamo"
                label="Fecha del Préstamo"
                prepend-inner-icon="mdi-calendar"
                type="date"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="formPrestamo.fecha_primer_pago"
                density="comfortable"
                :error-messages="errorsPrestamo.fecha_primer_pago"
                label="Fecha Primer Pago *"
                prepend-inner-icon="mdi-calendar-check"
                type="date"
                variant="outlined"
              />
            </v-col>

            <v-col v-if="desglosePrestamo.length" cols="12">
              <v-alert class="mb-2" density="compact" type="info" variant="tonal">
                Puedes dejar todas las cuotas iguales o cambiar montos. Suma:
                Q{{ formatNumber(sumaDesglosePrestamo) }} / Total a pagar Q{{ formatNumber(totalPagarPrestamo) }}
              </v-alert>
              <v-table density="compact">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Fecha</th>
                    <th class="text-right">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(c, idx) in desglosePrestamo" :key="idx">
                    <td>{{ idx + 1 }}</td>
                    <td>{{ c.fecha }}</td>
                    <td style="max-width: 160px;">
                      <v-text-field
                        v-model.number="c.monto"
                        density="compact"
                        hide-details
                        min="0.01"
                        prefix="Q"
                        step="0.01"
                        type="number"
                        variant="outlined"
                      />
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-col>

            <v-col cols="12" md="6">
              <v-textarea
                v-model="formPrestamo.observaciones"
                counter="1000"
                density="comfortable"
                :error-messages="errorsPrestamo.observaciones"
                label="Observaciones"
                prepend-inner-icon="mdi-text"
                rows="3"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-file-input
                v-model="comprobanteFile"
                accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx"
                clearable
                density="comfortable"
                hint="Opcional · máx. 10 MB"
                label="Comprobante"
                persistent-hint
                prepend-icon=""
                prepend-inner-icon="mdi-paperclip"
                variant="outlined"
              />
            </v-col>
          </v-row>

          <v-alert
            v-if="errorMessagePrestamo"
            class="mt-4"
            closable
            density="compact"
            type="error"
            variant="tonal"
            @click:close="errorMessagePrestamo = null"
          >
            {{ errorMessagePrestamo }}
          </v-alert>

          <div class="d-flex justify-end mt-4 ga-2">
            <v-btn
              variant="text"
              @click="resetFormPrestamo"
            >
              Limpiar
            </v-btn>
            <v-btn
              color="primary"
              :loading="savingPrestamo"
              type="submit"
              variant="elevated"
            >
              <v-icon start>mdi-content-save</v-icon>
              Solicitar Préstamo
            </v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>

    <!-- Historial de Préstamos -->
    <v-card elevation="2" rounded="xl">
      <v-card-title class="d-flex align-center py-4 px-6">
        <v-icon color="primary" start>mdi-history</v-icon>
        <span class="text-subtitle-1 font-weight-bold">Historial de Préstamos</span>
        <v-spacer />
        <v-chip v-if="prestamos.length > 0" color="primary" size="small">
          {{ prestamos.length }} registros
        </v-chip>
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-0">
        <v-data-table
          density="comfortable"
          :headers="headersPrestamos"
          :items="prestamos"
          :items-per-page="10"
          :loading="loading"
        >
          <!-- Monto Total -->
          <template #item.monto_total="{ item }">
            <span class="font-weight-bold">Q{{ formatNumber(item.monto_total) }}</span>
          </template>

          <!-- Saldo Pendiente -->
          <template #item.saldo_pendiente="{ item }">
            <span class="font-weight-bold" :class="item.saldo_pendiente > 0 ? 'text-error' : 'text-success'">
              Q{{ formatNumber(item.saldo_pendiente) }}
            </span>
          </template>

          <!-- Progreso - Oculto temporalmente -->
          <!--
          <template #item.progreso="{ item }">
            <div style="min-width: 150px;">
              <v-progress-linear
                :color="item.saldo_pendiente === 0 ? 'success' : 'primary'"
                height="20"
                :model-value="calcularPorcentajePagado(item)"
                rounded
              >
                <template #default>
                  <span class="text-white text-caption font-weight-bold">
                    {{ calcularPorcentajePagado(item) }}%
                  </span>
                </template>
              </v-progress-linear>
            </div>
          </template>
          -->

          <!-- Fecha -->
          <template #item.fecha="{ item }">
            {{ formatDate(item.fecha_prestamo) }}
          </template>

          <!-- Primer pago -->
          <template #item.fecha_primer_pago="{ item }">
            {{ formatDate(item.fecha_primer_pago) }}
          </template>

          <!-- Estado -->
          <template #item.estado="{ item }">
            <v-chip
              :color="getEstadoPrestamoColor(item.estado_prestamo)"
              size="small"
              variant="flat"
            >
              {{ getEstadoPrestamoLabel(item.estado_prestamo) }}
            </v-chip>
          </template>

          <!-- Comprobante -->
          <template #item.comprobante="{ item }">
            <v-tooltip v-if="item.comprobante_nombre_original" location="top" text="Ver comprobante">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  color="secondary"
                  icon="mdi-paperclip"
                  :loading="loadingComprobanteId === item.id"
                  size="small"
                  variant="tonal"
                  @click="verComprobantePrestamo(item.id)"
                />
              </template>
            </v-tooltip>
            <span v-else class="text-medium-emphasis">—</span>
          </template>

          <!-- Acciones -->
          <template #item.acciones="{ item }">
            <div class="d-flex ga-1">
              <v-tooltip location="top" text="Ver historial de pagos">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    color="info"
                    icon="mdi-history"
                    size="small"
                    variant="tonal"
                    @click="verHistorialPrestamo(item)"
                  />
                </template>
              </v-tooltip>
              <v-tooltip v-if="!readonly && item.comprobante_nombre_original" location="top" text="Eliminar comprobante">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    color="warning"
                    icon="mdi-paperclip-off"
                    size="small"
                    variant="tonal"
                    @click="eliminarComprobantePrestamo(item)"
                  />
                </template>
              </v-tooltip>
              <v-tooltip v-if="isAdmin && !readonly" location="top" text="Eliminar (admin)">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    color="error"
                    icon="mdi-delete"
                    size="small"
                    variant="tonal"
                    @click="abrirEliminarPrestamo(item)"
                  />
                </template>
              </v-tooltip>
            </div>
          </template>

          <!-- No data -->
          <template #no-data>
            <div class="text-center py-10">
              <v-avatar class="mb-3" color="grey-lighten-3" size="64">
                <v-icon color="grey-lighten-1" size="36">mdi-currency-usd</v-icon>
              </v-avatar>
              <p class="text-body-1 text-medium-emphasis mb-0">No hay préstamos registrados</p>
            </div>
          </template>

          <!-- Loading -->
          <template #loading>
            <v-skeleton-loader type="table-row@5" />
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Dialog Abonar -->
    <v-dialog v-model="dialogAbono" max-width="500" persistent>
      <v-card rounded="xl">
        <v-card-title class="bg-primary pa-4">
          <v-icon color="white" start>mdi-cash-plus</v-icon>
          <span class="text-white">Abonar al Préstamo</span>
        </v-card-title>
        <v-card-text class="pa-6">
          <v-alert class="mb-4" density="compact" type="info" variant="tonal">
            <div class="text-caption">
              <div>Saldo Pendiente: <strong>Q{{ formatNumber(prestamoActivo?.saldo_pendiente || 0) }}</strong></div>
            </div>
          </v-alert>

          <v-text-field
            v-model.number="formAbono.monto"
            autofocus
            density="comfortable"
            :error-messages="errorsAbono.monto"
            label="Monto del Abono *"
            :max="prestamoActivo?.saldo_pendiente"
            min="0.01"
            prefix="Q"
            prepend-inner-icon="mdi-currency-usd"
            step="0.01"
            type="number"
            variant="outlined"
          />

          <v-textarea
            v-model="formAbono.descripcion"
            density="comfortable"
            :error-messages="errorsAbono.descripcion"
            label="Descripción *"
            prepend-inner-icon="mdi-text"
            rows="3"
            variant="outlined"
          />

          <v-alert
            v-if="errorMessageAbono"
            class="mt-4"
            closable
            density="compact"
            type="error"
            variant="tonal"
            @click:close="errorMessageAbono = null"
          >
            {{ errorMessageAbono }}
          </v-alert>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="cerrarDialogAbono">Cancelar</v-btn>
          <v-btn
            color="primary"
            :loading="savingAbono"
            variant="elevated"
            @click="guardarAbono"
          >
            <v-icon start>mdi-content-save</v-icon>
            Guardar Abono
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Historial de Pagos -->
    <v-dialog v-model="dialogHistorial" max-width="800">
      <v-card v-if="prestamoSeleccionado" rounded="xl">
        <v-card-title class="bg-info pa-4">
          <v-icon color="white" start>mdi-history</v-icon>
          <span class="text-white">Historial de Pagos</span>
        </v-card-title>
        <v-card-text class="pa-6">
          <div class="mb-4">
            <v-row>
              <v-col cols="6">
                <div class="text-caption text-medium-emphasis">Monto Total</div>
                <div class="text-h6 font-weight-bold">Q{{ formatNumber(prestamoSeleccionado.monto_total) }}</div>
              </v-col>
              <v-col cols="6">
                <div class="text-caption text-medium-emphasis">Saldo Pendiente</div>
                <div class="text-h6 font-weight-bold text-error">Q{{ formatNumber(prestamoSeleccionado.saldo_pendiente) }}</div>
              </v-col>
            </v-row>
          </div>

          <v-divider class="my-4" />

          <v-data-table
            density="compact"
            :headers="headersHistorial"
            :items="historialPagos"
            :items-per-page="5"
            :loading="loadingHistorial"
          >
            <template #item.monto="{ item }">
              <span class="font-weight-bold text-success">Q{{ formatNumber(item.monto) }}</span>
            </template>

            <template #item.fecha="{ item }">
              {{ formatDate(item.fecha_transaccion) }}
            </template>

            <template #no-data>
              <div class="text-center py-6">
                <p class="text-body-2 text-medium-emphasis">No hay pagos registrados</p>
              </div>
            </template>
          </v-data-table>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="dialogHistorial = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Eliminar préstamo (admin) -->
    <v-dialog v-model="dialogEliminar" max-width="480" persistent>
      <v-card rounded="xl">
        <v-card-title class="bg-error pa-4">
          <v-icon color="white" start>mdi-delete-alert</v-icon>
          <span class="text-white">Eliminar préstamo</span>
        </v-card-title>
        <v-card-text class="pa-6">
          <v-alert class="mb-4" density="compact" type="warning" variant="tonal">
            Esta acción elimina el préstamo y sus cuotas/abonos de forma permanente. Confirme para continuar.
          </v-alert>
          <v-text-field
            v-model="confirmacionEliminar"
            density="comfortable"
            label="Confirmación"
            placeholder="Confirmación"
            variant="outlined"
          />
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="cerrarEliminarPrestamo">Cancelar</v-btn>
          <v-btn
            color="error"
            :disabled="confirmacionEliminar.toUpperCase() !== 'ELIMINAR'"
            :loading="savingEliminar"
            variant="elevated"
            @click="confirmarEliminarPrestamo"
          >
            Eliminar
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
  </div>
</template>

<script setup>
  import { format } from 'date-fns'
  import { es } from 'date-fns/locale'
  import { computed, onMounted, reactive, ref, watch } from 'vue'
  import operacionesService from '@/services/operacionesService'
  import { useAuthStore } from '@/stores/auth'

  const props = defineProps({
    personalId: {
      type: Number,
      required: true,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
  })

  const emit = defineEmits(['saved', 'error'])
  const authStore = useAuthStore()
  const isAdmin = computed(() => authStore.userRole?.includes('admin') || authStore.hasPermission?.('manage-roles'))

  // Estado
  const loading = ref(false)
  const savingPrestamo = ref(false)
  const savingAbono = ref(false)
  const loadingHistorial = ref(false)
  const prestamos = ref([])
  const prestamoActivo = computed(() => prestamos.value.find(p => p.estado_prestamo === 'activo'))
  const formRef = ref(null)
  const comprobanteFile = ref(null)
  const loadingComprobanteId = ref(null)

  // Dialogs
  const dialogAbono = ref(false)
  const dialogHistorial = ref(false)
  const dialogEliminar = ref(false)
  const prestamoSeleccionado = ref(null)
  const prestamoAEliminar = ref(null)
  const confirmacionEliminar = ref('')
  const savingEliminar = ref(false)
  const historialPagos = ref([])
  const desglosePrestamo = ref([])

  // Formulario Préstamo
  const formPrestamo = reactive({
    monto_total: null,
    cuotas_totales: null,
    tasa_interes: 0,
    monto_cuota: null,
    fecha_prestamo: new Date().toISOString().split('T')[0],
    fecha_primer_pago: new Date().toISOString().split('T')[0],
    observaciones: '',
  })

  const totalPagarPrestamo = computed(() => {
    const monto = Number(formPrestamo.monto_total || 0)
    const tasa = Number(formPrestamo.tasa_interes || 0)
    return Math.round((monto * (1 + tasa / 100)) * 100) / 100
  })

  const sumaDesglosePrestamo = computed(() =>
    Math.round((desglosePrestamo.value || []).reduce((s, c) => s + (Number(c.monto) || 0), 0) * 100) / 100
  )

  // Calcular cuota automáticamente
  watch(
    () => [formPrestamo.monto_total, formPrestamo.cuotas_totales, formPrestamo.tasa_interes, formPrestamo.fecha_primer_pago],
    ([monto, cuotas, tasa, fechaInicio]) => {
      if (!monto || !cuotas || cuotas < 1) {
        formPrestamo.monto_cuota = null
        desglosePrestamo.value = []
        return
      }

      const montoPrincipal = Number.parseFloat(monto)
      const numCuotas = Number.parseInt(cuotas)
      const porcentajeInteres = Number.parseFloat(tasa || 0)
      const totalInteres = montoPrincipal * (porcentajeInteres / 100)
      const totalPagar = montoPrincipal + totalInteres
      const cuota = Math.round((totalPagar / numCuotas) * 100) / 100
      formPrestamo.monto_cuota = cuota

      const items = []
      let fecha = fechaInicio ? new Date(fechaInicio + 'T12:00:00') : new Date()
      let acumulado = 0
      for (let i = 0; i < numCuotas; i++) {
        const m = i === numCuotas - 1
          ? Math.round((totalPagar - acumulado) * 100) / 100
          : cuota
        acumulado += m
        const y = fecha.getFullYear()
        const mo = String(fecha.getMonth() + 1).padStart(2, '0')
        const d = String(fecha.getDate()).padStart(2, '0')
        items.push({ fecha: `${y}-${mo}-${d}`, monto: m })
        fecha = new Date(fecha.getFullYear(), fecha.getMonth() + 1, fecha.getDate())
      }
      desglosePrestamo.value = items
    },
  )

  const errorsPrestamo = reactive({
    monto_total: [],
    cuotas_totales: [],
    tasa_interes: [],
    monto_cuota: [],
    fecha_prestamo: [],
    fecha_primer_pago: [],
    observaciones: [],
  })

  const errorMessagePrestamo = ref(null)

  // Formulario Abono
  const formAbono = reactive({
    monto: null,
    descripcion: '',
  })

  const errorsAbono = reactive({
    monto: [],
    descripcion: [],
  })

  const errorMessageAbono = ref(null)

  // Snackbar
  const snackbar = reactive({
    show: false,
    text: '',
    color: 'success',
  })

  // Headers
  const headersPrestamos = [
    { title: 'Monto Total', key: 'monto_total', sortable: true },
    { title: 'Saldo Pendiente', key: 'saldo_pendiente', sortable: true },
    { title: 'Fecha', key: 'fecha', sortable: true },
    { title: 'Primer pago', key: 'fecha_primer_pago', sortable: true },
    { title: 'Estado', key: 'estado', sortable: true },
    { title: 'Comp.', key: 'comprobante', sortable: false, align: 'center', width: '60px' },
    { title: 'Acciones', key: 'acciones', sortable: false, align: 'center', width: '140px' },
  ]

  const headersHistorial = [
    { title: 'Fecha', key: 'fecha', sortable: true },
    { title: 'Monto', key: 'monto', sortable: true },
    { title: 'Descripción', key: 'descripcion', sortable: false },
  ]

  // Computed
  const porcentajePagado = computed(() => {
    if (!prestamoActivo.value) return 0
    return calcularPorcentajePagado(prestamoActivo.value)
  })

  // Funciones
  async function cargarPrestamos () {
    loading.value = true
    try {
      const response = await operacionesService.getPrestamos({ personal_id: props.personalId })
      prestamos.value = response.data || []
    } catch (error) {
      console.error('Error cargando préstamos:', error)
      showSnackbar('Error al cargar los préstamos', 'error')
    } finally {
      loading.value = false
    }
  }

  async function solicitarPrestamo () {
    // Limpiar errores
    for (const key of Object.keys(errorsPrestamo)) errorsPrestamo[key] = []
    errorMessagePrestamo.value = null

    // Validaciones
    if (!formPrestamo.monto_total || formPrestamo.monto_total <= 0) {
      errorsPrestamo.monto_total = ['El monto debe ser mayor a 0']
      return
    }
    if (!formPrestamo.cuotas_totales || formPrestamo.cuotas_totales < 1) {
      errorsPrestamo.cuotas_totales = ['Debe tener al menos 1 cuota']
      return
    }
    if (!formPrestamo.fecha_primer_pago) {
      errorsPrestamo.fecha_primer_pago = ['La fecha del primer pago es obligatoria']
      return
    }
    if (desglosePrestamo.value.length && Math.abs(sumaDesglosePrestamo.value - totalPagarPrestamo.value) > 0.05) {
      errorMessagePrestamo.value = 'La suma de las cuotas debe coincidir con el total a pagar.'
      return
    }

    savingPrestamo.value = true
    try {
      const data = {
        personal_id: props.personalId,
        ...formPrestamo,
        cuotas_montos: desglosePrestamo.value.map(c => Number(c.monto)),
        comprobante: comprobanteFile.value || undefined,
      }

      await operacionesService.crearPrestamo(data)

      showSnackbar('Préstamo solicitado exitosamente', 'success')
      resetFormPrestamo()
      await cargarPrestamos()
      emit('saved')
    } catch (error) {
      console.error('Error solicitando préstamo:', error)

      if (error.apiErrors) {
        for (const key of Object.keys(error.apiErrors)) {
          if (errorsPrestamo[key] !== undefined) {
            errorsPrestamo[key] = error.apiErrors[key]
          }
        }
      }

      errorMessagePrestamo.value = error.apiMessage || 'Error al solicitar el préstamo'
      emit('error', errorMessagePrestamo.value)
    } finally {
      savingPrestamo.value = false
    }
  }

  async function guardarAbono () {
    // Limpiar errores
    for (const key of Object.keys(errorsAbono)) errorsAbono[key] = []
    errorMessageAbono.value = null

    // Validaciones
    if (!formAbono.monto || formAbono.monto <= 0) {
      errorsAbono.monto = ['El monto debe ser mayor a 0']
      return
    }
    if (formAbono.monto > prestamoActivo.value.saldo_pendiente) {
      errorsAbono.monto = ['El monto no puede ser mayor al saldo pendiente']
      return
    }
    if (!formAbono.descripcion || formAbono.descripcion.length < 10) {
      errorsAbono.descripcion = ['La descripción debe tener al menos 10 caracteres']
      return
    }

    savingAbono.value = true
    try {
      const data = {
        personal_id: props.personalId,
        tipo_transaccion: 'abono_prestamo',
        monto: formAbono.monto,
        descripcion: formAbono.descripcion,
        prestamo_id: prestamoActivo.value.id,
        fecha_transaccion: new Date().toISOString().split('T')[0],
      }

      await operacionesService.crearTransaccion(data)

      showSnackbar('Abono registrado exitosamente', 'success')
      cerrarDialogAbono()
      await cargarPrestamos()
      emit('saved')
    } catch (error) {
      console.error('Error guardando abono:', error)

      if (error.apiErrors) {
        for (const key of Object.keys(error.apiErrors)) {
          if (errorsAbono[key] !== undefined) {
            errorsAbono[key] = error.apiErrors[key]
          }
        }
      }

      errorMessageAbono.value = error.apiMessage || 'Error al guardar el abono'
    } finally {
      savingAbono.value = false
    }
  }

  async function verHistorialPrestamo (prestamo) {
    prestamoSeleccionado.value = prestamo
    dialogHistorial.value = true
    loadingHistorial.value = true

    try {
      const response = await operacionesService.getHistorialPrestamo(prestamo.id)
      historialPagos.value = response.data?.transacciones || []
    } catch (error) {
      console.error('Error cargando historial:', error)
      showSnackbar('Error al cargar el historial de pagos', 'error')
    } finally {
      loadingHistorial.value = false
    }
  }

  async function cancelarPrestamo (prestamo) {
    if (!confirm('¿Está seguro de cancelar este préstamo?')) return

    try {
      await operacionesService.cancelarPrestamo(prestamo.id)
      showSnackbar('Préstamo cancelado exitosamente', 'success')
      await cargarPrestamos()
    } catch (error) {
      console.error('Error cancelando préstamo:', error)
      showSnackbar(error.apiMessage || 'Error al cancelar el préstamo', 'error')
    }
  }

  function abrirEliminarPrestamo (prestamo) {
    prestamoAEliminar.value = prestamo
    confirmacionEliminar.value = ''
    dialogEliminar.value = true
  }

  function cerrarEliminarPrestamo () {
    dialogEliminar.value = false
    prestamoAEliminar.value = null
    confirmacionEliminar.value = ''
  }

  async function confirmarEliminarPrestamo () {
    if (!prestamoAEliminar.value) return
    savingEliminar.value = true
    try {
      await operacionesService.eliminarPrestamo(prestamoAEliminar.value.id, confirmacionEliminar.value)
      showSnackbar('Préstamo eliminado permanentemente', 'success')
      cerrarEliminarPrestamo()
      await cargarPrestamos()
      emit('saved')
    } catch (error) {
      showSnackbar(error.apiMessage || 'Error al eliminar el préstamo', 'error')
    } finally {
      savingEliminar.value = false
    }
  }

  function resetFormPrestamo () {
    formPrestamo.monto_total = null
    formPrestamo.cuotas_totales = null
    formPrestamo.tasa_interes = 0
    formPrestamo.monto_cuota = null
    formPrestamo.fecha_prestamo = new Date().toISOString().split('T')[0]
    formPrestamo.fecha_primer_pago = new Date().toISOString().split('T')[0]
    formPrestamo.observaciones = ''
    desglosePrestamo.value = []
    comprobanteFile.value = null
    for (const key of Object.keys(errorsPrestamo)) errorsPrestamo[key] = []
    errorMessagePrestamo.value = null
  }

  async function verComprobantePrestamo (id) {
    loadingComprobanteId.value = id
    try {
      const response = await operacionesService.getComprobantePrestamo(id)
      const url = URL.createObjectURL(response.data)
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch {
      showSnackbar('Error al cargar el comprobante', 'error')
    } finally {
      loadingComprobanteId.value = null
    }
  }

  async function eliminarComprobantePrestamo (prestamo) {
    if (!confirm('¿Eliminar el comprobante adjunto?')) return
    try {
      await operacionesService.deleteComprobantePrestamo(prestamo.id)
      prestamo.comprobante_nombre_original = null
      prestamo.comprobante_ruta = null
      prestamo.comprobante_tamanio_kb = null
      showSnackbar('Comprobante eliminado', 'success')
    } catch {
      showSnackbar('Error al eliminar el comprobante', 'error')
    }
  }

  function cerrarDialogAbono () {
    dialogAbono.value = false
    formAbono.monto = null
    formAbono.descripcion = ''
    for (const key of Object.keys(errorsAbono)) errorsAbono[key] = []
    errorMessageAbono.value = null
  }

  function calcularPorcentajePagado (prestamo) {
    if (!prestamo.monto_total || prestamo.monto_total === 0) return 0
    const pagado = prestamo.monto_total - prestamo.saldo_pendiente
    return Math.round((pagado / prestamo.monto_total) * 100)
  }

  function getEstadoPrestamoLabel (estado) {
    const labels = {
      activo: 'Activo',
      pagado: 'Pagado',
      cancelado: 'Cancelado',
    }
    return labels[estado] || estado
  }

  function getEstadoPrestamoColor (estado) {
    const colors = {
      activo: 'success',
      pagado: 'info',
      cancelado: 'error',
    }
    return colors[estado] || 'grey'
  }

  function formatNumber (value) {
    return new Intl.NumberFormat('es-GT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  function formatDate (date) {
    if (!date) return '-'
    // Si ya viene con hora (ISO), usarlo directo
    if (date.includes('T')) {
      return format(new Date(date), 'dd/MM/yyyy', { locale: es })
    }
    return format(new Date(date + 'T12:00:00'), 'dd/MM/yyyy', { locale: es })
  }

  function showSnackbar (text, color = 'success') {
    snackbar.text = text
    snackbar.color = color
    snackbar.show = true
  }

  onMounted(() => {
    cargarPrestamos()
  })
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>
