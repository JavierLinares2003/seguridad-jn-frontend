/**
 * plugins/vuetify.js
 */

import { createVuetify } from 'vuetify'
import { es } from 'vuetify/locale'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

const jnLight = {
  dark: false,
  colors: {
    background: '#F2F5FA',
    surface: '#FFFFFF',
    'surface-bright': '#FAFBFD',
    'surface-light': '#E8EEF7',
    'surface-variant': '#D5DFEE',
    'on-surface-variant': '#3A4A63',
    primary: '#0A3D8F',
    'primary-darken-1': '#072A66',
    secondary: '#F5C400',
    'secondary-darken-1': '#D4A800',
    error: '#C62828',
    info: '#1565C0',
    success: '#2E7D4F',
    warning: '#F5C400',
    'on-background': '#0A2540',
    'on-surface': '#0A2540',
    'on-primary': '#FFFFFF',
    'on-secondary': '#072A66',
    'on-warning': '#072A66',
  },
  variables: {
    'border-color': '#0A3D8F',
    'border-opacity': 0.12,
    'hover-opacity': 0.04,
    'high-emphasis-opacity': 0.92,
    'medium-emphasis-opacity': 0.68,
  },
}

const jnDark = {
  dark: true,
  colors: {
    background: '#071427',
    surface: '#0E2448',
    'surface-bright': '#1A3A66',
    'surface-light': '#122C52',
    'surface-variant': '#1E4270',
    'on-surface-variant': '#D7E3F4',
    primary: '#F5C400',
    'primary-darken-1': '#D4A800',
    secondary: '#4D8FE8',
    error: '#EF5350',
    info: '#64B5F6',
    success: '#66BB6A',
    warning: '#F5C400',
    'on-background': '#F2F5FA',
    'on-surface': '#F2F5FA',
    'on-primary': '#072A66',
    'on-secondary': '#071427',
    'on-warning': '#072A66',
  },
}

export default createVuetify({
  locale: {
    locale: 'es',
    fallback: 'en',
    messages: { es },
  },
  theme: {
    defaultTheme: 'jnLight',
    themes: {
      jnLight,
      jnDark,
    },
  },
  defaults: {
    VBtn: {
      style: 'letter-spacing: 0.08em;',
    },
    VCard: {
      elevation: 0,
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
    },
    VAutocomplete: {
      variant: 'outlined',
      density: 'comfortable',
    },
    VTextarea: {
      variant: 'outlined',
    },
  },
})
