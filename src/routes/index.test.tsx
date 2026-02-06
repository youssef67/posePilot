import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  createRouter,
  createMemoryHistory,
  RouterProvider,
} from '@tanstack/react-router'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { routeTree } from '../routeTree.gen'

describe('HomePage', () => {
  it('renders posePilot heading', async () => {
    const queryClient = new QueryClient()
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/'] }),
    })

    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    )

    expect(await screen.findByText('posePilot')).toBeInTheDocument()
  })
})
