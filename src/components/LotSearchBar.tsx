import { useState, useMemo, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Search, X, Clock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useChantierLots } from '@/lib/queries/useChantierLots'
import type { ChantierLot } from '@/lib/queries/useChantierLots'
import { useLotSearchHistory } from '@/lib/utils/useLotSearchHistory'

interface LotSearchBarProps {
  chantierId: string
}

export function LotSearchBar({ chantierId }: LotSearchBarProps) {
  const [query, setQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [activeIndex, setActiveIndex] = useState(-1)
  const navigate = useNavigate()

  const { data: allLots, isLoading } = useChantierLots(chantierId)
  const { history, addToHistory } = useLotSearchHistory(chantierId)

  const filteredLots = useMemo(() => {
    if (!query.trim() || !allLots) return []
    const q = query.toLowerCase()
    return allLots.filter((lot) => lot.code.toLowerCase().includes(q))
  }, [allLots, query])

  function handleSelectLot(lot: ChantierLot) {
    addToHistory(query.trim())
    setQuery('')
    setShowResults(false)
    navigate({
      to: '/chantiers/$chantierId/plots/$plotId/$etageId/$lotId',
      params: {
        chantierId,
        plotId: lot.plot_id,
        etageId: lot.etage_id,
        lotId: lot.id,
      },
    })
  }

  function handleHistorySelect(entry: string) {
    setQuery(entry)
    inputRef.current?.focus()
  }

  const hasQuery = query.trim().length > 0
  const showHistory = !hasQuery && showResults && history.length > 0
  const showFilteredResults = hasQuery && showResults
  const showDropdown = showHistory || showFilteredResults
  const visibleItemCount = showHistory
    ? history.length
    : showFilteredResults
      ? filteredLots.length
      : 0

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setShowResults(false)
      setActiveIndex(-1)
      inputRef.current?.blur()
      return
    }
    if (!showDropdown || visibleItemCount === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex((prev) => (prev + 1) % visibleItemCount)
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((prev) =>
          prev <= 0 ? visibleItemCount - 1 : prev - 1,
        )
        break
      case 'Enter':
        if (activeIndex >= 0) {
          e.preventDefault()
          if (showHistory) {
            handleHistorySelect(history[activeIndex])
          } else {
            handleSelectLot(filteredLots[activeIndex])
          }
        }
        break
    }
  }

  return (
    <div
      role="search"
      className="sticky top-[env(safe-area-inset-top)] z-10 border-b border-border bg-background px-4 py-2"
    >
      <div className="relative">
        <Search
          className={cn(
            'absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground',
            isLoading && 'animate-pulse',
          )}
        />
        <Input
          ref={inputRef}
          inputMode="numeric"
          placeholder="Rechercher un lot..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setActiveIndex(-1)
          }}
          onFocus={() => {
            setShowResults(true)
            setActiveIndex(-1)
          }}
          onBlur={() => setTimeout(() => setShowResults(false), 150)}
          onKeyDown={handleKeyDown}
          className="pl-8 pr-8"
          role="combobox"
          aria-label="Rechercher un lot par numéro"
          aria-expanded={showDropdown}
          aria-controls={showDropdown ? 'lot-search-listbox' : undefined}
          aria-activedescendant={
            activeIndex >= 0 ? `lot-search-item-${activeIndex}` : undefined
          }
        />
        {hasQuery && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              inputRef.current?.focus()
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2"
            aria-label="Effacer la recherche"
          >
            <X className="size-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {showDropdown && (
        <ul
          id="lot-search-listbox"
          role="listbox"
          aria-label="Résultats de recherche"
          className="absolute left-0 right-0 mx-4 mt-1 max-h-64 overflow-y-auto rounded-md border border-border bg-popover shadow-md"
        >
          {showHistory &&
            history.map((entry, index) => (
              <li
                key={entry}
                id={`lot-search-item-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                className={cn(
                  'flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-accent active:bg-accent',
                  index === activeIndex && 'bg-accent',
                )}
                onMouseDown={() => handleHistorySelect(entry)}
              >
                <Clock className="size-3.5 text-muted-foreground" />
                <span className="text-foreground">{entry}</span>
              </li>
            ))}

          {showFilteredResults && filteredLots.length > 0 &&
            filteredLots.map((lot, index) => (
              <li
                key={lot.id}
                id={`lot-search-item-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                className={cn(
                  'flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-accent active:bg-accent',
                  index === activeIndex && 'bg-accent',
                )}
                onMouseDown={() => handleSelectLot(lot)}
              >
                <span className="font-medium text-foreground">
                  Lot {lot.code}
                </span>
                <span className="text-muted-foreground text-sm">
                  — {lot.plots.nom} › {lot.etages?.nom ?? '?'}
                </span>
              </li>
            ))}

          {showFilteredResults && filteredLots.length === 0 && (
            <li className="px-3 py-2.5 text-muted-foreground">
              <p>Aucun lot trouvé pour « {query} »</p>
              <p className="text-sm">Vérifiez le numéro</p>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
