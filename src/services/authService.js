import api from './api'

export const authService = {
  async login (credentials) {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },

  async register (userData) {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  async getProfile () {
    const response = await api.get('/auth/me')
    return response.data
  },

  async logout () {
    try {
      await api.post('/auth/logout')
    } catch {
      // Ignorar errores de logout en el servidor
    }
  },

  async refreshToken () {
    const response = await api.post('/auth/refresh')
    return response.data
  },

  async forgotPassword (email) {
    const response = await api.post('/auth/forgot-password', { email })
    return response.data
  },

  async resetPassword (data) {
    const response = await api.post('/auth/reset-password', data)
    return response.data
  },

  async changePassword (data) {
    const response = await api.post('/auth/change-password', data)
    return response.data
  },
}

export default authService
