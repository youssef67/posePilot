import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

const LAST_SEEN_KEY = 'posePilot_lastActivitySeenAt'

export function getLastSeenAt(): string {
  return localStorage.getItem(LAST_SEEN_KEY) || '1970-01-01T00:00:00.000Z'
}

export function setLastSeenAt(date: string): void {
  localStorage.setItem(LAST_SEEN_KEY, date)
}

export function useUnreadActivityCount(userId: string) {
  const lastSeenAt = getLastSeenAt()

  return useQuery({
    queryKey: ['activity_logs', 'unread_count', { lastSeenAt, userId }],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('activity_logs')
        .select('*', { count: 'exact', head: true })
        .gt('created_at', lastSeenAt)
        .neq('actor_id', userId)
      if (error) throw error
      return count ?? 0
    },
    enabled: !!userId,
    placeholderData: 0,
  })
}
