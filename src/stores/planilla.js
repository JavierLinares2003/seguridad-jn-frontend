import { defineStore } from 'pinia'
import planillaService from '@/services/planillaService'

export const usePlanillaStore = defineStore('planilla', {
  state: () => ({
    planillas: [],
    planillaActual: null,
    loading: false,
    error: null,
    meta: {
      current_page: 1,
      last_page: 1,
      per_page: 15,
      total: 0,
    },
  }),

  getters: {
    planillasBorrador: state => state.planillas.filter(p => p.estado_planilla === 'borrador'),
    planillasAprobadas: state => state.planillas.filter(p => p.estado_planilla === 'aprobada'),
    planillasPagadas: state => state.planillas.filter(p => p.estado_planilla === 'pagada'),
  },

  actions: {
    async generarPlanilla (data) {
      this.loading = true
      this.error = null
      try {
        const response = await planillaService.generarPlanilla(data)
        this.planillaActual = response.data
        return response
      } catch (error) {
        this.error = error.response?.data?.message || 'Error al generar planilla'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchPlanillas (params = {}) {
      this.loading = true
      this.error = null
      try {
        const response = await planillaService.getPlanillas(params)
        // Response: { success, data: [...items], meta: { current_page, last_page, per_page, total } }
        this.planillas = Array.isArray(response?.data) ? response.data : []
        if (response?.meta) {
          this.meta = {
            current_page: response.meta.current_page || 1,
            last_page: response.meta.last_page || 1,
            per_page: response.meta.per_page || 15,
            total: response.meta.total || 0,
          }
        }
        return response
      } catch (error) {
        this.error = error.apiMessage || error.response?.data?.message || 'Error al cargar planillas'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchPlanilla (id) {
      this.loading = true
      this.error = null
      try {
        const response = await planillaService.getPlanilla(id)
        this.planillaActual = response.data
        return response
      } catch (error) {
        this.error = error.response?.data?.message || 'Error al cargar planilla'
        throw error
      } finally {
        this.loading = false
      }
    },

    async aprobarPlanilla (id) {
      this.loading = true
      this.error = null
      try {
        const response = await planillaService.aprobarPlanilla(id)
        this.planillaActual = response.data
        // Actualizar en lista si existe
        const index = this.planillas.findIndex(p => p.id === id)
        if (index !== -1) {
          this.planillas[index] = response.data
        }
        return response
      } catch (error) {
        this.error = error.response?.data?.message || 'Error al aprobar planilla'
        throw error
      } finally {
        this.loading = false
      }
    },

    async marcarPagada (id) {
      this.loading = true
      this.error = null
      try {
        const response = await planillaService.marcarPagada(id)
        this.planillaActual = response.data
        const index = this.planillas.findIndex(p => p.id === id)
        if (index !== -1) {
          this.planillas[index] = response.data
        }
        return response
      } catch (error) {
        this.error = error.response?.data?.message || 'Error al marcar como pagada'
        throw error
      } finally {
        this.loading = false
      }
    },

    async cancelarPlanilla (id, motivo) {
      this.loading = true
      this.error = null
      try {
        const response = await planillaService.cancelarPlanilla(id, motivo)
        this.planillaActual = response.data
        const index = this.planillas.findIndex(p => p.id === id)
        if (index !== -1) {
          this.planillas[index] = response.data
        }
        return response
      } catch (error) {
        this.error = error.response?.data?.message || 'Error al cancelar planilla'
        throw error
      } finally {
        this.loading = false
      }
    },

    async exportarPlanilla (id, formato) {
      this.loading = true
      this.error = null
      try {
        const response = await planillaService.exportarPlanilla(id, formato)
        const disposition = response.headers?.['content-disposition']
        const fileName = disposition
          ? disposition.split('filename=')[1]?.replace(/"/g, '')
          : `planilla_${id}.${formato === 'excel' ? 'xlsx' : 'pdf'}`
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', fileName)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
      } catch (error) {
        this.error = error.response?.data?.message || 'Error al exportar planilla'
        throw error
      } finally {
        this.loading = false
      }
    },

    clearError () {
      this.error = null
    },

    clearPlanillaActual () {
      this.planillaActual = null
    },
  },
})
