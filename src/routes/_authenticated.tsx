import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { BottomNavigation } from '@/components/BottomNavigation'
import { SidebarNavigation } from '@/components/SidebarNavigation'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return (
    <>
      <SidebarNavigation />
      <div className="lg:pl-56">
        <Outlet />
      </div>
      <BottomNavigation />
    </>
  )
}
