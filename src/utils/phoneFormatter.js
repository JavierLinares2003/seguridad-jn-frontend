/**
 * Utilidad para formatear numeros de telefono de Guatemala
 * Formato: XXXX-XXXX (8 digitos)
 */

/**
 * Formatea un telefono para visualizacion
 * @param {string|number} phone - Telefono sin formato (8 digitos)
 * @returns {string} Telefono formateado XXXX-XXXX
 */
export function formatPhone(phone) {
  if (!phone) return ''

  // Limpiar cualquier caracter que no sea digito
  const cleaned = String(phone).replace(/\D/g, '')

  if (cleaned.length !== 8) return cleaned

  // Formato: XXXX-XXXX
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}`
}

/**
 * Limpia un telefono formateado dejando solo digitos
 * @param {string} phone - Telefono con o sin formato
 * @returns {string} Solo los digitos del telefono
 */
export function cleanPhone(phone) {
  if (!phone) return ''
  return String(phone).replace(/\D/g, '')
}

/**
 * Formatea un telefono mientras se escribe (para inputs)
 * @param {string} value - Valor actual del input
 * @returns {string} Valor formateado para mostrar
 */
export function formatPhoneInput(value) {
  if (!value) return ''

  // Limpiar todo excepto digitos
  const cleaned = String(value).replace(/\D/g, '')

  // Limitar a 8 digitos
  const limited = cleaned.slice(0, 8)

  // Aplicar formato progresivo
  if (limited.length <= 4) {
    return limited
  } else {
    return `${limited.slice(0, 4)}-${limited.slice(4)}`
  }
}

/**
 * Valida si un telefono tiene el formato correcto (8 digitos)
 * @param {string} phone - Telefono a validar
 * @returns {boolean}
 */
export function isValidPhone(phone) {
  const cleaned = cleanPhone(phone)
  return cleaned.length === 8
}

export default {
  formatPhone,
  cleanPhone,
  formatPhoneInput,
  isValidPhone,
}
