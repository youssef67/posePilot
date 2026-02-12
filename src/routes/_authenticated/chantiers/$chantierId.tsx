import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useChantier } from '@/lib/queries/useChantier'
import { LotSearchBar } from '@/components/LotSearchBar'

export const Route = createFileRoute('/_authenticated/chantiers/$chantierId')({
  staticData: { breadcrumb: 'Chantier' },
  component: ChantierLayout,
})

function ChantierLayout() {
  const { chantierId } = Route.useParams()
  const { data: chantier } = useChantier(chantierId)

  return (
    <>
      {chantier?.type === 'complet' && <LotSearchBar chantierId={chantierId} />}
      <Outlet />
    </>
  )
}
