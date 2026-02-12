import { useState, useCallback } from 'react'

const MAX_HISTORY = 5
const STORAGE_PREFIX = 'posepilot-lot-search-'

export function useLotSearchHistory(chantierId: string) {
  const storageKey = `${STORAGE_PREFIX}${chantierId}`

  const [history, setHistory] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '[]')
    } catch {
      return []
    }
  })

  const addToHistory = useCallback(
    (code: string) => {
      setHistory((prev) => {
        const filtered = prev.filter((c) => c !== code)
        const next = [code, ...filtered].slice(0, MAX_HISTORY)
        localStorage.setItem(storageKey, JSON.stringify(next))
        return next
      })
    },
    [storageKey],
  )

  const clearHistory = useCallback(() => {
    localStorage.removeItem(storageKey)
    setHistory([])
  }, [storageKey])

  return { history, addToHistory, clearHistory }
}
