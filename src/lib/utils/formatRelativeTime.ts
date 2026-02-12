const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' })

const DIVISIONS: { amount: number; name: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, name: 'second' },
  { amount: 60, name: 'minute' },
  { amount: 24, name: 'hour' },
  { amount: 7, name: 'day' },
  { amount: 4.34524, name: 'week' },
  { amount: 12, name: 'month' },
  { amount: Number.POSITIVE_INFINITY, name: 'year' },
]

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  let duration = (date.getTime() - Date.now()) / 1000

  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return rtf.format(Math.round(duration), division.name)
    }
    duration /= division.amount
  }
  return rtf.format(Math.round(duration), 'year')
}
