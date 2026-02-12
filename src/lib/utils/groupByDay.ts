export interface DayGroup<T> {
  label: string
  entries: T[]
}

export function groupByDay<T extends { created_at: string }>(items: T[]): DayGroup<T>[] {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)

  const groups = new Map<string, T[]>()

  for (const item of items) {
    const itemDate = new Date(item.created_at)
    const itemDay = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate())

    let label: string
    if (itemDay.getTime() === today.getTime()) {
      label = "Aujourd'hui"
    } else if (itemDay.getTime() === yesterday.getTime()) {
      label = 'Hier'
    } else {
      label = itemDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    }

    const existing = groups.get(label) || []
    existing.push(item)
    groups.set(label, existing)
  }

  return Array.from(groups.entries()).map(([label, entries]) => ({ label, entries }))
}
