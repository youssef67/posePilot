import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GridFilterTabs } from './GridFilterTabs'

interface MockItem {
  id: string
  name: string
  progress_done: number
  progress_total: number
}

const mockItems: MockItem[] = [
  { id: '1', name: 'A', progress_done: 0, progress_total: 5 },  // NOT_STARTED
  { id: '2', name: 'B', progress_done: 2, progress_total: 5 },  // IN_PROGRESS
  { id: '3', name: 'C', progress_done: 5, progress_total: 5 },  // DONE
  { id: '4', name: 'D', progress_done: 3, progress_total: 10 }, // IN_PROGRESS
  { id: '5', name: 'E', progress_done: 0, progress_total: 0 },  // EMPTY
]

const getProgress = (item: MockItem) => ({
  done: item.progress_done,
  total: item.progress_total,
})

describe('GridFilterTabs', () => {
  it('renders 4 tabs with correct labels', () => {
    const onChange = vi.fn()
    render(
      <GridFilterTabs
        items={mockItems}
        getProgress={getProgress}
        onFilteredChange={onChange}
      />,
    )

    expect(screen.getByRole('tablist')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Tous/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /En cours/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Terminés/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Alertes/i })).toBeInTheDocument()
  })

  it('has "Tous" tab active by default', () => {
    const onChange = vi.fn()
    render(
      <GridFilterTabs
        items={mockItems}
        getProgress={getProgress}
        onFilteredChange={onChange}
      />,
    )

    const tousTab = screen.getByRole('tab', { name: /Tous/i })
    expect(tousTab).toHaveAttribute('data-state', 'active')
  })

  it('displays correct counts on each tab', () => {
    const onChange = vi.fn()
    render(
      <GridFilterTabs
        items={mockItems}
        getProgress={getProgress}
        onFilteredChange={onChange}
      />,
    )

    expect(screen.getByRole('tab', { name: /Tous/i })).toHaveTextContent('(5)')
    expect(screen.getByRole('tab', { name: /En cours/i })).toHaveTextContent('(2)')
    expect(screen.getByRole('tab', { name: /Terminés/i })).toHaveTextContent('(1)')
    expect(screen.getByRole('tab', { name: /Alertes/i })).toHaveTextContent('(0)')
  })

  it('calls onFilteredChange with all items on initial render', () => {
    const onChange = vi.fn()
    render(
      <GridFilterTabs
        items={mockItems}
        getProgress={getProgress}
        onFilteredChange={onChange}
      />,
    )

    expect(onChange).toHaveBeenCalledWith(mockItems)
  })

  it('filters "En cours" — only partially completed items', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <GridFilterTabs
        items={mockItems}
        getProgress={getProgress}
        onFilteredChange={onChange}
      />,
    )

    await user.click(screen.getByRole('tab', { name: /En cours/i }))

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(lastCall).toHaveLength(2)
    expect(lastCall.map((i: MockItem) => i.id)).toEqual(['2', '4'])
  })

  it('filters "Terminés" — only fully completed items with total > 0', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <GridFilterTabs
        items={mockItems}
        getProgress={getProgress}
        onFilteredChange={onChange}
      />,
    )

    await user.click(screen.getByRole('tab', { name: /Terminés/i }))

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(lastCall).toHaveLength(1)
    expect(lastCall[0].id).toBe('3')
  })

  it('filters "Alertes" without getAlerts — returns empty array', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <GridFilterTabs
        items={mockItems}
        getProgress={getProgress}
        onFilteredChange={onChange}
      />,
    )

    await user.click(screen.getByRole('tab', { name: /Alertes/i }))

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(lastCall).toHaveLength(0)
  })

  it('filters "Alertes" with getAlerts — returns matching items', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const getAlerts = (item: MockItem) => item.id === '2' || item.id === '4'

    render(
      <GridFilterTabs
        items={mockItems}
        getProgress={getProgress}
        getAlerts={getAlerts}
        onFilteredChange={onChange}
      />,
    )

    await user.click(screen.getByRole('tab', { name: /Alertes/i }))

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(lastCall).toHaveLength(2)
    expect(lastCall.map((i: MockItem) => i.id)).toEqual(['2', '4'])
  })

  it('returns to full list when clicking "Tous" after a filter', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <GridFilterTabs
        items={mockItems}
        getProgress={getProgress}
        onFilteredChange={onChange}
      />,
    )

    await user.click(screen.getByRole('tab', { name: /En cours/i }))
    await user.click(screen.getByRole('tab', { name: /Tous/i }))

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(lastCall).toHaveLength(5)
  })

  it('marks active tab with data-state="active"', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <GridFilterTabs
        items={mockItems}
        getProgress={getProgress}
        onFilteredChange={onChange}
      />,
    )

    await user.click(screen.getByRole('tab', { name: /En cours/i }))
    expect(screen.getByRole('tab', { name: /En cours/i })).toHaveAttribute('data-state', 'active')
    expect(screen.getByRole('tab', { name: /Tous/i })).toHaveAttribute('data-state', 'inactive')
  })

  it('updates counts when getAlerts is provided', () => {
    const onChange = vi.fn()
    const getAlerts = (item: MockItem) => item.id === '1'

    render(
      <GridFilterTabs
        items={mockItems}
        getProgress={getProgress}
        getAlerts={getAlerts}
        onFilteredChange={onChange}
      />,
    )

    expect(screen.getByRole('tab', { name: /Alertes/i })).toHaveTextContent('(1)')
  })

  it('renders contextual empty message with emptyMessage prop', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <GridFilterTabs
        items={mockItems}
        getProgress={getProgress}
        onFilteredChange={onChange}
        emptyMessage="Aucun lot"
      />,
    )

    await user.click(screen.getByRole('tab', { name: /Alertes/i }))

    expect(screen.getByText('Aucun lot avec alertes')).toBeInTheDocument()
  })

  it('renders feminine agreement for "terminée" with emptyMessage starting with Aucune', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const allDoneItems = [
      { id: '1', name: 'A', progress_done: 5, progress_total: 5 },
    ]
    render(
      <GridFilterTabs
        items={allDoneItems}
        getProgress={getProgress}
        onFilteredChange={onChange}
        emptyMessage="Aucune pièce"
      />,
    )

    await user.click(screen.getByRole('tab', { name: /En cours/i }))

    expect(screen.getByText('Aucune pièce en cours')).toBeInTheDocument()
  })

  it('does not render empty message without emptyMessage prop', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <GridFilterTabs
        items={mockItems}
        getProgress={getProgress}
        onFilteredChange={onChange}
      />,
    )

    await user.click(screen.getByRole('tab', { name: /Alertes/i }))

    expect(screen.queryByText('Aucun lot avec alertes')).not.toBeInTheDocument()
  })
})
