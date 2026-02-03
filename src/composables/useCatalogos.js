import { computed, onMounted, ref, watch } from 'vue'
import { CATALOGOS } from '@/services/catalogoService'
import { useCatalogosStore } from '@/stores/catalogos'

/**
 * Composable para cargar y usar catálogos
 *
 * @param {string|string[]} catalogosIniciales - Catálogos a cargar al montar
 * @param {object} options - Opciones de configuración
 */
export function useCatalogos (catalogosIniciales = [], options = {}) {
  const { autoLoad = true, force = false } = options

  const store = useCatalogosStore()

  // Normalizar a array
  const catalogosArray = Array.isArray(catalogosIniciales)
    ? catalogosIniciales
    : [catalogosIniciales]

  // Estado local
  const initialized = ref(false)

  // Cargar catálogos iniciales
  onMounted(async () => {
    if (autoLoad && catalogosArray.length > 0) {
      await loadCatalogos(catalogosArray)
    }
    initialized.value = true
  })

  /**
   * Cargar un catálogo
   */
  async function loadCatalogo (nombre, opts = {}) {
    return store.loadCatalogo(nombre, { force, ...opts })
  }

  /**
   * Cargar múltiples catálogos
   */
  async function loadCatalogos (nombres, opts = {}) {
    return store.loadCatalogos(nombres, { force, ...opts })
  }

  /**
   * Cargar todos los catálogos
   */
  async function loadAll () {
    return store.loadAll(force)
  }

  /**
   * Obtener catálogo reactivo
   */
  function getCatalogo (nombre) {
    return computed(() => store.getCatalogo(nombre))
  }

  /**
   * Verificar si un catálogo está cargando
   */
  function isLoading (nombre) {
    return computed(() => store.isLoading(nombre))
  }

  /**
   * Obtener error de un catálogo
   */
  function getError (nombre) {
    return computed(() => store.getError(nombre))
  }

  /**
   * Buscar item por ID
   */
  function findById (nombre, id) {
    return store.findById(nombre, id)
  }

  /**
   * Obtener label de item
   */
  function getLabel (nombre, id, field = 'nombre') {
    return store.getLabel(nombre, id, field)
  }

  /**
   * Limpiar cache
   */
  function clearCache (nombre = null) {
    store.clearCache(nombre)
  }

  return {
    // State
    initialized,
    // Store reference
    store,
    // Constants
    CATALOGOS,
    // Actions
    loadCatalogo,
    loadCatalogos,
    loadAll,
    getCatalogo,
    isLoading,
    getError,
    findById,
    getLabel,
    clearCache,
  }
}

/**
 * Composable específico para selects dependientes (Departamento -> Municipio)
 */
export function useDepartamentoMunicipio () {
  const store = useCatalogosStore()

  const departamentoSeleccionado = ref(null)
  const municipios = ref([])
  const loadingMunicipios = ref(false)

  // Cargar departamentos al montar
  onMounted(async () => {
    await store.loadCatalogo(CATALOGOS.DEPARTAMENTOS_GEOGRAFICOS)
  })

  // Cuando cambia el departamento, cargar municipios
  watch(departamentoSeleccionado, async newVal => {
    if (newVal) {
      loadingMunicipios.value = true
      try {
        municipios.value = await store.loadMunicipios(newVal)
      } finally {
        loadingMunicipios.value = false
      }
    } else {
      municipios.value = []
    }
  })

  const departamentos = computed(() =>
    store.getCatalogo(CATALOGOS.DEPARTAMENTOS_GEOGRAFICOS),
  )

  return {
    departamentos,
    departamentoSeleccionado,
    municipios,
    loadingMunicipios,
  }
}

/**
 * Composable para formularios que necesitan múltiples catálogos
 */
export function useCatalogosPersonal () {
  const { loadCatalogos, getCatalogo, isLoading, CATALOGOS } = useCatalogos()

  const catalogosRequeridos = [
    CATALOGOS.ESTADOS_CIVILES,
    CATALOGOS.TIPOS_SANGRE,
    CATALOGOS.SEXOS,
    CATALOGOS.TIPOS_CONTRATACION,
    CATALOGOS.TIPOS_PAGO,
    CATALOGOS.DEPARTAMENTOS,
    CATALOGOS.TIPOS_PERSONAL,
    CATALOGOS.TURNOS,
    CATALOGOS.NIVELES_ESTUDIO,
  ]

  const loading = ref(true)

  onMounted(async () => {
    try {
      await loadCatalogos(catalogosRequeridos)
    } finally {
      loading.value = false
    }
  })

  return {
    loading,
    estadosCiviles: getCatalogo(CATALOGOS.ESTADOS_CIVILES),
    tiposSangre: getCatalogo(CATALOGOS.TIPOS_SANGRE),
    sexos: getCatalogo(CATALOGOS.SEXOS),
    tiposContratacion: getCatalogo(CATALOGOS.TIPOS_CONTRATACION),
    tiposPago: getCatalogo(CATALOGOS.TIPOS_PAGO),
    departamentos: getCatalogo(CATALOGOS.DEPARTAMENTOS),
    tiposPersonal: getCatalogo(CATALOGOS.TIPOS_PERSONAL),
    turnos: getCatalogo(CATALOGOS.TURNOS),
    nivelesEstudio: getCatalogo(CATALOGOS.NIVELES_ESTUDIO),
    isLoading,
    CATALOGOS,
  }
}

export default useCatalogos
