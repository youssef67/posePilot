import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ActivityLog } from '@/types/database'

export function useActivityLogs(userId: string) {
  return useQuery({
    queryKey: ['activity_logs', { userId }],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .neq('actor_id', userId)
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error
      return data as unknown as ActivityLog[]
    },
    enabled: !!userId,
  })
}
