<template>
  <div>
    <!-- Formulario de Nueva Transacción -->
    <v-card v-if="!readonly" class="mb-6" elevation="2" rounded="xl">
      <v-card-title class="d-flex align-center bg-grey-lighten-5 py-4 px-6">
        <v-icon color="primary" start>mdi-cash-plus</v-icon>
        <span class="text-subtitle-1 font-weight-bold">Registrar Transacción</span>
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-6">
        <v-form ref="formRef" @submit.prevent="guardarTransaccion">
          <v-row>
            <v-col cols="12" md="6">
              <v-select
                v-model="form.tipo_transaccion"
                density="comfortable"
                :error-messages="errors.tipo_transaccion"
                item-title="title"
                item-value="value"
                :items="tiposTransaccion"
                label="Tipo de Transacción *"
                prepend-inner-icon="mdi-tag"
                variant="outlined"
                @update:model-value="onTipoTransaccionChange"
              >
                <template #item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template #prepend>
                      <v-icon :color="item.raw.color">{{ item.raw.icon }}</v-icon>
                    </template>
                  </v-list-item>
                </template>
              </v-select>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="form.monto"
                density="comfortable"
                :error-messages="errors.monto"
                :label="esUniforme ? 'Precio total *' : 'Monto *'"
                min="0.01"
                prefix="Q"
                prepend-inner-icon="mdi-currency-usd"
                step="0.01"
                type="number"
                variant="outlined"
                @update:model-value="regenerarDesgloseUniforme"
              />
            </v-col>

            <v-col v-if="esUniforme" cols="12" md="6">
              <v-text-field
                v-model.number="form.cuotas_totales"
                density="comfortable"
                :error-messages="errors.cuotas_totales"
                label="Número de cuotas *"
                min="1"
                max="60"
                prepend-inner-icon="mdi-numeric"
                type="number"
                variant="outlined"
                @update:model-value="regenerarDesgloseUniforme"
              />
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="form.descripcion"
                counter="1000"
                density="comfortable"
                :error-messages="errors.descripcion"
                :label="esUniforme ? 'Descripción / concepto *' : 'Descripción *'"
                :placeholder="esUniforme ? 'Ej. Uniforme completo agente...' : 'Describa el motivo de la transacción...'"
                prepend-inner-icon="mdi-text"
                rows="3"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.fecha_transaccion"
                density="comfortable"
                :error-messages="errors.fecha_transaccion"
                :label="esUniforme ? 'Fecha inicio (1ª cuota)' : 'Fecha de Transacción'"
                prepend-inner-icon="mdi-calendar"
                type="date"
                variant="outlined"
                @update:model-value="regenerarDesgloseUniforme"
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
                prepend-inner-icon="mdi-paperclip"
                prepend-icon=""
                variant="outlined"
              />
            </v-col>

            <!-- Desglose cuotas uniforme -->
            <v-col v-if="esUniforme && desgloseUniforme.length" cols="12">
              <v-card border rounded="lg" variant="outlined">
                <v-card-title class="d-flex align-center flex-wrap ga-2 py-3 px-4 bg-info-lighten-5">
                  <v-icon color="info" start>mdi-tshirt-crew</v-icon>
                  <span class="text-subtitle-2 font-weight-bold">Descuento Uniforme Quincenal</span>
                  <v-spacer />
                  <v-chip color="info" size="small" variant="flat">
                    Q{{ formatNumber(form.monto || 0) }} · {{ desgloseUniforme.length }} cuotas
                  </v-chip>
                </v-card-title>
                <v-divider />
                <v-card-text class="pa-0">
                  <v-table density="comfortable">
                    <thead>
                      <tr>
                        <th class="text-left">#</th>
                        <th class="text-left">Fecha descuento</th>
                        <th class="text-right">Cuota</th>
                        <th class="text-right">Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="cuota in desgloseUniforme" :key="cuota.numero">
                        <td class="font-weight-medium">{{ cuota.numero }}</td>
                        <td style="min-width: 180px;">
                          <v-text-field
                            v-model="cuota.fecha_transaccion"
                            density="compact"
                            hide-details
                            type="date"
                            variant="outlined"
                          />
                        </td>
                        <td class="text-right font-weight-bold text-error">
                          Q{{ formatNumber(cuota.monto) }}
                        </td>
                        <td class="text-right" :class="cuota.saldo_despues === 0 ? 'text-success font-weight-bold' : ''">
                          Q{{ formatNumber(cuota.saldo_despues) }}
                        </td>
                      </tr>
                    </tbody>
                  </v-table>
                </v-card-text>
                <v-card-text class="pt-0 pb-3 px-4">
                  <v-alert density="compact" type="info" variant="tonal">
                    Puedes editar las fechas de cada cuota. Se descontará en la planilla del período correspondiente.
                  </v-alert>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col v-if="asistenciaId" cols="12">
              <v-alert density="compact" type="info" variant="tonal">
                <v-icon start>mdi-link-variant</v-icon>
                Esta transacción se vinculará a la asistencia del día
              </v-alert>
            </v-col>
          </v-row>

          <v-alert
            v-if="errorMessage"
            class="mt-4"
            closable
            density="compact"
            type="error"
            variant="tonal"
            @click:close="errorMessage = null"
          >
            {{ errorMessage }}
          </v-alert>

          <div class="d-flex justify-end mt-4 ga-2">
            <v-btn
              variant="text"
              @click="resetForm"
            >
              Limpiar
            </v-btn>
            <v-btn
              color="primary"
              :loading="saving"
              type="submit"
              variant="elevated"
            >
              <v-icon start>mdi-content-save</v-icon>
              Guardar Transacción
            </v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>

    <!-- Planes de uniforme activos -->
    <v-card
      v-for="plan in planesUniformeActivos"
      :key="plan.grupo_uniforme"
      class="mb-4"
      elevation="2"
      rounded="xl"
    >
      <v-card-title class="d-flex align-center flex-wrap ga-2 bg-info-lighten-5 py-4 px-6">
        <v-icon color="info" start>mdi-tshirt-crew</v-icon>
        <span class="text-subtitle-1 font-weight-bold">Plan de uniforme</span>
        <span v-if="plan.descripcion" class="text-body-2 text-medium-emphasis">· {{ plan.descripcion }}</span>
        <v-chip color="info" size="small" variant="flat">
          {{ plan.cuotas_aplicadas }}/{{ plan.cuotas_totales }} aplicadas
        </v-chip>
        <v-spacer />
        <v-btn
          v-if="!readonly"
          color="info"
          size="small"
          variant="elevated"
          @click="abrirGestionUniforme(plan.grupo_uniforme)"
        >
          <v-icon start>mdi-calendar-edit</v-icon>
          Editar fechas restantes
        </v-btn>
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-4">
        <v-row dense>
          <v-col cols="6" sm="3">
            <div class="text-caption text-medium-emphasis">Total</div>
            <div class="text-body-1 font-weight-bold">Q{{ formatNumber(plan.monto_total) }}</div>
          </v-col>
          <v-col cols="6" sm="3">
            <div class="text-caption text-medium-emphasis">Saldo pendiente</div>
            <div class="text-body-1 font-weight-bold text-error">Q{{ formatNumber(plan.saldo_pendiente) }}</div>
          </v-col>
          <v-col cols="6" sm="3">
            <div class="text-caption text-medium-emphasis">Cuotas pendientes</div>
            <div class="text-body-1 font-weight-bold">{{ plan.cuotas_pendientes }}</div>
          </v-col>
          <v-col cols="6" sm="3">
            <div class="text-caption text-medium-emphasis">Próximo descuento</div>
            <div class="text-body-1 font-weight-bold">{{ formatDate(plan.proxima_fecha) }}</div>
          </v-col>
        </v-row>
        <v-progress-linear
          class="mt-3"
          color="info"
          height="10"
          :model-value="plan.cuotas_totales ? (plan.cuotas_aplicadas / plan.cuotas_totales) * 100 : 0"
          rounded
        />
      </v-card-text>
    </v-card>

    <!-- Filtros -->
    <v-card class="mb-4" elevation="2" rounded="xl">
      <v-card-text class="pa-4">
        <v-row align="center">
          <v-col cols="12" md="4">
            <v-select
              v-model="filtros.tipo"
              clearable
              density="compact"
              item-title="title"
              item-value="value"
              :items="[{ value: null, title: 'Todos los tipos' }, ...tiposTransaccion]"
              label="Filtrar por tipo"
              variant="outlined"
              @update:model-value="cargarTransacciones"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="filtros.fecha_desde"
              density="compact"
              label="Desde"
              type="date"
              variant="outlined"
              @update:model-value="cargarTransacciones"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="filtros.fecha_hasta"
              density="compact"
              label="Hasta"
              type="date"
              variant="outlined"
              @update:model-value="cargarTransacciones"
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-btn
              block
              color="secondary"
              variant="tonal"
              @click="limpiarFiltros"
            >
              <v-icon start>mdi-filter-off</v-icon>
              Limpiar
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Tabla de Transacciones -->
    <v-card elevation="2" rounded="xl">
      <v-card-title class="d-flex align-center py-4 px-6">
        <v-icon color="primary" start>mdi-cash-multiple</v-icon>
        <span class="text-subtitle-1 font-weight-bold">Historial de Transacciones</span>
        <v-spacer />
        <v-chip v-if="transacciones.length > 0" color="primary" size="small">
          {{ transacciones.length }} registros
        </v-chip>
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-0">
        <v-data-table
          density="comfortable"
          :headers="headers"
          :items="transacciones"
          :items-per-page="10"
          :loading="loading"
        >
          <!-- Tipo -->
          <template #item.tipo="{ item }">
            <v-chip
              :color="getTipoColor(item.tipo_transaccion)"
              label
              size="small"
              variant="tonal"
            >
              <v-icon size="14" start>{{ getTipoIcon(item.tipo_transaccion) }}</v-icon>
              {{ getTipoLabel(item.tipo_transaccion) }}
              <span v-if="item.numero_cuota" class="ml-1">{{ item.numero_cuota }}/{{ item.cuotas_totales }}</span>
            </v-chip>
          </template>

          <!-- Monto -->
          <template #item.monto="{ item }">
            <span class="font-weight-bold" :class="item.es_descuento ? 'text-error' : 'text-success'">
              {{ item.es_descuento ? '-' : '+' }}Q{{ formatNumber(item.monto) }}
            </span>
          </template>

          <!-- Fecha -->
          <template #item.fecha="{ item }">
            {{ formatDate(item.fecha_transaccion) }}
          </template>

          <!-- Estado -->
          <template #item.estado="{ item }">
            <v-chip
              :color="getEstadoColor(item.estado_transaccion)"
              size="small"
              variant="flat"
            >
              {{ getEstadoLabel(item.estado_transaccion) }}
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
                  @click="verComprobanteTransaccion(item.id)"
                />
              </template>
            </v-tooltip>
            <span v-else class="text-medium-emphasis">—</span>
          </template>

          <!-- Acciones -->
          <template #item.acciones="{ item }">
            <div class="d-flex ga-1">
              <v-tooltip
                v-if="item.grupo_uniforme && item.tipo_transaccion === 'uniforme'"
                location="top"
                text="Gestionar fechas del plan"
              >
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    color="info"
                    icon="mdi-calendar-edit"
                    size="small"
                    variant="tonal"
                    @click="abrirGestionUniforme(item.grupo_uniforme)"
                  />
                </template>
              </v-tooltip>
              <v-tooltip location="top" text="Ver detalles">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    color="info"
                    icon="mdi-eye"
                    size="small"
                    variant="tonal"
                    @click="verDetalle(item)"
                  />
                </template>
              </v-tooltip>
              <v-tooltip v-if="item.estado_transaccion === 'pendiente' && !readonly" location="top" text="Cancelar">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    color="warning"
                    icon="mdi-close-circle"
                    size="small"
                    variant="tonal"
                    @click="cancelarTransaccion(item)"
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
                    @click="abrirEliminarTransaccion(item)"
                  />
                </template>
              </v-tooltip>
            </div>
          </template>

          <!-- No data -->
          <template #no-data>
            <div class="text-center py-10">
              <v-avatar class="mb-3" color="grey-lighten-3" size="64">
                <v-icon color="grey-lighten-1" size="36">mdi-cash-multiple</v-icon>
              </v-avatar>
              <p class="text-body-1 text-medium-emphasis mb-0">No hay transacciones registradas</p>
            </div>
          </template>

          <!-- Loading -->
          <template #loading>
            <v-skeleton-loader type="table-row@5" />
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Dialog Detalle -->
    <v-dialog v-model="dialogDetalle" :max-width="desgloseGrupoDetalle.length ? 720 : 600">
      <v-card v-if="transaccionSeleccionada" rounded="xl">
        <v-card-title class="bg-primary pa-4">
          <v-icon color="white" start>mdi-information</v-icon>
          <span class="text-white">Detalle de Transacción</span>
        </v-card-title>
        <v-card-text class="pa-6">
          <v-list density="compact">
            <v-list-item>
              <v-list-item-subtitle class="text-caption">Tipo</v-list-item-subtitle>
              <v-list-item-title>
                <v-chip :color="getTipoColor(transaccionSeleccionada.tipo_transaccion)" size="small" variant="tonal">
                  {{ getTipoLabel(transaccionSeleccionada.tipo_transaccion) }}
                  <template v-if="transaccionSeleccionada.numero_cuota">
                    · Cuota {{ transaccionSeleccionada.numero_cuota }}/{{ transaccionSeleccionada.cuotas_totales }}
                  </template>
                </v-chip>
              </v-list-item-title>
            </v-list-item>
            <v-divider />
            <v-list-item>
              <v-list-item-subtitle class="text-caption">Monto</v-list-item-subtitle>
              <v-list-item-title class="text-h6 font-weight-bold">
                Q{{ formatNumber(transaccionSeleccionada.monto) }}
              </v-list-item-title>
            </v-list-item>
            <v-divider />
            <v-list-item>
              <v-list-item-subtitle class="text-caption">Descripción</v-list-item-subtitle>
              <v-list-item-title>{{ transaccionSeleccionada.descripcion }}</v-list-item-title>
            </v-list-item>
            <v-divider />
            <v-list-item>
              <v-list-item-subtitle class="text-caption">Fecha</v-list-item-subtitle>
              <v-list-item-title>{{ formatDate(transaccionSeleccionada.fecha_transaccion) }}</v-list-item-title>
            </v-list-item>
            <v-divider />
            <v-list-item>
              <v-list-item-subtitle class="text-caption">Estado</v-list-item-subtitle>
              <v-list-item-title>
                <v-chip :color="getEstadoColor(transaccionSeleccionada.estado_transaccion)" size="small">
                  {{ getEstadoLabel(transaccionSeleccionada.estado_transaccion) }}
                </v-chip>
              </v-list-item-title>
            </v-list-item>
            <v-divider />
            <v-list-item>
              <v-list-item-subtitle class="text-caption">Registrado por</v-list-item-subtitle>
              <v-list-item-title>{{ transaccionSeleccionada.registrado_por?.name || 'N/A' }}</v-list-item-title>
            </v-list-item>
            <template v-if="transaccionSeleccionada.comprobante_nombre_original">
              <v-divider />
              <v-list-item>
                <v-list-item-subtitle class="text-caption">Comprobante</v-list-item-subtitle>
                <v-list-item-title class="d-flex align-center justify-space-between flex-wrap ga-2">
                  <span class="text-body-2">
                    <v-icon class="mr-1" color="grey" size="16">mdi-paperclip</v-icon>
                    {{ transaccionSeleccionada.comprobante_nombre_original }}
                    <span class="text-caption text-medium-emphasis ml-1">({{ transaccionSeleccionada.comprobante_tamanio_kb }} KB)</span>
                  </span>
                  <div class="d-flex ga-1">
                    <v-btn
                      color="info"
                      :loading="loadingComprobanteId === transaccionSeleccionada.id"
                      size="small"
                      variant="tonal"
                      @click="verComprobanteTransaccion(transaccionSeleccionada.id)"
                    >
                      <v-icon start>mdi-eye-outline</v-icon>
                      Ver
                    </v-btn>
                    <v-btn
                      v-if="!readonly"
                      color="error"
                      size="small"
                      variant="tonal"
                      @click="eliminarComprobanteTransaccion(transaccionSeleccionada)"
                    >
                      <v-icon start>mdi-delete-outline</v-icon>
                      Eliminar
                    </v-btn>
                  </div>
                </v-list-item-title>
              </v-list-item>
            </template>
          </v-list>

          <!-- Desglose del grupo uniforme -->
          <div v-if="desgloseGrupoDetalle.length" class="mt-6">
            <div class="d-flex align-center mb-3 ga-2 flex-wrap">
              <v-icon color="info">mdi-calendar-month</v-icon>
              <span class="text-subtitle-2 font-weight-bold">Desglose de cuotas</span>
              <v-spacer />
              <v-chip
                v-if="infoGrupoDetalle"
                color="error"
                size="small"
                variant="tonal"
              >
                Saldo: Q{{ formatNumber(infoGrupoDetalle.saldo_pendiente) }}
              </v-chip>
              <v-btn
                v-if="!readonly && infoGrupoDetalle?.cuotas_pendientes > 0"
                color="info"
                size="small"
                variant="tonal"
                @click="abrirGestionUniforme(transaccionSeleccionada.grupo_uniforme)"
              >
                <v-icon start>mdi-calendar-edit</v-icon>
                Editar fechas restantes
              </v-btn>
            </div>
            <v-table density="compact">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Fecha</th>
                  <th class="text-right">Cuota</th>
                  <th class="text-right">Saldo</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="cuota in desgloseGrupoDetalle" :key="cuota.id">
                  <td>{{ cuota.numero_cuota }}</td>
                  <td>{{ formatDate(cuota.fecha_transaccion) }}</td>
                  <td class="text-right font-weight-medium">Q{{ formatNumber(cuota.monto) }}</td>
                  <td class="text-right">Q{{ formatNumber(cuota.saldo_despues) }}</td>
                  <td>
                    <v-chip :color="getEstadoColor(cuota.estado_transaccion)" size="x-small" variant="flat">
                      {{ getEstadoLabel(cuota.estado_transaccion) }}
                    </v-chip>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="cerrarDetalle">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Gestionar fechas de uniforme -->
    <v-dialog v-model="dialogGestionUniforme" max-width="820" persistent>
      <v-card v-if="planGestion" rounded="xl">
        <v-card-title class="bg-info pa-4 d-flex align-center flex-wrap ga-2">
          <v-icon color="white" start>mdi-calendar-edit</v-icon>
          <span class="text-white">Gestionar fechas del uniforme</span>
          <v-spacer />
          <v-chip color="white" size="small" variant="flat">
            {{ planGestion.cuotas_aplicadas || 0 }}/{{ planGestion.cuotas_totales }} aplicadas
          </v-chip>
        </v-card-title>
        <v-card-text class="pa-6">
          <v-row class="mb-4" dense>
            <v-col cols="6" sm="3">
              <div class="text-caption text-medium-emphasis">Total</div>
              <div class="font-weight-bold">Q{{ formatNumber(planGestion.monto_total) }}</div>
            </v-col>
            <v-col cols="6" sm="3">
              <div class="text-caption text-medium-emphasis">Saldo pendiente</div>
              <div class="font-weight-bold text-error">Q{{ formatNumber(planGestion.saldo_pendiente) }}</div>
            </v-col>
            <v-col cols="6" sm="3">
              <div class="text-caption text-medium-emphasis">Pendientes</div>
              <div class="font-weight-bold">{{ planGestion.cuotas_pendientes }}</div>
            </v-col>
            <v-col cols="6" sm="3">
              <div class="text-caption text-medium-emphasis">Ya descontadas</div>
              <div class="font-weight-bold text-success">Q{{ formatNumber(planGestion.monto_aplicado) }}</div>
            </v-col>
          </v-row>

          <v-alert
            v-if="!readonly && planGestion.cuotas_pendientes > 0"
            class="mb-4"
            density="compact"
            type="info"
            variant="tonal"
          >
            Las cuotas ya aplicadas no se modifican. Solo editas las fechas restantes (pendientes).
          </v-alert>

          <!-- Cambiar número de cuotas -->
          <v-card
            v-if="!readonly"
            border
            class="mb-4"
            rounded="lg"
            variant="outlined"
          >
            <v-card-text class="pa-4">
              <div class="text-subtitle-2 font-weight-bold mb-2">
                Cambiar número de cuotas
              </div>
              <p class="text-caption text-medium-emphasis mb-3">
                Ejemplo: de 6 a 3. Las ya aplicadas se conservan y el saldo pendiente se reparte en las cuotas nuevas.
                Mínimo permitido: {{ planGestion.cuotas_aplicadas || 0 }} (las ya aplicadas).
              </p>
              <v-row align="center" dense>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model.number="nuevoCuotasTotales"
                    density="comfortable"
                    hide-details
                    :min="Math.max(1, planGestion.cuotas_aplicadas || 0)"
                    max="60"
                    label="Cuotas totales"
                    prepend-inner-icon="mdi-numeric"
                    type="number"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="fechaReprogramar"
                    density="comfortable"
                    hide-details
                    label="Fecha próxima cuota"
                    prepend-inner-icon="mdi-calendar-start"
                    type="date"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-btn
                    block
                    color="primary"
                    :disabled="!puedeCambiarCuotas"
                    :loading="savingCambiarCuotas"
                    variant="elevated"
                    @click="cambiarNumeroCuotas"
                  >
                    <v-icon start>mdi-playlist-edit</v-icon>
                    Aplicar cambio
                  </v-btn>
                </v-col>
              </v-row>
              <v-alert
                v-if="previewMontoCuota != null"
                class="mt-3"
                density="compact"
                type="warning"
                variant="tonal"
              >
                Quedarían {{ previewPendientes }} cuota(s) pendiente(s) de
                ~Q{{ formatNumber(previewMontoCuota) }} c/u (saldo Q{{ formatNumber(planGestion.saldo_pendiente) }}).
              </v-alert>
            </v-card-text>
          </v-card>

          <!-- Reprogramar restantes de un jalón -->
          <v-card
            v-if="!readonly && planGestion.cuotas_pendientes > 0"
            border
            class="mb-4"
            rounded="lg"
            variant="outlined"
          >
            <v-card-text class="pa-4">
              <div class="text-subtitle-2 font-weight-bold mb-2">
                Reprogramar todas las restantes
              </div>
              <p class="text-caption text-medium-emphasis mb-3">
                Ideal si ya van por la cuota {{ (planGestion.cuotas_aplicadas || 0) + 1 }} y quieren
                mover el resto a nuevas fechas quincenales desde una fecha nueva.
              </p>
              <v-row align="center" dense>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="fechaReprogramar"
                    density="comfortable"
                    label="Nueva fecha de la próxima cuota"
                    prepend-inner-icon="mdi-calendar-start"
                    type="date"
                    variant="outlined"
                    hide-details
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-btn
                    block
                    color="info"
                    :disabled="!fechaReprogramar"
                    :loading="savingReprogramar"
                    variant="elevated"
                    @click="reprogramarFechasRestantes"
                  >
                    <v-icon start>mdi-calendar-sync</v-icon>
                    Generar fechas quincenales
                  </v-btn>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <v-table density="comfortable">
            <thead>
              <tr>
                <th>#</th>
                <th>Fecha descuento</th>
                <th class="text-right">Cuota</th>
                <th class="text-right">Saldo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="cuota in cuotasGestion"
                :key="cuota.id"
                :class="cuota.estado_transaccion === 'pendiente' ? '' : 'bg-grey-lighten-4'"
              >
                <td class="font-weight-medium">{{ cuota.numero_cuota }}</td>
                <td style="min-width: 180px;">
                  <v-text-field
                    v-if="cuota.estado_transaccion === 'pendiente' && !readonly"
                    v-model="cuota._fechaEdit"
                    density="compact"
                    hide-details
                    type="date"
                    variant="outlined"
                  />
                  <span v-else>{{ formatDate(cuota.fecha_transaccion) }}</span>
                </td>
                <td class="text-right font-weight-bold text-error">
                  Q{{ formatNumber(cuota.monto) }}
                </td>
                <td class="text-right">Q{{ formatNumber(cuota.saldo_despues) }}</td>
                <td>
                  <v-chip :color="getEstadoColor(cuota.estado_transaccion)" size="small" variant="flat">
                    {{ getEstadoLabel(cuota.estado_transaccion) }}
                  </v-chip>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="cerrarGestionUniforme">Cerrar</v-btn>
          <v-btn
            v-if="!readonly && hayCambiosFechasGestion"
            color="primary"
            :loading="savingFechasGestion"
            variant="elevated"
            @click="guardarFechasGestion"
          >
            <v-icon start>mdi-content-save</v-icon>
            Guardar fechas
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Eliminar transacción (admin) -->
    <v-dialog v-model="dialogEliminar" max-width="480" persistent>
      <v-card rounded="xl">
        <v-card-title class="bg-error pa-4">
          <v-icon color="white" start>mdi-delete-alert</v-icon>
          <span class="text-white">Eliminar transacción</span>
        </v-card-title>
        <v-card-text class="pa-6">
          <v-alert class="mb-4" density="compact" type="warning" variant="tonal">
            Esta acción elimina la transacción de forma permanente y no volverá a aparecer. Confirme para continuar.
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
          <v-btn variant="text" @click="cerrarEliminarTransaccion">Cancelar</v-btn>
          <v-btn
            color="error"
            :disabled="confirmacionEliminar.toUpperCase() !== 'ELIMINAR'"
            :loading="savingEliminar"
            variant="elevated"
            @click="confirmarEliminarTransaccion"
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
  import { computed, onMounted, reactive, ref } from 'vue'
  import operacionesService from '@/services/operacionesService'
  import { useAuthStore } from '@/stores/auth'

  const props = defineProps({
    personalId: {
      type: Number,
      required: true,
    },
    asistenciaId: {
      type: Number,
      default: null,
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
  const saving = ref(false)
  const transacciones = ref([])
  const formRef = ref(null)
  const dialogDetalle = ref(false)
  const transaccionSeleccionada = ref(null)
  const desgloseGrupoDetalle = ref([])
  const infoGrupoDetalle = ref(null)
  const comprobanteFile = ref(null)
  const loadingComprobanteId = ref(null)
  const dialogEliminar = ref(false)
  const transaccionAEliminar = ref(null)
  const confirmacionEliminar = ref('')
  const savingEliminar = ref(false)
  const desgloseUniforme = ref([])
  const planesUniforme = ref([])
  const dialogGestionUniforme = ref(false)
  const planGestion = ref(null)
  const cuotasGestion = ref([])
  const fechaReprogramar = ref(null)
  const savingReprogramar = ref(false)
  const savingFechasGestion = ref(false)
  const nuevoCuotasTotales = ref(1)
  const savingCambiarCuotas = ref(false)

  const planesUniformeActivos = computed(() =>
    (planesUniforme.value || []).filter(p => p.activo && p.cuotas_pendientes > 0),
  )

  const hayCambiosFechasGestion = computed(() =>
    cuotasGestion.value.some(c =>
      c.estado_transaccion === 'pendiente'
      && c._fechaEdit
      && c._fechaEdit !== (c.fecha_transaccion || '').toString().slice(0, 10),
    ),
  )

  const puedeCambiarCuotas = computed(() => {
    if (!planGestion.value) return false
    const aplicado = planGestion.value.cuotas_aplicadas || 0
    const nuevo = Number(nuevoCuotasTotales.value)
    if (!nuevo || nuevo < Math.max(1, aplicado) || nuevo > 60) return false
    if (nuevo === planGestion.value.cuotas_totales) return false
    // Si hay saldo y se pone solo aplicadas, no alcanza
    if (nuevo === aplicado && (planGestion.value.saldo_pendiente || 0) > 0.009) return false
    return true
  })

  const previewPendientes = computed(() => {
    if (!planGestion.value) return 0
    return Math.max(0, Number(nuevoCuotasTotales.value || 0) - (planGestion.value.cuotas_aplicadas || 0))
  })

  const previewMontoCuota = computed(() => {
    if (!planGestion.value || previewPendientes.value <= 0) return null
    if (nuevoCuotasTotales.value === planGestion.value.cuotas_totales) return null
    return Math.round((planGestion.value.saldo_pendiente / previewPendientes.value) * 100) / 100
  })

  // Formulario
  const form = reactive({
    tipo_transaccion: null,
    monto: null,
    descripcion: '',
    fecha_transaccion: new Date().toISOString().split('T')[0],
    cuotas_totales: 1,
  })

  const errors = reactive({
    tipo_transaccion: [],
    monto: [],
    descripcion: [],
    fecha_transaccion: [],
    cuotas_totales: [],
  })

  const errorMessage = ref(null)
  const esUniforme = computed(() => form.tipo_transaccion === 'uniforme')

  // Filtros
  const filtros = reactive({
    tipo: null,
    fecha_desde: null,
    fecha_hasta: null,
  })

  // Snackbar
  const snackbar = reactive({
    show: false,
    text: '',
    color: 'success',
  })

  // Tipos de transacción
  const tiposTransaccion = [
    { value: 'multa', title: 'Multa', icon: 'mdi-alert-circle', color: 'error' },
    { value: 'uniforme', title: 'Uniforme', icon: 'mdi-tshirt-crew', color: 'info' },
    { value: 'anticipo', title: 'Anticipo', icon: 'mdi-cash-fast', color: 'warning' },
    { value: 'abono_prestamo', title: 'Abono a Préstamo', icon: 'mdi-cash-check', color: 'success' },
    { value: 'antecedentes', title: 'Antecedentes', icon: 'mdi-file-document', color: 'secondary' },
    { value: 'otro_descuento', title: 'Otro Descuento', icon: 'mdi-cash-minus', color: 'grey' },
  ]

  // Headers de la tabla
  const headers = [
    { title: 'Tipo', key: 'tipo', sortable: true },
    { title: 'Monto', key: 'monto', sortable: true },
    { title: 'Descripción', key: 'descripcion', sortable: false },
    { title: 'Fecha', key: 'fecha', sortable: true },
    { title: 'Estado', key: 'estado', sortable: true },
    { title: 'Comp.', key: 'comprobante', sortable: false, align: 'center', width: '60px' },
    { title: 'Acciones', key: 'acciones', sortable: false, align: 'center', width: '180px' },
  ]

  function toDateOnly (value) {
    const d = value instanceof Date ? value : new Date(value)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  function parseLocalDate (ymd) {
    const [y, m, d] = ymd.split('-').map(Number)
    return new Date(y, m - 1, d)
  }

  /** Siguiente fecha quincenal: <15 → 15 del mes; =15 → fin de mes; >15 → 15 del siguiente */
  function siguienteFechaQuincenal (fecha) {
    const d = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
    if (d.getDate() < 15) {
      return new Date(d.getFullYear(), d.getMonth(), 15)
    }
    if (d.getDate() === 15) {
      return new Date(d.getFullYear(), d.getMonth() + 1, 0)
    }
    return new Date(d.getFullYear(), d.getMonth() + 1, 15)
  }

  function generarFechasQuincenales (fechaInicioYmd, cuotas) {
    const fechas = []
    let fecha = parseLocalDate(fechaInicioYmd)
    for (let i = 0; i < cuotas; i++) {
      fechas.push(toDateOnly(fecha))
      fecha = siguienteFechaQuincenal(fecha)
    }
    return fechas
  }

  function distribuirMontos (montoTotal, cuotas) {
    const montoCuota = Math.round((montoTotal / cuotas) * 100) / 100
    const montos = []
    for (let i = 0; i < cuotas; i++) {
      if (i === cuotas - 1) {
        montos.push(Math.round((montoTotal - montoCuota * (cuotas - 1)) * 100) / 100)
      } else {
        montos.push(montoCuota)
      }
    }
    return montos
  }

  function regenerarDesgloseUniforme () {
    if (!esUniforme.value) {
      desgloseUniforme.value = []
      return
    }

    const monto = Number(form.monto)
    const cuotas = Number(form.cuotas_totales)
    const fechaInicio = form.fecha_transaccion

    if (!monto || monto <= 0 || !cuotas || cuotas < 1 || !fechaInicio) {
      desgloseUniforme.value = []
      return
    }

    const fechas = generarFechasQuincenales(fechaInicio, cuotas)
    const montos = distribuirMontos(monto, cuotas)
    let acumulado = 0

    desgloseUniforme.value = fechas.map((fecha, i) => {
      acumulado += montos[i]
      return {
        numero: i + 1,
        fecha_transaccion: fecha,
        monto: montos[i],
        saldo_despues: Math.round((monto - acumulado) * 100) / 100,
      }
    })
  }

  function onTipoTransaccionChange () {
    if (esUniforme.value) {
      if (!form.cuotas_totales || form.cuotas_totales < 1) form.cuotas_totales = 1
      if (!form.descripcion) form.descripcion = 'Descuento uniforme quincenal'
      regenerarDesgloseUniforme()
    } else {
      desgloseUniforme.value = []
    }
  }

  // Funciones
  async function cargarTransacciones () {
    loading.value = true
    try {
      const params = {
        personal_id: props.personalId,
      }
      if (filtros.tipo) params.tipo = filtros.tipo
      if (filtros.fecha_desde) params.fecha_desde = filtros.fecha_desde
      if (filtros.fecha_hasta) params.fecha_hasta = filtros.fecha_hasta

      const response = await operacionesService.getTransacciones(params)
      transacciones.value = response.data || []
      await cargarPlanesUniforme()
    } catch (error) {
      console.error('Error cargando transacciones:', error)
      showSnackbar('Error al cargar las transacciones', 'error')
    } finally {
      loading.value = false
    }
  }

  async function cargarPlanesUniforme () {
    try {
      const response = await operacionesService.getPlanesUniforme(props.personalId)
      planesUniforme.value = response.data || []
    } catch (error) {
      console.error('Error cargando planes de uniforme:', error)
      planesUniforme.value = []
    }
  }

  function mapCuotasGestion (cuotas) {
    return (cuotas || []).map(c => ({
      ...c,
      _fechaEdit: (c.fecha_transaccion || '').toString().slice(0, 10),
    }))
  }

  async function abrirGestionUniforme (grupo) {
    if (!grupo) return
    try {
      const response = await operacionesService.getDesgloseGrupoUniforme(grupo)
      const data = response.data
      planGestion.value = {
        grupo_uniforme: data.grupo_uniforme,
        monto_total: data.monto_total,
        saldo_pendiente: data.saldo_pendiente,
        monto_aplicado: data.monto_aplicado,
        cuotas_totales: data.cuotas_totales,
        cuotas_aplicadas: data.cuotas_aplicadas ?? (data.cuotas || []).filter(c => c.estado_transaccion === 'aplicado').length,
        cuotas_pendientes: data.cuotas_pendientes ?? (data.cuotas || []).filter(c => c.estado_transaccion === 'pendiente').length,
      }
      cuotasGestion.value = mapCuotasGestion(data.cuotas)
      nuevoCuotasTotales.value = planGestion.value.cuotas_totales
      const proxima = cuotasGestion.value.find(c => c.estado_transaccion === 'pendiente')
      fechaReprogramar.value = proxima?._fechaEdit || new Date().toISOString().split('T')[0]
      dialogDetalle.value = false
      dialogGestionUniforme.value = true
    } catch (error) {
      showSnackbar(error.apiMessage || 'Error al cargar el plan de uniforme', 'error')
    }
  }

  function cerrarGestionUniforme () {
    dialogGestionUniforme.value = false
    planGestion.value = null
    cuotasGestion.value = []
    fechaReprogramar.value = null
    nuevoCuotasTotales.value = 1
  }

  async function guardarFechasGestion () {
    if (!planGestion.value || !hayCambiosFechasGestion.value) return

    const cambios = cuotasGestion.value
      .filter(c =>
        c.estado_transaccion === 'pendiente'
        && c._fechaEdit
        && c._fechaEdit !== (c.fecha_transaccion || '').toString().slice(0, 10),
      )
      .map(c => ({
        id: c.id,
        fecha_transaccion: c._fechaEdit,
      }))

    if (!cambios.length) return

    savingFechasGestion.value = true
    try {
      const response = await operacionesService.actualizarFechasGrupoUniforme(
        planGestion.value.grupo_uniforme,
        cambios,
      )
      showSnackbar(response.message || 'Fechas actualizadas', 'success')
      cuotasGestion.value = mapCuotasGestion(response.data?.cuotas || [])
      await cargarTransacciones()
      // refrescar resumen del diálogo
      await abrirGestionUniforme(planGestion.value.grupo_uniforme)
    } catch (error) {
      showSnackbar(error.apiMessage || 'Error al guardar las fechas', 'error')
    } finally {
      savingFechasGestion.value = false
    }
  }

  async function reprogramarFechasRestantes () {
    if (!planGestion.value || !fechaReprogramar.value) return

    savingReprogramar.value = true
    try {
      const response = await operacionesService.reprogramarGrupoUniforme(
        planGestion.value.grupo_uniforme,
        fechaReprogramar.value,
      )
      showSnackbar(response.message || 'Fechas reprogramadas', 'success')
      cuotasGestion.value = mapCuotasGestion(response.data?.cuotas || [])
      await cargarTransacciones()
      await abrirGestionUniforme(planGestion.value.grupo_uniforme)
    } catch (error) {
      showSnackbar(error.apiMessage || 'Error al reprogramar las fechas', 'error')
    } finally {
      savingReprogramar.value = false
    }
  }

  async function cambiarNumeroCuotas () {
    if (!planGestion.value || !puedeCambiarCuotas.value) return

    const aplicado = planGestion.value.cuotas_aplicadas || 0
    const nuevo = Number(nuevoCuotasTotales.value)
    const msg = `¿Cambiar el plan a ${nuevo} cuota(s)?\n`
      + `Se conservan ${aplicado} aplicada(s) y el saldo pendiente se redistribuye.`

    if (!confirm(msg)) return

    savingCambiarCuotas.value = true
    try {
      const response = await operacionesService.cambiarCuotasGrupoUniforme(
        planGestion.value.grupo_uniforme,
        {
          cuotas_totales: nuevo,
          fecha_inicio: fechaReprogramar.value || undefined,
        },
      )
      showSnackbar(response.message || 'Número de cuotas actualizado', 'success')
      await cargarTransacciones()
      await abrirGestionUniforme(planGestion.value.grupo_uniforme)
    } catch (error) {
      showSnackbar(error.apiMessage || 'Error al cambiar el número de cuotas', 'error')
    } finally {
      savingCambiarCuotas.value = false
    }
  }

  async function guardarTransaccion () {
    // Limpiar errores
    for (const key of Object.keys(errors)) errors[key] = []
    errorMessage.value = null

    // Validaciones
    if (!form.tipo_transaccion) {
      errors.tipo_transaccion = ['El tipo de transacción es requerido']
      return
    }
    if (!form.monto || form.monto <= 0) {
      errors.monto = ['El monto debe ser mayor a 0']
      return
    }
    if (!form.descripcion || form.descripcion.length < 10) {
      errors.descripcion = ['La descripción debe tener al menos 10 caracteres']
      return
    }
    if (esUniforme.value) {
      if (!form.cuotas_totales || form.cuotas_totales < 1) {
        errors.cuotas_totales = ['Indique el número de cuotas']
        return
      }
      if (!desgloseUniforme.value.length) {
        regenerarDesgloseUniforme()
      }
      if (!desgloseUniforme.value.length) {
        errors.fecha_transaccion = ['Indique la fecha de inicio']
        return
      }
    }

    saving.value = true
    try {
      const data = {
        personal_id: props.personalId,
        asistencia_id: props.asistenciaId,
        tipo_transaccion: form.tipo_transaccion,
        monto: form.monto,
        descripcion: form.descripcion,
        fecha_transaccion: form.fecha_transaccion,
        es_descuento: true,
        comprobante: comprobanteFile.value || undefined,
      }

      if (esUniforme.value) {
        data.cuotas_totales = form.cuotas_totales
        data.fecha_inicio = form.fecha_transaccion
        data.cuotas = desgloseUniforme.value.map(c => ({
          fecha_transaccion: c.fecha_transaccion,
          monto: c.monto,
        }))
      }

      const response = await operacionesService.crearTransaccion(data)

      showSnackbar(response.message || 'Transacción registrada exitosamente', 'success')
      resetForm()
      await cargarTransacciones()
      emit('saved')
    } catch (error) {
      console.error('Error guardando transacción:', error)

      if (error.apiErrors) {
        for (const key of Object.keys(error.apiErrors)) {
          if (errors[key] !== undefined) {
            errors[key] = error.apiErrors[key]
          }
        }
      }

      errorMessage.value = error.apiMessage || 'Error al guardar la transacción'
      emit('error', errorMessage.value)
    } finally {
      saving.value = false
    }
  }

  function resetForm () {
    form.tipo_transaccion = null
    form.monto = null
    form.descripcion = ''
    form.fecha_transaccion = new Date().toISOString().split('T')[0]
    form.cuotas_totales = 1
    desgloseUniforme.value = []
    comprobanteFile.value = null
    for (const key of Object.keys(errors)) errors[key] = []
    errorMessage.value = null
  }

  async function verComprobanteTransaccion (id) {
    loadingComprobanteId.value = id
    try {
      const response = await operacionesService.getComprobanteTransaccion(id)
      const url = URL.createObjectURL(response.data)
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch {
      showSnackbar('Error al cargar el comprobante', 'error')
    } finally {
      loadingComprobanteId.value = null
    }
  }

  async function eliminarComprobanteTransaccion (transaccion) {
    if (!confirm('¿Eliminar el comprobante adjunto?')) return
    try {
      await operacionesService.deleteComprobanteTransaccion(transaccion.id)
      // Limpiar campos del comprobante localmente
      transaccion.comprobante_nombre_original = null
      transaccion.comprobante_ruta = null
      transaccion.comprobante_tamanio_kb = null
      showSnackbar('Comprobante eliminado', 'success')
    } catch {
      showSnackbar('Error al eliminar el comprobante', 'error')
    }
  }

  function limpiarFiltros () {
    filtros.tipo = null
    filtros.fecha_desde = null
    filtros.fecha_hasta = null
    cargarTransacciones()
  }

  async function verDetalle (transaccion) {
    transaccionSeleccionada.value = transaccion
    desgloseGrupoDetalle.value = []
    infoGrupoDetalle.value = null
    dialogDetalle.value = true

    if (transaccion.grupo_uniforme) {
      try {
        const response = await operacionesService.getDesgloseGrupoUniforme(transaccion.grupo_uniforme)
        infoGrupoDetalle.value = response.data
        desgloseGrupoDetalle.value = response.data?.cuotas || []
      } catch (error) {
        console.error('Error cargando desglose uniforme:', error)
      }
    }
  }

  function cerrarDetalle () {
    dialogDetalle.value = false
    transaccionSeleccionada.value = null
    desgloseGrupoDetalle.value = []
    infoGrupoDetalle.value = null
  }

  async function cancelarTransaccion (transaccion) {
    if (!confirm('¿Está seguro de cancelar esta transacción?')) return

    try {
      await operacionesService.cancelarTransaccion(transaccion.id)
      showSnackbar('Transacción cancelada exitosamente', 'success')
      await cargarTransacciones()
    } catch (error) {
      console.error('Error cancelando transacción:', error)
      showSnackbar(error.apiMessage || 'Error al cancelar la transacción', 'error')
    }
  }

  function abrirEliminarTransaccion (transaccion) {
    transaccionAEliminar.value = transaccion
    confirmacionEliminar.value = ''
    dialogEliminar.value = true
  }

  function cerrarEliminarTransaccion () {
    dialogEliminar.value = false
    transaccionAEliminar.value = null
    confirmacionEliminar.value = ''
  }

  async function confirmarEliminarTransaccion () {
    if (!transaccionAEliminar.value) return
    savingEliminar.value = true
    try {
      await operacionesService.eliminarTransaccion(transaccionAEliminar.value.id, confirmacionEliminar.value)
      showSnackbar('Transacción eliminada permanentemente', 'success')
      cerrarEliminarTransaccion()
      await cargarTransacciones()
      emit('saved')
    } catch (error) {
      showSnackbar(error.apiMessage || 'Error al eliminar la transacción', 'error')
    } finally {
      savingEliminar.value = false
    }
  }

  function getTipoLabel (tipo) {
    return tiposTransaccion.find(t => t.value === tipo)?.title || tipo
  }

  function getTipoIcon (tipo) {
    return tiposTransaccion.find(t => t.value === tipo)?.icon || 'mdi-cash'
  }

  function getTipoColor (tipo) {
    return tiposTransaccion.find(t => t.value === tipo)?.color || 'grey'
  }

  function getEstadoLabel (estado) {
    const labels = {
      pendiente: 'Pendiente',
      aplicado: 'Aplicado',
      cancelado: 'Cancelado',
    }
    return labels[estado] || estado
  }

  function getEstadoColor (estado) {
    const colors = {
      pendiente: 'warning',
      aplicado: 'success',
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
    // Si es solo fecha YYYY-MM-DD, agregar hora media para evitar cambios por zona horaria
    return format(new Date(date + 'T12:00:00'), 'dd/MM/yyyy', { locale: es })
  }

  function showSnackbar (text, color = 'success') {
    snackbar.text = text
    snackbar.color = color
    snackbar.show = true
  }

  onMounted(() => {
    cargarTransacciones()
  })
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>
