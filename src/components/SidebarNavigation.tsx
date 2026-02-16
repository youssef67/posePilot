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

export function SidebarNavigation() {
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
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 border-r border-sidebar-border bg-sidebar lg:block">
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
        <span className="text-lg font-semibold text-sidebar-foreground">
          posePilot
        </span>
      </div>
      <nav
        role="navigation"
        aria-label="Navigation principale"
        className="flex flex-col gap-1 p-2"
      >
        {tabs.map(({ to, label, icon: Icon }) => {
          const active = isActive(to)
          const showActivityBadge = to === '/activite' && (unreadCount ?? 0) > 0
          const showBesoinsBadge =
            to === '/livraisons' && (pendingBesoinsCount ?? 0) > 0
          const badgeCount = showActivityBadge
            ? unreadCount
            : showBesoinsBadge
              ? pendingBesoinsCount
              : null
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
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-sidebar-accent text-[#3B82F6]'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="flex-1">{label}</span>
              {(showActivityBadge || showBesoinsBadge) && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#EF4444] px-1.5 text-xs font-medium text-white">
                  {(badgeCount ?? 0) > 99 ? '99+' : badgeCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
