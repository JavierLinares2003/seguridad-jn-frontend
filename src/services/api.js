import axios from 'axios'
import router from '@/router'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - agregar token a cada request
api.interceptors.request.use(
  config => {
    // Leer token directamente de localStorage para evitar dependencias circulares
    const token = localStorage.getItem('auth_token_jn')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  error => {
    return Promise.reject(error)
  },
)

// Response interceptor - normalizar respuestas y manejar errores
api.interceptors.response.use(
  response => {
    // La API retorna: { success: true, message: "...", data: {...} }
    // Normalizamos para que response.data contenga la estructura completa
    // pero agregamos acceso directo a los datos si existen
    const apiResponse = response.data

    // Si la respuesta tiene la estructura estándar del API
    if (apiResponse && typeof apiResponse === 'object' && 'success' in apiResponse) {
      // Mantener la estructura original pero facilitar el acceso
      response.data = {
        ...apiResponse,
        // Alias para acceso más fácil cuando hay data anidada
        _raw: apiResponse,
      }
    }

    return response
  },
  async error => {
    // Extraer información del error
    const status = error.response?.status
    const apiError = error.response?.data

    // Manejar errores de autenticación
    if (status === 401) {
      // Limpiar token y redirigir a login
      localStorage.removeItem('auth_token_jn')
      router.push({ name: 'login' })
    }

    // Manejar errores de autorización
    if (status === 403) {
      router.push({ name: 'forbidden' })
    }

    // Normalizar el error para fácil acceso
    if (apiError) {
      error.apiMessage = apiError.message || 'Error desconocido'
      error.apiErrors = apiError.errors || null
      error.apiErrorCode = apiError.error || null
    }

    throw error
  },
)

export default api
