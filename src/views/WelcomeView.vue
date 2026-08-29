<template>
  <div class="jn-home">
    <header class="jn-home__head">
      <p class="jn-home__kicker">Hoy</p>
      <h1 class="jn-display text-h4 mb-1">{{ saludo }}, {{ primerNombre }}</h1>
      <p class="jn-home__stamp mb-0">{{ currentDate }} · {{ currentTime }}</p>
    </header>

    <div v-if="loading" class="jn-home__muted mt-8">Cargando el día…</div>

    <div v-else class="jn-board">
      <section v-if="canOps" class="jn-panel">
        <div class="jn-panel__bar">
          <h2 class="jn-panel__title">Asistencia</h2>
          <router-link class="jn-panel__link" :to="{ name: 'operaciones-asistencia' }">Abrir</router-link>
        </div>
        <p class="jn-panel__lead">
          {{ asistencia.proyectos }} proyecto(s) con gente en turno.
          <span v-if="asistencia.sinRegistro"> {{ asistencia.sinRegistro }} sin marcar.</span>
          <span v-if="asistencia.ausentes"> {{ asistencia.ausentes }} ausente(s).</span>
        </p>
        <ul v-if="asistencia.filas.length" class="jn-rows">
          <li v-for="fila in asistencia.filas" :key="fila.id">
            <span class="jn-rows__name">{{ fila.nombre }}</span>
            <span class="jn-rows__meta">{{ fila.detalle }}</span>
          </li>
        </ul>
        <p v-else class="jn-empty">No hay proyectos con turno para hoy.</p>
      </section>

      <section v-if="canOps" class="jn-panel">
        <div class="jn-panel__bar">
          <h2 class="jn-panel__title">Cobertura</h2>
          <router-link class="jn-panel__link" :to="{ name: 'operaciones-alertas-cobertura' }">Ver alertas</router-link>
        </div>
        <p class="jn-panel__lead">
          {{ cobertura.criticas }} crítica(s) · {{ cobertura.altas }} alta(s)
        </p>
        <ul v-if="cobertura.filas.length" class="jn-rows">
          <li v-for="fila in cobertura.filas" :key="fila.id">
            <span class="jn-rows__name">{{ fila.nombre }}</span>
            <span class="jn-rows__meta">{{ fila.detalle }}</span>
          </li>
        </ul>
        <p v-else class="jn-empty">Sin alertas de cobertura.</p>
      </section>

      <section v-if="canBodega" class="jn-panel">
        <div class="jn-panel__bar">
          <h2 class="jn-panel__title">Bodega</h2>
          <router-link class="jn-panel__link" :to="{ name: 'bodega' }">Abrir</router-link>
        </div>
        <p class="jn-panel__lead">
          {{ bodega.stockBajo }} ítem(s) en stock bajo · {{ bodega.existencia }} en existencia
        </p>
        <ul v-if="bodega.filas.length" class="jn-rows">
          <li v-for="fila in bodega.filas" :key="fila.id">
            <span class="jn-rows__name">{{ fila.nombre }}</span>
            <span class="jn-rows__meta">{{ fila.detalle }}</span>
          </li>
        </ul>
        <p v-else class="jn-empty">No hay productos bajo mínimo.</p>
      </section>

      <section v-if="canRoles" class="jn-panel">
        <div class="jn-panel__bar">
          <h2 class="jn-panel__title">Roles y vistas</h2>
          <router-link class="jn-panel__link" :to="{ name: 'configuracion-roles' }">Abrir</router-link>
        </div>
        <p class="jn-panel__lead">
          Quién ve cada pantalla del menú: Personal, Bodega, Planillas, Usuarios y el resto.
        </p>
        <p class="jn-empty">Edita las vistas de cada rol para restringir o ampliar el acceso.</p>
      </section>

      <section v-if="canPlanillas" class="jn-panel">
        <div class="jn-panel__bar">
          <h2 class="jn-panel__title">Planillas</h2>
          <router-link class="jn-panel__link" :to="{ name: 'operaciones-planillas' }">Abrir</router-link>
        </div>
        <p class="jn-panel__lead">
          {{ planillas.borradores }} en borrador · {{ planillas.aprobadas }} aprobada(s)
        </p>
        <ul v-if="planillas.filas.length" class="jn-rows">
          <li v-for="fila in planillas.filas" :key="fila.id">
            <span class="jn-rows__name">{{ fila.nombre }}</span>
            <span class="jn-rows__meta">{{ fila.detalle }}</span>
          </li>
        </ul>
        <p v-else class="jn-empty">No hay planillas recientes.</p>
      </section>
    </div>
  </div>
</template>

