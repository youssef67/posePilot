import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth'
import { useActivityLogs } from '@/lib/queries/useActivityLogs'
import { useRealtimeActivityLogs } from '@/lib/subscriptions/useRealtimeActivityLogs'
import { getLastSeenAt, setLastSeenAt } from '@/lib/queries/useUnreadActivityCount'
import { ActivityFeed } from '@/components/ActivityFeed'

export const Route = createFileRoute('/_authenticated/activite')({
  component: ActivitePage,
})

function ActivitePage() {
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const queryClient = useQueryClient()

  // Capture lastSeenAt BEFORE updating it (once at mount)
  const [lastSeenAtSnapshot] = useState(() => getLastSeenAt())

  const { data: entries, isLoading } = useActivityLogs(userId)

  useRealtimeActivityLogs()

  // Update lastSeenAt and reset badge on mount
  useEffect(() => {
    setLastSeenAt(new Date().toISOString())
    queryClient.invalidateQueries({ queryKey: ['activity_logs', 'unread_count'] })
  }, [queryClient])

  return (
    <div className="pb-16">
      <h1 className="px-4 pt-4 text-2xl font-semibold text-foreground">Activité</h1>
      <ActivityFeed
        entries={entries ?? []}
        lastSeenAt={lastSeenAtSnapshot}
        isLoading={isLoading}
      />
    </div>
  )
}
