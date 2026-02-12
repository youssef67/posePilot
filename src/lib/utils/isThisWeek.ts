/**
 * Returns true if the given date string (YYYY-MM-DD) falls within the current
 * ISO week (Monday to Sunday).
 */
export function isThisWeek(dateStr: string | null): boolean {
  if (!dateStr) return false
  const date = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1))
  startOfWeek.setHours(0, 0, 0, 0)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)
  return date >= startOfWeek && date <= endOfWeek
}