<script setup>
  import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
  import { format } from 'date-fns'
  import { es } from 'date-fns/locale'
  import { useAuthStore } from '@/stores/auth'
  import operacionesService from '@/services/operacionesService'
  import bodegaService from '@/services/bodegaService'
  import planillaService from '@/services/planillaService'

  const authStore = useAuthStore()
  const loading = ref(true)
  const currentDate = ref('')
  const currentTime = ref('')
  let timeInterval = null

  const canOps = computed(() => authStore.hasPermission('view-operaciones'))
  const canBodega = computed(() => authStore.hasPermission('view-bodega'))
  const canPlanillas = computed(() => authStore.hasPermission('view-planillas'))
  const canRoles = computed(() => authStore.hasPermission('manage-roles'))

  const primerNombre = computed(() => {
    const name = authStore.userName || 'Usuario'
    return name.split(' ')[0]
  })

  const saludo = computed(() => {
    const h = new Date().getHours()
    if (h < 12) return 'Buenos días'
    if (h < 19) return 'Buenas tardes'
    return 'Buenas noches'
  })

  const asistencia = reactive({ proyectos: 0, sinRegistro: 0, ausentes: 0, filas: [] })
  const cobertura = reactive({ criticas: 0, altas: 0, filas: [] })
  const bodega = reactive({ stockBajo: 0, existencia: 0, filas: [] })
  const planillas = reactive({ borradores: 0, aprobadas: 0, filas: [] })

  function hoyIso () {
    return format(new Date(), 'yyyy-MM-dd')
  }

  function updateDateTime () {
    const now = new Date()
    currentDate.value = format(now, "EEEE d 'de' MMMM yyyy", { locale: es })
    currentTime.value = format(now, 'HH:mm')
  }

  function unwrap (res) {
    return res?.data ?? res
  }

  async function cargarAsistencia () {
    const res = await operacionesService.getAsistenciaPorFecha(hoyIso(), { per_page: 6 })
    const page = unwrap(res)
    const list = page?.data || (Array.isArray(page) ? page : [])
    asistencia.proyectos = page?.total ?? list.length
    let sin = 0
    let aus = 0
    asistencia.filas = list.slice(0, 6).map(item => {
      const r = item.resumen || {}
      sin += Number(r.sin_registro || 0)
      aus += Number(r.ausentes_justificados || 0) + Number(r.ausentes_injustificados || 0)
      const pendiente = Number(r.sin_registro || 0)
      return {
        id: item.proyecto?.id,
        nombre: item.proyecto?.nombre || 'Proyecto',
        detalle: pendiente ? `${pendiente} sin marcar` : `${r.presentes || 0} presente(s)`,
      }
    })
    asistencia.sinRegistro = sin
    asistencia.ausentes = aus
  }

  async function cargarCobertura () {
    const res = await operacionesService.getAlertasCobertura()
    const meta = res.meta || {}
    cobertura.criticas = meta.criticas || 0
    cobertura.altas = meta.altas || 0
    const porProyecto = res.resumen_por_proyecto || []
    cobertura.filas = porProyecto.slice(0, 6).map(p => ({
      id: p.proyecto_id,
      nombre: p.nombre_proyecto || 'Proyecto',
      detalle: `${p.total_alertas} alerta(s)`,
    }))
  }

  async function cargarBodega () {
    const [dash, bajo] = await Promise.all([
      bodegaService.getDashboard(),
      bodegaService.getStockBajo(),
    ])
    const tot = unwrap(dash)?.totales || {}
    bodega.stockBajo = tot.stock_bajo || 0
    bodega.existencia = tot.existencia || 0
    const items = unwrap(bajo) || []
    bodega.filas = items.slice(0, 6).map(v => ({
      id: v.id,
      nombre: v.producto?.nombre || 'Producto',
      detalle: `${v.etiqueta || ''} · ${v.existencia} / mín. ${v.stock_minimo}`,
    }))
  }

  async function cargarPlanillas () {
    const res = await planillaService.getPlanillas({ per_page: 8 })
    const raw = unwrap(res)
    const list = raw?.data || (Array.isArray(raw) ? raw : [])
    planillas.borradores = list.filter(p => p.estado_planilla === 'borrador').length
    planillas.aprobadas = list.filter(p => p.estado_planilla === 'aprobada').length
    planillas.filas = list.slice(0, 6).map(p => ({
      id: p.id,
      nombre: p.nombre_planilla || `Planilla #${p.id}`,
      detalle: p.estado_planilla || '',
    }))
  }

  onMounted(async () => {
    updateDateTime()
    timeInterval = setInterval(updateDateTime, 30_000)
    const jobs = []
    if (canOps.value) jobs.push(cargarAsistencia(), cargarCobertura())
    if (canBodega.value) jobs.push(cargarBodega())
    if (canPlanillas.value) jobs.push(cargarPlanillas())
    await Promise.allSettled(jobs)
    loading.value = false
  })

  onUnmounted(() => {
    if (timeInterval) clearInterval(timeInterval)
  })
</script>

<style scoped>
.jn-home {
  padding: clamp(1.25rem, 3vw, 2.5rem) clamp(1.25rem, 3vw, 2.75rem) 3rem;
}

.jn-home__kicker {
  margin: 0 0 0.4rem;
  color: var(--jn-blue);
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.jn-home__stamp,
.jn-home__muted {
  color: color-mix(in srgb, currentColor 60%, transparent);
  font-size: 0.95rem;
  text-transform: capitalize;
}

.jn-board {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.25rem 2rem;
  margin-top: 2rem;
  max-width: 1100px;
}

.jn-panel {
  min-height: 12rem;
  padding-bottom: 0.5rem;
  border-top: 1px solid color-mix(in srgb, currentColor 14%, transparent);
}

.jn-panel__bar {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 0 0.35rem;
}

.jn-panel__title {
  margin: 0;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 1.15rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.jn-panel__link {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 0.8rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--jn-blue);
  text-decoration: none;
}

.v-theme--jnDark .jn-panel__link {
  color: var(--jn-yellow);
}

.jn-panel__lead {
  margin: 0 0 0.75rem;
  font-size: 0.92rem;
  opacity: 0.75;
}

.jn-rows {
  list-style: none;
  margin: 0;
  padding: 0;
}

.jn-rows li {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.45rem 0;
  border-bottom: 1px solid color-mix(in srgb, currentColor 8%, transparent);
  font-size: 0.92rem;
}

.jn-rows__meta {
  opacity: 0.55;
  white-space: nowrap;
}

.jn-empty {
  margin: 0.5rem 0 0;
  font-size: 0.9rem;
  opacity: 0.5;
}

@media (max-width: 900px) {
  .jn-board {
    grid-template-columns: 1fr;
  }
}
</style>
