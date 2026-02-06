import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import type { AuthState } from '@/lib/auth'

export interface RouterContext {
  auth: AuthState
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
})

function RootLayout() {
  return <Outlet />
}
