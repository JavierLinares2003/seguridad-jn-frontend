/**
 * Utilidad para formatear DPI de Guatemala
 * Formato: XXXX-XXXXX-XXXX (4-5-4 digitos)
 */

/**
 * Formatea un DPI para visualizacion
 * @param {string|number} dpi - DPI sin formato (13 digitos)
 * @returns {string} DPI formateado XXXX-XXXXX-XXXX
 */
export function formatDPI(dpi) {
  if (!dpi) return ''

  // Limpiar cualquier caracter que no sea digito
  const cleaned = String(dpi).replace(/\D/g, '')

  if (cleaned.length !== 13) return cleaned

  // Formato: XXXX-XXXXX-XXXX
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 9)}-${cleaned.slice(9, 13)}`
}

/**
 * Limpia un DPI formateado dejando solo digitos
 * @param {string} dpi - DPI con o sin formato
 * @returns {string} Solo los digitos del DPI
 */
export function cleanDPI(dpi) {
  if (!dpi) return ''
  return String(dpi).replace(/\D/g, '')
}

/**
 * Formatea un DPI mientras se escribe (para inputs)
 * @param {string} value - Valor actual del input
 * @returns {string} Valor formateado para mostrar
 */
export function formatDPIInput(value) {
  if (!value) return ''

  // Limpiar todo excepto digitos
  const cleaned = String(value).replace(/\D/g, '')

  // Limitar a 13 digitos
  const limited = cleaned.slice(0, 13)

  // Aplicar formato progresivo
  if (limited.length <= 4) {
    return limited
  } else if (limited.length <= 9) {
    return `${limited.slice(0, 4)}-${limited.slice(4)}`
  } else {
    return `${limited.slice(0, 4)}-${limited.slice(4, 9)}-${limited.slice(9)}`
  }
}

/**
 * Valida si un DPI tiene el formato correcto (13 digitos)
 * @param {string} dpi - DPI a validar
 * @returns {boolean}
 */
export function isValidDPI(dpi) {
  const cleaned = cleanDPI(dpi)
  return cleaned.length === 13
}

export default {
  formatDPI,
  cleanDPI,
  formatDPIInput,
  isValidDPI,
}
