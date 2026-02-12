import { Link, useRouterState } from '@tanstack/react-router'
import { Home, Truck, Bell, Settings } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useUnreadActivityCount } from '@/lib/queries/useUnreadActivityCount'
import { useAllPendingBesoinsCount } from '@/lib/queries/useAllPendingBesoinsCount'
import { useRealtimeActivityLogs } from '@/lib/subscriptions/useRealtimeActivityLogs'
import { useRealtimeAllBesoins } from '@/lib/subscriptions/useRealtimeAllBesoins'

const tabs = [
  { to: '/', label: 'Chantiers', icon: Home },
  { to: '/livraisons', label: 'Livraisons', icon: Truck },
  { to: '/activite', label: 'Activité', icon: Bell },
  { to: '/settings', label: 'Réglages', icon: Settings },
] as const

export function BottomNavigation() {
  const routerState = useRouterState()
  const pathname = routerState.location.pathname
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const { data: unreadCount } = useUnreadActivityCount(userId)
  const { data: pendingBesoinsCount } = useAllPendingBesoinsCount()

  useRealtimeActivityLogs()
  useRealtimeAllBesoins()

  function isActive(to: string) {
    if (to === '/') return pathname === '/'
    return pathname.startsWith(to)
  }

  return (
    <nav
      role="navigation"
      aria-label="Navigation principale"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex h-14 items-center justify-around">
        {tabs.map(({ to, label, icon: Icon }) => {
          const active = isActive(to)
          const showActivityBadge = to === '/activite' && (unreadCount ?? 0) > 0
          const showBesoinsBadge = to === '/livraisons' && (pendingBesoinsCount ?? 0) > 0
          const badgeCount = showActivityBadge ? unreadCount : showBesoinsBadge ? pendingBesoinsCount : null
          const ariaLabel = showActivityBadge
            ? `${label}, ${unreadCount} nouvelles notifications`
            : showBesoinsBadge
              ? `${label}, ${pendingBesoinsCount} besoins en attente`
              : undefined
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? 'page' : undefined}
              aria-label={ariaLabel}
              className={`relative flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-0.5 rounded-lg px-2 transition-colors ${
                active
                  ? 'bg-[#3B82F6]/10 text-[#3B82F6]'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-6 w-6" />
              {(showActivityBadge || showBesoinsBadge) && (
                <span className="absolute -top-1 right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#EF4444] px-1 text-[10px] font-medium text-white">
                  {(badgeCount ?? 0) > 99 ? '99+' : badgeCount}
                </span>
              )}
              <span className="text-[10px] font-medium leading-tight">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
