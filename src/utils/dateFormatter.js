/**
 * Fechas de calendario (YYYY-MM-DD) sin corrimiento por zona horaria.
 * new Date('2026-08-31') se parsea como UTC y en Guatemala muestra el día anterior.
 */
export function toLocalCalendarDate (date) {
  if (!date) return null
  const raw = typeof date === 'string' ? date : (date instanceof Date ? date.toISOString() : String(date))
  const dateOnly = raw.includes('T') ? raw.split('T')[0] : raw.substring(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return null
  return new Date(`${dateOnly}T12:00:00`)
}

export function formatDateGT (date) {
  const parsed = toLocalCalendarDate(date)
  if (!parsed) return date ? String(date) : '-'
  return parsed.toLocaleDateString('es-GT')
}

export function todayLocalISODate () {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
