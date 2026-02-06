import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { queryClient } from '@/lib/queryClient'
import { useAuth } from '@/lib/auth'
import { AuthProvider } from '@/components/AuthProvider'
import { routeTree } from './routeTree.gen'
import './index.css'

const router = createRouter({
  routeTree,
  context: { auth: undefined! },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// eslint-disable-next-line react-refresh/only-export-components
function InnerApp() {
  const auth = useAuth()

  useEffect(() => {
    if (!auth.isLoading) {
      router.invalidate()
    }
  }, [auth.isAuthenticated, auth.isLoading])

  if (auth.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#111827]">
        <p className="text-white text-lg font-semibold">posePilot</p>
      </div>
    )
  }

  return <RouterProvider router={router} context={{ auth }} />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <InnerApp />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
