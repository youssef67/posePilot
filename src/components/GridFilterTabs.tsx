import { useState, useMemo, useLayoutEffect } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

type FilterType = 'tous' | 'en-cours' | 'termines' | 'alertes'

const FILTER_LABELS: Record<Exclude<FilterType, 'tous'>, string> = {
  'en-cours': 'en cours',
  'termines': 'terminé',
  'alertes': 'avec alertes',
}

interface GridFilterTabsProps<T> {
  items: T[]
  getProgress: (item: T) => { done: number; total: number }
  getAlerts?: (item: T) => boolean
  /** Must be a stable reference (e.g. useState setter). Unstable refs cause infinite re-renders. */
  onFilteredChange: (filtered: T[]) => void
  emptyMessage?: string
  className?: string
}

const FILTER_TABS: { value: FilterType; label: string }[] = [
  { value: 'tous', label: 'Tous' },
  { value: 'en-cours', label: 'En cours' },
  { value: 'termines', label: 'Terminés' },
  { value: 'alertes', label: 'Avec alertes' },
]

export function GridFilterTabs<T>({
  items,
  getProgress,
  getAlerts,
  onFilteredChange,
  emptyMessage,
  className,
}: GridFilterTabsProps<T>) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('tous')

  const filterFns: Record<FilterType, (list: T[]) => T[]> = useMemo(
    () => ({
      tous: (list) => list,
      'en-cours': (list) =>
        list.filter((item) => {
          const { done, total } = getProgress(item)
          return done > 0 && done < total
        }),
      termines: (list) =>
        list.filter((item) => {
          const { done, total } = getProgress(item)
          return done === total && total > 0
        }),
      alertes: (list) =>
        getAlerts ? list.filter((item) => getAlerts(item)) : [],
    }),
    [getProgress, getAlerts],
  )

  const filtered = useMemo(
    () => filterFns[activeFilter](items),
    [items, activeFilter, filterFns],
  )

  const counts = useMemo(
    () => ({
      tous: items.length,
      'en-cours': filterFns['en-cours'](items).length,
      termines: filterFns['termines'](items).length,
      alertes: filterFns['alertes'](items).length,
    }),
    [items, filterFns],
  )

  useLayoutEffect(() => {
    onFilteredChange(filtered)
  }, [filtered, onFilteredChange])

  return (
    <>
      <Tabs
        value={activeFilter}
        onValueChange={(v) => setActiveFilter(v as FilterType)}
        className={className}
      >
        <TabsList
          variant="line"
          className="w-full justify-start gap-0 border-b border-border px-4"
        >
          {FILTER_TABS.map(({ value, label }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="after:bg-primary text-sm px-3 py-2"
            >
              {label}
              <span className="ml-1 text-xs text-muted-foreground">
                ({counts[value]})
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {emptyMessage && filtered.length === 0 && activeFilter !== 'tous' && (
        <p className="text-center text-muted-foreground py-8">
          {emptyMessage}{' '}
          {activeFilter === 'termines' && emptyMessage.startsWith('Aucune')
            ? 'terminée'
            : FILTER_LABELS[activeFilter as Exclude<FilterType, 'tous'>]}
        </p>
      )}
    </>
  )
}
